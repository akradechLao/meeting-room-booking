import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 6 * 60 * 60, // 6 hours
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('กรุณากรอก username และ password');
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username.toLowerCase() },
        });

        if (!user) {
          throw new Error('ไม่พบบัญชีผู้ใช้นี้');
        }

        if (!user.active) {
          throw new Error('บัญชีนี้ถูกปิดใช้งาน');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('รหัสผ่านไม่ถูกต้อง');
        }

        return {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};
