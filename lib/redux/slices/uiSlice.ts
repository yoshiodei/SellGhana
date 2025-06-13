import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface ModalState {
  shareModalOpen: boolean
  reportModalOpen: boolean
  currentProductId: string | null
  currentProductUrl: string | null
  isDeleteProductModalOpen: boolean
  deleteProductData: { productId: string; productName: string; images?: string[] } | null
}

const initialState: ModalState = {
  shareModalOpen: false,
  reportModalOpen: false,
  currentProductId: null,
  currentProductUrl: null,
  isDeleteProductModalOpen: false,
  deleteProductData: null,
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openShareModal: (state, action: PayloadAction<{ productId: string; productUrl: string }>) => {
      state.shareModalOpen = true
      state.currentProductId = action.payload.productId
      state.currentProductUrl = action.payload.productUrl
    },
    closeShareModal: (state) => {
      state.shareModalOpen = false
    },
    openReportModal: (state, action: PayloadAction<string>) => {
      state.reportModalOpen = true
      state.currentProductId = action.payload
    },
    closeReportModal: (state) => {
      state.reportModalOpen = false
    },
    openDeleteProductModal: (
      state,
      action: PayloadAction<{ productId: string; productName: string; images?: string[] }>,
    ) => {
      state.isDeleteProductModalOpen = true
      state.deleteProductData = action.payload
    },
    closeDeleteProductModal: (state) => {
      state.isDeleteProductModalOpen = false
      state.deleteProductData = null
    },
  },
})

export const {
  openShareModal,
  closeShareModal,
  openReportModal,
  closeReportModal,
  openDeleteProductModal,
  closeDeleteProductModal,
} = uiSlice.actions
export default uiSlice.reducer
