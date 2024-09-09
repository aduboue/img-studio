import { getServerSession } from 'next-auth';
import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google";

// Configuration options for authentication
export const authOptions: NextAuthOptions = ({
  // Callback to modify the session object
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  // Authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
})

// Utility function to retrieve the server session with authentication options
export const getServerAuthSession = NextAuth(authOptions)
export { getServerAuthSession as GET, getServerAuthSession as POST }
