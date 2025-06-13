import LoadingSpinner from "@/components/loading-spinner"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 text-center">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-lg text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
