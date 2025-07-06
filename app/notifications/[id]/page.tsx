"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Bell } from "lucide-react"
import NavBar from "@/components/nav-bar"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { markAsRead } from "@/lib/redux/slices/notificationsSlice"

export default function SingleNotificationPage({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector((state) => state.notifications.items)
  const notification = notifications.find((n) => n.id === params.id)

  useEffect(() => {
    // Mark notification as read when viewed
    if (notification && !notification.read) {
      dispatch(markAsRead(notification.id))
    }
  }, [notification, dispatch])

  if (!notification) {
    return (
      <main className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container px-4 py-8 mx-auto">
          <div className="max-w-2xl mx-auto">
            <Link href="/notifications" className="inline-flex items-center mb-6 text-gray-600 hover:text-black">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to notifications
            </Link>
            <div className="p-8 text-center bg-white rounded-lg shadow">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <h2 className="mb-2 text-xl font-medium">Notification not found</h2>
              <p className="text-gray-600">This notification may have been deleted or doesn't exist.</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-2xl mx-auto">
          <Link href="/notifications" className="inline-flex items-center mb-6 text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to notifications
          </Link>

          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-start mb-6">
              <div className="relative flex-shrink-0 mr-4">
                <div className="relative w-12 h-12 overflow-hidden rounded-full">
                  <Image src={notification.image || "/user_placeholder.png"} alt="" fill className="object-cover" />
                </div>
              </div>
              <div>
                <h1 className="mb-1 text-xl font-bold">{notification.title}</h1>
                <p className="text-sm text-gray-500">{notification.time}</p>
              </div>
            </div>

            <div className="p-4 mb-6 bg-gray-50 rounded-lg">
              <p className="text-gray-800">{notification.description}</p>
            </div>

            {notification.type === "message" && (
              <Link
                href="/chat"
                className="flex items-center justify-center w-full px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800"
              >
                Reply to Message
              </Link>
            )}

            {notification.type === "offer" && (
              <div className="flex space-x-2">
                <button className="flex-1 px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800">
                  Accept Offer
                </button>
                <button className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100">
                  Decline
                </button>
              </div>
            )}

            {notification.type === "wishlist" && (
              <Link
                href="/wishlist"
                className="flex items-center justify-center w-full px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800"
              >
                View Wishlist
              </Link>
            )}

            {notification.type === "sale" && (
              <Link
                href="/profile"
                className="flex items-center justify-center w-full px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800"
              >
                View Sale Details
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
