import type { FirebaseApp } from "firebase/app"
import type { Auth } from "firebase/auth"
import type { Firestore } from "firebase/firestore"
import type { FirebaseStorage } from "firebase/storage"

declare global {
  interface Window {
    firebase?: {
      app: FirebaseApp
      auth: Auth
      db: Firestore
      storage: FirebaseStorage
    }
  }
}
