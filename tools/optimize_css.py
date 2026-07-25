import re

with open('src/index.css', 'r') as f:
    css = f.read()

# 1. Optimize blur & backdrop-filter
# Find all blur(X) where X > 12px and replace with blur(12px)
css = re.sub(r'blur\([1-9][3-9]px\)', 'blur(12px)', css)
css = re.sub(r'blur\([2-9][0-9]px\)', 'blur(12px)', css)
# Remove saturate
css = css.replace(' saturate(180%)', '')

# 2. Optimize Box Shadows
css = css.replace('box-shadow:\n    0 0 0 4px rgba(28, 28, 30, 0.9),\n    0 0 20px rgba(212, 255, 0, 0.3);', 'box-shadow:\n    0 0 0 4px rgba(28, 28, 30, 0.9),\n    0 4px 12px rgba(212, 255, 0, 0.2);')
css = css.replace('0 0 12px rgba(212, 255, 0, 0.12)', '0 2px 8px rgba(212, 255, 0, 0.1)')
css = css.replace('0 0 12px rgba(255, 77, 28, 0.12)', '0 2px 8px rgba(255, 77, 28, 0.1)')
css = css.replace('0 8px 24px rgba(212,255,0,0.2)', '0 4px 12px rgba(212,255,0,0.2)')

# 3. transition: all
css = css.replace('transition: all 0.2s ease;', 'transition: border-color 0.2s ease, box-shadow 0.2s ease;') # for streak-chip

# 4. Progress bar width transition -> scaleX is better, but requires changing TSX. 
# Since we might not want to rewrite all TSX if it's complex, we can at least add will-change to progress bars.
css = css.replace('transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s;', 'transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s;\n  will-change: width;')
css = css.replace('transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s;', 'transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s;\n  will-change: width;')

# 5. Add will-change to sliding elements
css = css.replace('animation: transformSlideIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;', 'animation: transformSlideIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;\n  will-change: transform, opacity;')
css = css.replace('animation: profileSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;', 'animation: profileSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;\n  will-change: transform, opacity;')

with open('src/index.css', 'w') as f:
    f.write(css)
