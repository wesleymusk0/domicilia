'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoading } from '@/components/ui/Loading';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        const dashPath = user.role === 'admin' ? '/admin' : user.role === 'pedagogo' ? '/pedagogo' : '/professor';
        router.push(dashPath);
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return <PageLoading />;
}
