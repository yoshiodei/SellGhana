import Link from "next/link"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 text-center bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gray-100 rounded-full">
          <span className="text-3xl">🔍</span>
        </div>
        <h1 className="mb-4 text-3xl font-bold">Page Not Found</h1>
        <p className="mb-8 text-gray-600">The page you are looking for doesn't exist or has been moved.</p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 text-white bg-primary rounded-md hover:bg-primary-light transition-colors"
        >
          <Home className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
