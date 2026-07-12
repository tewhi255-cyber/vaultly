import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and a number"
  ),
})

export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().optional(),
})

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
})

export const renameFileSchema = z.object({
  name: z.string().min(1).max(255),
})

export const moveFileSchema = z.object({
  folderId: z.string().nullable(),
})

export const createShareLinkSchema = z.object({
  fileId: z.string().optional(),
  folderId: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  allowDownload: z.boolean().default(true),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  adminRole: z.enum(["SUPER_ADMIN", "MODERATOR"]).nullable().optional(),
  storageQuota: z.number().positive().optional(),
  status: z.enum(["active", "suspended"]).optional(),
})

export const updateSettingsSchema = z.object({
  defaultStorageQuotaGb: z.number().positive().optional(),
  maxUploadSizeMb: z.number().positive().optional(),
  allowedExtensions: z.string().optional(),
  blockedExtensions: z.string().optional(),
  enablePublicSignups: z.boolean().optional(),
  enablePublicShares: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  siteAnnouncement: z.string().optional(),
  showAnnouncement: z.boolean().optional(),
})
