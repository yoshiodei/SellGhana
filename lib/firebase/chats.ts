import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore"
import { db } from "./firebase"

interface messageDataType {
  text: string,
  timeStamp: any,
  senderId: string,
}

export interface ChatMessage {
  chatId: string
  participants: {
    [id: string]: {
      name: string,
      image: string,
    }
  }
  productData: {
    productId: string,
    productImage: string,
    productPrice: string | number,
    productName: string,
  }
  messages: messageDataType[]
}

export interface ChatListDataType {
  id?: string
  timeStamp: any
  productName: string
  message: {
    senderId: string,
    text: string,
  }
  participants: {
    [id: string]: {
      name: string
      id: string
      image: string
    }
  }
  unreadCount: {
    [id: string]: number
  }
}

// // Create a new chat or get existing chat for a product
// export const createOrGetChat = async (
//   productId: string,
//   productName: string,
//   productPrice: number,
//   productImage: string,
//   buyerId: string,
//   buyerName: string,
//   sellerId: string,
//   sellerName: string,
//   buyerAvatar?: string,
//   sellerAvatar?: string,
// ): Promise<string> => {
//   try {
//     // Validate that buyer and seller are different
//     if (buyerId === sellerId) {
//       throw new Error("Cannot create chat with yourself")
//     }

//     // Check if chat already exists between these users for this specific product
//     const chatsQuery = query(
//       collection(db, "chatList"),
//       where("productId", "==", productId),
//       where("buyerId", "==", buyerId),
//       where("sellerId", "==", sellerId),
//     )

//     const existingChats = await getDocs(chatsQuery)

//     if (!existingChats.empty) {
//       // Return existing chat ID for this product
//       console.log("Found existing chat for product:", productId)
//       return existingChats.docs[0].id
//     }

//     // Create new chat for this specific product
//     const chatData: Omit<Chat, "id"> = {
//       productId,
//       productName: productName || "Unknown Product",
//       productPrice: productPrice || 0,
//       productImage: productImage || "/user_placeholder.png",
//       buyerId,
//       buyerName: buyerName || "Anonymous Buyer",
//       buyerAvatar,
//       sellerId,
//       sellerName: sellerName || "Anonymous Seller",
//       sellerAvatar,
//       lastMessage: "",
//       lastMessageTime: serverTimestamp(),
//       unreadCount: {
//         [buyerId]: 0,
//         [sellerId]: 0,
//       },
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//     }

//     console.log("Creating new chat for product:", productId)
//     const chatRef = await addDoc(collection(db, "chatList"), chatData)
//     return chatRef.id
//   } catch (error) {
//     console.error("Error creating/getting chat:", error)
//     throw new Error(`Failed to create chat: ${error instanceof Error ? error.message : "Unknown error"}`)
//   }
// }

// Send a message in a chat
export const sendMessage = async (
  chatId: string,
  senderId: string,
  senderName: string,
  text: string,
  receiverId: string,
  senderAvatar: string,
  productName: string,
  receiverName: string,
  receiverAvatar: string,
  productId: string,
  productImage: string,
  productPrice: string | number
): Promise<void> => {
  try {
    // Validate parameters
    if (!chatId || !senderId || !text.trim() || !receiverId || !senderName || !productName || !receiverName || !productId || !productPrice) {
      throw new Error("Missing required parameters for sending message")
    }

    if (senderId === receiverId) {
      throw new Error("Cannot send message to yourself")
    }

    // Update chat with last message and increment unread count
    const chatRef = doc(db, "chatList", chatId)
    const chatDoc = await getDoc(chatRef)

    if (chatDoc.exists()) {
      const chatData = chatDoc.data() as ChatListDataType
      const newUnreadCount = { ...chatData.unreadCount }
      newUnreadCount[receiverId] = (newUnreadCount[receiverId] || 0) + 1

      await updateDoc(chatRef, {
        message: {
          text: text.trim(),
          senderId,
        },
        unreadCount: newUnreadCount,
        timeStamp: serverTimestamp(),
      });

      console.log("Updated chat with last message");

    } else {
      // creating new chatList
      const newChatListData = {
        chatId,
        timeStamp: serverTimestamp(),
        productName,
        message: {
          senderId,
          text: text.trim(),
        },
        participants: {
          [senderId]:{
            name: senderName,
            senderAvatar,
          },
          [receiverId]:{
            name: receiverName,
            receiverAvatar,
          }
        },
        unreadCount: {
          [receiverId]: 1,
          [senderId]: 0,
        }
      }

      console.log("new chat list data", newChatListData);
     
      await setDoc(doc(db, "chatList", chatId), newChatListData);
    }

    const messagesRef = doc(db, "messages", chatId);
    const messagesDoc = await getDoc(messagesRef);

    if (messagesDoc.exists()) {
      const messagesData = messagesDoc.data() as ChatMessage
      const newMessage = { text, timeStamp: Date.now(), senderId };
      const messagesList = [ ...messagesData.messages, newMessage ];

      await updateDoc(messagesRef, {
        messages: messagesList
      })

      console.log("Updated chat with last message")

    } else {
      // creating new chatList
      const newMessagesData = {
        chatId,
        participants: {
          [senderId]:{
            name: senderName,
            senderAvatar,
          },
          [receiverId]:{
            name: receiverName,
            receiverAvatar,
          }
        },
        productData:{
          productId,
          productPrice,
          productName,
          productImage,
        },
        messages: [
          {
            text, 
            timeStamp: Date.now(),
            senderId,
          }
        ]
      }

      console.log("new messages data", newMessagesData);
      await setDoc(doc(db, "messages", chatId), newMessagesData);
    }
  } catch (error) {
    console.error("Error sending message:", error)
    throw new Error(`Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Get chats for a user (only return chat list, not messages)
// export const getUserChats = async (userId: string): Promise<Chat[]> => {
//   try {
//     if (!userId) {
//       throw new Error("User ID is required")
//     }

//     // Get chats where user is buyer
//     const buyerChatsQuery = query(collection(db, "chatList"), where("buyerId", "==", userId), orderBy("updatedAt", "desc"))

//     // Get chats where user is seller
//     const sellerChatsQuery = query(
//       collection(db, "chatList"),
//       where("sellerId", "==", userId),
//       orderBy("updatedAt", "desc"),
//     )

//     const [buyerChats, sellerChats] = await Promise.all([getDocs(buyerChatsQuery), getDocs(sellerChatsQuery)])

//     const allChats: Chat[] = []

//     // Add buyer chats
//     buyerChats.docs.forEach((doc) => {
//       allChats.push({ id: doc.id, ...doc.data() } as Chat)
//     })

//     // Add seller chats (avoid duplicates)
//     sellerChats.docs.forEach((doc) => {
//       const chatData = { id: doc.id, ...doc.data() } as Chat
//       if (!allChats.find((chat) => chat.id === chatData.id)) {
//         allChats.push(chatData)
//       }
//     })

//     // Sort by last message time
//     return allChats.sort((a, b) => {
//       const aTime = a.lastMessageTime?.toDate() || new Date(0)
//       const bTime = b.lastMessageTime?.toDate() || new Date(0)
//       return bTime.getTime() - aTime.getTime()
//     })
//   } catch (error) {
//     console.error("Error getting user chats:", error)
//     return []
//   }
// }

// // Get messages for a specific chat
// export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
//   try {
//     if (!chatId) {
//       throw new Error("Chat ID is required")
//     }

//     const messagesQuery = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("timestamp", "asc"))

//     const messagesSnapshot = await getDocs(messagesQuery)
//     return messagesSnapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     })) as ChatMessage[]
//   } catch (error) {
//     console.error("Error getting chat messages:", error)
//     return []
//   }
// }

// // Subscribe to chat messages for a specific chat
export const subscribeToChatMessages = (chatId: string, callback: (messages: ChatMessage|null) => void): (() => void) => {
  if (!chatId) {
    console.error("Chat ID is required for subscription")
    return () => {}
  }

  return onSnapshot(
    doc(db, "messages", chatId), 
    (doc) => {
      console.log("Current data: ", doc.data());
      const messageData = doc.data() as ChatMessage;
      callback(messageData);
    },
    (error) => {
      console.error("Error in user chats subscription:", error)
      callback(null)
    },
  );

  
}

// // Subscribe to user chats (only chat list, not messages)
export const subscribeToUserChats = (userId: string, callback: (chats: ChatListDataType[]) => void): (() => void) => {
  if (!userId) {
    console.error("User ID is required for subscription")
    return () => {}
  }
  
  // Subscribe to all chats and filter on client side for simplicity
  const chatsQuery = query(collection(db, "chatList"), orderBy("timeStamp", "desc"))

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const allChats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatListDataType[]

      const userChats = allChats.filter((chat) => chat.participants[userId])
      
      console.log("Chats subscription update for user", userId, ":", userChats.length)
      callback(userChats)
    },
    (error) => {
      console.error("Error in user chats subscription:", error)
      callback([])
    },
  )
}

// // Mark messages as read
// export const markMessagesAsRead = async (chatId: string, userId: string): Promise<void> => {
//   try {
//     if (!chatId || !userId) {
//       throw new Error("Chat ID and User ID are required")
//     }

//     // Update chat unread count
//     const chatRef = doc(db, "chatList", chatId)
//     const chatDoc = await getDoc(chatRef)

//     if (chatDoc.exists()) {
//       const chatData = chatDoc.data() as Chat
//       const newUnreadCount = { ...chatData.unreadCount }
//       newUnreadCount[userId] = 0

//       await updateDoc(chatRef, {
//         unreadCount: newUnreadCount,
//       })
//     }

//     // Mark individual messages as read
//     const messagesQuery = query(
//       collection(db, "messages"),
//       where("chatId", "==", chatId),
//       where("senderId", "!=", userId),
//       where("read", "==", false),
//     )

//     const unreadMessages = await getDocs(messagesQuery)
//     const updatePromises = unreadMessages.docs.map((messageDoc) =>
//       updateDoc(doc(db, "messages", messageDoc.id), { read: true }),
//     )

//     await Promise.all(updatePromises)
//   } catch (error) {
//     console.error("Error marking messages as read:", error)
//   }
// }

export const generateChatId = (senderId: string, vendorId: string, productId: string) => {
  const chatId = (senderId > vendorId) ? `${productId}${senderId}${vendorId}` : `${productId}${vendorId}${senderId}`
  return chatId;
}

export const getOtherUserId = (obj: ChatMessage, myId: string): string | null => {
  const participantIds = Object.keys(obj.participants);
  const otherId = participantIds.find(id => id !== myId);
  return otherId || null;
}

