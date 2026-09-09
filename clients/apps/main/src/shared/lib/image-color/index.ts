type ImageMetadata = { dominantColor?: string; width?: number; height?: number };
const results = new WeakMap<File, Promise<ImageMetadata>>();
let pending: Promise<unknown> = Promise.resolve();

export function extractImageMetadata(file: File): Promise<ImageMetadata> {
  if (!/^image\/(png|jpeg|webp|gif|avif|bmp)$/.test(file.type)) return Promise.resolve({});
  const cached = results.get(file);
  if (cached) return cached;
  const result = pending.then(async () => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    const metadata: ImageMetadata = {};
    try {
      image.src = url;
      await image.decode();
      metadata.width = image.naturalWidth;
      metadata.height = image.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 96;
      const context = canvas.getContext('2d');
      if (!context) return metadata;
      context.drawImage(image, 0, 0, 96, 96);
      const { getColorSync } = await import('colorthief');
      metadata.dominantColor = getColorSync(canvas)?.hex();
    } catch {
      // 대표색 분석 실패는 원본 업로드를 막지 않는다.
    } finally {
      image.src = '';
      URL.revokeObjectURL(url);
    }
    return metadata;
  });
  pending = result;
  results.set(file, result);
  return result;
}
