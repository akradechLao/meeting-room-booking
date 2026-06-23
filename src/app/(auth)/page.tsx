'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthRoot() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      const isAdmin = (session?.user as any)?.role === 'admin';
      router.push(isAdmin ? '/admin' : '/home');
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="skeleton h-8 w-32"></div>
    </div>
  );
}
