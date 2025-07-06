"use client"

import Link from "next/link"
import Image from "next/image"
import NavBar from "@/components/nav-bar"
import { Bell } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { markAllAsRead } from "@/lib/redux/slices/notificationsSlice"

export default function NotificationsPage() {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector((state) => state.notifications.items)
  

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead())
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-2xl mx-auto">
          <h1 className="mb-6 text-2xl font-bold">Notifications</h1>

          {/* Notification Tabs */}
          <div className="mb-6 overflow-x-auto border-b">
            <div className="flex space-x-8">
              <button className="px-1 py-4 text-sm font-medium border-b-2 border-black">All</button>
              <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-black">
                Unread
              </button>
              <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-black">
                Messages
              </button>
              <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-black">
                Offers
              </button>
              <button className="px-1 py-4 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-black">
                System
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-hidden bg-white rounded-lg shadow">
            {/* {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={`/notifications/${notification.id}`}
                className={`flex items-start p-4 border-b hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}
              >
                <div className="relative flex-shrink-0 mr-4">
                  <div className="relative w-10 h-10 overflow-hidden rounded-full">
                    <Image src={notification.image || "/user_placeholder.png"} alt="" fill className="object-cover" />
                  </div>
                  {!notification.read && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${!notification.read ? "font-semibold" : ""}`}>{notification.title}</h3>
                  <p className="text-sm text-gray-600">{notification.description}</p>
                  <p className="mt-1 text-xs text-gray-500">{notification.time}</p>
                </div>
              </Link>
            ))} */}

            {notifications.length === 0 || true && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="p-3 mb-4 bg-gray-100 rounded-full">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium">No notifications yet</h3>
                <p className="text-gray-600">We'll notify you when something happens</p>
              </div>
            )}
          </div>

          {/* Mark All as Read Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Mark all as read
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
