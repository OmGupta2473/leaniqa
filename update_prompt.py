with open('src/shared/components/SaveAccountPrompt.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [show, setShow] = React.useState(false);", "const [show, setShow] = React.useState(false);\n  const [ignoredId, setIgnoredId] = React.useState<string | null>(null);")

content = content.replace("""  React.useEffect(() => {
    if (session?.user) {
      const id = session.user.id;
      if (!accounts[id]) {
        setShow(true);
      } else {
        setShow(false);
      }
    } else {
      setShow(false);
    }
  }, [session, accounts]);""", """  React.useEffect(() => {
    if (session?.user) {
      const id = session.user.id;
      if (!accounts[id] && ignoredId !== id) {
        setShow(true);
      } else {
        setShow(false);
      }
    } else {
      setShow(false);
    }
  }, [session, accounts, ignoredId]);""")

content = content.replace("""  const handleNotNow = () => {
    // Just dismiss the prompt, but it's not saved in accounts list
    setShow(false);
    
    // We want to remember that they dismissed it for this session,
    // but right now setShow(false) just hides it.
    // If accounts changes or session changes, it might re-evaluate. 
    // To prevent it reappearing in this session, we can track the ignored ID in local state.
  };""", """  const handleNotNow = () => {
    if (session?.user) {
      setIgnoredId(session.user.id);
    }
    setShow(false);
  };""")

with open('src/shared/components/SaveAccountPrompt.tsx', 'w') as f:
    f.write(content)

