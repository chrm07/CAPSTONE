import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// Mock users for demo purposes
const users = [
  {
    id: "1",
    name: "Juan Dela Cruz",
    email: "student@example.com",
    password: "Student123", // Changed from password123 to Student123
    role: "student",
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin123", // Changed from password123 to Admin123
    role: "admin",
  },
]

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = users.find((user) => user.email === credentials.email)

          if (!user) {
            return null
          }

          // Simple password check for demo
          if (credentials.password !== user.password) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "THIS_IS_A_DEVELOPMENT_SECRET_CHANGE_IT",
  debug: false, // Set to false in production
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
