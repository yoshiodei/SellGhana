"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { format, isToday, isYesterday } from "date-fns"
import Image from "next/image"
import { MessageCircle, PlusCircle, Search, Send, MenuIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"
import {
  subscribeToUserChats,
  subscribeToChatMessages,
  sendMessage,
  // markMessagesAsRead,
  // type Chat,
  type ChatMessage,
  ChatListDataType,
  getOtherUserId,
} from "@/lib/firebase/chats"
import { useAuthUser } from "@/lib/auth/hooks/useAuthUser"
import { showToast } from "@/utils/showToast"

export default function ChatPage() {
  const { user } = useAuthUser()
  const searchParams = useSearchParams()
  const chatIdFromUrl = searchParams.get("chatId")

  const [chats, setChats] = useState<ChatListDataType[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatListDataType | null>(null)
  const [messages, setMessages] = useState<ChatMessage | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showMessage, setShowMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesUnsubscribeRef = useRef<(() => void) | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages?.messages && messages?.messages?.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Subscribe to user chats (only chat list)
  useEffect(() => {
    if (!user) {
      setLoadingChats(false)
      return
    }

    console.log("Setting up chats subscription for user:", user.uid)

    const unsubscribe = subscribeToUserChats(user.uid, (userChats) => {
      console.log("Received chats:", userChats.length)
      setChats(userChats)
      setLoadingChats(false)

      // If there's a chatId in URL, auto-select that chat
      if (chatIdFromUrl && userChats.length > 0) {
        const targetChat = userChats.find((chat) => chat.id === chatIdFromUrl)
        if (targetChat?.id) {
          console.log("Auto-selecting chat from URL:", targetChat.id)
          handleChatSelect(targetChat.id)
        }
      }
    })

    return unsubscribe
  }, [user, chatIdFromUrl])

  // Handle chat selection - load messages only when a chat is selected
  const handleChatSelect = (id: string) => {
    console.log("Chat selected:", id)

    if(!id){
      return;
    }

    // Clean up previous messages subscription
    if (messagesUnsubscribeRef.current) {
      messagesUnsubscribeRef.current()
      messagesUnsubscribeRef.current = null
    }

    // setSelectedChat(chat)
    setShowMessage(true)
    setMessages(null) // Clear previous messages
    setLoadingMessages(true)

    // Subscribe to messages for the selected chat
    const unsubscribe = subscribeToChatMessages(id, (chatMessages) => {
      // console.log("Received messages for chat", chat.id, ":", chatMessages.length);
      setMessages(chatMessages)
      setLoadingMessages(false)

      // Mark messages as read
      // if (user) {
      //   markMessagesAsRead(chat.id, user.uid)
      // }
    })

    messagesUnsubscribeRef.current = unsubscribe
  }

  // Clean up messages subscription when component unmounts
  useEffect(() => {
    return () => {
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current()
      }
    }
  }, [])


  const groupedMessages = messages?.messages.reduce((groups: any, message) => {
    const date = new Date(message.timeStamp)
    const dateKey = format(date, "yyyy-MM-dd")
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(message)
    return groups
  }, {})

  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    const messageText = newMessage.trim();
    if (!messageText || !messages || !user) {
      return;
    }

    try {
      setSendingMessage(true);

      // Determine receiver ID
      // const receiverId = selectedChat.buyerId === user.uid ? selectedChat.sellerId : selectedChat.buyerId
      const receiverId = getOtherUserId(messages, user.uid);

      if(!receiverId){
        return;
      }

      // Get user display name
      const displayName = user.displayName || "Anonymous"

      // console.log("Sending message to chat:", selectedChat.id)

      await sendMessage(
        messages.chatId,
        user.uid,
        displayName,
        newMessage,
        receiverId,
        messages.participants[user.uid].image,
        messages.productData.productName,
        messages.participants[receiverId].name,
        messages.participants[receiverId].image,
        messages.productData.productId,
        messages.productData.productImage, 
        messages.productData.productPrice, 
      )


      setNewMessage("")
      console.log("Message sent successfully")
    } catch (error) {
      console.error("Error sending message:", error)
      // alert(`Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`)
      showToast("Failed to send message","error");
    } finally {
      setSendingMessage(false)
    }
  }

  const getOtherUserInfo = (chat: ChatMessage | ChatListDataType | null) => {
    if (!user) return { name: "Unknown", avatar: "/placeholder.svg?height=40&width=40" }
    if (!chat) return { name: "Unknown", avatar: "/placeholder.svg?height=40&width=40" }
    
    if(Object.keys(chat.participants)[0] === user.uid){
      const otherUserId = Object.keys(chat.participants)[1];
      return {
        name: chat.participants[otherUserId].name || "Unknown Seller",
        avatar: chat.participants[otherUserId].image || "/placeholder.svg?height=40&width=40",
      }
    } else {
      const otherUserId = Object.keys(chat.participants)[0];
      return {
        name: chat.participants[otherUserId].name || "Unknown Seller",
        avatar: chat.participants[otherUserId].image || "/placeholder.svg?height=40&width=40",
      }
    }
  }

  const filteredChats = chats.filter((chat) => {
    const otherUser = getOtherUserInfo(chat)
    // const otherUser = getOtherUserInfo(chat)
    return (
      otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.productName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (!user) {
    return (
      <main className="min-h-screen">
        <nav className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="container flex items-center justify-between h-16 px-4 mx-auto">
            <Link href="/" className="text-xl font-bold">
              Sell Ghana
            </Link>
            <Link href="/signin" className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800">
              Sign In
            </Link>
          </div>
        </nav>
        <div className="container px-4 py-8 mx-auto text-center">
          <h1 className="mb-4 text-2xl font-bold">Please sign in to view your messages</h1>
          <Link href="/signin" className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800">
            Sign In
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="h-[100vh] flex flex-col justify-between lg:block lg:min-h-screen w-screen lg:w-auto">
      {/* Navbar */}
      <nav className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container flex items-center justify-between w-full h-16 px-4 mx-auto">
          <Link href="/" className="text-xl font-bold">
            Sell Ghana
          </Link>
        </div>
      </nav>

      <div className="h-[calc(100vh-119px)] bg-red-400">
        
      </div>
      
      <div className="h-[55px] lg:hidden w-full flex border-t border-slate-200">
        <button onClick={() => {setShowMessage(false)}} className={`flex-1 h-full flex items-center justify-center ${showMessage ? 'text-slate-500' : 'bg-purple-300 text-white'}`}>
          <MenuIcon className=""></MenuIcon>
        </button>
        <button onClick={() => {setShowMessage(true)}} className={`flex-1 h-full flex items-center justify-center ${showMessage ? 'bg-purple-300 text-white' : 'text-slate-500'}`}>
          <MessageCircle className=""></MessageCircle>
        </button>
      </div>

    </main>
  )
}
