const fs = require('fs');

const fixFile = (path) => {
  let content = fs.readFileSync(path, 'utf8');

  // Change useCalculatedProfile(profile, goal) to useCalculatedProfile()
  content = content.replace(/const calculated = useCalculatedProfile\([^)]*\);/g, "const { profileData: calculated } = useCalculatedProfile();");

  fs.writeFileSync(path, content);
};

fixFile('src/features/profile/pages/ProfilePage.tsx');
fixFile('src/features/transformation/pages/TransformationPage.tsx');
