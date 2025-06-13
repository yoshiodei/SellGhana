export const getFirstThreeLetters = (input: string) => {
    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return '000';
    }
  
    return input.trim().slice(0, 3).toLowerCase();
  };