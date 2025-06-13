'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import { showToast } from '@/utils/showToast';

interface RouteProtectorProps {
  children: React.ReactNode;
}

export const RouteProtector = ({ children }: RouteProtectorProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        showToast('You must be logged in to access this page.', 'error');
        router.replace('/login');
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return <>{children}</>;
};