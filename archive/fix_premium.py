import os
import re

def premiumize_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    original = content

    # Upgrade basic white borders to softer ones
    content = content.replace("border-[rgba(255,255,255,0.1)]", "border-[rgba(255,255,255,0.06)]")
    content = content.replace("border-[rgba(255,255,255,0.08)]", "border-[rgba(255,255,255,0.05)]")
    
    # Increase corner radii
    content = content.replace("rounded-[16px]", "rounded-[20px]")
    content = content.replace("rounded-xl", "rounded-[20px]")
    content = content.replace("rounded-2xl", "rounded-[24px]")

    # Reduce background opacities to make it look cleaner
    content = content.replace("bg-[rgba(255,255,255,0.05)]", "bg-[rgba(255,255,255,0.03)]")
    content = content.replace("bg-[rgba(255,255,255,0.04)]", "bg-[rgba(255,255,255,0.02)]")
    
    # Improve shadows
    content = content.replace("shadow-sm", "shadow-[0_2px_12px_rgba(0,0,0,0.1)]")
    content = content.replace("shadow-md", "shadow-[0_8px_32px_rgba(0,0,0,0.15)]")

    # Change all text-[16px] font-semibold to a standardized class if needed.
    # We did some replacements previously.
    
    # Add beautiful line-heights to standard paragraphs
    content = content.replace("leading-snug", "leading-relaxed")
    content = content.replace("leading-normal", "leading-relaxed")
    
    # Subdue secondary text slightly more for better contrast with primary
    content = content.replace("text-[rgba(235,235,245,0.7)]", "text-[rgba(235,235,245,0.6)]")
    content = content.replace("text-gray-400", "text-[rgba(235,235,245,0.5)]")
    content = content.replace("text-gray-500", "text-[rgba(235,235,245,0.4)]")

    if original != content:
        with open(filepath, 'w') as f:
            f.write(content)

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            premiumize_file(os.path.join(root, file))

print("Premiumized UI.")
