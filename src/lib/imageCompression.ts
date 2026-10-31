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
