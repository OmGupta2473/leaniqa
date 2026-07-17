import re

with open("src/features/profile/pages/ProfilePage.tsx", "r") as f:
    c = f.read()

# Add Crown, CreditCard, Sparkles, ArrowRight, Zap to lucide-react import
c = re.sub(
    r'import { (.*?) } from \'lucide-react\';',
    r'import { \1, Crown, CreditCard as CreditCardIcon, Sparkles, ArrowRight, Zap } from \'lucide-react\';',
    c
)

# Add subscriptionService import
sub_import = "import { subscriptionService } from '@/features/pricing/services/subscriptionService';\n"
if "subscriptionService" not in c:
    import_end = c.rfind("import ")
    newline_after = c.find("\n", import_end)
    c = c[:newline_after+1] + sub_import + c[newline_after+1:]

with open("src/features/profile/pages/ProfilePage.tsx", "w") as f:
    f.write(c)

