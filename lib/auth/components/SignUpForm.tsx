"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import NavBar from "@/components/nav-bar"
import { useAuth } from "@/lib/auth/context/AuthContext"
import { showToast } from "@/utils/showToast"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/firebase"
import { GoogleAuthProvider, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"

export default function SignUpForm() {
    const router = useRouter();
    const { user } = useAuth();
    
    console.log("show user data", auth);

    const [firstName, setFirstName] = useState("")
    const [loadingSignup, setLoadingSignup] = useState(false)
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [phone, setPhone] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  
    

    useEffect(() => {
      if (user && !user.emailVerified) {
        setShowVerificationMessage(true)
      }
    }, [user])
  
const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();

    const res = await fetch("/api/auth/google-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Google sign-in failed.");
    }

    showToast("Google sign-in successful!", "success");
    router.push("/");
  } catch (error: any) {
    showToast((error.message || "Google sign-in failed"), "error");
  }
}

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoadingSignup(true);

      const payload = {firstName, lastName, phone, email, password};
      
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          showToast(data.message || 'Signup failed', 'error');
          return;
        }
  
        showToast('Signup successful. Sending verification email...', 'success');
  
        // Sign in the user (client-side)
        const userCredential = await signInWithEmailAndPassword(auth, payload.email, payload.password);
  
        // Send email verification
        await sendEmailVerification(userCredential.user);
        showToast('Verification email sent successfully.', 'success');
        console.log("abaoooooo --", auth);
        
        router.push('/verifyEmail');
      } catch (err) {
        console.error('Signup error:', err);
        showToast('Something went wrong. Please try again.', 'error');
      } finally {
        setLoadingSignup(false);
      }
    }  

  return (
    <main className="min-h-screen bg-gray-50">
      {/* <NavBar /> */}
      <NavBar />

      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-md p-8 mx-auto bg-white rounded-lg shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Create an Account</h1>
            <p className="mt-2 text-gray-600">Join Sell Ghana and start buying and selling!</p>
          </div>

          {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

          {showVerificationMessage && (
            <div className="p-3 mb-4 text-sm text-green-500 bg-green-50 rounded-md">
              Please verify your email address to continue.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

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
            
            <div>
              <label htmlFor="phone" className="block mb-1 text-sm font-medium text-gray-700">
                Phone Number
              </label>  
              <div className="flex items-center border rounded-md overflow-hidden">
              <span className="p-3 h-full bg-gray-100 text-gray-600 font-medium">+233</span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 p-2 outline-none"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                required
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{" "}
                <Link href="/terms" className="text-black hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-black hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loadingSignup}
              className="w-full px-4 py-2 text-white bg-primary rounded-md hover:primary-light disabled:bg-gray-400"
            >
              {loadingSignup ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="px-3 text-sm text-gray-500">or</div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loadingSignup}
            className="flex items-center justify-center w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100"
          >
            <Image src="/google-logo.png" alt="Google" width={20} height={20} className="mr-2" />
            Sign up with Google
          </button>

          <p className="mt-6 text-sm text-center text-gray-600">
            Already have an account?{" "}
            <Link href="/signin" className="font-medium text-black hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>

  )
}
