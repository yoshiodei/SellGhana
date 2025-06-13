// "use client"

// import type React from "react"

// import { useEffect } from "react"
// import { useRouter } from "next/navigation"
// // import { useAuth } from "@/lib/context/auth-context"

// export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   // const { user, loading } = useAuth()
//   const router = useRouter()

//   // useEffect(() => {
//     // if (!loading && !user) {
//       // router.push("/signin")
//     }
//   }, [user, loading, router])

//   // Show loading state while checking authentication
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
//       </div>
//     )
//   }

//   // If user is authenticated, render children
//   return user ? <>{children}</> : null
// }
