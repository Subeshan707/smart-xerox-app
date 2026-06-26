import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';

// --- 3D Interactive Tilt Card Component ---
const TiltCard = ({ children, className }) => {
  const ref = useRef(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative will-change-transform ${className}`}
    >
      {/* 3D Inner Layer translated on Z axis for depth */}
      <div 
        style={{ transform: "translateZ(50px)" }}
        className="absolute inset-0 w-full h-full"
      >
        {children}
      </div>
      {/* Base Glass Layer */}
      <div className="absolute inset-0 w-full h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
      </div>
    </motion.div>
  );
};

const features = [
  {
    title: 'Zero Queue System',
    desc: 'Reserve time slots remotely. Your document begins printing precisely when you arrive.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-400'
  },
  {
    title: 'Automated Pricing',
    desc: 'Upload PDFs to instantly calculate accurate page counts and exact costs before printing.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    color: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Absolute Privacy',
    desc: 'Military-grade encryption. Files are completely purged from servers upon print completion.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    color: 'from-emerald-400 to-teal-500'
  }
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  
  // Advanced Scroll Transforms for Hero
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
  const heroBlur = useTransform(scrollYProgress, [0, 0.2], ["blur(0px)", "blur(20px)"]);
  
  // Transforms for background orbs
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, 500]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const orb3X = useTransform(scrollYProgress, [0, 1], [0, 300]);

  // Transforms for Features section entering
  const featuresY = useTransform(scrollYProgress, [0.1, 0.3], [200, 0]);
  const featuresOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);

  return (
    <div className="bg-[#030014] min-h-[250vh] text-white font-sans overflow-x-hidden selection:bg-purple-500/30">
      
      {/* 3D Deep Parallax Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40 mix-blend-overlay" />
        
        <motion.div 
          style={{ y: orb1Y }}
          className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div 
          style={{ y: orb2Y }}
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen"
        />
        <motion.div 
          style={{ x: orb3X }}
          className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] bg-pink-500/10 rounded-full blur-[100px] mix-blend-screen"
        />
      </div>

      {/* Navbar - Sticky Glassmorphism */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 inset-x-0 z-50 bg-white/5 backdrop-blur-2xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Smart<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Xerox</span></span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="relative group px-6 py-2.5 rounded-full overflow-hidden bg-white/10 hover:bg-white/20 border border-white/20 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <span className="relative z-10 text-sm font-semibold">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Main Scroll Container */}
      <div className="relative z-10">
        
        {/* Section 1: Hero (Fixed/Sticky behavior handled by framer-motion transforms) */}
        <motion.section 
          style={{ 
            scale: heroScale, 
            opacity: heroOpacity, 
            y: heroY,
            filter: heroBlur 
          }}
          className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 pt-20 origin-center will-change-transform"
        >
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-xs font-semibold text-purple-300 mb-8 shadow-2xl"
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            Next Generation Printing Infrastructure
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-[1.05] text-center max-w-6xl mx-auto"
          >
            Print dynamically.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
              Never wait again.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 text-xl md:text-2xl text-white/50 max-w-3xl mx-auto text-center font-light leading-relaxed"
          >
            A powerful, immersive platform that completely eliminates physical queues and manual document handling.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 flex flex-col sm:flex-row items-center gap-6"
          >
            <Link to="/register" className="group relative px-8 py-4 bg-white text-black font-bold rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all hover:scale-105 duration-300">
              <span className="relative z-10 flex items-center gap-2 text-lg">
                Start Booking Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-10 flex flex-col items-center gap-2 text-white/40 text-sm font-medium tracking-widest uppercase"
          >
            <span className="animate-bounce">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent" />
          </motion.div>
        </motion.section>

        {/* Section 2: Features (Overlays the sticky hero) */}
        <motion.section 
          style={{ y: featuresY, opacity: featuresOpacity }}
          className="relative min-h-screen px-6 py-32 mt-[-50vh] flex items-center justify-center"
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center mb-24">
              <h2 className="text-5xl md:text-7xl font-black tracking-tight">
                Flawless <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Execution</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 perspective-1000">
              {features.map((feature, i) => (
                <TiltCard key={i} className="h-96">
                  <div className="flex flex-col h-full p-10 justify-between">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                      <p className="text-white/60 text-lg leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Section 3: Deep Glass Metrics Panel */}
        <section className="relative min-h-screen flex items-center justify-center px-6 py-32">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[100px] z-0" />
          
          <div className="max-w-5xl mx-auto relative z-10 w-full">
            <TiltCard className="w-full">
              <div className="p-16 md:p-24 text-center">
                <h2 className="text-4xl md:text-6xl font-black mb-16">Platform Intelligence</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-white/10">
                  {[
                    { value: '100%', label: 'Uptime Reliability' },
                    { value: '< 1ms', label: 'Queue Sync Speed' },
                    { value: 'AES-256', label: 'File Encryption' },
                  ].map((stat, i) => (
                    <div key={i} className="pt-8 md:pt-0">
                      <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 mb-4">{stat.value}</div>
                      <div className="text-lg font-medium text-white/50 uppercase tracking-widest">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="relative py-40 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0520] z-0" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-black mb-8">Ready to step into the future?</h2>
            <Link to="/register" className="inline-block px-12 py-5 bg-white text-black font-black text-xl rounded-full shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(255,255,255,0.4)] hover:scale-105 transition-all duration-300">
              Join Smart Xerox Today
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
