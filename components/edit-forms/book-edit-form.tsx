"use client"

import GeneralEditForm from "@/components/edit-forms/general-edit-form"





interface BookEditFormProps {
  product: any
}

export default function BookEditForm({ product }: BookEditFormProps) {
  // For now, use the general edit form
  // You can create a specific book edit form later with book-specific fields
//   return <GeneralEditForm product={product} />
// return <GeneralEditForm
return <GeneralEditForm product={product} />
}
