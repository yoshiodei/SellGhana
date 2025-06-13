"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { getProduct, isProductOwner } from "@/lib/firebase/product"
import NavBar from "@/components/nav-bar"
import LoadingSpinner from "@/components/loading-spinner"
import VehicleEditForm from "@/components/edit-forms/vehicle-edit-form"
import BookEditForm from "@/components/edit-forms/book-edit-form"
import PropertyEditForm from "@/components/edit-forms/property-edit-form"
import GeneralEditForm from "@/components/edit-forms/general-edit-form"
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"

export default function EditProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthUser()
  const router = useRouter()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!user) {
        router.push("/signin")
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Get the product
        const productData = await getProduct(params.id)

        if (!productData) {
          setError("Product not found")
          return
        }

        // Check if user owns this product
        const isOwner = await isProductOwner(params.id, user.uid)

        if (!isOwner) {
          setError("You don't have permission to edit this product")
          return
        }

        setProduct(productData)
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Failed to load product")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id, user, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container px-4 py-8 mx-auto">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container px-4 py-8 mx-auto">
          <div className="max-w-md mx-auto text-center">
            <h1 className="mb-4 text-2xl font-bold text-red-600">Error</h1>
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return null
  }

  // Render the appropriate edit form based on product category
  const renderEditForm = () => {
    const category = product.category?.toLowerCase()

    switch (category) {
      case "vehicles":
        return <VehicleEditForm product={product} />
      case "books":
        return <BookEditForm product={product} />
      case "property":
        return <PropertyEditForm product={product} />
      default:
        return <GeneralEditForm product={product} />
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />
      {renderEditForm()}
    </main>
  )
}
