"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, Filter, MessageCircle, Banknote, Search, ShoppingBag, User, X } from "lucide-react"
import ProductCard from "@/components/product-card"
import { products } from "@/lib/products"
import { ghanaRegions } from "@/lib/ghana-regions"
import NavBar from "@/components/nav-bar"
import { useRouter } from 'next/navigation';
import { fetchJobList, fetchProductsByCategory } from "@/utils/dataFetch"
import { showToast } from "@/utils/showToast"
import { FirebaseProduct } from "@/lib/firebase/firestore"

export default function CategoryPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [condition, setCondition] = useState("");
  const [categoryName, setCategoryName] = useState("All");
  const [allProducts, setAllProducts] = useState<FirebaseProduct[]>([]);
  const [allJobs, setAllJobs] = useState<any>();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState<FirebaseProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  const fetchData = async (type: string) => {
    try {
      setLoading(true);
      const jobs  = await fetchJobList(type);
      setAllJobs(jobs);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      showToast("Unable to fetch data. Please try again later.", "error")
      console.error("Error fetching products:", err);
    }
  }

  const initialFilterState = {
    priceMin: "",
    priceMax: "",
    condition: "all",
    region: "all",
    suburb: "all",
  }

  const [filters, setFilters] = useState(initialFilterState);

  const handleApplyFilters = () => {
    let filtered = [...allProducts];

    if(Number(filters.priceMax) < Number(filters.priceMin)){
      showToast("Min Price cannot be greater than Max Price", "error");
      return;
    }

    if (filters.priceMin)
        filtered = filtered.filter((p) => p.price >= Number(filters.priceMin));
    if (filters.priceMax)
        filtered = filtered.filter((p) => p.price <= Number(filters.priceMax));
    if (filters.condition !== "all" && filters.condition)
        filtered = filtered.filter((p) => p.condition === filters.condition);
    if (filters.region !== "all" && filters.region)
      filtered = filtered.filter((p) => p.location?.region === filters.region);
    if (filters.suburb !== "all" && filters.suburb)
      filtered = filtered.filter((p) => p.location?.suburb === filters.suburb);

    setSearchTerm("");
    setFilteredProducts(filtered);
  };

  useEffect(
    () => {
      fetchData(categoryName);
  }, [categoryName]);

  const handleSearch = () => {
    const search = searchTerm.toLowerCase();
    const filtered = allProducts.filter((product) =>
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search)
    );
    setFilteredProducts(filtered);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <NavBar />

      {/* Hero Section */}
      <section 
        className="bg-cover bg-center relative h-[250px] bg-gray-100"
        style={{ backgroundImage: "url('/pattern_bg.jpg')" }}
      >
        <div className="container flex flex-col items-center justify-center h-full px-4 mx-auto text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Jobs Listing</h1>
          <p className="text-lg text-gray-600">Discover what people are working on or hiring for right now.</p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-6 bg-white border-b">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="What are you looking to buy"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button onClick={handleSearch} className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-700 bg-gray-100 border-l border-gray-300 rounded-r-md hover:bg-gray-200">
                <Search className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 space-x-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Filter Form */}
          {showFilters && (
            <div className="p-4 mt-4 border border-gray-300 rounded-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Filter Products</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Price Range */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Price Range</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      min={0}
                      value={filters.priceMin}
                      onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      min={0}
                      value={filters.priceMax}
                      onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Condition</label>
                  <select
                    value={filters.condition}
                    onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">All Conditions</option>
                    <option value="brand-new">Brand New</option>
                    <option value="slightly-used">Slightly Used</option>
                    <option value="used">Used</option>
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Region</label>
                  <select
                    value={filters.region}
                    onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">All Regions</option>
                    {Object.keys(ghanaRegions).map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Suburb */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Suburb</label>
                  <select
                    disabled={!selectedRegion}
                    value={filters.suburb}
                    onChange={(e) => setFilters({ ...filters, suburb: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="all">{selectedRegion ? `All in ${selectedRegion}` : "Select a region first"}</option>
                    {selectedRegion &&
                      ghanaRegions[selectedRegion]?.map((suburb) => (
                        <option key={suburb} value={suburb}>
                          {suburb}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                <button 
                  onClick={() => setFilters(initialFilterState) }
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Reset
                </button>
                <button onClick={handleApplyFilters} className="px-4 py-2 text-white bg-primary rounded-md hover:bg-primary-light">Apply Filters</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-6 bg-white">
        <div className="container px-4 mx-auto">
          <div className="flex overflow-x-auto pb-2 space-x-2 hide-scrollbar">
            {[
              "All",
              'Jobs',
              'Services'
            ].map((category) => (
              <button
                key={category}
                onClick={() => { setCategoryName(category) }}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border rounded-md ${
                  categoryName === category || (category === "All" && categoryName === "All")
                    ? "bg-primary-light text-white border-black"
                    : "text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}

        { loading ? (
            <section className="py-8 bg-gray-50 flex-1">
            <div className="container px-4 mx-auto">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg aspect-square"></div>
                  <div className="h-4 mt-3 bg-gray-200 rounded"></div>
                  <div className="h-4 mt-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
              </div>
            </div>
          </section>
          ) : (    
        <section className="py-8 bg-gray-50 flex-1">
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{filteredProducts.length} Jobs/Services</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {
            filteredJobs.length === 0 ? (
            [1,2,3].map((product) => (
              <button className="hover:bg-slate-100 border border-slate-400 rounded-lg p-2 flex flex-col w-full gap-y-2">
                <div className="w-full">
                  <div className="flex flex justify-between items-center w-full">
                    <div className="h-[40px] flex items-center">
                      <div className="me-[7px] w-[40px] h-[40px] rounded-full bg-slate-300 border border-slate-500"></div>
                      <p className="text-[0.85em] truncate">Some Company</p>
                    </div>
                    <p className="text-[0.72em] text-slate-500">Posted 6 days ago</p>
                  </div>
                </div>
                <h5 className="text-[1em] text-left font-bold text-slate-700">Some Job/Service Title</h5>
                <div className="flex flex-wrap gap-2">
                  {["Part-Time","Full-Time","Contract","On-Site"].map((type) => (
                    <div className="font-semibold p-1 bg-slate-300 text-slate-500 rounded text-[0.75em]">{type}</div>
                  ))}
                </div>
                <div className="flex gap-2 items-center text-slate-600">
                  <Banknote />
                  <p className="text-[0.95em] font-semibold">Ghc 700 - Ghc 1200</p>
                </div>
              </button>
            ))) :
            (<p>No Jobs/Services found.</p>)
            }
          </div>
        </div>
      </section>)}

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-4 text-lg font-bold">ShopNow</h3>
              <p className="text-gray-400">Your one-stop shop for all your needs.</p>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-bold">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 mt-8 text-center text-gray-400 border-t border-gray-800">
            &copy; {new Date().getFullYear()} ShopNow. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
