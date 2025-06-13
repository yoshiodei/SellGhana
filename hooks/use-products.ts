"use client"

import { useEffect, useState } from "react"
import { type FirebaseProduct, getProducts, subscribeToProducts } from "@/lib/firebase/firestore"

export function useProducts() {
  const [products, setProducts] = useState<FirebaseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Initial fetch
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const data = await getProducts()
        setProducts(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch products"))
        console.error("Error fetching products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToProducts((updatedProducts) => {
      setProducts(updatedProducts)
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [])

  return { products, loading, error }
}
