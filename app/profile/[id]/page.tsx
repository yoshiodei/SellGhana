"use client"

import type React from "react"
// import { logoutUser } from "@/utils/logoutUser"
import { useEffect, useState } from "react"
import Image from "next/image"
import { ghanaRegions } from "@/lib/ghana-regions"
import { Settings, X, PlusCircle, Banknote } from "lucide-react"
import NavBar from "@/components/nav-bar"
import { db, storage } from "@/lib/firebase/firebase"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { logout } from "@/lib/auth/utils/logout"
import { useParams, useRouter } from "next/navigation"
// import { getActiveResourcesInfo } from "node:process"
import { getUserData, getUserJobs, getUserListings, jobListing } from "@/utils/dataFetch"
import { FirebaseProduct } from "@/lib/firebase/firestore"
import LoadingSpinner from "@/components/loading-spinner"
import { formatDistanceToNow } from 'date-fns';
import { getPostedTimeFromFirestore } from "@/utils/getters"
import { showToast } from "@/utils/showToast"
import { doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { getAuth, updateProfile } from "firebase/auth"

export default function ProfilePage() {
  const auth = getAuth();
  const user = auth.currentUser;

  // Maximum file size in bytes (1MB)
  const MAX_FILE_SIZE = 1024 * 1024

  const router = useRouter();
  // const { user } = useAuthUser();
  const [] = useState()
  const [listings, setListings] = useState<FirebaseProduct[]>([]);
  const [jobs, setJobs] = useState<jobListing[]>([]);
  const [time, setTime] = useState(Date.now());
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imageData, setImageData] = useState<{url?:string, path?:string, name?:string, size?:number, type?:string} | null>({url:'', path:'', name: '', size: 0, type: ''});
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  // console.log("profile auth---->", user);
  const {id}:{id:string} = useParams();

  const [formData, setFormData] = useState({
    displayName: "User",
    location: {region:'', suburb:''},
    email: '',
    phone: '',
    photoURL: "/placeholder.svg?height=96&width=96",
    createdAt: '',
  })

  const [editFormData, setEditFormData] = useState({
    displayName: "User",
    location: {region:'', suburb:''},
    email: '',
    phone: '',
    photoURL: "/placeholder.svg?height=96&width=96",
    createdAt: '',
  })

  const [showEditModal, setShowEditModal] = useState(false)
  const [tab, setTab] = useState< "products" | "jobs" >("products")
  
  const loadUserData = async () => {
    setLoading(true);
    const userData = await getUserData(id);

    setFormData({
      displayName: userData?.displayName,
      phone: userData?.phone,
      email: userData?.email,
      location: {region: (userData?.location?.region || ""), suburb: (userData?.location?.suburb || "")},
      photoURL: userData?.photoURL,
      createdAt: userData?.createdAt,
    });

    setEditFormData({
      displayName: userData?.displayName,
      phone: userData?.phone,
      email: userData?.email,
      location: {region: (userData?.location?.region || ""), suburb: (userData?.location?.suburb || "")},
      photoURL: userData?.photoURL,
      createdAt: userData?.createdAt,
    });

    if(imageData?.url || userData?.photoURL){
      setImageData({...imageData, url: userData?.photoURL});
    } else {
      setImageData({
        url: '',
        path: '',
        name: '',
        size: 0,
        type: '',
      });
    }

    const listing = await getUserListings(id);
    const jobs = await getUserJobs(id) 

    setJobs(jobs);
    setListings(listing);
    setLoading(false);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return
  
      const file = files[0]
  
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        // setErrors((prev) => ({ ...prev, image: "Image must be 1MB or less" }))
        showToast("Image must be 1MB or less","error")
        return
      }
      
      const imageRef = ref(storage, `productImages/${id}/${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
  
      setImageData({
        url: downloadURL,
        path: snapshot.ref.fullPath,
        name: file.name,
        size: file.size,
        type: file.type,
        }
      )
    }

  useEffect(() => {
      loadUserData();
  },
  [id]
  // [id, time]
  );

  const getSuburbs = () => {
    if (!editFormData?.location?.region) return []
    return ghanaRegions[editFormData?.location?.region] || []
}

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
       
    const { name, value } = e.target

    if(name === "region"){
      setEditFormData((prev) => ({ 
          ...prev, 
          location: {
            suburb: '',
            [name]: value, 
      }}))
    }
    else if(name === "suburb"){
      setEditFormData((prev) => ({ 
          ...prev, 
          location: {
            ...editFormData.location,
            [name]: value, 
      }}))
    }
    else{
      setEditFormData((prev) => ({ ...prev, [name]: value }))
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if(!editFormData?.displayName){
      newErrors.displayName = "Name is required"
    }
    if(editFormData?.phone && editFormData?.phone?.length !== 10){
      newErrors.phone = "Phone number must be 10 digits","error"
    }
    if(!editFormData?.location?.region){
      newErrors.region = "Region is required"
    }
    if(!editFormData?.location?.suburb){
      newErrors.suburb = "Suburb is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setEditLoading(true);
      

    const finalFormData = {
      displayName: editFormData?.displayName,
      phone: editFormData?.phone,
      email: editFormData?.email,
      location: {region: (editFormData?.location?.region || ""), suburb: (editFormData?.location?.suburb || "")},
      photoURL: imageData?.url,
      imageData,
      lastUpdated: serverTimestamp(),
    }

    console.log("edited data", finalFormData);

    const userRef = doc(db, "users", id);
    
    await updateDoc(userRef, finalFormData);

    if (user) {
      try {
        await updateProfile(user, {
          photoURL: imageData?.url || "",
          displayName: editFormData?.displayName, 
        });
        console.log("Photo URL updated!");
      } catch (error) {
        console.error("Error updating photoURL:", error);
      }
    } else {
      console.warn("No user is currently signed in.");
    }
      setShowEditModal(false);
      setEditLoading(false);
      window.location.reload();
      setTime(Date.now());
      showToast("Post updated successfully","success");
      
    }
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
                  <Image src={formData.photoURL || "/user_placeholder.png"} alt="Profile" fill className="object-cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col items-center justify-between md:flex-row">
                    <h1 className="mb-2 text-2xl font-bold">{formData?.displayName}</h1>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center mb-3 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  </div>
                  {formData?.location?.region && <p className="text-gray-600">{`${`${formData?.location?.region}, ${formData?.location?.suburb}` || ""}`}</p>}
                  {formData?.email && <p className="text-gray-600">{`${formData?.email || "Unknown"}`}</p>}
                  {formData?.phone && <p className="text-gray-600">{`${formData?.phone || "Unknown"}`}</p>}
                  {formData?.createdAt && <p className="mt-2 text-gray-600">{`Member since January ${new Date(formData?.createdAt).getFullYear()}`}</p>}
                  <div className="flex justify-center mt-4 space-x-4 md:justify-start">
                    <div className="text-center">
                      <p className="font-bold">{isNaN(listings?.length) ? "N/A" : listings.length}</p>
                      <p className="text-sm text-gray-600">Product Posts</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold">{isNaN(jobs?.length) ? "N/A" : jobs.length}</p>
                      <p className="text-sm text-gray-600">Job Posts</p>
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
                <button onClick={() => setTab("products")} className={`px-1 py-4 text-sm font-medium border-b-2 hover:border-b-2 hover:border-primary ${tab === "products" ? "border-b-2 border-primary" : ""}`}>My Products</button>
                <button onClick={() => setTab("jobs")} className={`px-1 py-4 text-sm font-medium border-b-2 hover:border-b-2 hover:border-primary ${tab === "jobs" ? "border-b-2 border-primary" : ""}`}>My Jobs</button>
              </div>
            </div>

            {/* Listings */}
            {
             tab === "products"  && (listings.length === 0 ?
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
            </div>))
            }

            {
             tab === "jobs" && (jobs.length === 0 ?
              (
                <div className="container px-4 mx-auto">
                  <div>
                    <p className="text-lg mb-5">No jobs found.</p>
                    <button onClick={() => {router.push("/new-post/jobs")}} className="flex items-center rounded text-primary py-2 px-6 border border-primary hover:bg-primary-alt">
                      <PlusCircle className="w-4 h-4 mr-2 text-primary" />
                      Create New Job
                    </button>
                  </div>
                </div>
              ) :
            (<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 ">
              {jobs.map((job) => (
                <button key={job.id} onClick={() => router.push(`/job/${job.id}`) } className="hover:bg-slate-100 border border-slate-400 rounded-lg p-2 flex flex-col w-full gap-y-2">
                <div className="w-full">
                  <div className="flex flex justify-between items-center w-full">
                    <div className="h-[40px] flex items-center">
                      <div className="me-[7px] w-[40px] h-[40px] rounded-full bg-slate-300 border border-slate-500 overflow-hidden">
                        <Image  
                          src={job.image || "/suit_case.jpg"}
                          alt="company" 
                          width={200}
                          height={200}
                          className="object-cover w-[40px] h-[40px] rounded-full"
                        />
                      </div>
                      <p className="text-[0.85em] font-semibold truncate">{job.company}</p>
                    </div>
                    <p className="text-[0.72em] text-slate-500">{getPostedTimeFromFirestore(job.createdAt)}</p>
                  </div>
                </div>
                <h5 className="text-[1em] text-left font-bold text-slate-700">{job.title}</h5>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((type) => (
                    <div key={type} className="font-semibold p-1 bg-slate-300 text-slate-500 rounded text-[0.75em]">{type}</div>
                  ))}
                </div>
                <div className="flex gap-2 items-center text-slate-600">
                  <Banknote />
                  <p className="text-[0.95em] font-semibold">{job.salary}</p>
                </div>
              </button>
              ))}
            </div>))
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
                      <Image src={imageData?.url || "/user_placeholder.png"} alt="Profile" fill className="object-cover" />
                    </div>
                    <label
                      htmlFor="photoURL"
                      className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      Change Image
                    </label>
                    <input 
                      id="photoURL" 
                      name="photoURL" 
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="displayName"
                    value={editFormData.displayName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  {errors.displayName && <p className="mt-1 text-sm text-red-500">{errors.displayName}</p>}
                </div>

                <div className="mb-4">
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editFormData.email}
                    readOnly={true}
                    className="w-full text-slate-400 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="mb-6">
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    {/* Region */}
                    <div>
                      <label htmlFor="region" className="block mb-2 text-sm font-medium text-gray-700">
                        Region <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="region"
                        name="region"
                        value={editFormData?.location?.region || ""}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black`}
                      >
                        <option value="">Select Region</option>
                        {Object.keys(ghanaRegions).map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                      {errors.region && <p className="mt-1 text-sm text-red-500">{errors.region}</p>}
                    </div>
  
                    {/* Suburb (conditional) */}
                    {editFormData?.location?.region && (
                      <div>
                        <label htmlFor="suburb" className="block mb-2 text-sm font-medium text-gray-700">
                          Suburb <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="suburb"
                          name="suburb"
                          value={editFormData.location.suburb || ""}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black`}
                        >
                          <option value="">Select Suburb</option>
                          {getSuburbs().map((suburb) => (
                            <option key={suburb} value={suburb}>
                              {suburb}
                            </option>
                          ))}
                        </select>
                        {errors.suburb && <p className="mt-1 text-sm text-red-500">{errors.suburb}</p>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 text-white bg-primary rounded-md hover:bg-primary-light">
                    {editLoading ? "...loading" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
  )
}
