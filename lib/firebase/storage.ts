import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "./firebase"
import { v4 as uuidv4 } from "uuid"

/**
 * Upload multiple images to Firebase Storage
 * @param files Array of files to upload
 * @param path Base path in storage where files will be stored
 * @returns Array of download URLs for the uploaded files
 */
export async function uploadImages(files: File[], path: string): Promise<string[]> {
  try {
    const uploadPromises = files.map(async (file) => {
      // Generate a unique filename to prevent collisions
      const fileExtension = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      const fullPath = `${path}/${fileName}`

      // Create a reference to the file location
      const fileRef = ref(storage, fullPath)

      // Upload the file
      const snapshot = await uploadBytes(fileRef, file)

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)

      return downloadURL
    })

    // Wait for all uploads to complete
    const downloadURLs = await Promise.all(uploadPromises)
    return downloadURLs
  } catch (error) {
    console.error("Error uploading images:", error)
    throw new Error("Failed to upload images. Please try again.")
  }
}

/**
 * Upload a single image to Firebase Storage
 * @param file File to upload
 * @param path Path in storage where file will be stored
 * @returns Download URL for the uploaded file
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  const urls = await uploadImages([file], path)
  return urls[0]
}
