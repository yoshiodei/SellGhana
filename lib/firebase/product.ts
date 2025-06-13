import { doc, deleteDoc, updateDoc, getDoc, increment } from "firebase/firestore"
import { ref, deleteObject, listAll } from "firebase/storage"
import { db, storage } from "./firebase"

/**
 * Delete a product and all its associated images
 */
export async function deleteProduct(productId: string, imageUrls: string[] = []): Promise<void> {
  try {
    // Delete the product document from Firestore
    const productRef = doc(db, "productListing", productId)
    await deleteDoc(productRef)

    // Delete all associated images from Firebase Storage
    if (imageUrls.length > 0) {
      const deletePromises = imageUrls.map(async (imageUrl) => {
        try {
          // Extract the file path from the URL
          const url = new URL(imageUrl)
          const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
          if (pathMatch) {
            const filePath = decodeURIComponent(pathMatch[1])
            const imageRef = ref(storage, filePath)
            await deleteObject(imageRef)
          }
        } catch (error) {
          console.error("Error deleting image:", imageUrl, error)
          // Continue with other deletions even if one fails
        }
      })

      await Promise.allSettled(deletePromises)
    }

    // Also try to delete the entire product folder in storage
    try {
      const productFolderRef = ref(storage, `products/${productId}`)
      const listResult = await listAll(productFolderRef)

      const deleteFilePromises = listResult.items.map((itemRef) => deleteObject(itemRef))
      await Promise.allSettled(deleteFilePromises)
    } catch (error) {
      console.error("Error deleting product folder:", error)
      // This is not critical, continue
    }

    console.log("Product deleted successfully:", productId)
  } catch (error) {
    console.error("Error deleting product:", error)
    throw new Error("Failed to delete product. Please try again.")
  }
}

/**
 * Update a product document
 */
export async function updateProduct(productId: string, updates: Partial<any>): Promise<void> {
  try {
    const productRef = doc(db, "productListing", productId)

    // Add updatedAt timestamp
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    }

    await updateDoc(productRef, updateData)
    console.log("Product updated successfully:", productId)
  } catch (error) {
    console.error("Error updating product:", error)
    throw new Error("Failed to update product. Please try again.")
  }
}

/**
 * Get a product by ID
 */
export async function getProduct(productId: string): Promise<any | null> {
  try {
    const productRef = doc(db, "productListing", productId)
    const productSnap = await getDoc(productRef)

    if (productSnap.exists()) {
      return {
        id: productSnap.id,
        ...productSnap.data(),
      }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting product:", error)
    throw new Error("Failed to get product. Please try again.")
  }
}

/**
 * Check if user owns a product
 */
export async function isProductOwner(productId: string, userId: string): Promise<boolean> {
  try {
    const product = await getProduct(productId)
    return product && product.userId === userId
  } catch (error) {
    console.error("Error checking product ownership:", error)
    return false
  }
}

/**
 * Increment the view count for a product
 * Only counts unique views per session
 */
export async function incrementProductViewCount(productId: string): Promise<void> {
  try {
    // Check if this product has been viewed in this session
    const viewedProducts = JSON.parse(sessionStorage.getItem("viewedProducts") || "{}")

    // If already viewed in this session, don't increment
    if (viewedProducts[productId]) {
      return
    }

    // Mark as viewed in this session
    viewedProducts[productId] = true
    sessionStorage.setItem("viewedProducts", JSON.stringify(viewedProducts))

    // Increment the view count in Firestore
    const productRef = doc(db, "products", productId)
    await updateDoc(productRef, {
      viewCount: increment(1),
    })

    console.log("View count incremented for product:", productId)
  } catch (error) {
    console.error("Error incrementing view count:", error)
    // Don't throw here - view count is non-critical
  }
}
