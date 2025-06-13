export interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  tag?: string
  condition?: "Brand New" | "Slightly Used" | "Used"
  location?: string
  date?: string
}

export const products: Product[] = [
  {
    id: "1",
    name: "Classic White T-Shirt",
    price: 29.99,
    description: "A comfortable and versatile white t-shirt made from 100% organic cotton. Perfect for everyday wear.",
    image: "/placeholder.svg?height=400&width=400",
    tag: "New",
    condition: "Brand New",
    location: "Accra, Ghana",
  },
  {
    id: "2",
    name: "Slim Fit Jeans",
    price: 59.99,
    description: "Modern slim fit jeans with a comfortable stretch. Made with sustainable denim.",
    image: "/placeholder.svg?height=400&width=400",
    condition: "Brand New",
    location: "Kumasi, Ghana",
  },
  {
    id: "3",
    name: "Leather Sneakers",
    price: 89.99,
    description: "Minimalist leather sneakers that go with everything. Features cushioned insoles for all-day comfort.",
    image: "/placeholder.svg?height=400&width=400",
    tag: "Sale",
    condition: "Slightly Used",
    location: "Tema, Ghana",
  },
  {
    id: "4",
    name: "Wool Blend Sweater",
    price: 79.99,
    description: "A warm and cozy sweater perfect for colder days. Made from a premium wool blend.",
    image: "/placeholder.svg?height=400&width=400",
    condition: "Used",
    location: "Cape Coast, Ghana",
  },
  {
    id: "5",
    name: "Canvas Backpack",
    price: 49.99,
    description: "Durable canvas backpack with multiple compartments. Perfect for daily use or weekend trips.",
    image: "/placeholder.svg?height=400&width=400",
    condition: "Brand New",
    location: "Tamale, Ghana",
  },
  {
    id: "6",
    name: "Aviator Sunglasses",
    price: 129.99,
    description: "Classic aviator sunglasses with UV protection. Lightweight metal frame with adjustable nose pads.",
    image: "/placeholder.svg?height=400&width=400",
    tag: "Trending",
    condition: "Brand New",
    location: "Accra, Ghana",
  },
  {
    id: "7",
    name: "Leather Watch",
    price: 199.99,
    description: "Elegant leather watch with a minimalist design. Features Japanese quartz movement.",
    image: "/placeholder.svg?height=400&width=400",
    condition: "Slightly Used",
    location: "Kumasi, Ghana",
  },
  {
    id: "8",
    name: "Hooded Jacket",
    price: 119.99,
    description: "Lightweight and water-resistant jacket with hood. Perfect for unpredictable weather.",
    image: "/placeholder.svg?height=400&width=400",
    tag: "Trending",
    condition: "Used",
    location: "Takoradi, Ghana",
  },
]
