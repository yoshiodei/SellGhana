import Link from "next/link"

export default function SimpleNavBar() {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container flex items-center h-16 px-4 mx-auto">
        <Link href="/" className="text-xl font-bold">
          Sell Ghana
        </Link>
      </div>
    </nav>
  )
}
