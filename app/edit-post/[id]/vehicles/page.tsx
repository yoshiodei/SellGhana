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
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"
import { showToast } from "@/utils/showToast"
import { useParams, useRouter } from "next/navigation"
import { FirebaseProduct } from "@/lib/firebase/firestore"

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

export default function VehicleUpdateFormPage() {
  const { id }: {id: string} = useParams();  
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null)

  // const initialFormState = 

  const [loading, setLoading] = useState(false);

  const initialState = {
    id: '',
    name: '',
    type: "",
    make: "",
    model: "",
    price: 0,
    vin: "",
    mileage: "",
    images: [],
    imagesData: [],
    description: "",
    year: "",
    condition: "",
    location: {region: '',suburb:''},
  }

  const [formData, setFormData] = useState<FirebaseProduct>(initialState)
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [oldImages, setOldImages] = useState<{url:string; path?:string; name:string;size:number;type:string;}[]>([])
  const [submittedData, setSubmittedData] = useState<any>(null)

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
    if (!formData?.type) {
      newErrors.type = "Vehicle type is required"
    }

    if (!formData?.make) {
      newErrors.make = "Vehicle make is required"
    }

    if (!formData?.model?.trim()) {
      newErrors.model = "Vehicle model is required"
    }

    if (!formData?.price) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }

    // VIN validation (optional but must be valid if provided)
    if (formData?.vin?.trim() && formData?.vin?.trim().length !== 17) {
      newErrors.vin = "VIN must be 17 characters long"
    }

    if (!formData?.mileage) {
      newErrors.mileage = "Mileage is required"
    } else if (isNaN(Number(formData.mileage)) || Number(formData.mileage) < 0) {
      newErrors.mileage = "Mileage must be a non-negative number"
    }

    if (!formData?.year) {
      newErrors.year = "Vehicle year is required"
    }

    if (!formData?.condition) {
      newErrors.condition = "Vehicle condition is required"
    }

    if (!formData?.location.region) {
      newErrors.region = "Region is required"
    }

    if (formData?.location?.region && !formData?.location?.suburb) {
      newErrors.suburb = "Suburb is required"
    }

    if (!formData?.description?.trim()) {
      newErrors.details = "Vehicle details are required"
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
    setLoading(true);

    try{
      if (validateForm()) {
      // Prepare the data object

      const finalBrand = formData?.brand === "Other" ? formData?.otherBrand : formData?.brand
      
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
                    

      const vehicleData = {
        id,
        type: formData.type,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        name: `${formData.year} ${formData.make === 'Other' ? '': formData.make} ${formData.model === 'Other' ? '': formData.model}`,
        price: Number(formData.price),
        condition: formData.condition,
        location: {
            region: formData.location.region,
            suburb: formData.location.suburb,
        },
        description: formData.description,
        images: [ ...oldImagesData , ...uploadedImages],
        imagesData: [...oldImages, ...imagesData],
        category: "vehicles",
        vin: formData.vin,
        mileage: Number(formData.mileage),
        lastEdited: serverTimestamp(),
      }

      // In a real app, you would submit this data to your backend
      console.log("Vehicle listing submitted:", vehicleData)

      const productRef = doc(db, "productListing", id);
      
      await updateDoc(productRef, vehicleData);

      showToast("Post updated successfully","success");
    
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

            <h1 className="mb-2 text-2xl font-bold">Update listing - Vehicles</h1>
            <p className="mb-6 text-gray-600">Update your listing details</p>

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

                {/* Vehicle Details */}
                <div className="mt-6">
                  <label htmlFor="details" className="block mb-2 text-sm font-medium text-gray-700">
                    Vehicle Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.details ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Describe your vehicle in detail, including its condition, history, features, and any other relevant information."
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
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
                        disabled={oldImages.length + images.length >= 4}
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
