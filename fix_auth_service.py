import re

with open("src/features/auth/services/authService.ts", "r") as f:
    content = f.read()

old_auth = """export const authService = {
  async getUserId(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new AppError({
        code: ErrorCodes.UNAUTHORIZED,
        message: error.message,
        retryable: false,
        status: 401,
      });
    }

    if (session?.user) {
      return session.user.id;
    }
    
    throw new AppError({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Not authenticated',
      retryable: false,
      status: 401,
    });
  },"""

new_auth = """export const authService = {
  async getUserId(): Promise<string> {
    // First try to get the active session from local cache
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new AppError({
        code: ErrorCodes.UNAUTHORIZED,
        message: sessionError.message,
        retryable: false,
        status: 401,
      });
    }

    if (!session?.user) {
      throw new AppError({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Not authenticated',
        retryable: false,
        status: 401,
      });
    }
    
    // Check if the user is actually valid on the server
    // This catches cases where the user was manually deleted from the database
    // but the session token is still cached in local storage.
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('Local session exists but user is invalid on server. Logging out.');
      await supabase.auth.signOut();
      throw new AppError({
        code: ErrorCodes.UNAUTHORIZED,
        message: 'User session invalid or expired. Please log in again.',
        retryable: false,
        status: 401,
      });
    }

    return user.id;
  },"""

content = content.replace(old_auth, new_auth)

with open("src/features/auth/services/authService.ts", "w") as f:
    f.write(content)

