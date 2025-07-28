import { collection, getDocs, onSnapshot, query } from "firebase/firestore"
import { db } from "./firebase"
import { LogsIcon } from "lucide-react"
// import { db } from "./firebase"

export interface FirebaseProduct {
  id: string
  make?: string,
  model?: string,
  year?: string,
  name: string
  price: number
  company?: string
  isRemote?: boolean
  description: string
  images: string[]
  imagesData: {
    path?: string
    url: string
    name: string
    size: number
    type: string
  }[]
  imageData?: {
    path?: string
    url: string
    name: string
    size: number
    type: string
  }
  salaryDetail?: {
    salaryMin?: number
    salaryMax?: number
  }
  skills?: string[]
  category?: string
  otherCategory?: string
  condition?: string
  location: {region: string, suburb: string}
  createdAt?: any
  userId?: string
  vendor?: {image: string, name: string, uid: string}
  tag?: string
  salaryMin?: number
  employmentType?: string
  experience?: string
  phone?: string 
  email?: string 
  applicationDeadline?: string
  externalLink?: string
  salaryDetails?: {
    salaryMin?: number
    salaryMax?: number
  }
  salaryMax?: number
  viewCount?: number
  vin?: string
  mileage?: string
  type?: string
  authors?: string
  datePublished?: string
  format?: string
  genre?: string
  isbn?: string
  language?: string
  pages?: string | number
  publisher?: string
  brand?: string
  otherBrand?: string
  listingType?: string
  title?: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  furnishing?: string
  size?: number
  availabilityDate?: string
  propertyLocation?: string
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
