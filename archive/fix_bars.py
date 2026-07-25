import re

with open('src/features/transformation/pages/TransformationPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('style={{ width: `${progressPercent}%` }}', 'style={{ transform: `translateX(-${100 - progressPercent}%)` }}')

with open('src/features/transformation/pages/TransformationPage.tsx', 'w') as f:
    f.write(content)

with open('src/features/profile/pages/ProfilePage.tsx', 'r') as f:
    content = f.read()

# I need to find .journey-fill usage
content = content.replace('style={{ width: `${journeyPercent}%` }}', 'style={{ transform: `translateX(-${100 - journeyPercent}%)` }}')
content = content.replace('style={{ width: `${progressPercent}%` }}', 'style={{ transform: `translateX(-${100 - progressPercent}%)` }}')

with open('src/features/profile/pages/ProfilePage.tsx', 'w') as f:
    f.write(content)

with open('src/index.css', 'r') as f:
    css = f.read()

css = css.replace(""".timeline-fill {
  height: 8px;
  border-radius: 100px;
  background: linear-gradient(90deg, #d4ff00 0%, rgba(212, 255, 0, 0.7) 100%);
  transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s;
  will-change: width;
  min-width: 3px;
}""", """.timeline-fill {
  height: 8px;
  width: 100%;
  border-radius: 100px;
  background: linear-gradient(90deg, #d4ff00 0%, rgba(212, 255, 0, 0.7) 100%);
  transition: transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s;
  will-change: transform;
}""")

css = css.replace(""".journey-fill {
  height: 6px;
  border-radius: 100px;
  background: linear-gradient(90deg, #d4ff00 0%, rgba(212, 255, 0, 0.6) 100%);
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s;
  will-change: width;
}""", """.journey-fill {
  height: 6px;
  width: 100%;
  border-radius: 100px;
  background: linear-gradient(90deg, #d4ff00 0%, rgba(212, 255, 0, 0.6) 100%);
  transition: transform 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s;
  will-change: transform;
}""")

with open('src/index.css', 'w') as f:
    f.write(css)

