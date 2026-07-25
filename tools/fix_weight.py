import re

with open('src/features/progress/services/weightService.ts', 'r') as f:
    content = f.read()

# Import queryClient
if "import { queryClient }" not in content:
    content = "import { queryClient } from '@/app/query/queryClient';\n" + content

old_add = """  async addWeightLog(logData: Omit<DbWeightLog, 'id' | 'user_id' | 'body_fat'>, measurementsUpdated: boolean = false): Promise<DbWeightLog | null> {
    const userId = await authService.getUserId();
    const profile = await profileService.getProfile();"""

new_add = """  async addWeightLog(logData: Omit<DbWeightLog, 'id' | 'user_id' | 'body_fat'>, measurementsUpdated: boolean = false): Promise<DbWeightLog | null> {
    const userId = await authService.getUserId();
    let profile = queryClient.getQueryData<any>(['profile']);
    if (!profile) profile = await queryClient.fetchQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });"""
    
content = content.replace(old_add, new_add)

with open('src/features/progress/services/weightService.ts', 'w') as f:
    f.write(content)
