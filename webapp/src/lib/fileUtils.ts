// Agnes requires image-to-image / multi-image / video reference inputs to be
// a public HTTPS URL or a Data URI. Since uploads here are local files with
// no image host, everything is normalized to a Base64 Data URI client-side
// (see docs/API接口文档.md §4.2). Oversized uploads are downscaled first to
// keep request payloads and latency reasonable.

const MAX_DIMENSION = 2048;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // 15MB guard before we even touch canvas

export function fileToDataURI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function normalizeImageFile(file: File): Promise<string> {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("图片文件过大（超过 15MB），请压缩后重试");
  }
  const dataUri = await fileToDataURI(file);
  return downscaleDataURI(dataUri, MAX_DIMENSION);
}

export function downscaleDataURI(dataUri: string, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        resolve(dataUri);
        return;
      }
      const scale = maxDim / Math.max(width, height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUri);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => reject(new Error("图片解码失败，请更换文件"));
    img.src = dataUri;
  });
}

export function extractFilesFromClipboard(e: ClipboardEvent): File[] {
  const files: File[] = [];
  const items = e.clipboardData?.items;
  if (!items) return files;
  for (const item of items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }
  return files;
}

export function extractFilesFromDrop(e: DragEvent): File[] {
  const files: File[] = [];
  const list = e.dataTransfer?.files;
  if (!list) return files;
  for (const file of Array.from(list)) {
    if (file.type.startsWith("image/")) files.push(file);
  }
  return files;
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}
