import { validateExtension, validateFileSize, validateFileSignature } from "@/lib/file-validation"

describe("Upload Flow Integration", () => {
  it("validates file before upload", async () => {
    const fileName = "test-image.png"
    const fileSize = 1024 * 1024 // 1MB
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) // PNG signature

    expect(validateExtension(fileName)).toBe(true)
    expect(validateFileSize(fileSize)).toBe(true)

    const signature = await validateFileSignature(buffer)
    expect(signature.valid).toBe(true)
  })

  it("rejects invalid file types", () => {
    expect(validateExtension("malware.exe")).toBe(false)
    expect(validateExtension("script.bat")).toBe(false)
  })

  it("rejects oversized files", () => {
    process.env.MAX_UPLOAD_SIZE_MB = "1"
    expect(validateFileSize(2 * 1024 * 1024)).toBe(false)
  })
})
