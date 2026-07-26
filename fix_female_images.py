import re

with open('src/features/goal/pages/GoalSetterPage.tsx', 'r') as f:
    content = f.read()

# For Step 1
old_img_step1 = """                        <div className="aspect-[3/4] w-full bg-zinc-900 relative">
                          <img
                               src={imgSrc}
                               alt={`${gender} Physique ${p}`}
                               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />"""

new_img_step1 = """                        <div className="aspect-[3/4] w-full bg-zinc-900 relative">
                          {gender === 'Male' ? (
                            <img
                                 src={imgSrc}
                                 alt={`${gender} Physique ${p}`}
                                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <BodyFatImagePlaceholder gender={gender} categoryRange={opt.range} className="rounded-none border-none" />
                          )}"""

content = content.replace(old_img_step1, new_img_step1)

# Step 2 has the same img block
# wait, actually let's just do it dynamically, or replace all matches
with open('src/features/goal/pages/GoalSetterPage.tsx', 'w') as f:
    f.write(content)
