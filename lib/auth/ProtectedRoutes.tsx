'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/utils/showToast';
import { useAuthUser } from './hooks/useAuthUser';


export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      showToast("You must be signed in to access that page.", "error");
      router.push('/'); // redirect to homepage
    }
  }, [user, loading, router]);

  if (loading || !user) return null; // or a loading spinner

  return <>{children}</>;
}
