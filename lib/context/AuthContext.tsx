"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  onAuthStateChange,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  resetPassword,
} from "@/lib/firebase/auth"
import { doc, getDoc } from "firebase/firestore"
// import initializeFirebase from "@/lib/firebase/firebase"
// import { db } from "@/lib/firebase/firebase"
// import initializeFirebase from "@/lib/firebase/firebase"
import { db } from "@/lib/firebase/firebase"

// Initialize Firebase
// if (typeof window !== "undefined") {
//   initializeFirebase()
// }

// Define the shape of our user object
export interface User {
  uid: string
  email: string | null
  firstName: string
  lastName: string
  phoneNumber: string
  provider: "password" | "google"
  emailVerified: boolean
  photoURL: string
  createdAt: Date
}

// Define the shape of our auth context
interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User logged in" : "User logged out")

      if (firebaseUser) {
        try {
          console.log("Fetching user data from Firestore for UID:", firebaseUser.uid)

          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

          if (userDoc.exists()) {
            const userData = userDoc.data()
            console.log("User data found in Firestore:", userData)

            const userObject: User = {
              uid: userData.uid,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phoneNumber: userData.phoneNumber,
              provider: userData.provider,
              emailVerified: firebaseUser.emailVerified, // Always get from Firebase Auth
              photoURL: userData.photoURL,
              createdAt: userData.createdAt.toDate(),
            }

            setUser(userObject)
            console.log("User state updated:", userObject)
          } else {
            console.log("No user document found in Firestore")
            setUser(null)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUser(null)
        }
      } else {
        console.log("No Firebase user, setting user to null")
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Sign in with email and password
  const handleSignIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log("Signing in user...")
      await signInWithEmail(email, password)
      router.push("/")
    } catch (error: any) {
      setLoading(false)
      throw error
    }
  }

  // Sign up with email and password
  const handleSignUp = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      console.log("Signing up user...")
      const result = await signUpWithEmail(email, password, name)
      console.log("Signup successful, user created:", result.user.uid)

      // Don't set loading to false here - let the auth state listener handle it
      // Navigate to email verification page
      router.push("/verify-email")
    } catch (error: any) {
      setLoading(false)
      throw error
    }
  }

  // Sign in with Google
  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      router.push("/")
    } catch (error: any) {
      setLoading(false)
      throw error
    }
  }

  // Sign out
  const handleLogout = async () => {
    try {
      console.log("Logging out user...")
      await signOut()
      setUser(null)
    } catch (error: any) {
      throw error
    }
  }

  // Reset password
  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email)
    } catch (error: any) {
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleGoogleSignIn,
    logout: handleLogout,
    resetPassword: handleResetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
