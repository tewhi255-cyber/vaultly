import { fileTypeFromBuffer } from "file-type"

const ALLOWED_EXTENSIONS = (process.env.ALLOWED_EXTENSIONS || "jpg,jpeg,png,gif,webp,svg,mp4,webm,mov,avi,mkv,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip,tar,gz,7z,mp3,wav,flac,aac,ogg")
  .split(",")
  .map((e) => e.trim().toLowerCase())

const BLOCKED_EXTENSIONS = (process.env.BLOCKED_EXTENSIONS || "exe,bat,sh,cmd,com,msi,scr,vbs,ps1,jar")
  .split(",")
  .map((e) => e.trim().toLowerCase())

export interface ValidationResult {
  valid: boolean
  error?: string
  detectedMime?: string
  detectedExt?: string
}

export function validateExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase()
  if (!ext) return false
  if (BLOCKED_EXTENSIONS.includes(ext)) return false
  return ALLOWED_EXTENSIONS.includes(ext)
}

export async function validateFileSignature(buffer: Buffer): Promise<ValidationResult> {
  try {
    const type = await fileTypeFromBuffer(buffer)
    if (!type) {
      return { valid: false, error: "Unable to detect file type" }
    }
    return {
      valid: true,
      detectedMime: type.mime,
      detectedExt: type.ext,
    }
  } catch {
    return { valid: false, error: "Failed to read file signature" }
  }
}

export function validateFileSize(size: number): boolean {
  const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE_MB || "500", 10) * 1024 * 1024
  return size <= maxSize
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\.\./g, "_")
    .substring(0, 255)
}
