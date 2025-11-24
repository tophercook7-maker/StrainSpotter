import { type User } from "@supabase/supabase-js";

/**
 * Check if a user is a founder based on email or metadata
 */
export function isFounderUser(user: User | null | undefined): boolean {
  if (!user) return false;

  const email = user.email?.toLowerCase() ?? "";

  // Primary founder email(s)
  if (email === "topher.cook7@gmail.com" || email === "strainspotter25@gmail.com") {
    return true;
  }

  // Optional: any other hard-coded founders
  // if (email === "andrewbeck209@gmail.com") return true;

  // Optional: if we encode founder role into user metadata:
  const metadata = (user as any).user_metadata || {};
  if (metadata.role === "founder" || metadata.isFounder === true) {
    return true;
  }

  return false;
}

