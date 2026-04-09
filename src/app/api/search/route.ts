import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''
    const origin = searchParams.get('origin')?.toLowerCase() || ''
    const destination = searchParams.get('destination')?.toLowerCase() || ''

    // If origin and destination provided, search by route
    if (origin && destination) {
      const allDrivers = await db.taxiDriver.findMany({
        where: { isActive: true },
        include: {
          city: true,
          canton: true,
        },
      })

      // Filter drivers that cover this route
      const filteredDrivers = allDrivers.filter(driver => {
        const routes = JSON.parse(driver.routes as string) as string[]
        const routeSlug = `${origin}-${destination}`
        const reverseRouteSlug = `${destination}-${origin}`
        
        return routes.some(r => 
          r.toLowerCase().includes(routeSlug) || 
          r.toLowerCase().includes(reverseRouteSlug) ||
          r.toLowerCase().includes(origin) ||
          r.toLowerCase().includes(destination)
        )
      }).map(driver => ({
        ...driver,
        services: JSON.parse(driver.services as string),
        routes: JSON.parse(driver.routes as string),
      }))

      return NextResponse.json({
        success: true,
        data: filteredDrivers,
        total: filteredDrivers.length,
        searchType: 'route',
        route: { origin, destination },
      })
    }

    // General search
    if (query) {
      const drivers = await db.taxiDriver.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query } },
            { city: { name: { contains: query } } },
            { canton: { name: { contains: query } } },
          ],
        },
        include: {
          city: true,
          canton: true,
        },
      })

      const cities = await db.city.findMany({
        where: {
          OR: [
            { name: { contains: query } },
          ],
        },
        include: {
          canton: true,
        },
      })

      const cantons = await db.canton.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { code: { contains: query } },
          ],
        },
      })

      const routes = await db.route.findMany({
        where: {
          OR: [
            { origin: { contains: query } },
            { destination: { contains: query } },
            { slug: { contains: query } },
          ],
        },
      })

      const parsedDrivers = drivers.map(driver => ({
        ...driver,
        services: JSON.parse(driver.services as string),
        routes: JSON.parse(driver.routes as string),
      }))

      return NextResponse.json({
        success: true,
        data: {
          drivers: parsedDrivers,
          cities,
          cantons,
          routes,
        },
        searchType: 'general',
        query,
      })
    }

    // Return popular routes if no search
    const popularRoutes = await db.route.findMany({
      orderBy: { popularity: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      data: popularRoutes,
      searchType: 'popular',
    })
  } catch (error) {
    console.error('Error in search:', error)
    return NextResponse.json(
      { success: false, error: 'Error en la búsqueda' },
      { status: 500 }
    )
  }
}
