"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Upload, X, Check, AlertCircle } from "lucide-react"
import NavBar from "@/components/nav-bar"
import { db, storage } from "@/lib/firebase/firebase"
import ProtectedRoute from "@/lib/auth/ProtectedRoutes"
import { ghanaRegions } from "@/lib/ghana-regions"
import { getFirstThreeLetters } from "@/utils/getters"
import { nanoid } from "nanoid"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { showToast } from "@/utils/showToast"
import { useRouter } from "next/navigation"

// Form data type
interface VehicleForm {
  type: string
  make: string
  model: string
  price: string
  vin: string
  mileage: string
  year: string
  region: string
  suburb: string
  details: string
  condition: string
}

// Vehicle types
const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "Truck",
  "Van",
  "Coupe",
  "Hatchback",
  "Convertible",
  "Wagon",
  "Crossover",
  "Minivan",
  "Motorcycle",
  "Bus",
  "Heavy Duty",
  "Other",
]

// Vehicle makes
const VEHICLE_MAKES = [
  "Toyota",
  "Honda",
  "Nissan",
  "Hyundai",
  "Kia",
  "Ford",
  "Chevrolet",
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Volkswagen",
  "Mazda",
  "Mitsubishi",
  "Suzuki",
  "Land Rover",
  "Jeep",
  "Other",
]

// Generate years from 1990 to current year
const VEHICLE_YEARS = Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) =>
  (new Date().getFullYear() - i).toString(),
)

// Vehicle conditions
const VEHICLE_CONDITIONS = ["Brand New", "Excellent", "Good", "Fair", "Poor", "Salvage", "Parts Only"]

// Maximum file size in bytes (1MB)
const MAX_FILE_SIZE = 1024 * 1024

export default function VehicleFormPage() {
  const { user } = useAuthUser();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null)

  // const initialFormState = 

  const [loading, setLoading] = useState(false);

  const initialFormData = {
    type: "",
    make: "",
    model: "",
    price: "",
    vin: "",
    mileage: "",
    year: "",
    region: "",
    suburb: "",
    details: "",
    condition: "",
  }

  const [formData, setFormData] = useState<VehicleForm>(initialFormData)

  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)

  // Get suburbs for the selected region
  const getSuburbs = () => {
    if (!formData.region) return []
    return ghanaRegions[formData.region] || []
  }

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Special handling for region to reset suburb when region changes
    if (name === "region") {
      setFormData((prev) => ({
        ...prev,
        region: value,
        suburb: "",
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
    if (!formData.type) {
      newErrors.type = "Vehicle type is required"
    }

    if (!formData.make) {
      newErrors.make = "Vehicle make is required"
    }

    if (!formData.model.trim()) {
      newErrors.model = "Vehicle model is required"
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }

    // VIN validation (optional but must be valid if provided)
    if (formData.vin.trim() && formData.vin.trim().length !== 17) {
      newErrors.vin = "VIN must be 17 characters long"
    }

    if (!formData.mileage.trim()) {
      newErrors.mileage = "Mileage is required"
    } else if (isNaN(Number(formData.mileage)) || Number(formData.mileage) < 0) {
      newErrors.mileage = "Mileage must be a non-negative number"
    }

    if (!formData.year) {
      newErrors.year = "Vehicle year is required"
    }

    if (!formData.condition) {
      newErrors.condition = "Vehicle condition is required"
    }

    if (!formData.region) {
      newErrors.region = "Region is required"
    }

    if (formData.region && !formData.suburb) {
      newErrors.suburb = "Suburb is required"
    }

    if (!formData.details.trim()) {
      newErrors.details = "Vehicle details are required"
    }

    if (images.length === 0) {
      newErrors.images = "At least one image is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true);

    try{
      if (validateForm()) {
      // Prepare the data object

      const three = getFirstThreeLetters("vehicles");
      const productId = `sg-${three}-${nanoid()}`;

      const uploadedImages = await Promise.all(
        images.map(async (image) => {
        const imageRef = ref(storage, `productImages/${productId}/${image.file.name}`);
        await uploadBytes(imageRef, image.file);
        const downloadURL = await getDownloadURL(imageRef);
          return downloadURL;
        })
      );
      

      const vehicleData = {
        id: productId,
        type: formData.type,
        make: formData.make,
        model: formData.model,

        name: `${formData.year} ${formData.make} ${formData.model}`,
        price: Number(formData.price),
        condition: formData.condition,
        location: `${formData.suburb}, ${formData.region}`,
        description: formData.details,
        images: uploadedImages,
        category: "vehicles",

        vin: formData.vin,
        mileage: Number(formData.mileage),
        year: formData.year,
        locationDetails: {
          region: formData.region,
          suburb: formData.suburb,
        },
        promotion: {
          isPromoted: false,
          datePromoted:"",
          dateOfExpiry:"",
          promoType: ""
          },
        viewCount: [],
        vendor:{
          uid: user?.uid || "",   
          image: user?.photoURL || "",
          name: user?.displayName || "", 
        },
        createdAt: serverTimestamp(),
      }

      // In a real app, you would submit this data to your backend
      console.log("Vehicle listing submitted:", vehicleData)

      await setDoc(doc(db, "productListing", productId), vehicleData);

      showToast("Post added successfully","success");
    
      setSubmittedData(vehicleData)
      setIsSubmitted(true)
      setFormData(initialFormData)
      router.push("/");
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      showToast("Error adding post", "error");
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

            <h1 className="mb-2 text-2xl font-bold">List Your Vehicle</h1>
            <p className="mb-6 text-gray-600">Fill in the details to create your vehicle listing</p>

              <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Vehicle Type */}
                  <div>
                    <label htmlFor="type" className="block mb-2 text-sm font-medium text-gray-700">
                      Vehicle Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.type ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Vehicle Type</option>
                      {VEHICLE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
                  </div>

                  {/* Vehicle Make */}
                  <div>
                    <label htmlFor="make" className="block mb-2 text-sm font-medium text-gray-700">
                      Make <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="make"
                      name="make"
                      value={formData.make}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.make ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Make</option>
                      {VEHICLE_MAKES.map((make) => (
                        <option key={make} value={make}>
                          {make}
                        </option>
                      ))}
                    </select>
                    {errors.make && <p className="mt-1 text-sm text-red-500">{errors.make}</p>}
                  </div>

                  {/* Vehicle Model */}
                  <div>
                    <label htmlFor="model" className="block mb-2 text-sm font-medium text-gray-700">
                      Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.model ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g., Camry, Civic, F-150"
                    />
                    {errors.model && <p className="mt-1 text-sm text-red-500">{errors.model}</p>}
                  </div>

                  {/* Vehicle Year */}
                  <div>
                    <label htmlFor="year" className="block mb-2 text-sm font-medium text-gray-700">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.year ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Year</option>
                      {VEHICLE_YEARS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {errors.year && <p className="mt-1 text-sm text-red-500">{errors.year}</p>}
                  </div>

                  {/* Price */}
                  <div>
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

                  {/* VIN */}
                  <div>
                    <label htmlFor="vin" className="block mb-2 text-sm font-medium text-gray-700">
                      VIN (Optional)
                    </label>
                    <input
                      type="text"
                      id="vin"
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.vin ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Vehicle Identification Number"
                      maxLength={17}
                    />
                    {errors.vin && <p className="mt-1 text-sm text-red-500">{errors.vin}</p>}
                    <p className="mt-1 text-xs text-gray-500">
                      The VIN is a 17-character identifier unique to your vehicle
                    </p>
                  </div>

                  {/* Mileage */}
                  <div>
                    <label htmlFor="mileage" className="block mb-2 text-sm font-medium text-gray-700">
                      Mileage (km) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="mileage"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.mileage ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g., 50000"
                      min="0"
                    />
                    {errors.mileage && <p className="mt-1 text-sm text-red-500">{errors.mileage}</p>}
                  </div>

                  {/* Vehicle Condition */}
                  <div>
                    <label htmlFor="condition" className="block mb-2 text-sm font-medium text-gray-700">
                      Condition <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.condition ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Condition</option>
                      {VEHICLE_CONDITIONS.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition}
                        </option>
                      ))}
                    </select>
                    {errors.condition && <p className="mt-1 text-sm text-red-500">{errors.condition}</p>}
                  </div>

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

                {/* Vehicle Details */}
                <div className="mt-6">
                  <label htmlFor="details" className="block mb-2 text-sm font-medium text-gray-700">
                    Vehicle Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    rows={5}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.details ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Describe your vehicle in detail, including its condition, history, features, and any other relevant information."
                  />
                  {errors.details && <p className="mt-1 text-sm text-red-500">{errors.details}</p>}
                </div>

                {/* Image Upload */}
                <div className="mt-6">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Vehicle Images <span className="text-red-500">*</span> (Up to 4, max 1MB each)
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
                        disabled={images.length >= 4}
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
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <div className="relative overflow-hidden bg-gray-100 rounded-lg aspect-square">
                            <Image
                              src={image.preview || "/placeholder.svg"}
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
                            {(image.file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                  <button type="submit" disabled={loading} className="w-full px-6 py-3 text-white bg-primary rounded-md hover:bg-primary-light">
                    {loading ? "...loading" : "List Vehicle"}
                  </button>
                </div>
              </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
