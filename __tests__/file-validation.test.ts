import { validateExtension, validateFileSize, sanitizeFileName } from "@/lib/file-validation"

describe("validateExtension", () => {
  it("allows common image extensions", () => {
    expect(validateExtension("photo.jpg")).toBe(true)
    expect(validateExtension("photo.png")).toBe(true)
    expect(validateExtension("photo.webp")).toBe(true)
  })

  it("allows video extensions", () => {
    expect(validateExtension("video.mp4")).toBe(true)
    expect(validateExtension("video.webm")).toBe(true)
  })

  it("allows document extensions", () => {
    expect(validateExtension("doc.pdf")).toBe(true)
    expect(validateExtension("doc.docx")).toBe(true)
  })

  it("blocks dangerous extensions", () => {
    expect(validateExtension("virus.exe")).toBe(false)
    expect(validateExtension("script.bat")).toBe(false)
    expect(validateExtension("script.sh")).toBe(false)
    expect(validateExtension("malware.jar")).toBe(false)
  })

  it("returns false for files without extension", () => {
    expect(validateExtension("Makefile")).toBe(false)
    expect(validateExtension("README")).toBe(false)
  })

  it("is case insensitive", () => {
    expect(validateExtension("Photo.JPG")).toBe(true)
    expect(validateExtension("Script.EXE")).toBe(false)
  })
})

describe("validateFileSize", () => {
  beforeEach(() => {
    process.env.MAX_UPLOAD_SIZE_MB = "10"
  })

  it("accepts files within limit", () => {
    expect(validateFileSize(5 * 1024 * 1024)).toBe(true)
    expect(validateFileSize(10 * 1024 * 1024)).toBe(true)
  })

  it("rejects files exceeding limit", () => {
    expect(validateFileSize(11 * 1024 * 1024)).toBe(false)
  })
})

describe("sanitizeFileName", () => {
  it("removes path traversal attempts", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("___etc_passwd")
    expect(sanitizeFileName("..\\..\\windows\\system32")).toBe("____windows_system32")
  })

  it("removes special characters", () => {
    expect(sanitizeFileName('file< >:"/\\|?*.txt')).toBe("file_ ________.txt")
  })

  it("truncates long names", () => {
    const longName = "a".repeat(300) + ".txt"
    expect(sanitizeFileName(longName).length).toBeLessThanOrEqual(255)
  })
})
