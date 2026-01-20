import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Check if the current user has admin role
 * Requires user to have { "role": "admin" } in their Clerk public metadata
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();
    
    if (!userId) return false;
    
    // Fetch the full user object to get public metadata
    const user = await currentUser();
    
    if (!user) return false;
    
    // Check public metadata for admin role
    const role = user.publicMetadata?.role as string | undefined;
    return role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get the current user's ID if authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch {
    return null;
  }
}
