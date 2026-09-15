import type { NextAuthConfig } from 'next-auth';

const authConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as 'ADMIN' | 'MEMBER';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
