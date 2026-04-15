import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getClientSession as getClientServerSession } from '@/lib/client-auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [driverSession, clientSession] = await Promise.all([
      getServerSession(),
      getClientServerSession(),
    ]);

    const roles: string[] = [];
    let driver: any = null;
    let client: any = null;

    // Si hay sesion de conductor, obtener datos extras
    if (driverSession) {
      roles.push('driver');
      try {
        const driverData = await db.taxiDriver.findUnique({
          where: { id: driverSession.driverId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            vehicleBrand: true,
            vehicleModel: true,
            vehicleType: true,
            imageUrl: true,
            rating: true,
            city: true,
            isActive: true,
          },
        });
        if (driverData) {
          driver = {
            driverId: driverData.id,
            name: driverData.name,
            email: driverData.email,
            phone: driverData.phone,
            vehicleBrand: driverData.vehicleBrand,
            vehicleModel: driverData.vehicleModel,
            vehicleType: driverData.vehicleType,
            imageUrl: driverData.imageUrl,
            rating: driverData.rating,
            city: driverData.city?.name || null,
            isActive: driverData.isActive,
          };

          // Contar reservas pendientes
          const pendingCount = await db.booking.count({
            where: { driverId: driverSession.driverId, status: 'pending' },
          });
          (driver as any).pendingBookings = pendingCount;

          // Contar reservas totales
          const totalCount = await db.booking.count({
            where: { driverId: driverSession.driverId },
          });
          (driver as any).totalBookings = totalCount;
        }
      } catch {
        driver = {
          driverId: driverSession.driverId,
          name: driverSession.name,
          email: driverSession.email,
        };
      }
    }

    // Si hay sesion de cliente, obtener datos extras
    if (clientSession) {
      roles.push('client');
      try {
        const clientData = await db.client.findUnique({
          where: { id: clientSession.clientId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        });
        if (clientData) {
          client = {
            clientId: clientData.id,
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            createdAt: clientData.createdAt,
          };

          // Contar reservas
          const totalBookings = await db.booking.count({
            where: { clientId: clientSession.clientId },
          });
          (client as any).totalBookings = totalBookings;
        }
      } catch {
        client = {
          clientId: clientSession.clientId,
          name: clientSession.name,
          email: clientSession.email,
        };
      }
    }

    if (roles.length === 0) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        role: null,
        roles: [],
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      role: roles.length === 1 ? roles[0] : 'both',
      roles,
      driver,
      client,
    });
  } catch (error) {
    console.error('Whoami error:', error);
    return NextResponse.json(
      { success: false, authenticated: false, role: null, roles: [] },
      { status: 500 }
    );
  }
}
