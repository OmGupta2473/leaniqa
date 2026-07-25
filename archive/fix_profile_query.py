import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

# Remove the existing profile query and queryClient
old_query_block = """  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileService.getProfile() });

  useEffect(() => {
    if (profile?.id) {
      initializeSession(profile.id);
    }
  }, [profile?.id, initializeSession]);"""

new_query_block = ""

if old_query_block in content:
    content = content.replace(old_query_block, new_query_block)
else:
    print("Warning: old query block not found")

# Insert it right before isToday
insert_pattern = """  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const isToday = (d: Date) => {"""

new_insert = """  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileService.getProfile() });

  useEffect(() => {
    if (profile?.id) {
      initializeSession(profile.id);
    }
  }, [profile?.id, initializeSession]);

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const isToday = (d: Date) => {"""

content = content.replace(insert_pattern, new_insert)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)
