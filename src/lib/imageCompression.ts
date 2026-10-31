export interface CompressOptions {
  /** Maior lado da imagem final, em pixels. */
  maxSide: number;
  /** Qualidade do webp, de 0 a 1. */
  quality: number;
}

/** Reduz as dimensões para caber em `maxSide`, mantendo a proporção. Nunca amplia. */
export function fitWithin(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const scale = maxSide / longest;
  return { width: width * scale, height: height * scale };
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Arquivo de imagem inválido'));
    img.src = src;
  });
}

/** Lê uma imagem, reduz e devolve um data URL webp. */
export async function compressImage(file: Blob, { maxSide, quality }: CompressOptions) {
  const img = await loadImage(await readAsDataUrl(file));
  const { width, height } = fitWithin(img.width, img.height, maxSide);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/webp', quality);
}

/** Retrato de personagem e de inimigo: 500 px e 70% de qualidade. */
export const PORTRAIT_COMPRESSION: CompressOptions = { maxSide: 500, quality: 0.7 };

/** O maior arquivo de imagem que o Mestre pode enviar para virar mapa. */
export const MAX_MAP_UPLOAD_BYTES = 20 * 1024 * 1024;

/** O motivo de recusar o arquivo de um mapa, ou nulo se pode seguir. */
export function validateMapFile(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith('image/')) return 'O arquivo não é uma imagem.';
  if (file.size === 0) return 'O arquivo está vazio.';
  if (file.size > MAX_MAP_UPLOAD_BYTES) return 'A imagem passa de 20 MB. Escolha uma menor.';
  return null;
}

/** Carrega o arquivo como imagem e devolve também o endereço para exibi-la (libere com `revoke`). */
export async function loadImageFile(
  file: Blob,
): Promise<{ image: HTMLImageElement; url: string; revoke: () => void }> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    return { image, url, revoke: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/** Recorta um retângulo da imagem, reduz para `size` e devolve um data URL webp. */
export function cropToDataUrl(
  image: HTMLImageElement,
  rect: { x: number; y: number; width: number; height: number },
  size: { width: number; height: number },
  quality: number,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, size.width, size.height);
  return canvas.toDataURL('image/webp', quality);
}
