import { createContext } from "react";

/**
 * User context for auth state management
 * Separated from the provider for Fast Refresh compliance
 */
export const UserContext = createContext();
