"use client"

import type React from "react"

import { useState, useRef, useEffect, useId } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Check, AlertCircle } from "lucide-react"
import NavBar from "@/components/nav-bar"
import ProtectedRoute from "@/lib/auth/ProtectedRoutes"
import { ghanaRegions } from "@/lib/ghana-regions"
import { db, storage } from "@/lib/firebase/firebase"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { showToast } from "@/utils/showToast"
import { getFirstThreeLetters } from "@/utils/getters"
import { nanoid } from "nanoid"
import { addDoc, collection, doc, getDoc, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore"
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"
import { FirebaseProduct } from "@/lib/firebase/firestore"

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

export default function BookForm() {
  const { id }: {id: string} = useParams();

  console.log("param for books!!", id);
  

  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initialState = {
  id: '',
  name: '',
  price: 0,
  description: '',
  images: [],
  imagesData: [],
  category: '',
  condition: '',
  location: {region: '',suburb:''},
  createdAt: '',
  userId: '',
  vendor: {image: '',name: '',uid: ''},
  tag: '',
  viewCount: 0,
  vin: '',
  mileage: '',
  type: '',
  author: '',
  datePublished: '',
  format: '',
  genre: '',
  isbn: '',
  language: '',
  pages: 0,
  publisher: '',
  }

  const [images, setImages] = useState<FileType[]>([])
  const [oldImages, setOldImages] = useState<{url:string; path?:string; name:string;size:number;type:string;}[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null)
  const [product, setProduct] = useState<FirebaseProduct>(initialState);

  // Get suburbs for the selected region
  const getSuburbs = () => {
    if (!product?.location?.region) return []
    return ghanaRegions[product?.location?.region] || []
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Special handling for region to reset suburb when region changes
    if (name === "region") {
      setProduct((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          region: value,
        },
      }))
    } else if (name === "suburb") {
      setProduct((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          suburb: value,
        },
      }))
    } else {
      setProduct((prev) => ({
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
          fileData: {
              url: `productImages/${id}/${file.name}`,
              name: file.name,
              size: file.size,
              type: file.type,
          },
          preview: URL.createObjectURL(file),
        }
      })
      .filter((img): img is FileType => img !== null)

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages])
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate required fields
    if (!product?.name.trim()) {
      newErrors.name = "Book title is required"
    }

    if (!product?.authors?.trim()) {
      newErrors.authors = "Author(s) is required"
    }

    if (!product?.publisher?.trim()) {
      newErrors.publisher = "Publisher is required"
    }

    if (!product?.datePublished?.trim()) {
      newErrors.datePublished = "Publication date is required"
    }

    if (!product?.isbn?.trim()) {
      newErrors.isbn = "ISBN is required"
    } else if (!/^(?:\d[- ]?){9}[\dXx]$|^(?:\d[- ]?){12}\d$/.test(product?.isbn.replace(/[- ]/g, ""))) {
      newErrors.isbn = "Please enter a valid ISBN-10 or ISBN-13"
    }

    if (!product?.genre) {
      newErrors.genre = "Genre is required"
    }

    if (!product?.language) {
      newErrors.language = "Language is required"
    }

    if (!product?.pages) {
      newErrors.pages = "Number of pages is required"
    } else if (isNaN(Number(product?.pages)) || Number(product?.pages) <= 0) {
      newErrors.pages = "Pages must be a positive number"
    }

    if (!product?.format) {
      newErrors.format = "Format is required"
    }

    if (!product?.description.trim()) {
      newErrors.description = "Book description is required"
    }

    if (!product?.price) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number(product?.price)) || Number(product?.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }

    if (!product?.location?.region) {
      newErrors.region = "Region is required"
    }

    if (product?.location?.region && !product?.location?.suburb) {
      newErrors.suburb = "Suburb is required"
    }

    if (images.length + oldImages.length === 0) {
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
      const bookData = {
          name: product.name,
          price: Number(product.price),
          location: {
            region: product?.location?.region,
            suburb: product?.location?.suburb,
          },
          description: product.description,
          images: [ ...oldImagesData , ...uploadedImages],
          imagesData: [...oldImages, ...imagesData],
          authors: product.authors,
          publisher: product.publisher,
          datePublished: product.datePublished,
          isbn: product.isbn,
          genre: product.genre,
          language: product.language,
          pages: Number(product.pages),
          format: product.format,
          category: "books",
          lastEdited: serverTimestamp(),
      }

      // In a real app, you would submit this data to your backend
      console.log("Form submitted book form:", bookData)

      const booksRef = doc(db, "productListing", id);

      await updateDoc(booksRef, bookData);
      
      // Show the submitted data
      // setSubmittedData(bookData)
      setIsSubmitted(true)

      showToast("Post updated successfully","success");
      
      // setProduct(initialState);
      router.push("/");

      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      showToast("Error adding post","error")
      console.error('Error submitting listing:', error);
    }
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.preview))
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
      setProduct(productData);
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

            <h1 className="mb-2 text-2xl font-bold">Update Listing - Books</h1>
            <p className="mb-6 text-gray-600">Update your listing details</p>

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
                    value={product?.name || ""}
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
                    value={product?.authors || ""}
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
                    value={product?.publisher || ""}
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
                    value={product?.datePublished || ""}
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
                    value={product?.isbn || ""}
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
                      value={product?.genre}
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
                      value={product?.language || ""}
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
                      value={product?.pages || 0}
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
                      value={product?.format || ""}
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
                    value={product?.price || 0}
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
                    value={product?.description || ""}
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
                      value={product?.location?.region || ""}
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
                  {product?.location?.region && (
                    <div>
                      <label htmlFor="suburb" className="block mb-2 text-sm font-medium text-gray-700">
                        Suburb <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="suburb"
                        name="suburb"
                        value={product?.location?.suburb || ""}
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

                  {/* {(oldImages.length + images.length <= 4 && images.length > 0) && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {images.map((image, index) => (
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
                      ))}
                    </div>
                  )} */}
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={loading} className="w-full px-6 py-3 text-white bg-primary rounded-md hover:bg-primary-light">
                  {loading ? '...loading' : 'Update Book Listing'}
                </button>
              </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
