import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ToastContainer } from 'react-toastify';
import { ReduxProvider } from "@/lib/redux/provider"
import ModalProvider from "@/components/modals/modal-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sell Ghana - Buy and Sell in Ghana",
  description: "Ghana's marketplace for buying and selling anything",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          {children}
          <ModalProvider />
          <ToastContainer /> 
        </ReduxProvider>
      </body>
    </html>
  )
}
