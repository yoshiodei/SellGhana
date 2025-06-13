import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase"

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  try {
    console.log("Creating Firebase Auth user...")

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    console.log("Firebase Auth user created:", user.uid)

    // Parse name into firstName and lastName
    const nameParts = fullName.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    // Update the user's display name
    await updateProfile(user, { displayName: fullName })
    console.log("User profile updated with display name")

    // Send email verification
    await sendEmailVerification(user)
    console.log("Email verification sent")

    // Create user document in Firestore
    const userData = {
      uid: user.uid,
      email: user.email,
      firstName,
      lastName,
      phoneNumber: "",
      provider: "password",
      emailVerified: false,
      photoURL: "",
      createdAt: serverTimestamp(),
    }

    console.log("Creating user document in Firestore:", userData)
    await setDoc(doc(db, "users", user.uid), userData)
    console.log("User document created successfully")

    return { user, userData }
  } catch (error: any) {
    console.error("Error signing up:", error)
    if (error.code === "auth/email-already-in-use") {
      throw new Error("An account with this email already exists")
    }
    throw new Error(error.message || "Failed to create account")
  }
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential
  } catch (error: any) {
    console.error("Error signing in:", error)
    throw new Error(error.message || "Failed to sign in")
  }
}

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user

    // Check if user document exists, if not create it
    const userDoc = await getDoc(doc(db, "users", user.uid))

    if (!userDoc.exists()) {
      // Parse name into firstName and lastName
      const nameParts = (user.displayName || "").trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      const userData = {
        uid: user.uid,
        email: user.email,
        firstName,
        lastName,
        phoneNumber: "",
        provider: "google",
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
      }

      await setDoc(doc(db, "users", user.uid), userData)
    }

    return userCredential
  } catch (error: any) {
    console.error("Error signing in with Google:", error)
    throw new Error(error.message || "Failed to sign in with Google")
  }
}

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
  } catch (error: any) {
    console.error("Error signing out:", error)
    throw new Error(error.message || "Failed to sign out")
  }
}

// Reset password
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    console.error("Error resetting password:", error)
    throw new Error(error.message || "Failed to send password reset email")
  }
}

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser
}

// Listen to auth state changes - THIS WAS MISSING
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback)
}
