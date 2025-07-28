export const getFirstThreeLetters = (input: string | null) => {
    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return '000';
    }
  
    return input.trim().slice(0, 3).toLowerCase();
  };

  export function getPostedTimeFromFirestore(timestamp: any): string {
    if (!timestamp || typeof timestamp.toDate !== "function") return "posted some time ago";
  
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds
  
    if (diff < 60) return "posted just now";
    if (diff < 3600) return `posted ${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `posted ${Math.floor(diff / 3600)} hours ago`;
    if (diff < 2592000) return `posted ${(Math.floor(diff / 86400) === 1) ? "1 day ago" : `${Math.floor(diff / 86400)} days ago`}`;
    if (diff < 31536000) return `posted ${Math.floor(diff / 2592000)} months ago`;
    return `posted ${Math.floor(diff / 31536000)} years ago`;
  }