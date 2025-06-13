"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Upload, X, Check, AlertCircle } from "lucide-react"
import { categories } from "@/lib/categories"
import NavBar from "@/components/nav-bar"
import ProtectedRoute from "@/lib/auth/ProtectedRoutes"
import { ghanaRegions } from "@/lib/ghana-regions"
import { useRouter } from "next/navigation"
import { brandsByCategory } from "@/utils/productData"
import { nanoid } from 'nanoid'
import { getFirstThreeLetters } from "@/utils/getters"
import { useAuth } from "@/lib/auth/context/AuthContext"
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore"
import { db, storage } from "@/lib/firebase/firebase"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { showToast } from "@/utils/showToast"
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"

const validCategories = [
  'electronics',
  'vehicles',
  'books',
  'gaming',
  'furniture',
  'jobs',
  'home',
  'property',
  'fashion',
];

// Maximum file size in bytes (1MB)
const MAX_FILE_SIZE = 1024 * 1024

export default function NewPostPage() {
  const { user } = useAuthUser();
  
  console.log("vendor data ooo", user);
  

  const { category: categoryTitle }: {category: string} = useParams();  
  console.log("category title", categoryTitle);
  
  const searchParams = useSearchParams()
  const categoryId = searchParams.get("category")
  const category = categories.find((c) => c.id === categoryId)
  const router = useRouter();

  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (categoryTitle && !validCategories.includes(categoryTitle)) {
      router.push("/not-found")
    }
  }, [categoryTitle, router])

//   if (isValid === null) return null; // Prevent early render
//   if (!isValid) return null; // Won't render — redirecting

  const fileInputRef = useRef<HTMLInputElement>(null)

  const initialFormState = {
    name: "",
    price: "",
    brand: "",
    otherBrand: "",
    condition: "brand-new",
    description: "",
    region: "",
    suburb: "",
  }

  const [formData, setFormData] = useState(initialFormState);

  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)
  const [loading, setLoading] = useState(false);

  // Get brands for the selected category
  const getBrands = () => {
    if (!categoryTitle) return brandsByCategory.default
    return brandsByCategory[categoryTitle] || brandsByCategory.default
  }

  // Get suburbs for the selected region
  const getSuburbs = () => {
    if (!formData.region) return []
    return ghanaRegions[formData.region] || []
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Special handling for region to reset suburb when region changes
    if (name === "region") {
      setFormData((prev) => ({ ...prev, [name]: value, suburb: "" }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
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

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = "Product name is required"
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number.parseFloat(formData.price)) || Number.parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }

    if (!formData.brand) {
      newErrors.brand = "Brand is required"
    }

    if (formData.brand === "Other" && !formData.otherBrand.trim()) {
      newErrors.otherBrand = "Please specify the brand"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Product details are required"
    }

    if (!formData.region) {
      newErrors.region = "Region is required"
    }

    if (formData.region && !formData.suburb) {
      newErrors.suburb = "Suburb is required"
    }

    if (images.length === 0) {
      newErrors.images = "At least one image is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true);

    try{
        if (validateForm()) {
        // Prepare the data object
        const finalBrand = formData.brand === "Other" ? formData.otherBrand : formData.brand
        // get first three letters of category and add to id string
        const three = getFirstThreeLetters(categoryTitle);
        const productId = `sg-${three}-${nanoid()}`;

        const uploadedImages = await Promise.all(
            images.map(async (image) => {
              const imageRef = ref(storage, `productImages/${productId}/${image.file.name}`);
              await uploadBytes(imageRef, image.file);
              const downloadURL = await getDownloadURL(imageRef);
      
              //   return {
              //     name: image.file.name,
              //     size: image.file.size,
              //     type: image.file.type,
              //     url: downloadURL,
              //   };

              return downloadURL;
            })
          );

        const productData = {
            id: productId,
            name: formData.name,
            price: Number.parseFloat(formData.price),
            brand: finalBrand,
            condition: formData.condition,
            description: formData.description,
            location: {
            region: formData.region,
            suburb: formData.suburb,
            },
            promotion: {
            isPromoted: false,
            datePromoted:"",
            dateOfExpiry:"",
            promoType: ""
            },
            images: uploadedImages,
            vendor:{
            uid: user?.uid || "",   
            image: user?.photoURL || "",
            name: user?.displayName || "", 
            },
            category: categoryTitle || "uncategorized",
            viewCount: [],
            createdAt: serverTimestamp(),
        }

          console.log("Form submitted:", productData)

          setSubmittedData(productData)
          setIsSubmitted(false);

          //   await addDoc(collection(db, "productListing"), productData);
          //   await addDoc(collection(db, "productListing"), productData);
          await setDoc(doc(db, "productListing", productId), productData);

          showToast("Post added successfully","success");
          setFormData(initialFormState);
          router.push("/");
        }

        setLoading(false);
    } catch (error) {
        setLoading(false);
        showToast("Error adding post","error")
        console.error('Error submitting listing:', error);
    }
  }

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

            <h1 className="mb-2 text-2xl font-bold capitalize">Create New Listing {categoryTitle ? `- ${categoryTitle}` : ""}</h1>
            <p className="mb-6 text-gray-600">Fill in the details to create your listing</p>

              <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
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
                    type="text"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.price ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter price"
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                </div>

                {/* Brand */}
                <div className="mb-4">
                  <label htmlFor="brand" className="block mb-2 text-sm font-medium text-gray-700">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.brand ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Brand</option>
                    {getBrands().map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                  {errors.brand && <p className="mt-1 text-sm text-red-500">{errors.brand}</p>}
                </div>

                {/* Other Brand (conditional) */}
                {formData.brand === "Other" && (
                  <div className="mb-4">
                    <label htmlFor="otherBrand" className="block mb-2 text-sm font-medium text-gray-700">
                      Specify Brand <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="otherBrand"
                      name="otherBrand"
                      value={formData.otherBrand}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.otherBrand ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter brand name"
                    />
                    {errors.otherBrand && <p className="mt-1 text-sm text-red-500">{errors.otherBrand}</p>}
                  </div>
                )}

                {/* Condition */}
                <div className="mb-4">
                  <label htmlFor="condition" className="block mb-2 text-sm font-medium text-gray-700">
                    Condition
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="brand-new">Brand New</option>
                    <option value="slightly-used">Slightly Used</option>
                    <option value="used">Used</option>
                  </select>
                </div>

                {/* Region */}
                <div className="mb-4">
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

                {/* Suburb (conditional) */}
                {formData.region && (
                  <div className="mb-4">
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

                {/* Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">
                    Product Details <span className="text-red-500">*</span>
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

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Product Images <span className="text-red-500">*</span> (Up to 4, max 1MB each)
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
                <button type="submit" disabled={loading} className="w-full px-6 py-3 text-white bg-primary rounded-md hover:bg-primary-light">
                  {loading ? "...loading" : "Post Product"}
                </button>
              </form>
            
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
