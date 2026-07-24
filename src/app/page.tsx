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
        if (user.role === 'admin') router.push('/admin');
        else if (user.role === 'pedagogo') router.push('/pedagogo');
        else router.push('/professor');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return <PageLoading />;
}
