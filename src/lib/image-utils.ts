/**
 * Image validation, auto-compression & base64 conversion utility.
 * – Validates type, size, and minimum dimensions.
 * – Auto-compresses images using an off-screen canvas with JPEG encoding.
 * – Converts to base64 data URLs for Firestore storage (no Firebase Storage needed).
 *
 * ⚠ Firestore doc limit is ~1MB. With 5 images we target ~150KB each compressed.
 */

const MAX_DIMENSION = 800; // px – aggressive resize for Firestore
const MIN_DIMENSION = 200; // px – reject if smaller
const COMPRESS_QUALITY = 0.55; // aggressive JPEG compression
const MAX_BASE64_SIZE = 200 * 1024; // 200KB per image base64
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  file: File; // original or compressed
  base64?: string; // data URL for Firestore
}

/** Load an image element from a File */
const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });

/** Compress via canvas and return base64 data URL */
const compressToBase64 = (
  img: HTMLImageElement,
  quality: number = COMPRESS_QUALITY
): string => {
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

  return canvas.toDataURL("image/jpeg", quality);
};

/**
 * Validate and compress a single image file to base64.
 * Returns { valid, error?, file, base64 }
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

  // Compress to base64
  let base64 = compressToBase64(img, COMPRESS_QUALITY);

  // If still too large, reduce quality further
  if (base64.length > MAX_BASE64_SIZE) {
    base64 = compressToBase64(img, 0.4);
  }
  if (base64.length > MAX_BASE64_SIZE) {
    base64 = compressToBase64(img, 0.3);
  }

  URL.revokeObjectURL(img.src);

  // Final size check
  if (base64.length > MAX_BASE64_SIZE * 1.5) {
    return {
      valid: false,
      error: `"${file.name}" is still too large after compression. Use a smaller image.`,
      file,
    };
  }

  return { valid: true, file, base64 };
};

/**
 * Process multiple files: validate, compress to base64, and return results.
 */
export const processImageFiles = async (
  files: File[],
  maxCount: number
): Promise<{ validBase64: string[]; errors: string[] }> => {
  const sliced = files.slice(0, maxCount);
  const results = await Promise.all(sliced.map(validateAndCompressImage));

  const validBase64: string[] = [];
  const errors: string[] = [];

  for (const r of results) {
    if (r.valid && r.base64) {
      validBase64.push(r.base64);
    } else if (!r.valid) {
      errors.push(r.error!);
    }
  }

  return { validBase64, errors };
};

/**
 * Compress a single file to base64 (for logo upload).
 */
export const compressFileToBase64 = async (file: File): Promise<string | null> => {
  const result = await validateAndCompressImage(file);
  return result.valid ? result.base64 || null : null;
};
