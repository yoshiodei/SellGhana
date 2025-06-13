import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface Notification {
  id: string
  type: "message" | "offer" | "system" | "wishlist" | "sale"
  title: string
  description: string
  time: string
  read: boolean
  image: string
  link: string
}

interface NotificationsState {
  items: Notification[]
}

// Sample notification data
const initialState: NotificationsState = {
  items: [
    {
      id: "1",
      type: "message",
      title: "New message from John Doe",
      description: "Hey, is this still available?",
      time: "5 minutes ago",
      read: false,
      image: "/placeholder.svg?height=40&width=40",
      link: "/chat",
    },
    {
      id: "2",
      type: "offer",
      title: "New offer on your product",
      description: "Someone offered GH₵200 for your laptop",
      time: "2 hours ago",
      read: false,
      image: "/placeholder.svg?height=40&width=40",
      link: "/product/3",
    },
    {
      id: "3",
      type: "system",
      title: "Welcome to Sell Ghana!",
      description: "Thank you for joining our marketplace.",
      time: "1 day ago",
      read: true,
      image: "/placeholder.svg?height=40&width=40",
      link: "/",
    },
    {
      id: "4",
      type: "wishlist",
      title: "Price drop alert",
      description: "A product in your wishlist is now 15% off",
      time: "2 days ago",
      read: true,
      image: "/placeholder.svg?height=40&width=40",
      link: "/wishlist",
    },
    {
      id: "5",
      type: "sale",
      title: "Your item was sold!",
      description: "Your iPhone 12 has been purchased",
      time: "3 days ago",
      read: true,
      image: "/placeholder.svg?height=40&width=40",
      link: "/profile",
    },
  ],
}

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((item) => item.id === action.payload)
      if (notification) {
        notification.read = true
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((notification) => {
        notification.read = true
      })
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload)
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
  },
})

export const { markAsRead, markAllAsRead, addNotification, removeNotification } = notificationsSlice.actions
export default notificationsSlice.reducer
