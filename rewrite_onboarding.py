import re

with open("src/features/onboarding/pages/OnboardingPage.tsx", "r") as f:
    content = f.read()

replacement = """
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Name</span>
              <span className="text-[17px] font-semibold text-white">{profile.name || onboardingData?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Age</span>
              <span className="text-[17px] font-semibold text-white">{profile.age || onboardingData?.age || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Weight</span>
              <span className="text-[17px] font-semibold text-white">{profile.weight || onboardingData?.weightKg || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">kg</span></span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Height</span>
              <span className="text-[17px] font-semibold text-white">{profile.height || onboardingData?.heightCm || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">cm</span></span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Activity</span>
              <span className="text-[17px] font-semibold text-white">{profile.activity_level || onboardingData?.activityLevel || '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-[12px]">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">TDEE</span>
              <span className="text-[17px] font-semibold text-white">{profile.maintenance_kcal || onboardingData?.tdee || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">kcal</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[15px] font-normal text-[#EBEBF5CC]">Protein Target</span>
              <span className="text-[17px] font-semibold text-white">{profile.protein_target || onboardingData?.proteinMid || '-'} <span className="text-[13px] font-normal text-[#EBEBF599]">g</span></span>
            </div>
"""

pattern = r'            <div className="flex justify-between items-center border-b border-\[rgba\(255,255,255,0\.06\)\] pb-\[12px\]">\n              <span className="text-\[15px\] font-normal text-\[#EBEBF5CC\]">Name</span>.*?<span className="text-\[13px\] font-normal text-\[#EBEBF599\]">g</span></span>\n            </div>'

new_content = re.sub(pattern, replacement.strip(), content, flags=re.DOTALL)

with open("src/features/onboarding/pages/OnboardingPage.tsx", "w") as f:
    f.write(new_content)
