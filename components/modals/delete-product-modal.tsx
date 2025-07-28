"use client"

import { useState } from "react"
import { X, Trash2, AlertTriangle } from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { closeDeleteProductModal } from "@/lib/redux/slices/uiSlice"
import { deleteProduct } from "@/lib/firebase/product"
import { useRouter } from "next/navigation"
import { showToast } from "@/utils/showToast"

export default function DeleteProductModal() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { isDeleteProductModalOpen, deleteProductData } = useAppSelector((state) => state.ui)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    if (!isDeleting) {
      dispatch(closeDeleteProductModal())
    }
  }

  const handleDelete = async () => {
    if (!deleteProductData) return

    try {
      setIsDeleting(true)
      setError(null)
      await deleteProduct(deleteProductData.productId, deleteProductData.images || [])
      console.log('delete 002');
      setIsDeleting(false)
      // Close modal and redirect
      dispatch(closeDeleteProductModal())
      router.push("/")
      console.log('delete 003');
      // Show success message (you could also use a toast notification here)
      setTimeout(() => {
        // alert("Product deleted successfully!")
        showToast("Product deleted successfully!","success")
      }, 100)
      console.log('delete 004');
      // setIsDeleting(false)
    } catch (error) {
      console.error("Error deleting product:", error)
      setError("Failed to delete product. Please try again.")
      setIsDeleting(false)
    }
  }

  if (!isDeleteProductModalOpen || !deleteProductData) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Warning icon */}
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Product</h3>

          {/* Message */}
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete "{deleteProductData.productName}"? This action cannot be undone and will
            permanently remove the product from your listings.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded-md">
              <AlertTriangle className="inline-block w-4 h-4 mr-1" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
