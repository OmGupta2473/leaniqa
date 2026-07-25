import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Update font scale
new_scale = """  --font-xs: 11px;
  --font-sm: 13px;
  --font-base: 15px;
  --font-md: 16px;
  --font-lg: 17px;
  --font-xl: 20px;
  --font-2xl: 24px;
  --font-3xl: 28px;
  --font-4xl: 32px;
  --font-stat: 40px;"""
content = re.sub(r'--font-xs: clamp.*?--font-stat: clamp.*?;', new_scale, content, flags=re.DOTALL)

# Let's add new utility classes for the premium look at the end of the file.
premium_utilities = """
/* Premium UI Utilities */
.premium-card {
  background: rgba(255, 255, 255, 0.03);
  border: 0.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.premium-card-hover:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.05);
}

.premium-title-large {
  font-size: var(--font-3xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #FFFFFF;
}

.premium-title {
  font-size: var(--font-xl);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #FFFFFF;
}

.premium-card-title {
  font-size: var(--font-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #FFFFFF;
}

.premium-body {
  font-size: var(--font-base);
  font-weight: 400;
  color: rgba(235, 235, 245, 0.8);
  line-height: 1.5;
}

.premium-caption {
  font-size: var(--font-sm);
  font-weight: 400;
  color: rgba(235, 235, 245, 0.5);
  letter-spacing: 0.01em;
}

.premium-button {
  background: #FFFFFF;
  color: #0A0A0A;
  border-radius: 100px;
  font-size: var(--font-md);
  font-weight: 600;
  padding: 16px 24px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.premium-button:active {
  transform: scale(0.97);
  background: #E5E5E5;
}
"""

if "Premium UI Utilities" not in content:
    content += premium_utilities

with open('src/index.css', 'w') as f:
    f.write(content)

