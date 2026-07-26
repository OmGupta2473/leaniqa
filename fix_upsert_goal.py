import re

with open('src/features/profile/services/profileService.ts', 'r') as f:
    content = f.read()

old_error_block_goal = """      if (error && error.code !== 'PGRST116') {
        console.error('upsertGoal error:', error);
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: `Failed to upsert goal: ${error.message} (code: ${error.code})`,
          retryable: true,
          status: 500,
          details: error,
        });
      }"""

new_error_block_goal = """      if (error && error.code !== 'PGRST116') {
        console.error('upsertGoal error:', error);
        
        if (error.code === '23503' && error.message.includes('goals_user_id_fkey')) {
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
          message: `Failed to upsert goal: ${error.message} (code: ${error.code})`,
          retryable: true,
          status: 500,
          details: error,
        });
      }"""

if old_error_block_goal in content:
    content = content.replace(old_error_block_goal, new_error_block_goal)
    print("Replaced goal!")
else:
    print("Goal not found.")

with open('src/features/profile/services/profileService.ts', 'w') as f:
    f.write(content)
