"use client"

import { useState, useEffect } from "react"
import { Mail, RefreshCw, CheckCircle } from "lucide-react"
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"

export default function EmailVerification() {
  const { user } = useAuthUser();
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")

  // Check for email verification every 5 seconds
  // useEffect(() => {
  //   if (!user?.emailVerified) {
  //     const interval = setInterval(async () => {
  //       await refreshUser()
  //     }, 5000)

  //     return () => clearInterval(interval)
  //   }
  // }, [user?.emailVerified, refreshUser])

  const handleResendVerification = async () => {
    setIsResending(true)
    setError("")
    setResendSuccess(false)

    try {
      // await resendVerification()
      setResendSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email")
    } finally {
      setIsResending(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // await refreshUser()
    setIsRefreshing(false)
  }

  const handleLogout = async () => {
    try {
      // await logout()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (user?.emailVerified) {
    return null // Don't show if email is verified
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            We've sent a verification email to <span className="font-medium text-gray-900">{user?.email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please check your email and click the verification link to continue. You may need to check your spam folder.
          </p>

          {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

          {resendSuccess && (
            <div className="p-3 text-sm text-green-500 bg-green-50 rounded-md flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Verification email sent successfully!
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full flex items-center justify-center px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800 disabled:bg-gray-400"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Checking..." : "I've verified my email"}
            </button>

            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100"
            >
              {isResending ? "Sending..." : "Resend verification email"}
            </button>

            <button onClick={handleLogout} className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
              Sign in with a different account
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">Having trouble? Contact our support team for assistance.</p>
        </div>
      </div>
    </div>
  )
}
