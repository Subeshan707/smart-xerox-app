import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'No time Limit Prop firm',
    description: 'We believe that trading should be completely relaxed. Our evaluations do not have a time limit.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Fast progress',
    description: 'You can expect a 200% fee return with the first payout and a possibility to raise your level up to 120%.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: '100% Data Privacy',
    description: 'Your files are instantly wiped from our servers upon print completion. Total anonymity.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
    title: 'Native platform',
    description: 'Progressive Web App built entirely in-house. Lightning fast and completely responsive.',
  },
];

const faqs = [
  { q: 'What does overall drawdown mean?', a: 'Overall drawdown is the maximum amount your account can drop from the initial balance.' },
  { q: 'What is a Free Trial Account?', a: 'A free trial gives you access to a simulated trading environment so you can test our platform entirely risk-free.' },
  { q: 'I have successfully completed one of the training programs, what now?', a: 'Once completed, our risk team will verify your results, and you will be upgraded to a funded account phase within 24 hours.' },
  { q: 'Where can I download the platform?', a: 'Our platform is a Progressive Web App (PWA). You can install it directly from your browser by clicking "Add to Home Screen".' },
];

const mathSymbols = ['(12+12)', '-15+6', '3y', '17+6-4', '-8', '5x9', '24'];

const ParticleCanvas = () => {
  useEffect(() => {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas id="particles" className="absolute inset-0 pointer-events-none opacity-40 z-0" />;
};

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } };

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-[#00FF7F] selection:text-black overflow-x-hidden">
      {/* Dynamic Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[#00FF7F]/10 blur-[150px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#00FF7F]/5 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#080808]/70 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00FF7F] rotate-45 rounded-sm shadow-[0_0_15px_rgba(0,255,127,0.4)]" />
            <span className="text-xl font-bold tracking-widest uppercase text-white ml-1">Fxology</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-[#888888] uppercase tracking-wide">
            <a href="#" className="text-white">Home</a>
            <a href="#how" className="hover:text-white transition-colors">How it Works</a>
            <a href="#programs" className="hover:text-white transition-colors">Programs</a>
            <a href="#faq" className="hover:text-white transition-colors">Support</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-[13px] font-semibold text-white uppercase tracking-wide hidden sm:block">Log in</Link>
            <Link to="/register" className="px-6 py-2.5 bg-transparent border border-[#00FF7F] text-[#00FF7F] hover:bg-[#00FF7F] hover:text-black text-[13px] font-bold uppercase tracking-wide rounded-sm transition-all shadow-[0_0_10px_rgba(0,255,127,0.1)] hover:shadow-[0_0_20px_rgba(0,255,127,0.3)]">
              Start Challenge →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <ParticleCanvas />
        {mathSymbols.map((sym, i) => (
          <motion.div
            key={i}
            className="absolute text-[#333333] font-mono text-xl z-0"
            initial={{ y: Math.random() * window.innerHeight, x: Math.random() * window.innerWidth }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
            }}
            transition={{ duration: 40 + Math.random() * 20, repeat: Infinity, ease: "linear" }}
          >
            {sym}
          </motion.div>
        ))}

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 text-center">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto flex flex-col items-center">
            
            <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#111111] border border-[#1e1e1e] rounded-full text-xs font-semibold uppercase tracking-widest text-[#888888] mb-8">
              <span className="w-3 h-3 rounded-full bg-[#00FF7F] flex items-center justify-center">
                <svg className="w-2 h-2 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              Our Capital, Your Success
            </motion.div>

            <motion.h1 variants={item} className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tighter">
              No Time Limit <br />
              <span className="text-[#00FF7F]">Prop Firm</span>
            </motion.h1>

            <motion.p variants={item} className="mt-8 text-lg text-[#888888] max-w-2xl font-light">
              Conquer the market with up to $640,000 in simulated capital. Keep up to 90% of your profits and scale your success.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 w-full">
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-[#00FF7F] text-[#00FF7F] hover:bg-[#00FF7F] hover:text-black font-bold uppercase tracking-wider rounded-sm transition-all duration-300 shadow-[0_0_15px_rgba(0,255,127,0.2)] hover:shadow-[0_0_30px_rgba(0,255,127,0.4)]">
                Start a challenge →
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-[#111111] border border-[#1e1e1e] text-white font-bold uppercase tracking-wider hover:bg-[#1a1a1a] rounded-sm transition-all">
                Free trial
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 right-10 text-[11px] font-mono text-[#555555] tracking-widest uppercase animate-bounce">
          Scroll to explore ↓
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 relative z-10 bg-[#080808] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-[13px] font-semibold text-[#888888] uppercase tracking-[0.2em] mb-4">Have registered:</h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto font-light">Join the fastest-growing community of funded traders globally.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#1e1e1e] rounded-sm bg-[#111111] overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00FF7F]/10 rounded-full blur-[80px]" />
            {[
              { value: '$400K+', label: 'Paid out to Traders' },
              { value: '15K+', label: 'No. of active traders' },
              { value: '150+', label: 'Countries globally' },
              { value: '16h', label: 'Avg payout time' },
            ].map((stat, i) => (
              <div key={i} className="p-10 border-[#1e1e1e] border-b md:border-b-0 md:border-r last:border-r-0 relative group">
                <div className="text-4xl md:text-5xl font-black text-white group-hover:text-[#00FF7F] transition-colors">{stat.value}</div>
                <div className="text-sm text-[#888888] mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Capital Section */}
      <section className="py-32 relative z-10 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="absolute -inset-4 bg-[#00FF7F]/5 border border-[#00FF7F]/20 blur-xl" />
              <div className="relative bg-[#111111] border border-[#1e1e1e] p-12 rounded-sm aspect-square flex items-center justify-center overflow-hidden">
                <div className="w-64 h-64 border border-[#00FF7F]/30 rotate-45 absolute" />
                <div className="w-48 h-48 border border-[#00FF7F]/50 rotate-12 absolute" />
                <h2 className="text-6xl font-black leading-none text-white relative z-10">
                  OUR CAPITAL<br />
                  <span className="text-[#00FF7F]">YOUR SUCCESS</span>
                </h2>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-block px-3 py-1 bg-[#1e1e1e] text-[11px] text-[#00FF7F] font-mono tracking-widest uppercase mb-6 border border-[#00FF7F]/30 rounded-sm">What is Fxology?</div>
              <h3 className="text-4xl font-bold mb-6 text-white leading-tight">Trade on Forex and other markets with capital up to 640,000 USD!</h3>
              <p className="text-lg text-[#888888] mb-6 font-light leading-relaxed">
                Fxology is looking for profitable traders to trade with our funds. Choose from our unique programs specifically tailored to different styles. Prove your skills in our evaluation phases and get funded.
              </p>
              <p className="text-lg text-[#888888] font-light leading-relaxed">
                We offer the widest variety of training programs with no time limits. Your success is in your hands.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Ticker */}
        <div className="w-full overflow-hidden border-y border-[#1e1e1e] bg-[#080808] py-4 mt-24">
          <div className="flex gap-12 whitespace-nowrap animate-[marquee_20s_linear_infinite]">
            {['EUR/USD', 'GBP/USD', 'BTC/USD', 'ETH/USD', 'XAU/USD', 'US30'].map(pair => (
              <span key={pair} className="text-sm font-mono text-[#888888] flex items-center gap-2">
                {pair} <span className="text-[#00FF7F]">+0.0{Math.floor(Math.random()*9)}%</span>
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {['EUR/USD', 'GBP/USD', 'BTC/USD', 'ETH/USD', 'XAU/USD', 'US30'].map((pair,i) => (
               <span key={pair+i} className="text-sm font-mono text-[#888888] flex items-center gap-2">
               {pair} <span className="text-[#00FF7F]">+0.0{Math.floor(Math.random()*9)}%</span>
             </span>
            ))}
          </div>
        </div>
      </section>

      {/* How does it work */}
      <section id="how" className="py-32 relative z-10 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">How does it <span className="text-[#00FF7F]">work?</span></h2>
            <p className="text-[#888888]">Your pathway to professional trading</p>
          </motion.div>

          {/* Steps Nav */}
          <div className="flex justify-center gap-4 mb-12">
            {['Step 1', 'Step 2', 'Step 3'].map((step, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`px-8 py-3 rounded-sm font-bold tracking-widest uppercase text-sm border transition-all ${activeStep === idx ? 'bg-[#00FF7F] text-black border-[#00FF7F]' : 'bg-[#111111] text-[#888888] border-[#1e1e1e] hover:border-[#555555]'}`}
              >
                {step}
              </button>
            ))}
          </div>

          {/* Visual Display */}
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-sm p-12 max-w-4xl mx-auto relative overflow-hidden aspect-[21/9] flex items-center justify-center">
            {/* Corner accents */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#555555]" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#555555]" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#555555]" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#555555]" />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                {activeStep === 0 && (
                  <div>
                    <h3 className="text-3xl font-bold mb-4">Choose A Program</h3>
                    <p className="text-[#888888] max-w-md mx-auto">Select the capital amount and rules that fit your trading style perfectly.</p>
                  </div>
                )}
                {activeStep === 1 && (
                  <div>
                    <h3 className="text-3xl font-bold mb-4">Training phases</h3>
                    <p className="text-[#888888] max-w-md mx-auto">Prove your skills by hitting the profit target while managing your risk strictly.</p>
                  </div>
                )}
                {activeStep === 2 && (
                  <div>
                    <h3 className="text-3xl font-bold mb-4 text-[#00FF7F]">Get Funded</h3>
                    <p className="text-[#888888] max-w-md mx-auto">Receive your funded account. Keep up to 90% of your profits, paid bi-weekly.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            {/* Ambient visual effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,127,0.1)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-32 relative z-10 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-5xl font-black mb-4">Choose one of <br />our <span className="text-[#00FF7F]">programs</span></h2>
              <p className="text-[#888888]">What is your experience and what do you prefer?</p>
            </div>
            <div className="flex p-1 bg-[#111111] border border-[#1e1e1e] rounded-sm">
              <button className="px-6 py-2 bg-[#1a1a1a] text-white font-bold text-sm tracking-widest uppercase rounded-sm border border-[#333333]">1 - Phase</button>
              <button className="px-6 py-2 text-[#888888] font-bold text-sm tracking-widest uppercase hover:text-white">2 - Phases</button>
            </div>
          </div>

          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Bronze', glow: 'group-hover:shadow-[0_0_30px_rgba(255,100,100,0.2)] border-[#1e1e1e] hover:border-red-500/50' },
              { name: 'Silver', glow: 'group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] border-[#1e1e1e] hover:border-white/50' },
              { name: 'Gold', glow: 'group-hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] border-[#00FF7F]/30 hover:border-[#FFD700]/50' },
              { name: 'Diamond', glow: 'group-hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] border-[#1e1e1e] hover:border-cyan-500/50' },
            ].map((prog) => (
              <motion.div key={prog.name} variants={item} className={`group bg-[#111111] p-8 rounded-sm border transition-all duration-500 ${prog.glow} relative overflow-hidden`}>
                <div className="text-2xl font-black mb-2 uppercase tracking-wider text-white">{prog.name}</div>
                <div className="text-[#888888] text-sm mb-8">Virtual Capital up to $200k</div>
                <ul className="space-y-4 mb-10 text-sm text-[#AAAAAA]">
                  <li className="flex justify-between border-b border-[#1e1e1e] pb-2"><span>Profit Target</span> <span className="text-white font-bold">10%</span></li>
                  <li className="flex justify-between border-b border-[#1e1e1e] pb-2"><span>Max Drawdown</span> <span className="text-white font-bold">8%</span></li>
                  <li className="flex justify-between border-b border-[#1e1e1e] pb-2"><span>Daily Drawdown</span> <span className="text-white font-bold">4%</span></li>
                </ul>
                <button className="w-full py-3 bg-transparent border border-[#333333] text-white text-xs font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-colors rounded-sm">
                  Learn More →
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black mb-16 text-center">Why choose our <span className="text-[#00FF7F]">platform...</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-[#111111] border border-[#1e1e1e] p-10 rounded-sm hover:border-[#00FF7F]/30 transition-colors group">
                <div className="w-12 h-12 bg-[#0a0a0a] border border-[#1e1e1e] text-[#00FF7F] rounded-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,255,127,0.1)]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[#888888] font-light leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-black mb-12 text-center">Frequently asked <span className="text-[#00FF7F]">questions</span></h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#111111] border border-[#1e1e1e] rounded-sm overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-[#151515]"
                >
                  <span className="font-bold pr-8">{faq.q}</span>
                  <span className={`text-[#00FF7F] text-2xl font-light transition-transform duration-300 ${activeFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-6 pt-0 text-[#888888] border-t border-[#1e1e1e] mt-2 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-32 relative overflow-hidden bg-[#080808]">
        {/* Matrix Rain effect abstraction */}
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#00FF7F]/5 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#00FF7F]/5 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="w-16 h-16 bg-[#00FF7F] rotate-45 mx-auto mb-10 shadow-[0_0_30px_rgba(0,255,127,0.5)] flex items-center justify-center">
            <span className="text-black font-black -rotate-45">FX</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-black mb-12">Join our <span className="text-[#00FF7F]">traders</span></h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/login" className="px-10 py-4 bg-transparent border border-[#333333] text-white hover:border-white font-bold uppercase tracking-wider rounded-sm transition-all">
              Try for free
            </Link>
            <Link to="/register" className="px-10 py-4 bg-transparent border border-[#00FF7F] text-[#00FF7F] hover:bg-[#00FF7F] hover:text-black font-bold uppercase tracking-wider rounded-sm shadow-[0_0_15px_rgba(0,255,127,0.2)] transition-all">
              I want to join
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-[#1e1e1e] pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-5 h-5 bg-[#00FF7F] rotate-45" />
                <span className="text-lg font-bold tracking-widest uppercase">Fxology</span>
              </div>
              <p className="text-[#555555] text-sm">Empowering traders worldwide with simulated capital and industry-leading technology.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-sm">Programs</h4>
              <ul className="space-y-3 text-sm text-[#888888]">
                <li><a href="#" className="hover:text-[#00FF7F] transition-colors">Bronze Extreme</a></li>
                <li><a href="#" className="hover:text-[#00FF7F] transition-colors">Silver Extreme</a></li>
                <li><a href="#" className="hover:text-[#00FF7F] transition-colors">Gold Extreme</a></li>
                <li><a href="#" className="hover:text-[#00FF7F] transition-colors">Competitions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-sm">About Us</h4>
              <ul className="space-y-3 text-sm text-[#888888]">
                <li><a href="#" className="hover:text-[#00FF7F] transition-colors">About us</a></li>
                <li><a href="#" className="hover:text-[#00FF7F] transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-[#00FF7F] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#00FF7F] transition-colors">Affiliate</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-sm">Support</h4>
              <p className="text-[#888888] text-sm mb-4">support@fxology.com</p>
              <div className="flex gap-4 text-[#555555]">
                <a href="#" className="hover:text-white transition-colors">FB</a>
                <a href="#" className="hover:text-white transition-colors">TW</a>
                <a href="#" className="hover:text-white transition-colors">IG</a>
                <a href="#" className="hover:text-white transition-colors">DC</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#1e1e1e] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#555555] font-mono uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Fxology. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
