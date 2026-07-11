const fs = require('fs');

const profilePath = 'src/features/profile/pages/ProfilePage.tsx';
let profileContent = fs.readFileSync(profilePath, 'utf8');

profileContent = profileContent.replace(
  "import { useCalculatedProfile } from '../hooks/useCalculatedProfile';",
  "import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';"
);

profileContent = profileContent.replace(
  "mutationFn: () => profileService.resetProfile(),",
  "mutationFn: async () => {\n      await profileService.deleteGoal();\n      await profileService.deleteProfile();\n    },"
);

profileContent = profileContent.replace(
  "await authService.signOut();",
  "await authService.logout();"
);

fs.writeFileSync(profilePath, profileContent);

const transPath = 'src/features/transformation/pages/TransformationPage.tsx';
let transContent = fs.readFileSync(transPath, 'utf8');

transContent = transContent.replace(
  "import { useCalculatedProfile } from \"@/features/profile/hooks/useCalculatedProfile\";",
  "import { useCalculatedProfile } from \"@/shared/hooks/useCalculatedProfile\";"
);

fs.writeFileSync(transPath, transContent);
