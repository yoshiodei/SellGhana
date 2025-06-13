import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import { showToast } from '@/utils/showToast';

export const logoutUser = async () => {

  try {
    await signOut(auth); // Firebase logout

    // Clear the session cookie via API call
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });

    // Redirect to homepage
    window.location.href = '/';
    showToast('You have logged out successfully!', 'success');
  } catch (error) {
    console.error('Logout error:', error);
  }
};