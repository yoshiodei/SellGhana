"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Flag,
  Heart,
  Share,
  Edit,
  Trash2,
  Eye,
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
  Users,
  GraduationCap,
  Send,
  Banknote,
} from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import type { FirebaseProduct } from "@/lib/firebase/firestore"
import ProductCard from "@/components/product-card"
import NavBar from "@/components/nav-bar"
import { useAppDispatch } from "@/lib/redux/hooks"
import { openShareModal, openReportModal, openDeleteProductModal } from "@/lib/redux/slices/uiSlice"
import ProductNotFound from "@/components/product-not-found"
import { useWishlist } from "@/hooks/use-wishlist"
import { 
    // createOrGetChat, 
    sendMessage 
} from "@/lib/firebase/chats"
import { useParams, useRouter } from "next/navigation"
// import { incrementProductViewCount } from "@/lib/firebase/products"
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"
import { jobListing } from "@/utils/dataFetch"
import { getPostedTimeFromFirestore } from "@/utils/getters"

interface JobPoster {
  uid: string
  firstName: string
  lastName: string
  email: string
  photoURL?: string
  companyName?: string
}

interface JobData extends FirebaseProduct {
  employmentType?: "Full-time" | "Part-time" | "Contract" | "Freelance" | "Internship"
  salary?: string
  title: string
  image?: string
  experience?: "Entry Level" | "Mid Level" | "Senior Level" | "Executive"
  skills?: string[]
  benefits?: string[]
  applicationDeadline?: any
  company?: string
  contact: {email: string, phone: string}
  industry?: string
  workLocation?: string
  applicationEmail?: string
  externalLink?: string
}

export default function JobPage() {
  const {id}:{ id: string } = useParams();
  const [job, setJob] = useState<JobData | null>(null)
  const [jobPoster, setJobPoster] = useState<JobPoster | null>(null)
  const [similarJobs, setSimilarJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  //   const { user } = useAuth()
  const { user } = useAuthUser();
  const { isInWishlist, toggleWishlistItem } = useWishlist()
  const [isLiking, setIsLiking] = useState(false)
  const router = useRouter()
  const [viewCount, setViewCount] = useState<number>(0)

  // Check if current user is the owner of the job
  const isOwner = user && job && user.uid === job.userId

  // Fetch the job poster information
  const fetchJobPoster = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setJobPoster({
          uid: userData.uid,
          firstName: userData.firstName || "Unknown",
          lastName: userData.lastName || "User",
          email: userData.email || "",
          photoURL: userData.photoURL || undefined,
          companyName: userData.companyName || undefined,
        })
      } else {
        console.warn("Job poster not found in users collection")
        setJobPoster({
          uid: userId,
          firstName: "Unknown",
          lastName: "User",
          email: "",
        })
      }
    } catch (error) {
      console.error("Error fetching job poster:", error)
      setJobPoster({
        uid: userId,
        firstName: "Unknown",
        lastName: "User",
        email: "",
      })
    }
  }

  // Fetch the job and similar jobs
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch the job by ID
        const jobDocRef = doc(db, "jobListing", id)
        const jobDocSnap = await getDoc(jobDocRef)

        console.log("Does not live here 1");

        if (!jobDocSnap.exists()) {
          setError("Job not found")
          setLoading(false)
          return
        }

        // Get the job data
        const jobData = {
          ...jobDocSnap.data(),
        } as JobData


        setJob(jobData)
        


        console.log("Does not live here 11111", jobData);


        // Fetch job poster information
        // if (jobData.userId) {
        //   await fetchJobPoster(jobData.userId)
        // }

        // Set view count from job data (default to 0 if not set)
        setViewCount(jobData.viewCount || 0)

        // Fetch similar jobs from the same category
        const similarJobsQuery = query(
          collection(db, "jobListing"),
            where("category", "==", jobData.category),
            where("id", "!=", jobData.id),
            limit(3)
        )

        
        

        const similarJobsSnapshot = await getDocs(similarJobsQuery)

        if (!similarJobsSnapshot.empty) {
          const similarJobsData = similarJobsSnapshot.docs.map((doc) => ({
            ...doc.data(),
          })) as JobData[]

          setSimilarJobs(similarJobsData)
        } else {
          setSimilarJobs([])
        }

      } catch (err) {
        console.error("Error fetching job:", err)
        setError("Failed to load job. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchJobData()
  }, [id, user])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessageError(null)

    if (!message.trim()) {
      setMessageError("Please enter a message")
      return
    }

    if (!user) {
      setMessageError("Please sign in to send messages")
      return
    }

    if (!job) {
      setMessageError("Job information not available")
      return
    }

    if (!jobPoster) {
      setMessageError("Unable to find job poster information")
      return
    }

    if (user.uid === job.userId) {
      setMessageError("You cannot send a message to yourself")
      return
    }

    try {
      setIsSendingMessage(true)

      setMessage("")
      setMessageError(null)
    //   router.push(`/chat?chatId=${chatId}`)
    } catch (error) {
      console.error("Error sending message:", error)
      setMessageError(`Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleApplyExternal = () => {
    if (job?.externalLink) {
      window.open(job.externalLink, "_blank")
    } else if (job?.externalLink) {
      window.open(`mailto:${job.externalLink}?subject=Application for ${job.name}`, "_blank")
    }
  }

  const handleEdit = () => {
    if (job) {
      router.push(`/edit-product/${job.id}?category=job`)
    }
  }

  const handleDelete = () => {
    if (job) {
      dispatch(
        openDeleteProductModal({
          productId: job.id,
          productName: job.name,
          images: job.images || [],
        }),
      )
    }
  }

  const handleShare = () => {
    if (job) {
      const jobUrl = `${window.location.origin}/job/${job.id}`
      dispatch(openShareModal({ productId: job.id, productUrl: jobUrl }))
    }
  }

  const handleReport = () => {
    if (job) {
      dispatch(openReportModal(job.id))
    }
  }

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen">
        <NavBar />
        <div className="container px-4 py-8 mx-auto">
          <div className="animate-pulse">
            <div className="h-4 mb-6 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Error or job not found state
  if (error || !job) {
    return (
      <main className="min-h-screen">
        <NavBar />
        <div className="container px-4 py-8 mx-auto">
          <ProductNotFound message={error || "The job you're looking for doesn't exist or has been removed."} />
        </div>
      </main>
    )
  }

  const isLiked = isInWishlist(job.id)
//   const isDeadlinePassed = job?.applicationDeadline && new Date() > job.applicationDeadline

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container px-4 py-8 mx-auto">
        <Link href="/jobs" className="inline-flex items-center mb-6 text-gray-600 hover:text-black">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to jobs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Job Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <div className="flex flex-col md:flex-row md:items-center gap-3 text-gray-600 mb-4">
                    <span className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      {job.company || "Company"}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {job.workLocation || "Location not specified"}
                    </span>
                    {/* <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {viewCount} views
                    </span> */}
                  </div>
                </div>
              </div>

              {/* Job Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {job.employmentType && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {job.employmentType}
                  </span>
                )}
                {job.workLocation && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {job.workLocation}
                  </span>
                )}
                {job.experience && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {job.experience}
                  </span>
                )}
                {/* {isDeadlinePassed && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    Application Closed
                  </span>
                )} */}
              </div>

              {/* Job Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {job.salary && (
                  <div className="flex items-center">
                    <Banknote className="w-8 h-8 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Salary</p>
                      <p className="font-medium">{job.salary}</p>
                    </div>
                  </div>
                )}
                {job.applicationDeadline && (
                  <div className="flex items-center">
                    <Calendar className="w-8 h-8 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Application Deadline</p>
                      <p className="font-medium">{job.applicationDeadline}</p>
                    </div>
                  </div>
                )}
                {/* {job.education && (
                  <div className="flex items-center">
                    <GraduationCap className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Education</p>
                      <p className="font-medium">{job.education}</p>
                    </div>
                  </div>
                )} */}
              </div>

              <div className="text-sm text-gray-500">
                Posted {job.createdAt ? ` on ${new Date(job.createdAt.toDate()).toLocaleDateString()}` : " recently"}
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Job Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {/* Skills Required */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {/* {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Benefits</h2>
                <ul className="space-y-2">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )} */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <div className="flex items-center mb-4">
                <div className="relative w-12 h-12 mr-3 bg-slate-300 border border-slate-600 overflow-hidden rounded-full">
                  <Image
                    src={job.image || "/suit_case.jpg"}
                    alt="Company"
                    fill
                    className="object-cover w-12 h-12 rounded-full"
                  />
                </div>
                <div>
                  <p className="font-medium">
                    { job.company }
                  </p>
                  { job?.category && (
                      <p className="text-sm text-gray-600">{job.category}</p>
                    )
                  }
                </div>
              </div>
            </div>

            {/* Application Actions */}
            {!isOwner && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Apply for this Job</h3>

                {/* External Application */}
                {job?.externalLink && (
                  <button
                    onClick={handleApplyExternal}
                    disabled={!job?.externalLink}
                    className="w-full mb-3 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Apply Now
                  </button>
                )}

                {/* Message Employer */}
                {/* <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Message Employer</h4>
                  <form onSubmit={handleSendMessage}>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Hi, I'm interested in the ${job.name} position. I'd like to learn more about this opportunity.`}
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />

                    {messageError && (
                      <div className="mb-2 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                        {messageError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50"
                      disabled={!message.trim() || isSendingMessage || !jobPoster}
                    >
                      {isSendingMessage ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                </div> */}
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Manage Your Job Listing</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center justify-center px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Job
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Job
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center justify-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  <Share className="w-4 h-4 mb-1" />
                  <span className="text-xs">Share</span>
                </button>
                <button
                  onClick={handleReport}
                  className="flex flex-col items-center justify-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  <Flag className="w-4 h-4 mb-1" />
                  <span className="text-xs">Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>

       {/* Youre here then check the company image */}

        {/* Similar Jobs */}
        {similarJobs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Similar Jobs</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {similarJobs.map((similarJob: JobData) => (
                <button key={similarJob.id} onClick={() => router.push(`/job/${similarJob.id}`) } className="hover:bg-slate-100 border border-slate-400 rounded-lg p-2 flex flex-col w-full gap-y-2">
                                <div className="w-full">
                                  <div className="flex flex justify-between items-center w-full">
                                    <div className="h-[40px] flex items-center">
                                      <div className="me-[7px] w-[40px] h-[40px] rounded-full bg-slate-300 border border-slate-500 overflow-hidden">
                                        <Image  
                                          src={similarJob.image || "/suit_case.jpg"}
                                          alt="company" 
                                          width={200}
                                          height={200}
                                          className="object-cover w-[40px] h-[40px] rounded-full"
                                        />
                                      </div>
                                      <p className="text-[0.85em] font-semibold truncate">{similarJob.company}</p>
                                    </div>
                                    <p className="text-[0.72em] text-slate-500">{getPostedTimeFromFirestore(similarJob.createdAt)}</p>
                                  </div>
                                </div>
                                <h5 className="text-[1em] text-left font-bold text-slate-700">{similarJob.title}</h5>
                                {(similarJob?.skills?.length === 0) && (<div className="flex flex-wrap gap-2">
                                  {similarJob.skills.map((type) => (
                                    <div className="font-semibold p-1 bg-slate-300 text-slate-500 rounded text-[0.75em]">{type}</div>
                                  ))}
                                </div>)}
                                <div className="flex gap-2 items-center text-slate-600">
                                  <Banknote />
                                  <p className="text-[0.95em] font-semibold">{similarJob.salary}</p>
                                </div>
                              </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
