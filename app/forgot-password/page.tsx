"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import NavBar from "@/components/nav-bar"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      // await resetPassword(email)
      setSuccess(true)
    } catch (err) {
      setError("Failed to send reset email. Please check your email address and try again.")
      console.error(err)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-md p-8 mx-auto bg-white rounded-lg shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="mt-2 text-gray-600">Enter your email to receive a password reset link</p>
          </div>

          {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

          {success ? (
            <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-md">
              <p>Password reset email sent! Check your inbox for further instructions.</p>
              <p className="mt-2">
                Didn&apos;t receive the email?{" "}
                <button onClick={handleSubmit} className="font-medium text-green-800 underline" disabled={loading}>
                  Resend
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 text-white bg-primary rounded-md hover:bg-primary-light disabled:bg-gray-400"
              >
                {loading ? "Sending..." : "Reset Password"}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-center text-gray-600">
            Remember your password?{" "}
            <Link href="/signin" className="font-medium text-black hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
