# Fix GoalSetterPage import
sed -i "s|import { useUserStore } from \"@/features/profile/store/userStore\";|import { useUserStore } from \"@/features/profile/store/userStore\";\nimport { useCalculatedProfile } from \"@/shared/hooks/useCalculatedProfile\";|" src/features/goal/pages/GoalSetterPage.tsx

# Fix target_weight in DbGoal
sed -i "s|  target_date?: string;|  target_date?: string;\n  target_weight?: number;|" src/shared/types/supabase.ts

