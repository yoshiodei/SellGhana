import Link from "next/link"
import { Home, ShoppingBag } from "lucide-react"

export default function ProductNotFound({
  message = "The product you're looking for doesn't exist or has been removed.",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="p-8 text-center bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gray-100 rounded-full">
          <ShoppingBag className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="mb-4 text-2xl font-bold">Product Not Found</h1>
        <p className="mb-8 text-gray-600">{message}</p>
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-white bg-primary rounded-md hover:bg-primary-light transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
