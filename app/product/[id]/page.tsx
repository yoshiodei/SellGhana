"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
// import { ArrowLeft, Flag, Heart, Share, Trash, Edit } from "lucide-react"
import { ArrowLeft, Flag, Heart, Share, Edit, Trash2, Trash } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs, limit, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import type { FirebaseProduct } from "@/lib/firebase/firestore"
import ProductCard from "@/components/product-card"
import NavBar from "@/components/nav-bar"
import { useAppDispatch } from "@/lib/redux/hooks"
// import { openShareModal } from "@/lib/redux/slices/uiSlice"
// import { openReportModal } from "@/lib/redux/slices/uiSlice"
import { openShareModal, openReportModal, openDeleteProductModal } from "@/lib/redux/slices/uiSlice"
import { toggleWishlistItem } from "@/lib/redux/slices/wishlistSlice"
import { useParams, useRouter } from "next/navigation"
import ProductNotFound from "@/components/product-not-found"
import { formatDate } from "@/utils/dataFetch"
import { useWishlist } from "@/hooks/use-wishlist"
import { showToast } from "@/utils/showToast"
import { generateChatId, sendMessage } from "@/lib/firebase/chats"
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"
import { deleteProduct } from "@/lib/firebase/product"
import { timeStamp } from "console"


export default function ProductPage() {
  const { user } = useAuthUser();
  const { id : productId }: { id: string } = useParams();
  const router = useRouter();

  const { isInWishlist, toggleWishlistItem } = useWishlist()  
  const [product, setProduct] = useState<FirebaseProduct | null>(null)
  const [similarProducts, setSimilarProducts] = useState<FirebaseProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mainImage, setMainImage] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [liked, setLiked] = useState(false)
  const [message, setMessage] = useState("")
  const dispatch = useAppDispatch()
  const [isLiking, setIsLiking] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);

  const isOwner = user && product && user.uid === product?.vendor?.uid


  const handleLike = async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
  
      if (!user) {
        // Redirect to sign in or show sign in modal
        alert("Please sign in to add items to your wishlist")
        return
      }
  
      setIsLiking(true)
      await toggleWishlistItem(productId)
      setIsLiking(false)
    }


    const isLiked = isInWishlist(productId);

  // Fetch the product and similar products
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch the product by ID
        const productDocRef = doc(db, "productListing", productId)
        const productDocSnap = await getDoc(productDocRef)

        if (!productDocSnap.exists()) {
          console.log('does not exist');
          
          setError("Product not found")
          setLoading(false)
          return
        }

        // Get the product data
        const productData = {
          id: productDocSnap.id,
          ...productDocSnap.data(),
        } as FirebaseProduct

        console.log("product data is", productData);
        

        setProduct(productData)

        // Set the main image to the first image in the array
        if (productData.images && productData.images.length > 0) {
          setMainImage(productData.images[0])
        }

        // Fetch similar products from the same category
        if (productData.category) {
          const similarProductsQuery = query(
            collection(db, "productListing"),
            where("category", "==", productData.category),
            where("id", "!=", productId),
            limit(6),
          )

          const similarProductsSnapshot = await getDocs(similarProductsQuery)

          if (!similarProductsSnapshot.empty) {
            const similarProductsData = similarProductsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as FirebaseProduct[]

            setSimilarProducts(similarProductsData)
          } else {
            setSimilarProducts([])
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Failed to load product. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchProductData()
  }, [productId])


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      showToast("Please enter a message", "error");
      return
    }

    if (!user) {
      showToast("Please sign in to send a message", "error");
      return
    }

    if (!product) {
      showToast("Product information is not available", "error");
      return
    }

    if (!product.vendor?.uid) {
      showToast("Unable to find product owner information", "error");
      return
    }

    // Prevent users from messaging themselves
    if (user.uid === product.vendor?.uid) {
      showToast("You cannot send message to yourself", "error");
      return
    }

    try{
      setIsSendingMessage(true);

      console.log("chatList data", {
        vendorImage: product.vendor?.image || "",
        vendorName: product.vendor?.name || "",
        lastMessage: message,
        unreadMessageCount: [message],
        productName: product.name,
        chatId: generateChatId(user.uid , product.vendor?.uid, productId),
        timeStamp: serverTimestamp(),
      });

      console.log("messageList data", {
        chatId: generateChatId(user.uid , product.vendor?.uid, productId),
        productPrice: product.price,
        productId,
        message: { 
          timeStamp: serverTimestamp(),
          senderId: user.uid,
          text: message,
        }
      });
      
      // send message to back end
      await sendMessage(
        generateChatId(user.uid , product.vendor?.uid, productId),
        user.uid,
        user?.displayName || "",
        message,
        product.vendor.uid,
        user?.photoURL || "",
        product.name,
        product.vendor?.name,
        product.vendor?.image,
        productId,
        product?.images[0] || "",
        product.price 
      )

      showToast("Message sent successfully", "success");
      setMessage("");
      // router.push(`/chat?chatId=${generateChatId(user.uid , product.vendor?.uid, productId)}`)
      
    } catch(error){
      console.error("Error sending message:", error);
      showToast("Failed to send message", "error");
    } finally {
      setIsSendingMessage(false);
    }
  }

  const handleEdit = () => {
    if (product) {
      // Navigate to edit page based on product category
      const category = product.category?.toLowerCase() || "general"
      router.push(`/edit-product/${product.id}?category=${category}`)
    }
  }

  const handleDelete = () => {
    if (product) {
      dispatch(
        openDeleteProductModal({
          productId: product.id,
          productName: product.name,
          images: product.images || [],
        }),
      )
    }
  }

  const handleShare = () => {
    if (product) {
      const productUrl = `${window.location.origin}/product/${product.id}`
      dispatch(openShareModal({ productId: product.id, productUrl }))
    }
  }

  const handleReport = () => {
    if (product) {
      dispatch(openReportModal(product.id))
    }
  }

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen">
        <NavBar />
        <div className="container px-4 py-8 mx-auto">
          <div className="animate-pulse">
            <div className="h-4 mb-6 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <div className="bg-gray-200 rounded-lg aspect-square"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="bg-gray-200 rounded-md aspect-square"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Error or product not found state
  if (error || !product) {
    return (
      <main className="min-h-screen">
        <NavBar />
        <div className="container px-4 py-8 mx-auto">
          <ProductNotFound message={error || "The product you're looking for doesn't exist or has been removed."} />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <NavBar />

      {/* Product Details */}
      <div className="container px-4 py-8 mx-auto">
        <Link href="/" className="inline-flex items-center mb-6 text-gray-600 hover:text-black">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to products
        </Link>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative overflow-hidden bg-gray-100 rounded-lg aspect-square">
              <Image
                src={mainImage || "/placeholder.svg?height=400&width=400"}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, index) => (
                  <div
                    key={index}
                    className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${
                      mainImage === img ? "border-black" : "border-transparent"
                    }`}
                    onClick={() => setMainImage(img)}
                  >
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`Product view ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-bold">GH₵{product.price.toFixed(2)}</p>

            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 text-xs text-white bg-green-500 rounded-full">
                {product.condition || "Brand New"}
              </span>
              <span className="text-sm text-gray-600">
                {product.createdAt ? `Posted on ${formatDate(product.createdAt)}` : "Posted date unknown"}
              </span>
            </div>

            <p className="text-sm text-gray-600">{`Location: ${product?.location?.region}, ${product?.location?.suburb}`}</p>

            <div className="pt-4 border-t">
              <h3 className="mb-2 text-lg font-medium">Description</h3>
              <p className="text-gray-600">{product?.description}</p>
            </div>

            {/* Vendor Details */}
            <div className="pt-4 border-t">
              {/* <h3 className="mb-2 text-sm font-medium text-gray-500">VENDOR</h3> */}
              <button onClick={() => router.push(`/profile/${product?.vendor?.uid}`)} className="flex items-center w-auto">
                <div className="relative w-[50px] h-[50px] mr-3 overflow-hidden rounded-full">
                  <Image src={product?.vendor?.image || "/placeholder.svg?height=48&width=48"} alt="Vendor" fill className="object-cover" />
                </div>
                <div className="flex flex-col items-start">
                  <p className="font-medium">Vendor</p>
                  <p className="text-lg hover:underline">{product?.vendor?.name || "Unknown User"}</p>
                  {/* <p className="text-sm text-gray-600">Member since 2022</p> */}
                </div>
              </button>
            </div>

             {/* Owner Actions (Edit/Delete) OR Message Vendor */}
             {isOwner ? (
              <div className="pt-4 border-t">
                <h3 className="mb-4 text-md font-medium">Manage Your Listing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleEdit}
                    className="flex items-center justify-center px-4 py-3 text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors"
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    Edit Product
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center justify-center px-4 py-3 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Product"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t">
                <h3 className="mb-2 text-lg font-medium">Message Vendor</h3>
                <form onSubmit={handleSendMessage}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type message"
                    className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    rows={3}
                  ></textarea>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 text-white bg-primary rounded-md hover:bg-primary-light disabled:opacity-50"
                    disabled={!message.trim() || isSendingMessage}
                  >
                    {isSendingMessage ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            )}

            {/* Action Buttons - Updated to equal width */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                <Heart className={`w-5 h-5 mr-2 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                Save
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                <Share className="w-5 h-5 mr-2" />
                Share
              </button>
              <button
                onClick={handleReport}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                <Flag className="w-5 h-5 mr-2" />
                Report 
              </button>
            </div>
          </div>
        </div>

       

        {/* Similar Products Section - Only show if there are similar products */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold">Similar Products</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {similarProducts.map((similarProduct) => (
                <ProductCard key={similarProduct.id} product={similarProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}


