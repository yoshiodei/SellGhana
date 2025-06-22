"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowUp, Scale } from "lucide-react"
import ProductCard from "@/components/product-card"
import NavBar from "@/components/nav-bar"
import { Smartphone, Car, Shirt, HomeIcon, Sofa, Dumbbell, Gamepad2, BookOpen, Briefcase} from "lucide-react"
import SoapDispenser from '@/components/icons/soap-dispenser-droplet.svg';
import { useProducts } from "@/hooks/use-products"
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"

export default function Home() {
  const {user, loading: authLoading } = useAuthUser();
  console.log("profile auth---->", user);

  // const [showScrollTop, setShowScrollTop] = useState(false)
  const featuredRef = useRef<HTMLDivElement>(null)
  const { products, loading } = useProducts();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Get trending and new products
  const trendingProducts = products.filter((p) => p.tag === "Trending").slice(0, 4)
  const newProducts = products.filter((p, index) => index < 4) // Just using the first 4 for demo

  // Handle scroll to featured products
  const scrollToFeatured = () => {
    featuredRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Handle scroll to top button visibility
  // useEffect(() => {
  //   const handleScroll = () => {
  //     if (window.scrollY > 300) {
  //       setShowScrollTop(true)
  //     } else {
  //       setShowScrollTop(false)
  //     }
  //   }

  //   window.addEventListener("scroll", handleScroll)
  //   return () => window.removeEventListener("scroll", handleScroll)
  // }, [])

  // Handle scroll to top
  // const scrollToTop = () => {
  //   window.scrollTo({ top: 0, behavior: "smooth" })
  // }

  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <NavBar />

      {/* Hero Section */}
      <section 
        className="bg-cover bg-center relative h-[400px] bg-gray-100"
        style={{ backgroundImage: "url('/pattern_bg.jpg')" }}
      >
        <div className="container flex flex-col items-center justify-center h-full px-4 mx-auto text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Discover Ghana's Marketplace</h1>
          <p className="mb-6 text-lg text-gray-600">Buy and sell anything across Ghana</p>
          <button onClick={scrollToFeatured} className="px-6 py-3 text-white bg-primary rounded-md hover:bg-primary-light">
            Shop Now
          </button>
        </div>
      </section>

      {/* Trending and New Products Sections */}
      <section className="py-12 bg-white">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Trending Products */}
            <div 
              className="bg-cover bg-center p-6 border border-slate-300 bg-gray-100 rounded-lg shadow-sm"
              // style={{ backgroundImage: "url('/pattern_bg.jpg')" }}
            >
              <h2 className="mb-4 text-2xl font-bold">Find Jobs</h2>
              <p className="mb-6 text-gray-600">Find your next job opportunity right here today.</p>
              <Link
                href="/jobs"
                className="inline-block px-6 py-3 text-white bg-primary rounded-md hover:bg-primary-light"
              >
                View Jobs
              </Link>
            </div>

            {/* New Products */}
            <div 
              className="bg-cover bg-center border border-slate-300 p-6 bg-gray-100 rounded-lg shadow-sm"
              // style={{ backgroundImage: "url('/pattern_bg.jpg')" }}
            >
              <h2 className="mb-4 text-2xl font-bold">New Products</h2>
              <p className="mb-6 text-gray-600">Be the first to discover fresh listings</p>
              <Link
                href="/category/new"
                className="inline-block px-6 py-3 text-white bg-primary rounded-md hover:bg-primary-light"
              >
                View New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-gray-50">
        <div className="container px-4 mx-auto">
          <h2 className="mb-6 text-2xl font-bold">Categories</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 md:grid-cols-10">
            <Link href="/category/electronics" className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 mb-2 bg-white border rounded-lg shadow-sm hover:border-primary">
                <Smartphone className="w-8 h-8 text-gray-700" />
              </div>
              <span className="text-xs text-center font-semibold text-gray-600">Electronics</span>
            </Link>

            <Link href="/category/vehicles" className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 mb-2 bg-white border rounded-lg shadow-sm hover:border-primary">
                <Car className="w-8 h-8 text-gray-700" />
              </div>
              <span className="text-xs text-center font-semibold text-gray-600">Vehicles</span>
            </Link>

            <Link href="/category/fashion" className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 mb-2 bg-white border rounded-lg shadow-sm hover:border-primary">
                <Shirt className="w-8 h-8 text-gray-700" />
              </div>
              <span className="text-xs text-center font-semibold text-gray-600">Fashion</span>
            </Link>

            <Link href="/category/cosmetics" className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 mb-2 bg-white border rounded-lg shadow-sm hover:border-primary">
                <SoapDispenser className="text-gray-700 scale-125" />
              </div>
              <span className="text-xs text-center font-semibold text-gray-600">Cosmetics</span>
            </Link>

            <Link href="/category/furniture" className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 mb-2 bg-white border rounded-lg shadow-sm hover:border-primary">
                <Sofa className="w-8 h-8 text-gray-700" />
              </div>
              <span className="text-xs text-center font-semibold text-gray-600">Furniture</span>
            </Link>

            <Link href="/category/fitness" className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 mb-2 bg-white border rounded-lg shadow-sm hover:border-primary">
                <Dumbbell className="w-8 h-8 text-gray-700" />
              </div>
              <span className="text-xs text-center font-semibold text-gray-600">Fitness</span>
            </Link>

            <Link href="/category/gaming" className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 mb-2 bg-white border rounded-lg shadow-sm hover:border-primary">
                <Gamepad2 className="w-8 h-8 text-gray-700" />
              </div>
              <span className="text-xs text-center font-semibold text-gray-600">Gaming</span>
            </Link>

            <Link href="/category/property" className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 mb-2 bg-white border rounded-lg shadow-sm hover:border-primary">
                <HomeIcon className="w-8 h-8 text-gray-700" />
              </div>
              <span className="text-xs text-center font-semibold text-gray-600">Property</span>
            </Link>

            <Link href="/category/books" className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 mb-2 bg-white border rounded-lg shadow-sm hover:border-primary">
                <BookOpen className="w-8 h-8 text-gray-700" />
              </div>
              <span className="text-xs text-center font-semibold text-gray-600">Books</span>
            </Link>

            <Link href="/jobs" className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 mb-2 bg-white border rounded-lg shadow-sm hover:border-primary">
                <Briefcase className="w-8 h-8 text-gray-700" />
              </div>
              <span className="text-xs text-center font-semibold text-gray-600">Jobs</span>
            </Link>

          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section ref={featuredRef} className="py-8 bg-white">
        <div className="container px-4 mx-auto">
          <h2 className="mb-6 text-2xl font-bold">Featured Products</h2>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg aspect-square"></div>
                  <div className="h-4 mt-3 bg-gray-200 rounded"></div>
                  <div className="h-4 mt-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 bg-gray-800 text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 px-4">
            <div>
              <h3 className="mb-4 text-lg font-bold">Sell Ghana</h3>
              <p className="text-gray-400">Your marketplace for everything Ghanaian.</p>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-bold">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="py-5 mt-8 text-center text-gray-400 border-t border-gray-700">
            &copy; {new Date().getFullYear()} Sell Ghana. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      {/* <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-3 bg-primary text-white rounded-full shadow-lg transition-all duration-300 ${
          showScrollTop ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
        }`}
      >
        <ArrowUp className="w-6 h-6" />
      </button> */}
    </main>
  )
}
