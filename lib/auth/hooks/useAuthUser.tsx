'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { auth } from '@/lib/firebase/firebase'

interface SimplifiedUser {
  uid: string
  email: string | null
  displayName: string | null
  phoneNumber: string | null
  photoURL: string | null
  emailVerified: boolean
}

export function useAuthUser() {
  const [user, setUser] = useState<SimplifiedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const {
          uid,
          email,
          displayName,
          phoneNumber,
          photoURL,
          emailVerified,
        } = firebaseUser

        const simplifiedUser: SimplifiedUser = {
          uid,
          email,
          displayName,
          phoneNumber,
          photoURL,
          emailVerified,
        }

        setUser(simplifiedUser)

        // Redirect only if email is not verified
        if (!emailVerified) {
          router.push('/verifyEmail')
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  return { user, loading }
}