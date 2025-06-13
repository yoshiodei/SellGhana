"use client"

import GeneralEditForm from "./general-edit-form"

interface PropertyEditFormProps {
  product: any
}

export default function PropertyEditForm({ product }: PropertyEditFormProps) {
  // For now, use the general edit form
  // You can create a specific property edit form later with property-specific fields
  return <GeneralEditForm product={product} />
}
