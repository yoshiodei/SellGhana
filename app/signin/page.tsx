"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import NavBar from "@/components/nav-bar"
import { signInWithGoogle } from "@/utils/googleSignin"
import { signInWithEmail } from "@/utils/signinUser"
import { showToast } from "@/utils/showToast"
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { useRouter } from "next/navigation"

interface signInPayload {
  email: string;
  password: string;
}

export default function SignInPage() {
  const router = useRouter();

  const initialState = {
    email: "",
    password: "",
  }

  const [formData, setFormData] = useState<signInPayload>(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = ({name, value}: {name: string, value: string}) => {
    setFormData({...formData, [name]: value});
    console.log("form data", formData);
  }

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setError("")

  //   try {
  //       setLoading(true);
  //       const {email, password} = formData;
  //       await signInWithEmail(email, password);
  //       console.log("user signed up successfully");
  //       setLoading(false);
  //     } catch (err) {
  //       setLoading(false);
  //       if (err instanceof Error) {
  //         setError(err.message);
  //         console.error(err);
  //       } else {
  //       setError("An unknown error occurred.");
  //       console.error("Unknown error", err);
  //     }
  //   }
  // }

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setError("")

    
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("");
    
    const { email, password } = formData;

    try {
      // 1. Check if email exists from server
      console.log("check if email exists from server", email);
      
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          showToast("User not found", "error");
        } else {
          showToast("Server error occurred.", "error");
        }
        return;
      }

      // 2. Proceed to sign in
      await signInWithEmailAndPassword(auth, email, password);
      
      showToast("Signed in successfully!", "success");
      router.push("/"); // ✅ Redirect after successful sign-in
    } catch (error: any) {
      console.error("Firebase sign-in error:", error);
      const message =
        error.code === "auth/wrong-password"
          ? "Incorrect password."
          : error.code === "auth/invalid-email"
          ? "Invalid email."
          : "Failed to sign in.";
      showToast(message, "error");
    }
  };

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


  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-md p-8 mx-auto bg-white rounded-lg shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Sign In to Sell Ghana</h1>
            <p className="mt-2 text-gray-600">Welcome back! Please enter your details.</p>
          </div>

          {error && <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange(e.target)}
                placeholder="Enter your email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-black">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange(e.target)}
                  placeholder="Enter your password"
                  required
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-primary rounded-md hover:bg-primary-light disabled:bg-gray-400"
            >
              {loading ? "Signing in..." : "Sign In"}
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
            disabled={loading}
            className="flex items-center justify-center w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100"
          >
            <Image src="/google-logo.png" alt="Google" width={20} height={20} className="mr-2" />
            Sign in with Google
          </button>

          <p className="mt-6 text-sm text-center text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-black hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
