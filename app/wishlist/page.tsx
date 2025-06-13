"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import NavBar from "@/components/nav-bar"
import ProductCard from "@/components/product-card"
import { useWishlist } from "@/hooks/use-wishlist"
import { db } from "@/lib/firebase/firebase"
import { doc, getDoc } from "firebase/firestore"
import type { FirebaseProduct } from "@/lib/firebase/firestore"

export default function WishlistPage() {
  const { wishlistItems, loading: wishlistLoading } = useWishlist()
  const [products, setProducts] = useState<FirebaseProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlistItems.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const productPromises = wishlistItems.map(async (productId) => {
          const productDocRef = doc(db, "productListing", productId)
          const productDoc = await getDoc(productDocRef)

          if (productDoc.exists()) {
            return { id: productDoc.id, ...productDoc.data() } as FirebaseProduct
          }
          return null
        })

        const productsData = await Promise.all(productPromises)
        setProducts(productsData.filter((product): product is FirebaseProduct => product !== null))
      } catch (error) {
        console.error("Error fetching wishlist products:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!wishlistLoading) {
      fetchWishlistProducts()
    }
  }, [wishlistItems, wishlistLoading])

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-6 text-2xl font-bold">My Wishlist</h1>

        {loading || wishlistLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg aspect-square"></div>
                <div className="h-4 mt-3 bg-gray-200 rounded"></div>
                <div className="h-4 mt-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 mt-8 text-center bg-white rounded-lg shadow">
            <div className="p-3 mb-4 bg-gray-100 rounded-full">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium">Your wishlist is empty</h3>
            <p className="mb-4 text-gray-600">Save items you like by clicking the heart icon</p>
            <Link href="/" className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800">
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
