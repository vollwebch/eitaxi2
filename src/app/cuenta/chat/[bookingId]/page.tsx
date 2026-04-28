"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function ChatRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bookingId = params.bookingId as string;
    if (bookingId) {
      // Redirect to cuenta with chat open for this booking
      router.replace(`/cuenta?tab=reservas&booking=${bookingId}&chat=open`);
    } else {
      setError("Booking no encontrado");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">
          {error || "Abriendo chat..."}
        </p>
      </div>
    </div>
  );
}
