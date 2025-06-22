import type { LucideIcon } from "lucide-react"
import {
  Car,
  Home,
  Smartphone,
  Shirt,
  Sofa,
  Briefcase,
  Utensils,
  Gamepad2,
  Baby,
  Palette,
  BookOpen,
  Dumbbell,
  Leaf,
  Wrench,
  Building2,
  Gem,
} from "lucide-react"

import SoapDispenser from '@/components/icons/soap-dispenser-droplet.svg';

export interface Category {
  id: string
  name: string
  description: string
  icon: LucideIcon
  formType?: "vehicle" | "standard"
}

export const categories: Category[] = [
  {
    id: "vehicles",
    name: "Vehicles",
    description: "Cars, motorcycles, trucks, and other vehicles",
    icon: Car,
    formType: "vehicle",
  },
  {
    id: "property",
    name: "Property",
    description: "Houses, apartments, land, and commercial properties",
    icon: Home,
  },
  {
    id: "electronics",
    name: "Electronics",
    description: "Phones, computers, TVs, and other electronic devices",
    icon: Smartphone,
  },
  {
    id: "furniture",
    name: "Furniture",
    description: "Sofas, beds, tables, chairs, and other home furniture",
    icon: Sofa,
  },
  {
    id: "fashion",
    name: "Fashion",
    description: "Clothing, shoes, bags, and accessories",
    icon: Shirt,
  },
  {
    id: "cosmetics",
    name: "Cosmetics",
    description: "Soap, perfume, lotion, and makeup",
    icon: SoapDispenser,
  },
  {
    id: "jobs",
    name: "Jobs",
    description: "Job listings, employment opportunities, and services",
    icon: Briefcase,
  },
  // {
  //   id: "food",
  //   name: "Food & Agriculture",
  //   description: "Food items, agricultural products, and farming equipment",
  //   icon: Utensils,
  // },
  {
    id: "gaming",
    name: "Gaming",
    description: "Video games, consoles, and gaming accessories",
    icon: Gamepad2,
  },
  // {
  //   id: "baby",
  //   name: "Baby Products",
  //   description: "Baby clothes, toys, strollers, and other baby items",
  //   icon: Baby,
  // },
  // {
  //   id: "art",
  //   name: "Art & Collectibles",
  //   description: "Artwork, collectibles, antiques, and memorabilia",
  //   icon: Palette,
  // },
  {
    id: "books",
    name: "Books",
    // name: "Books & Media",
    description: "Books, magazines, music, movies, and other media",
    icon: BookOpen,
  },
  {
    id: "fitness",
    name: "Fitness",
    description: "Sports equipment, fitness gear, and outdoor activities",
    icon: Dumbbell,
  },
  // {
  //   id: "garden",
  //   name: "Garden & Outdoor",
  //   description: "Plants, gardening tools, outdoor furniture, and equipment",
  //   icon: Leaf,
  // },
  // {
  //   id: "tools",
  //   name: "Tools & Equipment",
  //   description: "Tools, machinery, and industrial equipment",
  //   icon: Wrench,
  // },
  // {
  //   id: "commercial",
  //   name: "Commercial Equipment",
  //   description: "Business and commercial equipment and supplies",
  //   icon: Building2,
  // },
  // {
  //   id: "jewelry",
  //   name: "Jewelry & Watches",
  //   description: "Jewelry, watches, and luxury accessories",
  //   icon: Gem,
  // },
]
