import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getS3Client, s3Bucket } from "@/lib/s3"
import prisma from "@/lib/db"
import { GetObjectCommand } from "@aws-sdk/client-s3"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const file = await prisma.file.findFirst({
    where: { id, userId: session.user.id },
    select: { thumbnailPath: true, type: true, mimeType: true },
  })

  if (!file?.thumbnailPath) {
    return NextResponse.json({ error: "No thumbnail" }, { status: 404 })
  }

  try {
    const s3 = getS3Client()
    const response = await s3.send(
      new GetObjectCommand({ Bucket: s3Bucket, Key: file.thumbnailPath })
    )
    const buffer = Buffer.from(await response.Body!.transformToByteArray())

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
