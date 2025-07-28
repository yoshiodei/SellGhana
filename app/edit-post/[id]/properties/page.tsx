"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Upload, X, Check, AlertCircle } from "lucide-react"
import NavBar from "@/components/nav-bar"
import ProtectedRoute from "@/lib/auth/ProtectedRoutes"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { ghanaRegions } from "@/lib/ghana-regions"
import { showToast } from "@/utils/showToast"
import { db, storage } from "@/lib/firebase/firebase"
import { getFirstThreeLetters } from "@/utils/getters"
import { nanoid } from "nanoid"
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"
import { useParams, useRouter } from "next/navigation"
import { FirebaseProduct } from "@/lib/firebase/firestore"


interface FileType { 
    file: File;
    fileData: 
    { 
      url: string,
      name: string,
      size: number,
      type: string,
    };
    preview: string;
}

// Form data type
interface PropertyForm {
  listingType: string
  title: string
  propertyType: string
  price: string
  location: string
  region: string
  suburb: string
  bedrooms: string
  bathrooms: string
  furnishing: string
  size: string
  availabilityDate: string
  contactName: string
  contactEmail: string
  contactPhone: string
  description: string
}

// Property types
const PROPERTY_TYPES = ["House", "Apartment", "Land", "Commercial"]

// Listing types
const LISTING_TYPES = ["Rent", "Sale"]

// Furnishing options
const FURNISHING_OPTIONS = ["Furnished", "Semi-furnished", "Unfurnished"]

// Maximum file size in bytes (1MB)
const MAX_FILE_SIZE = 1024 * 1024

export default function PropertyUpdateFormPage() {
  const { id }: {id: string} = useParams();    
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter();

  const initialState = {
    id: "",
    name: "",
    listingType: "",
    title: "",
    propertyType: "",
    price: 0,
    location: { 
      region: "",
      suburb: ""  
    },
    region: "",
    suburb: "",
    bedrooms: 0,
    bathrooms: 0,
    furnishing: "",
    size: 0,
    availabilityDate: "",
    propertyLocation: "",
    description: "",
    images: [],
    imagesData: [],
  }

//   const [formData, setFormData] = useState<PropertyForm>(initialFormState)
  const [formData, setFormData] = useState<FirebaseProduct>(initialState)
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oldImages, setOldImages] = useState<{url:string; path?:string; name:string;size:number;type:string;}[]>([])

  // Get suburbs for the selected region
  const getSuburbs = () => {
    if (!formData.location.region) return []
    return ghanaRegions[formData.location.region] || []
  }

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
    
        // Special handling for region to reset suburb when region change
        if (name === "region") {
            setFormData((prev) => ({
              ...prev,
              location: {
                ...prev.location,
                region: value,
              },
            }))
          } else if (name === "suburb") {
            setFormData((prev) => ({
              ...prev,
              location: {
                ...prev.location,
                suburb: value,
              },
            }))
          } else {
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

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Check if adding new files would exceed the limit of 4
    if (images.length + files.length > 4) {
      setErrors((prev) => ({ ...prev, images: "You can only upload up to 4 images" }))
      return
    }

    // Clear image error if it exists
    if (errors.images) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.images
        return newErrors
      })
    }

    // Process each file
    const newImages = Array.from(files)
      .map((file) => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          setErrors((prev) => ({ ...prev, images: "Each image must be 1MB or less" }))
          return null
        }

        return {
          file,
          preview: URL.createObjectURL(file),
        }
      })
      .filter((img): img is { file: File; preview: string } => img !== null)

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages])
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Remove image
  const removeImage = (index: number) => {
    setOldImages((prev) => {
      const newImages = [...prev]
      // Revoke the object URL to avoid memory leaks
      newImages.splice(index, 1)
      return newImages
    })
  }

  const removeNewImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.listingType) {
      newErrors.listingType = "Listing type is required"
    }

    if (!formData?.title?.trim()) {
      newErrors.title = "Property title is required"
    }

    if (!formData.propertyType) {
      newErrors.propertyType = "Property type is required"
    }

    if (!formData.price) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }

    if (!formData?.propertyLocation?.trim()) {
      newErrors.propertyLocation = "Location is required"
    }

    if (!formData.location.region) {
      newErrors.region = "Region is required"
    }

    if (formData.location.region && !formData.location.suburb) {
      newErrors.suburb = "Suburb is required"
    }

    if (formData.bedrooms && (isNaN(Number(formData.bedrooms)) || Number(formData.bedrooms) < 0)) {
      newErrors.bedrooms = "Bedrooms must be a non-negative number"
    }

    if (formData.bathrooms && (isNaN(Number(formData.bathrooms)) || Number(formData.bathrooms) < 0)) {
      newErrors.bathrooms = "Bathrooms must be a non-negative number"
    }

    if (!formData.furnishing) {
      newErrors.furnishing = "Furnishing status is required"
    }

    if (formData.size && (isNaN(Number(formData.size)) || Number(formData.size) <= 0)) {
      newErrors.size = "Size must be a positive number"
    }

    if (!formData.availabilityDate) {
      newErrors.availabilityDate = "Availability date is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (images.length + oldImages.length === 0) {
      newErrors.images = "At least one image is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try{
    if (validateForm()) {
  
       const uploadedImages = await Promise.all(
            images.map(async (image) => {
            const imageRef = ref(storage, `productImages/${id}/${image.file.name}`);
            // if(image.file)
            await uploadBytes(imageRef, image.file);
            const downloadURL = await getDownloadURL(imageRef);
            return downloadURL;
            })
        );
    
        const imagesData = await Promise.all(
            images.map(async (image) => {
            const imageRef = ref(storage, `productImages/${id}/${image.file.name}`);
            const snapshot = await uploadBytes(imageRef, image.file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return {
                url: downloadURL,
                path: snapshot.ref.fullPath,
                name: image.file.name,
                size: image.file.size,
                type: image.file.type,
            };
            })
        );
    
        const oldImagesData = oldImages.map((image) => (
            image.url
        ))
        
      // Prepare the data object
      const propertyData = {
        id,
        listingType: formData.listingType,
        title: formData.title,
        propertyType: formData.propertyType,
        price: Number(formData.price),
        location: {
            region: formData.location.region,
            suburb: formData.location.suburb,
        },
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
        furnishing: formData.furnishing,
        size: formData.size ? Number(formData.size) : null,
        availabilityDate: formData.availabilityDate,
        // contactName: formData.contactName,
        // contactEmail: formData.contactEmail,
        // contactPhone: formData.contactPhone,

        description: formData.description,
        images: [ ...oldImagesData , ...uploadedImages],
        imagesData: [...oldImages, ...imagesData],
        lastEdited: serverTimestamp(),
      }

      // Log the collected form data
      console.log("Property Form Submission Data:", propertyData)

      const productRef = doc(db, "productListing", id);
          
      await updateDoc(productRef, propertyData);
    
      showToast("Post updated successfully","success");
        
      router.push("/");
    }

      setLoading(false);
    } catch (error){
      setLoading(false);
      showToast("Error adding post", "error")
      console.error('Error submitting listing:', error);
    }
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach((image) => {
        URL.revokeObjectURL(image.preview)
      })
    }
  }, [])


   const fetchProductData = async () => {
         try {
           setLoading(true)
           setError(null)
     
           // Fetch the product by ID
           const productDocRef = doc(db, "productListing", id)
           const productDocSnap = await getDoc(productDocRef)
          
           if (!productDocSnap.exists()) {
             console.log('does not exist');
             
             // setError("Product not found")
             setLoading(false)
             return
           }
     
           // Get the product data
           const productData = {
             id: productDocSnap.id,
             ...productDocSnap.data(),
           } as FirebaseProduct
           
     
           console.log("product data for edit", productData);
     
           const newImages = productData.imagesData.map((file) => (
             file
           )
           )
     
           setOldImages(newImages);
           setFormData(productData);
         } catch (err) {
           console.error("Error fetching product:", err)
           setError("Failed to load product. Please try again later.")
         } finally {
           setLoading(false)
         }
     }


   useEffect(() => { 
     fetchProductData()
   }, [id, router])

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

            <h1 className="mb-2 text-2xl font-bold">Update Listing - Properties</h1>
            <p className="mb-6 text-gray-600">Update your listing details</p>

              <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
                {/* Listing Type */}
                <div className="mb-4">
                  <label htmlFor="listingType" className="block mb-2 text-sm font-medium text-gray-700">
                    Listing Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="listingType"
                    name="listingType"
                    value={formData.listingType}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.listingType ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Listing Type</option>
                    {LISTING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.listingType && <p className="mt-1 text-sm text-red-500">{errors.listingType}</p>}
                </div>

                {/* Property Title */}
                <div className="mb-4">
                  <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-700">
                    Property Title <span className="text-red-500">*</span>
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
                    placeholder="e.g., Spacious 3-Bedroom Apartment in East Legon"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                </div>

                {/* Property Type */}
                <div className="mb-4">
                  <label htmlFor="propertyType" className="block mb-2 text-sm font-medium text-gray-700">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.propertyType ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Property Type</option>
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.propertyType && <p className="mt-1 text-sm text-red-500">{errors.propertyType}</p>}
                </div>

                {/* Price */}
                <div className="mb-4">
                  <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-700">
                    Price (GH₵) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.price ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter price"
                    min="0"
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                </div>

                {/* Location */}
                <div className="mb-4">
                  <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-700">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="propertyLocation"
                    name="propertyLocation"
                    value={formData.propertyLocation}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.propertyLocation ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g., 123 Main Street"
                  />
                  {errors.propertyLocation && <p className="mt-1 text-sm text-red-500">{errors.propertyLocation}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                  {/* Region */}
                  <div>
                    <label htmlFor="region" className="block mb-2 text-sm font-medium text-gray-700">
                      Region <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="region"
                      name="region"
                      value={formData.location.region}
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
                  {formData.location.region && (
                    <div>
                      <label htmlFor="suburb" className="block mb-2 text-sm font-medium text-gray-700">
                        Suburb <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="suburb"
                        name="suburb"
                        value={formData.location.suburb}
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

                <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                  {/* Bedrooms */}
                  <div>
                    <label htmlFor="bedrooms" className="block mb-2 text-sm font-medium text-gray-700">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      id="bedrooms"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.bedrooms ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g., 3"
                      min="0"
                    />
                    {errors.bedrooms && <p className="mt-1 text-sm text-red-500">{errors.bedrooms}</p>}
                  </div>

                  {/* Bathrooms */}
                  <div>
                    <label htmlFor="bathrooms" className="block mb-2 text-sm font-medium text-gray-700">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      id="bathrooms"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.bathrooms ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g., 2"
                      min="0"
                    />
                    {errors.bathrooms && <p className="mt-1 text-sm text-red-500">{errors.bathrooms}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                  {/* Furnishing */}
                  <div>
                    <label htmlFor="furnishing" className="block mb-2 text-sm font-medium text-gray-700">
                      Furnishing <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="furnishing"
                      name="furnishing"
                      value={formData.furnishing}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.furnishing ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Furnishing</option>
                      {FURNISHING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.furnishing && <p className="mt-1 text-sm text-red-500">{errors.furnishing}</p>}
                  </div>

                  {/* Size */}
                  <div>
                    <label htmlFor="size" className="block mb-2 text-sm font-medium text-gray-700">
                      Size (sqm)
                    </label>
                    <input
                      type="number"
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.size ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g., 120"
                      min="0"
                    />
                    {errors.size && <p className="mt-1 text-sm text-red-500">{errors.size}</p>}
                  </div>
                </div>

                {/* Availability Date */}
                <div className="mb-4">
                  <label htmlFor="availabilityDate" className="block mb-2 text-sm font-medium text-gray-700">
                    Availability Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="availabilityDate"
                    name="availabilityDate"
                    value={formData.availabilityDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.availabilityDate ? "border-red-500" : "border-gray-300"
                    }`}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.availabilityDate && <p className="mt-1 text-sm text-red-500">{errors.availabilityDate}</p>}
                </div>

                {/* Property Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">
                    Property Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Provide a detailed description of the property..."
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                </div>

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Property Images <span className="text-red-500">*</span> (Up to 4, max 1MB each)
                  </label>
                  <div className="mb-4">
                    <label
                      htmlFor="images"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 ${
                        errors.images ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 1MB each)</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={images.length >= 10}
                      />
                    </label>
                    {errors.images && (
                      <div className="flex items-center mt-1 text-sm text-red-500">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.images}
                      </div>
                    )}
                  </div>

                  {/* Image Previews */}
                  {(oldImages.length + images.length > 0) && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {oldImages.map((image, index) => (
                        <div key={index} className="relative">
                        <div className="relative overflow-hidden bg-gray-100 rounded-lg aspect-square">
                            <Image
                            src={image.url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <p className="mt-1 text-xs text-gray-500 truncate">
                            {(image.size / 1024).toFixed(0)} KB
                        </p>
                        </div>
                    ))}
                    {(oldImages.length + images.length <= 4 && images.length > 0) && (images.map((image, index) => (
                        <div key={index} className="relative">
                        <div className="relative overflow-hidden bg-gray-100 rounded-lg aspect-square">
                            <Image
                            src={image.preview || "/user_placeholder.png"}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <p className="mt-1 text-xs text-gray-500 truncate">
                            {(image.file.size / 1024).toFixed(0)} KB
                        </p>
                        </div>
                    )))}
                    </div>
                )}
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                  <button type="submit" disabled={loading} className="w-full px-6 py-3 text-white bg-primary rounded-md hover:bg-primary-light">
                    {loading ? '...loading' : 'List Property'}
                  </button>
                </div>
              </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
