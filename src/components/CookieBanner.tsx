"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('eitaxi_cookies_accepted');
    if (!accepted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading from localStorage on mount is a valid sync pattern
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('eitaxi_cookies_accepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <Cookie className="h-6 w-6 text-yellow-400 flex-shrink-0" />
        <p className="text-sm text-muted-foreground flex-1">
          Utilizamos cookies para mejorar tu experiencia. Al continuar
          navegando, aceptas nuestra{' '}
          <a
            href="/privacidad"
            className="text-yellow-400 hover:underline"
          >
            política de privacidad
          </a>
          . Cumplimos con la ley suiza de protección de datos (nDSG).
        </p>
        <Button
          onClick={accept}
          className="bg-yellow-400 text-black hover:bg-yellow-500 flex-shrink-0"
        >
          Aceptar
        </Button>
      </div>
    </div>
  );
}
