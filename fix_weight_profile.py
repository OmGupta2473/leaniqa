import re

with open('src/features/progress/services/weightService.ts', 'r') as f:
    weight_content = f.read()

old_weight = """    const userId = await authService.getUserId();
    let profile = queryClient.getQueryData<any>(['profile']);
    if (!profile) profile = await queryClient.fetchQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });"""

new_weight = """    const [userId, profile] = await Promise.all([
      authService.getUserId(),
      queryClient.getQueryData<any>(['profile']) || queryClient.fetchQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() })
    ]);"""

weight_content = weight_content.replace(old_weight, new_weight)

with open('src/features/progress/services/weightService.ts', 'w') as f:
    f.write(weight_content)


with open('src/features/profile/services/profileService.ts', 'r') as f:
    profile_content = f.read()

old_profile = """    try {
      const userId = await authService.getUserId();
      const { data: { session } } = await supabase.auth.getSession();"""

new_profile = """    try {
      const [userId, { data: { session } }] = await Promise.all([
        authService.getUserId(),
        supabase.auth.getSession()
      ]);"""

profile_content = profile_content.replace(old_profile, new_profile)

with open('src/features/profile/services/profileService.ts', 'w') as f:
    f.write(profile_content)


with open('src/shared/services/waterService.ts', 'r') as f:
    water_content = f.read()

old_water = """  async addWater(amountMl: number): Promise<DbWaterLog | null> {
    const userId = await authService.getUserId();
    
    const previousTotalMl = await this.getTodaysWaterTotal();"""

new_water = """  async addWater(amountMl: number): Promise<DbWaterLog | null> {
    const [userId, previousTotalMl] = await Promise.all([
      authService.getUserId(),
      this.getTodaysWaterTotal()
    ]);"""

water_content = water_content.replace(old_water, new_water)

with open('src/shared/services/waterService.ts', 'w') as f:
    f.write(water_content)

