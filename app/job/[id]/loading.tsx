import NavBar from "@/components/nav-bar"
import LoadingSpinner from "@/components/loading-spinner"

export default function JobLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container px-4 py-16 mx-auto">
        <div className="flex flex-col items-center justify-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-lg text-gray-600">Loading job details...</p>
        </div>
      </div>
    </main>
  )
}
