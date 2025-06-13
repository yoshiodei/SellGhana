"use client"

import { useState } from "react"
import { Copy, Facebook, Instagram, Twitter, X } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { closeShareModal } from "@/lib/redux/slices/uiSlice"

export default function ShareModal() {
  const dispatch = useAppDispatch()
  const { shareModalOpen, currentProductUrl } = useAppSelector((state) => state.ui)
  const [copied, setCopied] = useState(false)

  if (!shareModalOpen) return null

  const handleCopyLink = () => {
    if (currentProductUrl) {
      navigator.clipboard.writeText(currentProductUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareUrl = currentProductUrl || window.location.href
  const encodedUrl = encodeURIComponent(shareUrl)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Share This Product</h2>
          <button onClick={() => dispatch(closeShareModal())} className="text-gray-500 hover:text-black">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-sm text-gray-600">Share via</p>
          <div className="flex space-x-4">
            <a
              href={`https://twitter.com/intent/tweet?url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              title="X"
              className="flex flex-col items-center justify-center w-16 h-16 p-3 text-white bg-black rounded-lg hover:bg-gray-800"
            >
              {/* <Twitter className="w-6 h-6" /> */}
              <svg xmlns="http://www.w3.org/2000/svg" role="img" className="w-6 h-6" fill="white" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
              {/* <span className="mt-1 text-xs">X</span> */}
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Facebook"
              className="flex flex-col items-center justify-center w-16 h-16 p-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Facebook className="w-6 h-6" />
              {/* <span className="mt-1 text-xs">Facebook</span> */}
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="flex flex-col items-center justify-center w-16 h-16 p-3 text-white bg-green-500 rounded-lg hover:bg-green-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              {/* <span className="mt-1 text-xs">WhatsApp</span> */}
            </a>
            <a
              href={`https://www.instagram.com/`}
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
              className="flex flex-col items-center justify-center w-16 h-16 p-3 text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-lg hover:opacity-90"
            >
              <Instagram className="w-6 h-6" />
              {/* <span className="mt-1 text-xs">Instagram</span> */}
            </a>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm text-gray-600">Or copy link</p>
          <div className="flex">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none bg-gray-50"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center px-4 py-2 text-white bg-primary rounded-r-md hover:bg-primary-light"
            >
              {copied ? "Copied!" : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
