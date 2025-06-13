"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import NavBar from "@/components/nav-bar"
import { categories } from "@/lib/categories"
import ProtectedRoute from "@/lib/auth/ProtectedRoutes"

export default function CategoriesPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <NavBar />

        <div className="container px-4 py-8 mx-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="mb-2 text-3xl font-bold">Create a New Listing</h1>
            <p className="mb-8 text-gray-600">Select a category for your listing</p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/new-post//${category.id}`}
                  className="flex items-center p-4 transition-colors bg-white border rounded-lg shadow-sm hover:border-primary"
                >
                  <div className="p-3 mr-4 text-primary bg-primary-alt rounded-full">
                    <category.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
              ))}
            </div>

          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
