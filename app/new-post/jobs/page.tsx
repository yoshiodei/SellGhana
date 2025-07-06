"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Upload, X, Check, AlertCircle, Calendar, ExternalLink } from "lucide-react"
import NavBar from "@/components/nav-bar"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import ProtectedRoute from "@/lib/auth/ProtectedRoutes"
import { db, storage } from "@/lib/firebase/firebase"
import { ghanaRegions } from "@/lib/ghana-regions"
import { showToast } from "@/utils/showToast"
import { useRouter } from "next/navigation"
import { getFirstThreeLetters } from "@/utils/getters"
import { nanoid } from "nanoid"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"

// Form data type
interface JobForm {
  title: string
  company: string
  category: string
  isRemote: boolean
  region: string
  suburb: string
  description: string
  salaryMin: string
  salaryMax: string
  email: string
  phone: string
  applicationDeadline: string
  experience: string
  employmentType: string
  otherCategory: string
  externalLink: string
}

interface ImageType { 
  file: File 
  preview: string 
}

// Job categories
const JOB_CATEGORIES = [
  "IT & Software",
  "Construction",
  "Cleaning",
  "Tutoring & Education",
  "Delivery & Logistics",
  "Healthcare",
  "Hospitality",
  "Sales & Marketing",
  "Administrative",
  "Customer Service",
  "Finance & Accounting",
  "Engineering",
  "Agriculture",
  "Manufacturing",
  "Media & Design",
  "Security",
  "Other",
]

// Experience levels
const EXPERIENCE_LEVELS = [
  "Entry Level",
  "Internship",
  "Junior Level",
  "Mid Level",
  "Senior Level",
  "Management",
  "Executive",
  "Any Level",
]

// Employment types
const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance",
  "One-time Service",
  "Volunteer",
]

// Common skills by category
const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  "IT & Software": [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "Java",
    "SQL",
    "AWS",
    "DevOps",
    "UI/UX Design",
    "PHP",
    "Mobile Development",
    "Data Analysis",
  ],
  Construction: [
    "Carpentry",
    "Electrical",
    "Plumbing",
    "Masonry",
    "Welding",
    "Blueprint Reading",
    "Heavy Equipment Operation",
    "Painting",
    "Roofing",
    "Project Management",
  ],
  Cleaning: [
    "Residential Cleaning",
    "Commercial Cleaning",
    "Deep Cleaning",
    "Carpet Cleaning",
    "Window Cleaning",
    "Sanitization",
    "Equipment Maintenance",
  ],
  "Tutoring & Education": [
    "Mathematics",
    "Science",
    "English",
    "History",
    "Computer Skills",
    "Test Preparation",
    "Special Education",
    "Language Teaching",
    "Music Instruction",
  ],
  "Delivery & Logistics": [
    "Driving",
    "Route Planning",
    "Inventory Management",
    "Warehouse Operations",
    "Supply Chain",
    "Fleet Management",
    "Package Handling",
    "Customer Service",
  ],
  default: [
    "Communication",
    "Customer Service",
    "Microsoft Office",
    "Excel",
    "Time Management",
    "Problem Solving",
    "Teamwork",
    "Leadership",
    "Project Management",
    "Attention to Detail",
  ],
}

// Maximum file size in bytes (1MB)
const MAX_FILE_SIZE = 1024 * 1024

export default function NewJobPostPage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialFormState = {
    title: "",
    company: "",
    category: "",
    otherCategory: "",
    isRemote: false,
    region: "",
    suburb: "",
    description: "",
    salaryMin: "",
    salaryMax: "",
    email: "",
    phone: "",
    applicationDeadline: "",
    experience: "",
    employmentType: "",
    externalLink: "",
  };
  const [formData, setFormData] = useState<JobForm>(initialFormState)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState("")
  const [image, setImage] = useState<ImageType | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Get skills based on selected category
  const getSkillsForCategory = () => {
    if (!formData.category) return SKILLS_BY_CATEGORY.default
    return SKILLS_BY_CATEGORY[formData.category] || SKILLS_BY_CATEGORY.default
  }

  // Get suburbs for the selected region
  const getSuburbs = () => {
    if (!formData.region) return []
    return ghanaRegions[formData.region] || []
  }

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    // Handle checkbox inputs differently
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked

      if (name === "isRemote") {
        // Clear region and suburb if remote is checked
        setFormData((prev) => ({
          ...prev,
          isRemote: checked,
          ...(checked ? { region: "", suburb: "" } : {}),
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
        }))
      }
    }
    // Handle region changes
    else if (name === "region") {
      setFormData((prev) => ({
        ...prev,
        region: value,
        suburb: "",
      }))
    }
    // Handle all other inputs
    else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle skill selection
  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  // Add custom skill
  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills((prev) => [...prev, customSkill.trim()])
      setCustomSkill("")
    }
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, image: "Image must be 1MB or less" }))
      return
    }

    // Clear image error if it exists
    if (errors.image) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.image
        return newErrors
      })
    }

    // If there was a previous image, revoke its object URL
    if (image) {
      URL.revokeObjectURL(image.preview)
    }

    // Set the new image
    setImage({
      file,
      preview: URL.createObjectURL(file),
    })

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Remove the uploaded image
  const removeImage = () => {
    if (image) {
      URL.revokeObjectURL(image.preview)
      setImage(null)
    }
  }

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = "Job title is required"
    }

    if (!formData.company.trim()) {
      newErrors.company = "Company name is required"
    }

    if (!formData.category || (formData.category === "Other" && !formData.otherCategory)) {
      newErrors.category = "Job category is required"
    }

    // Location validation
    if (!formData.isRemote) {
      if (!formData.region) {
        newErrors.region = "Region is required for non-remote jobs"
      }
      if (formData.region && !formData.suburb) {
        newErrors.suburb = "Suburb is required for non-remote jobs"
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = "Job description is required"
    }

    const regex = /^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([\/\w\-._~:?#[\]@!$&'()*+,;=]*)?$/;

    if (formData.externalLink && !regex.test(formData.externalLink)) {
      newErrors.externalLink = "URL entered is invalid"
    }

    // Salary validation
    if (formData.salaryMin && formData.salaryMax) {
      const min = Number(formData.salaryMin)
      const max = Number(formData.salaryMax)
      if (isNaN(min) || min <= 0) {
        newErrors.salaryMin = "Minimum salary must be a positive number"
      }
      if (isNaN(max) || max <= 0) {
        newErrors.salaryMax = "Maximum salary must be a positive number"
      }
      if (min > max) {
        newErrors.salaryRange = "Minimum salary cannot be greater than maximum salary"
      }
    } else if (formData.salaryMin && !formData.salaryMax) {
      const min = Number(formData.salaryMin)
      if (isNaN(min) || min <= 0) {
        newErrors.salaryMin = "Minimum salary must be a positive number"
      }
    } else if (!formData.salaryMin && formData.salaryMax) {
      const max = Number(formData.salaryMax)
      if (isNaN(max) || max <= 0) {
        newErrors.salaryMax = "Maximum salary must be a positive number"
      }
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && !/^[0-9+\-\s()]{7,15}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number"
    }

    // Application deadline validation
    if (!formData.applicationDeadline) {
      newErrors.applicationDeadline = "Application deadline is required"
    } else {
      const deadlineDate = new Date(formData.applicationDeadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (deadlineDate < today) {
        newErrors.applicationDeadline = "Application deadline cannot be in the past"
      }
    }

    if (!formData.experience) {
      newErrors.experience = "Experience level is required"
    }

    if (!formData.employmentType) {
      newErrors.employmentType = "Employment type is required"
    }

    if (selectedSkills.length === 0) {
      newErrors.skills = "At least one skill is required"
    }

    if (selectedSkills.length === 0) {
      newErrors.skills = "At least one skill is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try{
    if (validateForm()) {
      const  three = getFirstThreeLetters("jobs");
        const productId = `sg-${three}-${nanoid()}`;

      const uploadSingleImage = async (image: ImageType | null, productId: string) => {
        if(!image){
          return null;
        }

        const imageRef = ref(storage, `productImages/${productId}/${image.file.name}`);
        await uploadBytes(imageRef, image.file);
        const downloadURL = await getDownloadURL(imageRef);
        return downloadURL;
      };

      const uploadImage = await uploadSingleImage(image,productId);

      // Prepare the data object
      const jobData = {
        id: productId,
        title: formData.title,
        company: formData.company,
        category: formData.category,
        location: formData.isRemote ? "Remote" : `${formData.suburb}, ${formData.region}`,
        isRemote: formData.isRemote,
        description: formData.description,
        salary:
          formData.salaryMin && formData.salaryMax
            ? `GH₵${formData.salaryMin} - GH₵${formData.salaryMax}`
            : formData.salaryMin
              ? `GH₵${formData.salaryMin}`
              : formData.salaryMax
                ? `Up to GH₵${formData.salaryMax}`
                : "Salary Not specified",
        salaryDetails: {
          min: formData.salaryMin ? Number(formData.salaryMin) : null,
          max: formData.salaryMax ? Number(formData.salaryMax) : null,
        },
        skills: selectedSkills,
        contact: {
          email: formData.email,
          phone: formData.phone || "Not provided",
        },
        applicationDeadline: formData.applicationDeadline,
        experience: formData.experience,
        employmentType: formData.employmentType,
        image: uploadImage || "",
        createdAt: serverTimestamp(),
        externalLink: formData.externalLink,
      }

      // In a real app, you would submit this data to your backend
      console.log("Job posting submitted:", jobData)

      await setDoc(doc(db, "jobListing", productId), jobData);
      
      // Show the submitted data
      // setSubmittedData(jobData)
      // setIsSubmitted(true)

      showToast("Post added successfully","success");
      setFormData(initialFormState);
      router.push("/");

    }
    setLoading(false);
    } catch (error){
      setLoading(false);
      showToast("Error adding post","error")
      console.error('Error submitting listing:', error);
    }
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image.preview)
      }
    }
  }, [])

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <NavBar />

        <div className="container px-4 py-8 mx-auto">
          <div className="max-w-3xl mx-auto">
            <Link href="/categories" className="inline-flex items-center mb-6 text-gray-600 hover:text-black">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to categories
            </Link>

            <h1 className="mb-2 text-2xl font-bold">Create Job Listing</h1>
            <p className="mb-6 text-gray-600">Fill in the details to post a new job opportunity</p>

            {isSubmitted ? (
              <div className="p-6 bg-white rounded-lg shadow">
                <div className="flex items-center mb-4 text-green-600">
                  <Check className="w-6 h-6 mr-2" />
                  <h2 className="text-xl font-semibold">Job Posted Successfully!</h2>
                </div>

                <div className="p-4 mb-6 bg-gray-50 rounded-lg">
                  <h3 className="mb-2 font-medium">Job Details:</h3>
                  <pre className="p-4 overflow-auto text-sm bg-gray-100 rounded">
                    {JSON.stringify(submittedData, null, 2)}
                  </pre>
                </div>

                <div className="flex justify-between">
                  <Link
                    href="/new-post/job"
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    Post Another Job
                  </Link>
                  <Link href="/" className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800">
                    Go to Home
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
                {/* Job Title */}
                <div className="mb-4">
                  <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-700">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.title ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g., Software Developer, Construction Manager"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                </div>

                {/* Company */}
                <div className="mb-4">
                  <label htmlFor="company" className="block mb-2 text-sm font-medium text-gray-700">
                    Company Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.company ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Company name"
                  />
                  {errors.company && <p className="mt-1 text-sm text-red-500">{errors.company}</p>}
                </div>

                {/* Job Category */}
                <div className="mb-4">
                  <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-700">
                    Job Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.category ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Category</option>
                    {JOB_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                </div>

                {formData.category === "Other" && (
                  <div className="mb-4">
                    <label htmlFor="otherCategory" className="block mb-2 text-sm font-medium text-gray-700">
                      Specify Category<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="otherCategory"
                      name="otherCategory"
                      value={formData.otherCategory}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.otherCategory ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter brand name"
                    />
                    {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                  </div>
                )}

                {/* Location */}
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Location</label>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="isRemote"
                      name="isRemote"
                      checked={formData.isRemote}
                      onChange={handleChange}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <label htmlFor="isRemote" className="ml-2 text-sm text-gray-700">
                      This is a remote job
                    </label>
                  </div>

                  {!formData.isRemote && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Region */}
                      <div>
                        <label htmlFor="region" className="block mb-2 text-sm font-medium text-gray-700">
                          Region <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="region"
                          name="region"
                          value={formData.region}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                            errors.region ? "border-red-500" : "border-gray-300"
                          }`}
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

                      {/* Suburb */}
                      {formData.region && (
                        <div>
                          <label htmlFor="suburb" className="block mb-2 text-sm font-medium text-gray-700">
                            Suburb <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="suburb"
                            name="suburb"
                            value={formData.suburb}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                              errors.suburb ? "border-red-500" : "border-gray-300"
                            }`}
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
                  )}
                </div>

                {/* Job Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Describe the job responsibilities, requirements, benefits, etc."
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                </div>

                {/* Salary Range */}
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Salary Range (GH₵)</label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <input
                        type="number"
                        id="salaryMin"
                        name="salaryMin"
                        value={formData.salaryMin}
                        onChange={handleChange}
                        placeholder="Minimum"
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                          errors.salaryMin ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.salaryMin && <p className="mt-1 text-sm text-red-500">{errors.salaryMin}</p>}
                    </div>
                    <div>
                      <input
                        type="number"
                        id="salaryMax"
                        name="salaryMax"
                        value={formData.salaryMax}
                        onChange={handleChange}
                        placeholder="Maximum"
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                          errors.salaryMax ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.salaryMax && <p className="mt-1 text-sm text-red-500">{errors.salaryMax}</p>}
                    </div>
                  </div>
                  {errors.salaryRange && <p className="mt-1 text-sm text-red-500">{errors.salaryRange}</p>}
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Required Skills <span className="text-red-500">*</span>
                  </label>
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {getSkillsForCategory().map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillToggle(skill)}
                          className={`px-3 py-1 text-sm rounded-full ${
                            selectedSkills.includes(skill)
                              ? "bg-black text-white"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom skill input */}
                  <div className="flex mt-2">
                    <input
                      type="text"
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      placeholder="Add custom skill"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      disabled={!customSkill.trim()}
                      className="px-4 py-2 text-white bg-black rounded-r-md hover:bg-gray-800 disabled:bg-gray-400"
                    >
                      Add
                    </button>
                  </div>

                  {/* Selected skills */}
                  {selectedSkills.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-sm font-medium text-gray-700">Selected Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSkills.map((skill) => (
                          <div key={skill} className="flex items-center px-3 py-1 text-sm bg-gray-100 rounded-full">
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleSkillToggle(skill)}
                              className="ml-1 text-gray-500 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.skills && <p className="mt-1 text-sm text-red-500">{errors.skills}</p>}
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Email for applications"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Phone number"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                  </div>
                </div>

                {/* Application Deadline */}
                <div className="mb-4">
                  <label htmlFor="applicationDeadline" className="block mb-2 text-sm font-medium text-gray-700">
                    Application Deadline <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="applicationDeadline"
                      name="applicationDeadline"
                      value={formData.applicationDeadline}
                      onChange={handleChange}
                      min={new Date().toISOString().split("T")[0]}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.applicationDeadline ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <Calendar className="absolute transform -translate-y-1/2 pointer-events-none right-4 top-1/2 text-gray-400" />
                  </div>
                  {errors.applicationDeadline && (
                    <p className="mt-1 text-sm text-red-500">{errors.applicationDeadline}</p>
                  )}
                </div>

                {/* Experience Level */}
                <div className="mb-4">
                  <label htmlFor="experience" className="block mb-2 text-sm font-medium text-gray-700">
                    Experience Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.experience ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Experience Level</option>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                  {errors.experience && <p className="mt-1 text-sm text-red-500">{errors.experience}</p>}
                </div>

                {/* Employment Type */}
                <div className="mb-4">
                  <label htmlFor="employmentType" className="block mb-2 text-sm font-medium text-gray-700">
                    Employment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.employmentType ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Employment Type</option>
                    {EMPLOYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.employmentType && <p className="mt-1 text-sm text-red-500">{errors.employmentType}</p>}
                </div>

                {/* External Link */}
                <div className="mb-4">
                  <label htmlFor="externalLink" className="block mb-2 text-sm font-medium text-gray-700">
                    Job Link
                  </label>
                  <input
                    type="text"
                    id="externalLink"
                    name="externalLink"
                    value={formData.externalLink}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.externalLink ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter brand name"
                  />
                  {errors.externalLink && <p className="mt-1 text-sm text-red-500">{errors.externalLink}</p>}
                </div>

                {/* Company Logo Upload */}
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Company Logo (Optional, max 1MB)
                  </label>
                  <div className="mb-4">
                    <label
                      htmlFor="image"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 ${
                        errors.image ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 1MB)</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={!!image}
                      />
                    </label>
                    {errors.image && (
                      <div className="flex items-center mt-1 text-sm text-red-500">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.image}
                      </div>
                    )}
                  </div>

                  {/* Image Preview */}
                  {image && (
                    <div className="relative w-32 h-32 overflow-hidden bg-gray-100 rounded-lg">
                      <Image
                        src={image.preview || "/user_placeholder.png"}
                        alt="Company logo preview"
                        fill
                        className="object-contain"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute p-1 text-white bg-red-500 rounded-full top-2 right-2 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs text-center text-white bg-black bg-opacity-50">
                        {(image.file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button type="submit" className="w-full px-6 py-3 text-white bg-primary rounded-md hover:bg-primary-light">
                  Post Job
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
