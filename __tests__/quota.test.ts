describe("Storage Quota Logic", () => {
  const QUOTA_BYTES = 5 * 1024 * 1024 * 1024 // 5GB

  function hasQuotaAvailable(currentUsage: number, fileSize: number, quota: number = QUOTA_BYTES): boolean {
    return currentUsage + fileSize <= quota
  }

  it("allows upload when under quota", () => {
    expect(hasQuotaAvailable(1 * 1024 * 1024 * 1024, 100 * 1024 * 1024)).toBe(true)
  })

  it("allows upload when exactly at quota limit", () => {
    expect(hasQuotaAvailable(4.9 * 1024 * 1024 * 1024, 0.1 * 1024 * 1024 * 1024)).toBe(true)
  })

  it("rejects upload when over quota", () => {
    expect(hasQuotaAvailable(5 * 1024 * 1024 * 1024, 1)).toBe(false)
    expect(hasQuotaAvailable(4.9 * 1024 * 1024 * 1024, 0.2 * 1024 * 1024 * 1024)).toBe(false)
  })

  it("handles edge case of zero bytes", () => {
    expect(hasQuotaAvailable(0, 0)).toBe(true)
  })
})
