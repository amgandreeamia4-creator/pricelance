import { cookies } from "next/headers";

// Replace this with your actual cookie name
const ADMIN_COOKIE_NAME = "admin-auth";

// This function checks if the admin cookie is set correctly
export async function isAdminRequestAuthenticated(): Promise<boolean> {
  // cookies() must be awaited in App Router
  const store = await cookies();

  // Get the token from the cookie store
  const token = store.get(ADMIN_COOKIE_NAME)?.value;

  // Return true if token matches expected admin value
  return token === "1";
}