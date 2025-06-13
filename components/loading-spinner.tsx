export default function LoadingSpinner({ size = "medium" }: { size?: "small" | "medium" | "large" }) {
    const sizeClasses = {
      small: "w-6 h-6 border-2",
      medium: "w-12 h-12 border-3",
      large: "w-16 h-16 border-4",
    }
  
    return (
      <div className="flex items-center justify-center">
        <div
          className={`${sizeClasses[size]} border-t-black border-gray-200 rounded-full animate-spin`}
          role="status"
          aria-label="Loading"
        />
      </div>
    )
  }
  