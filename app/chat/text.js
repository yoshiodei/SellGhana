{/* Chat Interface */}
<div className="container px-0 mx-auto">
<div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)]">
  {/* Chat List */}
  <div className={`w-full max-w-full flex flex-col lg:border-r lg:max-w-sm lg:block ${showMessage ? "hidden" : ""}`}>
    <div className="p-4 border-b">
      <h2 className="mb-4 text-xl font-bold">Messages</h2>
      <div className="relative">
        <input
          type="text"
          placeholder="Search conversations"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
        />
        <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
      </div>
    </div>
    <div className="overflow-y-auto h-[calc(100vh-180px)] lg:h-[calc(100vh-180px)]">
      {loadingChats ? (
        <div className="p-4 text-center">Loading chats...</div>
      ) : filteredChats.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          {chats.length === 0 ? "No conversations yet" : "No matching conversations"}
        </div>
      ) : (
        filteredChats.map((chat) => {
          const otherUser = getOtherUserInfo(chat)
          console.log("other user name", otherUser.name);
          console.log("messages data", chat);
          
          const unreadCount = user ? chat.unreadCount[user.uid] || 0 : 0

          return (
            <div
              key={chat.id}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${
                messages?.chatId === chat.id ? "bg-blue-50 border-r-4 border-blue-500" : ""
              }`}
              onClick={() => { if(chat.id) handleChatSelect(chat.id)}}
            >
              <div className="relative mr-3">
                <div className="relative w-12 h-12 overflow-hidden rounded-full">
                  <Image
                    src={otherUser.avatar || "/placeholder.svg"}
                    alt={otherUser.name}
                    fill
                    className="object-cover"
                  />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{otherUser.name}</h3>
                <p className="text-sm text-blue-600 truncate font-medium">{chat.productName}</p>
                <p className="text-sm text-gray-500 truncate">{chat.message.senderId === user.uid ? `You: ${chat.message.text}` : chat.message.text}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">
                  {chat.timeStamp ? new Date(chat.timeStamp.toDate()).toLocaleDateString() : ""}
                </span>
              </div>
            </div>
          )
        })
      )}

    </div>
  </div>

  {/* Chat Messages Area */}
  <div className={`flex-1 lg:flex flex-col  ${showMessage ? "" : "hidden"}`}>
    {messages ? (
      <>
        {/* Chat Header */}
        <div className="border-b bg-white">
          {/* Product Info */}
          <div className="flex items-center p-4 bg-gray-50 border-b">
            <div className="relative w-12 h-12 mr-3 overflow-hidden rounded-lg">
              <Image
                src={messages.productData.productImage || "/placeholder.svg?height=48&width=48"}
                alt={messages.productData.productName}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{messages.productData.productName}</h3>
              <p className="text-lg font-bold text-green-600">GH₵{Number(messages.productData.productPrice).toFixed(2)}</p>
            </div>
            <Link
              href={`/product/${messages?.productData?.productId}`}
              className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
            >
              View Product
            </Link>
          </div>

          {/* Chat Partner */}
          <div className="flex items-center p-4">
            <div className="relative w-8 h-8 mr-3 overflow-hidden rounded-full">
              <Image
                src={getOtherUserInfo(messages).avatar || "/placeholder.svg"}
                alt={'hello word'}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {getOtherUserInfo(messages).name}
              </h3>
              <p className="text-xs text-gray-500">
                Chat about: 
                {messages.productData.productName}
                </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 h-[calc(100vh-360px)] lg:h-auto">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
                <p className="text-gray-500">Loading messages...</p>
              </div>
            </div>
          ) : 
          (
            <div className="space-y-6">
              {Object.entries(groupedMessages).map(([dateKey, dayMessages]: any) => {
                const dateLabel = (() => {
                  const date = new Date(dateKey)
                  if (isToday(date)) return "Today"
                  if (isYesterday(date)) return "Yesterday"
                  return format(date, "MMMM d, yyyy")
                })()
          
                return (
                  <div key={dateKey}>
                    {/* Date Header */}
                    <div className="text-center text-sm text-gray-500 my-4">{dateLabel}</div>
          
                    {/* Messages for this date */}
                    {dayMessages.map((message: any) => {
                      const isMe = message.senderId === user.uid
                      return (
                        <div
                          key={message.id || message.timeStamp}
                          className={`flex mb-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isMe
                                ? "bg-purple-500 text-white rounded-br-none"
                                : "bg-white text-gray-800 rounded-bl-none shadow-md"
                            }`}
                          >
                            <p className="break-words">{message.text}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className={`text-xs ${isMe ? "text-white" : "text-gray-500"}`}>
                                {message.timeStamp
                                  ? new Date(message.timeStamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Sending..."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
            )
          }
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <form 
            onSubmit={handleSendMessage} 
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message about ${messages.productData.productName}...`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sendingMessage}
            />
            <button
              type="submit"
              className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newMessage.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </>
    ) : (
      <div className="flex items-center justify-center h-full flex-1 bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">Select a conversation</h3>
          <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    )}

  </div>

  <div className="h-[55px] lg:hidden w-full flex border-t border-slate-200">
        <button onClick={() => {setShowMessage(false)}} className={`flex-1 h-full flex items-center justify-center ${showMessage ? 'text-slate-500' : 'bg-purple-300 text-white'}`}>
          <MenuIcon className=""></MenuIcon>
        </button>
        <button onClick={() => {setShowMessage(true)}} className={`flex-1 h-full flex items-center justify-center ${showMessage ? 'bg-purple-300 text-white' : 'text-slate-500'}`}>
          <MessageCircle className=""></MessageCircle>
        </button>
      </div>

</div>
</div>