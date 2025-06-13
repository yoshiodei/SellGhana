"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { closeReportModal } from "@/lib/redux/slices/uiSlice"
import { useAuth } from "@/lib/auth/context/AuthContext"
import { showToast } from "@/utils/showToast"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

const reportReasons = [
  "Prohibited item",
  "Counterfeit item",
  "Inappropriate content",
  "Misleading description",
  "Scam or fraud",
  "Wrong category",
  "Other",
]

export default function ReportModal() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { reportModalOpen, currentProductData } = useAppSelector((state) => state.ui)
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!reportModalOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try{

      const reportData = {
        reason,
        description,
        reporterData: {
          name: user?.displayName,
          id: user?.uid
        },
        reportedData: {
          name: currentProductData?.name,
          reportType: "product", // can either be product or user
          id: currentProductData?.id,
        },
        createdAt: new Date().toISOString(),
      }
    
      console.log("final modal data", reportData);

      setLoading(true);

      await addDoc(collection(db, "reportListing"), reportData);

      setSubmitted(true);
      setLoading(true);
    } catch (error) {
      setLoading(false);
      showToast("Error adding post","error");
      console.error('Error submitting listing:', error);
    }

    
    // setTimeout(() => {
    //   setSubmitted(false)
    //   setReason("")
    //   setDescription("")
    //   dispatch(closeReportModal())
    // }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Report This Item</h2>
          <button onClick={() => dispatch(closeReportModal())} className="text-gray-500 hover:text-black">
            <X className="w-6 h-6" />
          </button>
        </div>

        {submitted ? (
          <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-md">
            <p className="font-medium">Thank you for your report!</p>
            <p className="text-sm">We'll review this item and take appropriate action.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reason" className="block mb-1 text-sm font-medium text-gray-700">
                Reason for reporting
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select a reason</option>
                {reportReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
                Additional details
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Please provide more information about the issue"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => dispatch(closeReportModal())}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                disabled={loading}
                type="submit" 
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                {loading ? "...Submitting Report" : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
