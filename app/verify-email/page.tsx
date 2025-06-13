"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import SimpleNavBar from "@/components/simple-nav-bar"
import SimpleFooter from "@/components/simple-footer"
import LoadingSpinner from "@/components/loading-spinner"
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"

export default function VerifyEmailPage() {
  const { user, loading } = useAuthUser();
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLogOut,setIsLoadingLogOut] = useState(false);

  console.log("verify user email --->", user);
  

  // // Check email verification status every 3 seconds
  // useEffect(() => {
  //   if (user?.emailVerified) {
  //     router.push("/")
  //     return
  //   }

  //   const interval = setInterval(async () => {
  //     // Reload the current user to get updated email verification status
  //     try {
  //       const { getCurrentUser } = await import("@/lib/firebase/auth")
  //       const currentUser = getCurrentUser()
  //       if (currentUser) {
  //         await currentUser.reload()
  //         // The auth state listener will automatically update the user state
  //       }
  //     } catch (error) {
  //       console.error("Error reloading user:", error)
  //     }
  //   }, 3000)

  //   return () => clearInterval(interval)
  // }, [user?.emailVerified, router])

  // Only redirect to signin if we're not loading AND there's no user
//   useEffect(() => {
//     if (!loading && !user) {
//       console.log("No user found, redirecting to signin")
//       router.push("/signin")
//     }
//   }, [user, loading, router])

  const handleBrowseAnonymously = async () => {
    // setIsLoading(true)
    // try {
    //   await logout()
    //   router.push("/")
    // } catch (error) {
    //   console.error("Error logging out:", error)
    //   setIsLoading(false)
    // }
  }

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // If no user after loading is complete, will redirect to signin
//   if (!user) {
//     return null
//   }

  return (
    <div className="min-h-screen flex flex-col">
      <SimpleNavBar />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">Verify Your Email Address</h1>

            {
              user?.email &&
              (<p>{user.email}</p>)
            } 

            <p className="text-gray-600 mb-6">
              We've sent a verification email. Please
              check your email and click the verification link to continue.
            </p>
            

            <p className="text-sm text-gray-500 mb-8">
              Don't see the email? Check your spam folder or wait a few minutes for it to arrive.
            </p>
          </div>

          <button
            onClick={handleBrowseAnonymously}
            disabled={isLoading}
            className="w-full px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing out..." : "Browse Anonymously"}
          </button>

          <button
            onClick={handleBrowseAnonymously}
            disabled={isLoadingLogOut}
            className="w-full px-6 py-3 text-gray-500 bg-slate-300 border border-gray-500 rounded-md hover:bg-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {isLoadingLogOut ? "Signing out..." : "Browse Anonymously"}
          </button>
        </div>
      </main>

      <SimpleFooter />
    </div>
  )
}
