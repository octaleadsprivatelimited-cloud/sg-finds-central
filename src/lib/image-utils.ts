/**
 * Image validation & auto-compression utility.
 * – Validates type, size, and minimum dimensions.
 * – Auto-compresses images larger than MAX_DIMENSION or MAX_FILE_SIZE
 *   using an off-screen canvas with JPEG encoding.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 2048; // px – resize if wider/taller
const MIN_DIMENSION = 200; // px – reject if smaller
const COMPRESS_QUALITY = 0.82;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  file: File; // original or compressed
}

/** Load an image element from a File */
const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });

/** Resize / compress via canvas, returns a new File */
const compressImage = async (
  file: File,
  img: HTMLImageElement
): Promise<File> => {
  let { naturalWidth: w, naturalHeight: h } = img;

  // Scale down if exceeds MAX_DIMENSION
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", COMPRESS_QUALITY)
  );

  const ext = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${ext}.jpg`, { type: "image/jpeg" });
};

/**
 * Validate and optionally auto-compress a single image file.
 * Returns { valid, error?, file } where file may be the compressed version.
 */
export const validateAndCompressImage = async (
  file: File
): Promise<ImageValidationResult> => {
  // Type check
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `"${file.name}" is not a supported image format. Use JPEG, PNG, or WebP.`,
      file,
    };
  }

  // Load to check dimensions
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return { valid: false, error: `"${file.name}" could not be read as an image.`, file };
  }

  const { naturalWidth: w, naturalHeight: h } = img;

  // Min dimension check
  if (w < MIN_DIMENSION || h < MIN_DIMENSION) {
    URL.revokeObjectURL(img.src);
    return {
      valid: false,
      error: `"${file.name}" is too small (${w}×${h}). Minimum ${MIN_DIMENSION}×${MIN_DIMENSION}px.`,
      file,
    };
  }

  // Determine if compression is needed
  const needsResize = w > MAX_DIMENSION || h > MAX_DIMENSION;
  const needsCompress = file.size > MAX_FILE_SIZE;

  let outputFile = file;
  if (needsResize || needsCompress) {
    outputFile = await compressImage(file, img);
  }

  URL.revokeObjectURL(img.src);

  // Final size check after compression
  if (outputFile.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `"${file.name}" is still too large after compression (${(outputFile.size / 1024 / 1024).toFixed(1)}MB). Use a smaller image.`,
      file: outputFile,
    };
  }

  return { valid: true, file: outputFile };
};

/**
 * Process multiple files: validate, compress, and return results.
 */
export const processImageFiles = async (
  files: File[],
  maxCount: number
): Promise<{ validFiles: File[]; errors: string[] }> => {
  const sliced = files.slice(0, maxCount);
  const results = await Promise.all(sliced.map(validateAndCompressImage));

  const validFiles: File[] = [];
  const errors: string[] = [];

  for (const r of results) {
    if (r.valid) {
      validFiles.push(r.file);
    } else {
      errors.push(r.error!);
    }
  }

  return { validFiles, errors };
};
