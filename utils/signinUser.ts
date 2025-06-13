import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase"; // your Firebase config

export const signInWithEmail = async (email: string, password: string) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCred.user.getIdToken();
  return { user: userCred.user, token };
};

