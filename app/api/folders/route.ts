import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { createFolderSchema } from "@/lib/validations"
import { logActivity, extractLogContext } from "@/lib/audit"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const parentId = searchParams.get("parentId")

  const where: any = { userId: session.user.id, isTrash: false }
  if (parentId !== null) {
    where.parentId = parentId === "null" ? null : parentId
  }

  const folders = await prisma.folder.findMany({
    where,
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ folders })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  const ctx = extractLogContext(req)
  const body = await req.json()
  const parsed = createFolderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } }, { status: 400 })
  }

  const folder = await prisma.folder.create({
    data: {
      name: parsed.data.name,
      parentId: parsed.data.parentId || null,
      userId: session.user.id,
    },
  })

  await logActivity(session.user.id, "folder_create", "folder", folder.id, { name: folder.name }, ctx)

  return NextResponse.json({ folder }, { status: 201 })
}
