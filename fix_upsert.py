import re

with open('src/features/profile/services/profileService.ts', 'r') as f:
    content = f.read()

old_error_block = """      if (error && error.code !== 'PGRST116') {
        console.error('upsertProfile error:', error);
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: `Failed to upsert profile: ${error.message} (code: ${error.code})`,
          retryable: true,
          status: 500,
          details: error,
        });
      }"""

new_error_block = """      if (error && error.code !== 'PGRST116') {
        console.error('upsertProfile error:', error);
        
        // If it's a foreign key violation on profiles_id_fkey, it means the user was deleted from the database
        // but the local session is still active. Force a logout.
        if (error.code === '23503' && error.message.includes('profiles_id_fkey')) {
          await authService.logout();
          window.location.href = '/login';
          throw new AppError({
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Your session has expired. Please log in again.',
            retryable: false,
            status: 401,
            details: error,
          });
        }
        
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: `Failed to upsert profile: ${error.message} (code: ${error.code})`,
          retryable: true,
          status: 500,
          details: error,
        });
      }"""

if old_error_block in content:
    content = content.replace(old_error_block, new_error_block)
    print("Replaced!")
else:
    print("Not found.")

with open('src/features/profile/services/profileService.ts', 'w') as f:
    f.write(content)
