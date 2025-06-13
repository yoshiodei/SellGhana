"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Check, AlertCircle } from "lucide-react"
import { ghanaRegions } from "@/lib/ghana-regions"
import { uploadImages } from "@/lib/firebase/storage"
import { updateProduct } from "@/lib/firebase/product"

// Vehicle types, makes, years, and conditions (same as in the create form)
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

const VEHICLE_YEARS = Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) =>
  (new Date().getFullYear() - i).toString(),
)

const VEHICLE_CONDITIONS = ["Brand New", "Excellent", "Good", "Fair", "Poor", "Salvage", "Parts Only"]

const MAX_FILE_SIZE = 1024 * 1024 // 1MB

interface VehicleEditFormProps {
  product: any
}

export default function VehicleEditForm({ product }: VehicleEditFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    type: product.type || "",
    make: product.make || "",
    model: product.model || "",
    price: product.price?.toString() || "",
    vin: product.vin || "",
    mileage: product.mileage?.toString() || "",
    year: product.year || "",
    condition: product.condition || "",
    region: product.region || "",
    suburb: product.suburb || "",
    details: product.description || product.details || "",
  })

  const [existingImages, setExistingImages] = useState<string[]>(product.images || [])
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const getSuburbs = () => {
    if (!formData.region) return []
    return ghanaRegions[formData.region] || []
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === "region") {
      setFormData((prev) => ({ ...prev, region: value, suburb: "" }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const totalImages = existingImages.length + newImages.length + files.length
    if (totalImages > 4) {
      setErrors((prev) => ({ ...prev, images: "You can only have up to 4 images total" }))
      return
    }

    if (errors.images) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.images
        return newErrors
      })
    }

    const validImages = Array.from(files)
      .map((file) => {
        if (file.size > MAX_FILE_SIZE) {
          setErrors((prev) => ({ ...prev, images: "Each image must be 1MB or less" }))
          return null
        }
        return { file, preview: URL.createObjectURL(file) }
      })
      .filter((img): img is { file: File; preview: string } => img !== null)

    if (validImages.length > 0) {
      setNewImages((prev) => [...prev, ...validImages])
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeNewImage = (index: number) => {
    setNewImages((prev) => {
      const newImagesList = [...prev]
      URL.revokeObjectURL(newImagesList[index].preview)
      newImagesList.splice(index, 1)
      return newImagesList
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.type) newErrors.type = "Vehicle type is required"
    if (!formData.make) newErrors.make = "Vehicle make is required"
    if (!formData.model.trim()) newErrors.model = "Vehicle model is required"
    if (!formData.price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }
    if (formData.vin.trim() && formData.vin.trim().length !== 17) {
      newErrors.vin = "VIN must be 17 characters long"
    }
    if (!formData.mileage.trim()) {
      newErrors.mileage = "Mileage is required"
    } else if (isNaN(Number(formData.mileage)) || Number(formData.mileage) < 0) {
      newErrors.mileage = "Mileage must be a non-negative number"
    }
    if (!formData.year) newErrors.year = "Vehicle year is required"
    if (!formData.condition) newErrors.condition = "Vehicle condition is required"
    if (!formData.region) newErrors.region = "Region is required"
    if (formData.region && !formData.suburb) newErrors.suburb = "Suburb is required"
    if (!formData.details.trim()) newErrors.details = "Vehicle details are required"

    const totalImages = existingImages.length + newImages.length
    if (totalImages === 0) {
      newErrors.images = "At least one image is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      let allImageUrls = [...existingImages]

      // Upload new images if any
      if (newImages.length > 0) {
        const newImageFiles = newImages.map((img) => img.file)
        const uploadedUrls = await uploadImages(newImageFiles, `products/${product.id}`)
        allImageUrls = [...allImageUrls, ...uploadedUrls]
      }

      // Prepare update data
      const updateData = {
        type: formData.type,
        make: formData.make,
        model: formData.model,
        price: Number(formData.price),
        vin: formData.vin,
        mileage: Number(formData.mileage),
        year: formData.year,
        condition: formData.condition,
        region: formData.region,
        suburb: formData.suburb,
        location: `${formData.suburb}, ${formData.region}`,
        description: formData.details,
        details: formData.details,
        images: allImageUrls,
      }

      await updateProduct(product.id, updateData)
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error updating vehicle:", error)
      setErrors({ submit: "Failed to update vehicle. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      newImages.forEach((image) => URL.revokeObjectURL(image.preview))
    }
  }, [])

  if (isSubmitted) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-3xl mx-auto">
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center mb-4 text-green-600">
              <Check className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-semibold">Vehicle Updated Successfully!</h2>
            </div>
            <div className="flex justify-between">
              <Link
                href={`/product/${product.id}`}
                className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800"
              >
                View Product
              </Link>
              <Link href="/" className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100">
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-3xl mx-auto">
        <Link href={`/product/${product.id}`} className="inline-flex items-center mb-6 text-gray-600 hover:text-black">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to product
        </Link>

        <h1 className="mb-2 text-2xl font-bold">Edit Vehicle</h1>
        <p className="mb-6 text-gray-600">Update your vehicle listing details</p>

        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
          {errors.submit && (
            <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{errors.submit}</span>
              </div>
            </div>
          )}

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

          {/* Image Management */}
          <div className="mt-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Vehicle Images <span className="text-red-500">*</span> (Up to 4 total)
            </label>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-gray-600">Current Images</h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <div className="relative overflow-hidden bg-gray-100 rounded-lg aspect-square">
                        <Image
                          src={imageUrl || "/placeholder.svg"}
                          alt={`Current ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {newImages.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-gray-600">New Images</h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {newImages.map((image, index) => (
                    <div key={index} className="relative">
                      <div className="relative overflow-hidden bg-gray-100 rounded-lg aspect-square">
                        <Image
                          src={image.preview || "/placeholder.svg"}
                          alt={`New ${index + 1}`}
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
                      <p className="mt-1 text-xs text-gray-500 truncate">{(image.file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            {existingImages.length + newImages.length < 4 && (
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
                      <span className="font-semibold">Click to upload</span> additional images
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
                  />
                </label>
              </div>
            )}

            {errors.images && (
              <div className="flex items-center mt-1 text-sm text-red-500">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.images}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              className="w-full px-6 py-3 text-white bg-black rounded-md hover:bg-gray-800 disabled:bg-gray-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating Vehicle..." : "Update Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
