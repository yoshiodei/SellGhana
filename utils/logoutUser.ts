import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase/firebase';
import { showToast } from '@/utils/showToast';

export const logoutUser = async () => {
  const auth = getAuth(app);

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