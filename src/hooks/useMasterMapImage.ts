import { useQuery } from '@tanstack/react-query';
import { getMasterMapImage } from '@/data-access/masterMaps';

/**
 * A imagem de um mapa do Mestre, lida à parte, por id. A imagem de um id nunca muda (editar é
 * enviar outro mapa), então o cache não expira: cada aparelho a baixa uma vez (ADR 0010).
 */
export function useMasterMapImage(mapId: string) {
  return useQuery({
    queryKey: ['master-map-image', mapId],
    queryFn: () => getMasterMapImage(mapId),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
