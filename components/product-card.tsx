"use client"

import type React from "react"
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"
import type { FirebaseProduct } from "@/lib/firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { showToast } from '@/utils/showToast';
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser";

export default function ProductCard({ product }: { product: FirebaseProduct}) {
  const { user } = useAuthUser();

  const { isInWishlist, toggleWishlistItem } = useWishlist()  
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      // Redirect to sign in or show sign in modal
      alert("Please sign in to add items to your wishlist")
      return
    }

    setIsLiking(true)
    await toggleWishlistItem(product.id)
    setIsLiking(false)
  }

  // Use the first image from the images array, or a placeholder if no images
  const productImage =
    product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg?height=400&width=400"

  const isLiked = isInWishlist(product.id)
  
  return (
    <Link href={`/product/${product.id}`} className="group">
      <div className="relative overflow-hidden bg-gray-100 rounded-lg aspect-square">
        <Image
          src={productImage || "/user_placeholder.png"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Floating tag */}
        {product.tag && (
          <div className="absolute px-2 py-1 text-xs font-medium text-white bg-black top-2 left-2">{product.tag}</div>
        )}

        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`absolute p-2 transition-colors bg-white rounded-full shadow-md top-2 right-2 hover:bg-gray-100 ${
            isLiking ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
        </button>
      </div>

      <div className="mt-3">
        <h3 className="font-medium text-gray-900">{product.name}</h3>
        <p className="mt-1 font-medium">GH₵{Number(product.price).toFixed(2)}</p>
      </div>
    </Link>
  )
}
