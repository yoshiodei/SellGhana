// utils/signupUser.ts
// import { auth } from "@/lib/firebase/firebaseClient";
import { auth } from "@/lib/firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

interface signUpPayload {
    firstName: string;
    lastName: string;
    password: string;
    phoneNumber: string;
    email: string;
}

export async function signupUser(payload: signUpPayload) {
  const { email, password } = payload;
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();
  console.log("id token is ---> ", idToken);
  
  // Send to backend
  const response = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, idToken }),
  });

  return response.json();
}