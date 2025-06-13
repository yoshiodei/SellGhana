import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export async function googleSignIn() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, provider);
  const token = await result.user.getIdToken();

  // Call server to handle session + Firestore check
  await fetch('/api/session/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}