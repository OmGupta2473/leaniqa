with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

start_str = "function DesktopStory() {"
end_str = "function StickyScrollFeatures() {"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_desktop_story = """function DesktopStory() {
  return (
    <div className="hidden lg:flex flex-col py-24 gap-32">
      {STORY.map((step, i) => (
        <div key={i} className="min-h-screen flex items-center px-6 lg:px-16 max-w-7xl mx-auto w-full">
          <div className={`flex w-full items-center justify-between gap-24 ${i % 2 === 1 ? 'flex-row-reverse' : 'flex-row'}`}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-200px" }}
              transition={{ duration: 0.6 }}
              className="w-[45%]"
            >
              <h3 className="text-4xl lg:text-5xl font-semibold leading-[1.1] text-zinc-50 tracking-tight">
                {step.title}
              </h3>
              <p className="mt-6 text-lg lg:text-xl text-zinc-400 leading-relaxed">
                {step.subtitle}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-200px" }}
              transition={{ duration: 0.8 }}
              className="w-[45%] flex items-center justify-center"
            >
              <PhoneFrame>
                 {i === 0 && <AICoachScreen />}
                 {i === 1 && <DashboardScreen />}
                 {i === 2 && <TimelineScreen />}
              </PhoneFrame>
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}

"""
    new_content = content[:start_idx] + new_desktop_story + content[end_idx:]
    with open('src/LandingPage.tsx', 'w') as f:
        f.write(new_content)
    print("Replaced DesktopStory")
else:
    print("Could not find DesktopStory")
