import os
import re

def refine_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    # 1. Typography Hierarchy
    # Increase large stats
    content = re.sub(r'text-\[36px\]', 'text-[40px]', content)
    content = re.sub(r'text-\[32px\]', 'text-[34px]', content)
    
    # Increase titles slightly and use semibold
    content = re.sub(r'text-\[16px\] font-semibold', 'text-[22px] font-semibold tracking-tight', content)
    content = re.sub(r'text-\[15px\] font-semibold', 'text-[18px] font-semibold tracking-tight', content)
    content = re.sub(r'text-\[15px\] font-bold', 'text-[18px] font-semibold tracking-tight', content)
    content = re.sub(r'text-\[14px\] font-semibold', 'text-[16px] font-medium', content)

    # Body text readability
    content = re.sub(r'text-\[14px\] text-\[rgba\(255,255,255,0\.5\)\]', 'text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed', content)
    content = re.sub(r'text-\[14px\] text-\[rgba\(255,255,255,0\.6\)\]', 'text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed', content)
    content = re.sub(r'text-\[14px\] text-\[rgba\(255,255,255,0\.7\)\]', 'text-[15px] text-[rgba(235,235,245,0.6)] leading-relaxed', content)
    content = re.sub(r'text-\[14px\] text-\[rgba\(255,255,255,0\.8\)\]', 'text-[15px] text-white leading-relaxed', content)
    
    content = re.sub(r'text-\[13px\] text-\[rgba\(255,255,255,0\.5\)\]', 'text-[14px] text-[rgba(235,235,245,0.6)]', content)
    content = re.sub(r'text-\[12px\] text-\[rgba\(255,255,255,0\.4\)\]', 'text-[13px] text-[rgba(235,235,245,0.5)]', content)
    content = re.sub(r'text-\[12px\] text-\[rgba\(255,255,255,0\.5\)\]', 'text-[13px] text-[rgba(235,235,245,0.5)]', content)

    # Uppercase labels spacing
    content = re.sub(r'text-\[10px\] uppercase tracking-widest', 'text-[11px] uppercase tracking-[0.05em] font-medium', content)
    content = re.sub(r'text-\[11px\] uppercase tracking-widest', 'text-[12px] uppercase tracking-[0.05em] font-medium', content)
    content = re.sub(r'text-\[12px\] font-bold text-white tracking-widest uppercase', 'text-[13px] font-semibold text-[rgba(235,235,245,0.6)] tracking-[0.05em] uppercase', content)
    content = re.sub(r'text-\[12px\] font-bold uppercase', 'text-[12px] font-semibold uppercase tracking-[0.05em]', content)

    # 2. Card Appearance (Premium Glass)
    # Replace plain borders and backgrounds with premium glass classes or better tailwind classes
    # e.g., bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-5
    # with: bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl
    
    # Let's replace common card wrappers
    content = re.sub(
        r'bg-\[rgba\(255,255,255,0\.03\)\] border border-\[rgba\(255,255,255,0\.06\)\] rounded-\[20px\] p-([45])',
        r'bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl',
        content
    )
    content = re.sub(
        r'bg-\[rgba\(255,255,255,0\.02\)\] border border-\[rgba\(255,255,255,0\.04\)\] rounded-\[24px\] p-5',
        r'bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl',
        content
    )
    content = re.sub(
        r'bg-\[rgba\(255,255,255,0\.03\)\] border border-\[rgba\(255,255,255,0\.06\)\] rounded-\[24px\] p-5',
        r'bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl',
        content
    )
    content = re.sub(
        r'bg-\[\#111111\] border border-\[rgba\(255,255,255,0\.0[68]\)\] rounded-\[2[04]px\] p-5',
        r'bg-[rgba(30,30,30,0.5)] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-3xl',
        content
    )

    # Secondary cards
    content = re.sub(
        r'bg-\[rgba\(255,255,255,0\.03\)\] rounded-\[16px\] p-4',
        r'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)] rounded-[20px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.1)] backdrop-blur-xl',
        content
    )

    # 3. Primary Button styling
    # bg-white text-black font-semibold text-[15px] rounded-[20px] py-4
    content = re.sub(
        r'bg-white text-black font-semibold text-\[15px\] rounded-\[20px\] py-4',
        r'bg-white text-[#0A0A0A] font-semibold text-[16px] rounded-[100px] py-[16px] shadow-[0_4px_24px_rgba(255,255,255,0.15)] active:scale-[0.97] transition-all duration-200',
        content
    )

    # Section spacing (mb-8 -> mb-10 or mb-12)
    content = re.sub(r'mb-8', 'mb-10', content)
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            refine_file(os.path.join(root, file))

print("Done refining UI.")
