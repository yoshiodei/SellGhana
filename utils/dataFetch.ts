import { db } from "@/lib/firebase/firebase";
import { FirebaseProduct } from "@/lib/firebase/firestore";
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from "firebase/firestore";

export const fetchProductsByCategory = async (category: string) => {
    
    const validCategories = [
      'electronics',
      'vehicles',
      'books',
      'gaming',
      'furniture',
      'jobs',
      'home',
      'property',
      'fashion',
    ];

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    let q;
    
    if(validCategories.includes(category)){
      q = query(
        collection(db, "productListing"),
        where("category", "==", category)
        );
    }
    else if(!validCategories.includes(category) && category === "new"){
      q = query(
        collection(db, "productListing"),
        where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo)),
        where("createdAt", "<=", Timestamp.fromDate(now))
      )
    }
    else {
      q = collection(db, "productListing")
    }
  
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({
      //   id: doc.id,
      ...doc.data(),
    })) as FirebaseProduct[]
  
    return products;
  };


   export const fetchJobList = async (type: string) => {
      const validCategories = ['Services', 'Jobs'];

      let q;
    
      if(validCategories.includes(type)){
        q = query(
          collection(db, "jobListing"),
          where("category", "==", type.toLowerCase())
        );
      } else  {
        q = collection(db, "jobListing")
      }

      const querySnapshot = await getDocs(q);
      const jobs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
      }))
    
      return jobs;
   }
  

  // returns date in format eg. May 22, 2025
  export const formatDate = (dateString: string): string | null => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
  
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  export const getUserListings = async (userId: string) => {
    const q = query(
      collection(db, "productListing"),
      where("vendor.uid", "==", userId)
    )
  
    const querySnapshot = await getDocs(q)
    const listings = querySnapshot.docs.map(doc => ({
      ...doc.data(),
    })) as FirebaseProduct[]
    
    console.log("Listingss:", listings);
    
    return listings
  }


  export const getUserData = async (userId: string) => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
      const data = docSnap.data();
      return data;
    } else {
      console.log("No such document!");
      return {
        name: 'Anonymous',
        location: 'Unknown',
        email: 'Unknown',
        phone: 'Unknown',
        image: "/placeholder.svg?height=96&width=96",
        createdAt: ''
      };
    }
  }