import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await hash("Admin123!", 12)
  const userPassword = await hash("User1234!", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@vaultly.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@vaultly.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      storageQuota: BigInt(50 * 1024 * 1024 * 1024), // 50GB
    },
  })

  const user = await prisma.user.upsert({
    where: { email: "user@vaultly.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "user@vaultly.com",
      passwordHash: userPassword,
      role: "USER",
      storageQuota: BigInt(5 * 1024 * 1024 * 1024), // 5GB
    },
  })

  const folder = await prisma.folder.create({
    data: {
      name: "My Documents",
      userId: user.id,
    },
  })

  await prisma.file.create({
    data: {
      name: "welcome.txt",
      originalName: "welcome.txt",
      extension: "txt",
      mimeType: "text/plain",
      size: 123,
      storagePath: `users/${user.id}/welcome.txt`,
      type: "DOCUMENT",
      status: "READY",
      userId: user.id,
      folderId: folder.id,
    },
  })

  await prisma.file.create({
    data: {
      name: "sample-image.png",
      originalName: "sample-image.png",
      extension: "png",
      mimeType: "image/png",
      size: 45678,
      storagePath: `users/${user.id}/sample-image.png`,
      type: "IMAGE",
      status: "READY",
      userId: user.id,
      folderId: folder.id,
    },
  })

  await prisma.platformSettings.create({
    data: {},
  })

  console.log("Seed data created successfully")
  console.log("Admin: admin@vaultly.com / Admin123!")
  console.log("User:  user@vaultly.com / User1234!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
