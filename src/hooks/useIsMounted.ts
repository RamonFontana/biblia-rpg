import { useEffect, useRef } from 'react';

/** Uma ref que diz se o componente ainda está na tela, para ignorar respostas que chegam tarde. */
export function useIsMounted() {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}
