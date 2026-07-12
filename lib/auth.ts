import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { compare } from "bcryptjs"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db"
import { logActivity, logFailedActivity, logFailedLogin, extractLogContext } from "./audit"
import type { NextRequest } from "next/server"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/library",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string
        const ctx = extractLogContext(req as unknown as NextRequest)

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          await logFailedLogin(email, "user_not_found", ctx)
          return null
        }

        if (user.status === "suspended") {
          await logFailedLogin(email, "suspended_account", ctx, user.id)
          await logFailedActivity(user.id, "login", "account", user.id, { reason: "suspended" }, ctx)
          return null
        }

        const isValid = await compare(password, user.passwordHash)
        if (!isValid) {
          await logFailedLogin(email, "invalid_password", ctx, user.id)
          await logFailedActivity(user.id, "login", "account", user.id, { reason: "invalid_password" }, ctx)
          return null
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), lastIp: ctx.ipAddress },
        })

        await logActivity(user.id, "login", "account", user.id, {}, ctx)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  events: {
    async signOut(event) {
      const token = "token" in event ? event.token : null
      if (token?.id) {
        await logActivity(token.id as string, "logout", "account", token.id as string).catch(() => {})
      }
    },
  },
})

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session
}

export async function requireRole(role: "ADMIN" | "USER") {
  const session = await requireAuth()
  if (session.user.role !== role) throw new Error("Forbidden")
  return session
}

export async function requireAdminRole(minRole: "SUPER_ADMIN" | "MODERATOR" = "MODERATOR") {
  const session = await requireAuth()
  if (session.user.role !== "ADMIN") throw new Error("Forbidden")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { adminRole: true },
  })

  if (!user) throw new Error("Forbidden")

  if (minRole === "SUPER_ADMIN" && user.adminRole !== "SUPER_ADMIN") {
    throw new Error("Forbidden: super admin access required")
  }

  return { ...session, adminRole: user.adminRole }
}
