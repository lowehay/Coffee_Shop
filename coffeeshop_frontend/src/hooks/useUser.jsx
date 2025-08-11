import { useContext } from "react";
import { UserContext } from "../context/UserContext.context";

/**
 * Custom hook to access the user context
 * @returns {Object} User context value
 */
export function useUser() {
  return useContext(UserContext);
}
