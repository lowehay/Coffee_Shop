import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to conditionally join class names together.
 * 
 * @param {...any} inputs - Class names to be merged.
 * @returns {string} - Merged class names.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}