'use client';

import { signOut } from 'firebase/auth';
import { deleteCookie } from 'cookies-next'; // Optional if you're using cookies
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/firebase';
import { showToast } from '@/utils/showToast';

export const logout = async (router?: ReturnType<typeof useRouter>) => {
  
    try {
    await signOut(auth);

    // Optional: clear session cookie (depends on your session strategy)
    deleteCookie('__session');

    showToast('Logged out successfully.', 'success');

    // Optional redirect
    if (router) {
      router.replace('/');
    }
  } catch (error: any) {
    console.error('Logout error:', error.message);
    showToast('Failed to log out.', 'error');
  }
};