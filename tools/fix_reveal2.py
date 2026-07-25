with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

old_reveal = """function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {"""
new_reveal = """function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {"""

old_motion = """  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}"""
new_motion = """  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}"""

if old_reveal in content:
    content = content.replace(old_reveal, new_reveal)
    content = content.replace(old_motion, new_motion)
    with open('src/LandingPage.tsx', 'w') as f:
        f.write(content)
    print("Patched Reveal definition")
else:
    print("Could not find Reveal definition")
