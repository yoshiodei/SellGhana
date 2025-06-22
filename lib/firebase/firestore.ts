import { collection, getDocs, onSnapshot, query } from "firebase/firestore"
import { db } from "./firebase"
import { LogsIcon } from "lucide-react"
// import { db } from "./firebase"

export interface FirebaseProduct {
  id: string
  name: string
  price: number
  description: string
  images: string[]
  category?: string
  condition?: string
  location?: {region: string, suburb: string}
  createdAt?: any
  userId?: string
  vendor?: {image: string, name: string, uid: string}
  tag?: string
  viewCount?: number
  vin?: string
  mileage?: string
  type?: string
  author?: string
  datePublished?: string
  format?: string
  genre?: string
  isbn?: string
  language?: string
  pages?: string | number
  publisher?: string
}

// Cache for products
let cachedProducts: FirebaseProduct[] | null = null
let unsubscribe: (() => void) | null = null

export const getProducts = async (): Promise<FirebaseProduct[]> => {
  // If we have cached products, return them
  if (cachedProducts) {
    return cachedProducts
  }

  try {
    const productsQuery = query(collection(db, "productListing"))
    const snapshot = await getDocs(productsQuery)

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirebaseProduct[]
     
    console.log("Cached products", products);
    
    // Cache the products
    cachedProducts = products

    return products
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

export const subscribeToProducts = (callback: (products: FirebaseProduct[]) => void): (() => void) => {
  // Unsubscribe from previous listener if it exists
  if (unsubscribe) {
    unsubscribe()
  }

  try {
    const productsQuery = query(collection(db, "productListing"))

    // Set up real-time listener
    const unsubscribeFunc = onSnapshot(
      productsQuery,
      (snapshot) => {
        const products = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FirebaseProduct[]

        // Update cache
        cachedProducts = products

        // Call callback with new products
        callback(products)
      },
      (error) => {
        console.error("Error in products subscription:", error)
      },
    )

    unsubscribe = unsubscribeFunc
    return unsubscribeFunc
  } catch (error) {
    console.error("Error setting up products subscription:", error)
    return () => {}
  }
}

export const clearProductsCache = () => {
  cachedProducts = null
}
