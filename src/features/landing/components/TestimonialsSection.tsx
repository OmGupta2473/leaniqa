import React from 'react';
import { motion } from 'motion/react';

export function TestimonialsSection() {
  const testimonials = [
    { name: "Rahul S.", role: "Lost 12kg", text: "It's the first time I haven't felt guilty after a cheat meal. The AI just adjusts my next day and I move on." },
    { name: "Priya M.", role: "Built Muscle", text: "The natural language logging is magic. I just type 'dal chawal' and it knows exactly what to do." },
    { name: "Arjun K.", role: "Maintained for 6 months", text: "Not a tracker. A coach. It actually taught me how to eat intuitively by building consistency first." }
  ];

  return (
    <section className="relative py-32 px-6 md:px-12 w-full bg-[#0A0A0A] border-t border-white/5 flex flex-col items-center">
      <div className="max-w-6xl w-full text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
          Real people. Real consistency.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
        {testimonials.map((t, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-3xl p-8"
          >
            <div className="text-4xl text-[#D4FF00] font-serif mb-4">"</div>
            <p className="text-[rgba(235,235,245,0.8)] text-lg mb-8 leading-relaxed">
              {t.text}
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#378ADD] to-[#D4FF00] flex items-center justify-center text-black font-bold text-sm">
                {t.name[0]}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{t.name}</div>
                <div className="text-[rgba(235,235,245,0.5)] text-xs">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
