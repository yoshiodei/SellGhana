"use client"

import type React from "react"
import { logoutUser } from "@/utils/logoutUser"
import { useState } from "react"
import Image from "next/image"
import { Settings, X } from "lucide-react"
import NavBar from "@/components/nav-bar"
import ProtectedRoute from "@/lib/auth/ProtectedRoutes"
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"

export default function ProfilePage() {
  const { user, loading } = useAuthUser();
  console.log("profile auth---->", user);
  
  

  const [showEditModal, setShowEditModal] = useState(false)
  // const { user, logout } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.displayName || "User",
    location: "Accra, Ghana",
    image: user?.photoURL || "/placeholder.svg?height=96&width=96",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would update the user profile in Firebase
    setShowEditModal(false)
  }

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <NavBar />
        
        <div className="container px-4 py-8 mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
              <div className="flex flex-col items-center md:flex-row md:items-start">
                <div className="relative w-24 h-24 mb-4 overflow-hidden rounded-full md:mb-0 md:mr-6">
                  <Image src={formData.image || "/placeholder.svg"} alt="Profile" fill className="object-cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col items-center justify-between md:flex-row">
                    <h1 className="mb-2 text-2xl font-bold">{formData.name}</h1>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  </div>
                  <p className="text-gray-600">{formData.location}</p>
                  <p className="mt-2 text-gray-600">Member since January 2023</p>
                  <div className="flex justify-center mt-4 space-x-4 md:justify-start">
                    <div className="text-center">
                      <p className="font-bold">2400</p>
                      <p className="text-sm text-gray-600">Listings</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">156</p>
                      <p className="text-sm text-gray-600">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">42</p>
                      <p className="text-sm text-gray-600">Following</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="mb-6 text-right">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 ml-auto text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Log Out
              </button>
            </div>

            {/* Profile Tabs */}
            <div className="mb-6 overflow-x-auto border-b">
              <div className="flex space-x-8">
                <button className="px-1 py-4 text-sm font-medium border-b-2 border-black">My Listings</button>
                <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-black">
                  Saved
                </button>
                <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-black">
                  Sold
                </button>
                <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-black">
                  Purchased
                </button>
                <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-black">
                  Reviews
                </button>
              </div>
            </div>

            {/* Listings */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="overflow-hidden bg-white border rounded-lg shadow-sm">
                  <div className="relative aspect-square">
                    <Image
                      src={`/placeholder.svg?height=300&width=300&text=Product ${item}`}
                      alt={`Product ${item}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium">Product Name {item}</h3>
                    <p className="mt-1 font-medium">${(Math.random() * 100).toFixed(2)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">2 days ago</span>
                      <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Edit Profile</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-black">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Profile Image</label>
                  <div className="flex items-center">
                    <div className="relative w-16 h-16 mr-4 overflow-hidden rounded-full">
                      <Image src={formData.image || "/placeholder.svg"} alt="Profile" fill className="object-cover" />
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      Change Image
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  )
}
