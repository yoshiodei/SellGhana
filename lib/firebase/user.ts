import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "./firebase"

// Initialize a new user document in Firestore
export const initializeUserDocument = async (
  userId: string,
  userData: {
    displayName?: string | null
    email?: string | null
    photoURL?: string | null
    emailVerified?: boolean
  },
) => {
  try {
    const userDocRef = doc(db, "users", userId)
    const userDoc = await getDoc(userDocRef)

    // Only create if it doesn't exist
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        displayName: userData.displayName || null,
        email: userData.email || null,
        photoURL: userData.photoURL || null,
        emailVerified: userData.emailVerified || false,
        wishlist: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } else {
      // Update email verification status if it has changed
      const currentData = userDoc.data()
      if (currentData.emailVerified !== userData.emailVerified) {
        await updateDoc(userDocRef, {
          emailVerified: userData.emailVerified,
          updatedAt: new Date(),
        })
      }
    }

    return true
  } catch (error) {
    console.error("Error initializing user document:", error)
    return false
  }
}

// Update user email verification status
export const updateEmailVerificationStatus = async (userId: string, emailVerified: boolean) => {
  try {
    const userDocRef = doc(db, "users", userId)
    await updateDoc(userDocRef, {
      emailVerified,
      updatedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error("Error updating email verification status:", error)
    return false
  }
}

// Get user document
export const getUserDocument = async (userId: string) => {
  try {
    const userDocRef = doc(db, "users", userId)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      return userDoc.data()
    }
    return null
  } catch (error) {
    console.error("Error getting user document:", error)
    return null
  }
}
