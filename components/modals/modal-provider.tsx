"use client"

import { useEffect, useState } from "react"
import ShareModal from "./share-modal"
import ReportModal from "./report-modal"
import DeleteProductModal from "./delete-product-modal"

export default function ModalProvider() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <>
      <ShareModal />
      <ReportModal />
      <DeleteProductModal />
    </>
  )
}
