import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import prisma from "@/lib/db"
import { signupSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: parsed.error.issues[0].message } },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (existing) {
      return NextResponse.json(
        { error: { code: "EMAIL_EXISTS", message: "Email already registered" } },
        { status: 409 }
      )
    }

    const passwordHash = await hash(parsed.data.password, 12)
    const quotaGb = parseInt(process.env.DEFAULT_STORAGE_QUOTA_GB || "5", 10)

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        storageQuota: BigInt(quotaGb * 1024 * 1024 * 1024),
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: { code: "SIGNUP_FAILED", message: "Failed to create account" } },
      { status: 500 }
    )
  }
}
