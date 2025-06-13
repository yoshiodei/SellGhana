"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Check, AlertCircle } from "lucide-react"
import NavBar from "@/components/nav-bar"
import ProtectedRoute from "@/lib/auth/ProtectedRoutes"
import { ghanaRegions } from "@/lib/ghana-regions"

// Book genres
const BOOK_GENRES = [
  "Fiction",
  "Non-Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Science Fiction",
  "Fantasy",
  "Horror",
  "Biography",
  "Autobiography",
  "History",
  "Self-Help",
  "Business",
  "Children's",
  "Young Adult",
  "Poetry",
  "Drama",
  "Religion",
  "Philosophy",
  "Science",
  "Technology",
  "Art",
  "Cooking",
  "Travel",
  "Education",
  "Reference",
  "Other",
]

// Book languages
const BOOK_LANGUAGES = [
  "English",
  "French",
  "Spanish",
  "German",
  "Chinese",
  "Japanese",
  "Arabic",
  "Russian",
  "Portuguese",
  "Italian",
  "Hindi",
  "Bengali",
  "Urdu",
  "Swahili",
  "Twi",
  "Ga",
  "Ewe",
  "Hausa",
  "Yoruba",
  "Igbo",
  "Other",
]

// Book formats
const BOOK_FORMATS = [
  "Hardcover",
  "Paperback",
  "Mass Market Paperback",
  "E-book",
  "Audiobook",
  "Large Print",
  "Board Book",
  "Spiral-bound",
  "Textbook",
  "Library Binding",
  "Other",
]

// Maximum file size in bytes (1MB)
const MAX_FILE_SIZE = 1024 * 1024

// Interface for the form data
interface BookForm {
  name: string
  authors: string
  publisher: string
  datePublished: string
  isbn: string
  genre: string
  language: string
  pages: string
  format: string
  description: string
  price: string
  region: string
  suburb: string
}

export default function BookForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<BookForm>({
    name: "",
    authors: "",
    publisher: "",
    datePublished: "",
    isbn: "",
    genre: "",
    language: "",
    pages: "",
    format: "",
    description: "",
    price: "",
    region: "",
    suburb: "",
  })

  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)

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
      newErrors.name = "Book title is required"
    }

    if (!formData.authors.trim()) {
      newErrors.authors = "Author(s) is required"
    }

    if (!formData.publisher.trim()) {
      newErrors.publisher = "Publisher is required"
    }

    if (!formData.datePublished.trim()) {
      newErrors.datePublished = "Publication date is required"
    }

    if (!formData.isbn.trim()) {
      newErrors.isbn = "ISBN is required"
    } else if (!/^(?:\d[- ]?){9}[\dXx]$|^(?:\d[- ]?){12}\d$/.test(formData.isbn.replace(/[- ]/g, ""))) {
      newErrors.isbn = "Please enter a valid ISBN-10 or ISBN-13"
    }

    if (!formData.genre) {
      newErrors.genre = "Genre is required"
    }

    if (!formData.language) {
      newErrors.language = "Language is required"
    }

    if (!formData.pages.trim()) {
      newErrors.pages = "Number of pages is required"
    } else if (isNaN(Number(formData.pages)) || Number(formData.pages) <= 0) {
      newErrors.pages = "Pages must be a positive number"
    }

    if (!formData.format) {
      newErrors.format = "Format is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Book description is required"
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      // Prepare the data object
      const bookData = {
        name: formData.name,
        authors: formData.authors,
        publisher: formData.publisher,
        datePublished: formData.datePublished,
        isbn: formData.isbn,
        genre: formData.genre,
        language: formData.language,
        pages: Number(formData.pages),
        format: formData.format,
        description: formData.description,
        price: Number(formData.price),
        location: {
          region: formData.region,
          suburb: formData.suburb,
        },
        images: images.map((img) => ({
          name: img.file.name,
          size: img.file.size,
          type: img.file.type,
        })),
        category: "books",
        createdAt: new Date().toISOString(),
      }

      // In a real app, you would submit this data to your backend
      console.log("Form submitted:", bookData)

      // Show the submitted data
      setSubmittedData(bookData)
      setIsSubmitted(true)
    }
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.preview))
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

            <h1 className="mb-2 text-2xl font-bold">Create New Book Listing</h1>
            <p className="mb-6 text-gray-600">Fill in the details to list your book for sale</p>

            {isSubmitted ? (
              <div className="p-6 bg-white rounded-lg shadow">
                <div className="flex items-center mb-4 text-green-600">
                  <Check className="w-6 h-6 mr-2" />
                  <h2 className="text-xl font-semibold">Book Listing Created Successfully!</h2>
                </div>

                <div className="p-4 mb-6 bg-gray-50 rounded-lg">
                  <h3 className="mb-2 font-medium">Book Details:</h3>
                  <pre className="p-4 overflow-auto text-sm bg-gray-100 rounded">
                    {JSON.stringify(submittedData, null, 2)}
                  </pre>
                </div>

                <div className="flex justify-between">
                  <Link
                    href="/categories"
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    Create Another Listing
                  </Link>
                  <Link href="/" className="px-4 py-2 text-white bg-primary rounded-md hover:bg-primary-light">
                    Go to Home
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
                {/* Book Title */}
                <div className="mb-4">
                  <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                    Book Title <span className="text-red-500">*</span>
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
                    placeholder="Enter book title"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* Authors */}
                <div className="mb-4">
                  <label htmlFor="authors" className="block mb-2 text-sm font-medium text-gray-700">
                    Author(s) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="authors"
                    name="authors"
                    value={formData.authors}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.authors ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter author name(s), separate multiple with commas"
                  />
                  {errors.authors && <p className="mt-1 text-sm text-red-500">{errors.authors}</p>}
                </div>

                {/* Publisher */}
                <div className="mb-4">
                  <label htmlFor="publisher" className="block mb-2 text-sm font-medium text-gray-700">
                    Publisher <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="publisher"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.publisher ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter publisher name"
                  />
                  {errors.publisher && <p className="mt-1 text-sm text-red-500">{errors.publisher}</p>}
                </div>

                {/* Date Published */}
                <div className="mb-4">
                  <label htmlFor="datePublished" className="block mb-2 text-sm font-medium text-gray-700">
                    Date Published <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="datePublished"
                    name="datePublished"
                    value={formData.datePublished}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.datePublished ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.datePublished && <p className="mt-1 text-sm text-red-500">{errors.datePublished}</p>}
                </div>

                {/* ISBN */}
                <div className="mb-4">
                  <label htmlFor="isbn" className="block mb-2 text-sm font-medium text-gray-700">
                    ISBN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="isbn"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      errors.isbn ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter ISBN (e.g., 978-3-16-148410-0)"
                  />
                  {errors.isbn && <p className="mt-1 text-sm text-red-500">{errors.isbn}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                  {/* Genre */}
                  <div>
                    <label htmlFor="genre" className="block mb-2 text-sm font-medium text-gray-700">
                      Genre <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.genre ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Genre</option>
                      {BOOK_GENRES.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                    {errors.genre && <p className="mt-1 text-sm text-red-500">{errors.genre}</p>}
                  </div>

                  {/* Language */}
                  <div>
                    <label htmlFor="language" className="block mb-2 text-sm font-medium text-gray-700">
                      Language <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.language ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Language</option>
                      {BOOK_LANGUAGES.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                    {errors.language && <p className="mt-1 text-sm text-red-500">{errors.language}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                  {/* Pages */}
                  <div>
                    <label htmlFor="pages" className="block mb-2 text-sm font-medium text-gray-700">
                      Number of Pages <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="pages"
                      name="pages"
                      value={formData.pages}
                      onChange={handleChange}
                      min="1"
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.pages ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter number of pages"
                    />
                    {errors.pages && <p className="mt-1 text-sm text-red-500">{errors.pages}</p>}
                  </div>

                  {/* Format */}
                  <div>
                    <label htmlFor="format" className="block mb-2 text-sm font-medium text-gray-700">
                      Format <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="format"
                      name="format"
                      value={formData.format}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                        errors.format ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Format</option>
                      {BOOK_FORMATS.map((format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                    {errors.format && <p className="mt-1 text-sm text-red-500">{errors.format}</p>}
                  </div>
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

                {/* Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">
                    Book Description <span className="text-red-500">*</span>
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
                    placeholder="Describe the book, its condition, and any other relevant details"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
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

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Book Images <span className="text-red-500">*</span> (Up to 4, max 1MB each)
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
                <button type="submit" className="w-full px-6 py-3 text-white bg-primary rounded-md hover:bg-primary-light">
                  Post Book Listing
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
