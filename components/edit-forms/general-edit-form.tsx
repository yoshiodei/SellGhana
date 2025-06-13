"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Check, AlertCircle } from "lucide-react"
import { updateProduct } from "@/lib/firebase/product"
import { uploadImages } from "@/lib/firebase/storage"
// import { uploadImages } from "@/lib/firebase/storage"

const MAX_FILE_SIZE = 1024 * 1024 // 1MB

interface GeneralEditFormProps {
  product: any
}

export default function GeneralEditForm({ product }: GeneralEditFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: product.name || "",
    price: product.price?.toString() || "",
    description: product.description || "",
    location: product.location || "",
  })

  const [existingImages, setExistingImages] = useState<string[]>(product.images || [])
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

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

    if (!formData.name.trim()) newErrors.name = "Product name is required"
    if (!formData.price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }
    if (!formData.description.trim()) newErrors.description = "Description is required"

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
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        location: formData.location,
        images: allImageUrls,
      }

      await updateProduct(product.id, updateData)
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error updating product:", error)
      setErrors({ submit: "Failed to update product. Please try again." })
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
              <h2 className="text-xl font-semibold">Product Updated Successfully!</h2>
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

        <h1 className="mb-2 text-2xl font-bold">Edit Product</h1>
        <p className="mb-6 text-gray-600">Update your product listing details</p>

        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
          {errors.submit && (
            <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Product Name */}
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter product name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
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
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Enter location"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
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
              placeholder="Describe your product in detail"
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Image Management */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Product Images <span className="text-red-500">*</span> (Up to 4 total)
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
              {isSubmitting ? "Updating Product..." : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
