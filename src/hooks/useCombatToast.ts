import { useEffect, useState } from 'react';

/** O aviso de combate (evento `combat-toast` da janela): mostra a mensagem por 4 segundos. */
export function useCombatToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      setToastMessage(customEvent.detail.message);
      setTimeout(() => setToastMessage(null), 4000);
    };
    window.addEventListener('combat-toast', handleToast);
    return () => window.removeEventListener('combat-toast', handleToast);
  }, []);

  return toastMessage;
}
