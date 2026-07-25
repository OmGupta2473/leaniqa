import re

with open("src/features/profile/services/profileService.ts", "r") as f:
    content = f.read()

old_update = """      if (error) {
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to update profile',
          retryable: true,
          status: 500,
          details: error,
        });
      }"""

new_update = """      if (error) {
        throw new AppError({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: `Failed to update profile: ${error.message} (code: ${error.code})`,
          retryable: true,
          status: 500,
          details: error,
        });
      }"""

content = content.replace(old_update, new_update)

with open("src/features/profile/services/profileService.ts", "w") as f:
    f.write(content)
