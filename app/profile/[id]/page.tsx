"use client"

import type React from "react"
// import { logoutUser } from "@/utils/logoutUser"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Settings, X, PlusCircle } from "lucide-react"
import NavBar from "@/components/nav-bar"
// import ProtectedRoute from "@/lib/auth/ProtectedRoutes"
// import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"
import { logout } from "@/lib/auth/utils/logout"
import { useParams, useRouter } from "next/navigation"
// import { getActiveResourcesInfo } from "node:process"
import { getUserData, getUserListings } from "@/utils/dataFetch"
import { FirebaseProduct } from "@/lib/firebase/firestore"
import LoadingSpinner from "@/components/loading-spinner"
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const router = useRouter();
  // const { user } = useAuthUser();
  const [listings, setListings] = useState<FirebaseProduct[]>([]);
  const [loading, setLoading] = useState(false);
  // console.log("profile auth---->", user);
  const {id}:{id:string} = useParams();

  const [formData, setFormData] = useState({
    name: "User",
    location: "Accra, Ghana",
    email: '',
    phone: '',
    image: "/placeholder.svg?height=96&width=96",
    createdAt: '',
  })

  function getPostedTimeFromFirestore(timestamp: any): string {
    if (!timestamp || typeof timestamp.toDate !== "function") return "posted some time ago";
  
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds
  
    if (diff < 60) return "posted just now";
    if (diff < 3600) return `posted ${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `posted ${Math.floor(diff / 3600)} hours ago`;
    if (diff < 2592000) return `posted ${Math.floor(diff / 86400)} days ago`;
    if (diff < 31536000) return `posted ${Math.floor(diff / 2592000)} months ago`;
    return `posted ${Math.floor(diff / 31536000)} years ago`;
  }

  const [showEditModal, setShowEditModal] = useState(false)
  
  const loadUserData = async () => {
    setLoading(true);
    const userData = await getUserData(id);

    setFormData({
      name: userData?.displayName,
      phone: userData?.phone,
      email: userData?.email,
      location: userData?.location,
      image: userData?.image,
      createdAt: userData?.createdAt,
    });

    const listing = await getUserListings(id);
    setListings(listing);
    setLoading(false);
  }
  
  useEffect(() => {
    loadUserData();
  },[id]);

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
      await logout(router);
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container px-4 py-8 mx-auto">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </main>
    )
  }

  return (
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
                    <h1 className="mb-2 text-2xl font-bold">{formData?.name}</h1>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center mb-3 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  </div>
                  {formData?.location && <p className="text-gray-600">{`${formData?.location || "Unknown"}`}</p>}
                  {formData?.email && <p className="text-gray-600">{`${formData?.email || "Unknown"}`}</p>}
                  {formData?.phone && <p className="text-gray-600">{`${formData?.phone || "Unknown"}`}</p>}
                  {formData?.createdAt && <p className="mt-2 text-gray-600">{`Member since January ${new Date(formData?.createdAt).getFullYear()}`}</p>}
                  <div className="flex justify-center mt-4 space-x-4 md:justify-start">
                    <div className="text-center">
                      <p className="font-bold">{isNaN(listings?.length) ? "N/A" : listings.length}</p>
                      <p className="text-sm text-gray-600">Listings</p>
                    </div>
                    {/* <div className="text-center">
                      <p className="font-bold">156</p>
                      <p className="text-sm text-gray-600">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">42</p>
                      <p className="text-sm text-gray-600">Following</p>
                    </div> */}
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
                <button className="px-1 py-4 text-sm font-medium border-b-2 border-primary">My Listings</button>
                {/* <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-black">
                  Saved
                </button>
                <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-black">
                  Sold
                </button>
                <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-black">
                  Purchased
                </button>
                <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 hover:text-black">
                  Reviews
                </button> */}
              </div>
            </div>

            {/* Listings */}
            {
              listings.length === 0 ?
              (
                <div className="container px-4 mx-auto">
                  <div>
                    <p className="text-lg mb-5">No products found.</p>
                    <button onClick={() => {router.push("/categories")}} className="flex items-center rounded text-primary py-2 px-6 border border-primary hover:bg-primary-alt">
                      <PlusCircle className="w-4 h-4 mr-2 text-primary" />
                      Create New Post
                    </button>
                  </div>
                </div>
              ) :
            (<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 ">
              {listings.map((item) => (
                <button 
                  key={item.id}
                  className="overflow-hidden bg-white border rounded-lg shadow-sm"
                  onClick={() => {router.push(`/product/${item.id}`)}}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={item.images[0] || `/placeholder.svg?height=300&width=300&text=Product`}
                      alt={`Product ${item}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium truncate">{item.name}</h3>
                    <p className="mt-1 font-medium">${(item.price).toFixed(2)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{getPostedTimeFromFirestore(item.createdAt)}</span>
                      <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">Active</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>)
            }
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
  )
}
