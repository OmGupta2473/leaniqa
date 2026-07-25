import re

with open("src/features/landing/components/StickyCTA.tsx", "r") as f:
    content = f.read()

old_code = """  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show when scrolling up or at bottom, hide when scrolling down
      // Don't show at the very top (hero section)
      if (currentScrollY < 300) {
        setIsVisible(false);
      } else if (currentScrollY + windowHeight >= documentHeight - 50) {
        setIsVisible(true); // Always show at bottom
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true); // Scrolling up
      } else {
        setIsVisible(false); // Scrolling down
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);"""

new_code = """  const lastScrollY = React.useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (currentScrollY < 300) {
        setIsVisible(false);
      } else if (currentScrollY + windowHeight >= documentHeight - 50) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);"""

content = content.replace(old_code, new_code)

with open("src/features/landing/components/StickyCTA.tsx", "w") as f:
    f.write(content)
