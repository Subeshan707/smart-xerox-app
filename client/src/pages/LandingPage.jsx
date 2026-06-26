import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  // --- Refs for Canvas & Observers ---
  const particleCanvasRef = useRef(null);
  const matrixLeftRef = useRef(null);
  const matrixRightRef = useRef(null);
  const statsRef = useRef(null);
  const typeWriterRef = useRef(null);

  // --- State for interactive components ---
  const [activeStep, setActiveStep] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [typeWriterText, setTypeWriterText] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  const fullTypeWriterText = "Why choose Smart Xerox?";
  
  const targetStats = [
    { value: 400, prefix: '$', suffix: 'K+', label: 'Total Saved by Users' },
    { value: 15, prefix: '', suffix: 'K+', label: 'Active Daily Prints' },
    { value: 150, prefix: '', suffix: '+', label: 'Partnered Shops' },
    { value: 16, prefix: '', suffix: 'h', label: 'Avg Queue Time Saved' },
  ];

  // --- 1. Global Particle Canvas (Section Backgrounds) ---
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        speed: Math.random() * 0.5 + 0.1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.speed;
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- 2. Matrix Rain Canvas (Section 10 CTA) ---
  useEffect(() => {
    const initMatrix = (canvas) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      // Set fixed size for the edge canvases
      canvas.width = 300;
      canvas.height = 400;
      
      const characters = '01PRINTXEROX#queue';
      const charArray = characters.split('');
      const fontSize = 14;
      const columns = canvas.width / fontSize;
      const drops = [];
      for (let x = 0; x < columns; x++) drops[x] = 1;

      let frameCount = 0;
      const draw = () => {
        // Slow down the matrix rain slightly
        frameCount++;
        if (frameCount % 2 !== 0) {
          return requestAnimationFrame(draw);
        }

        ctx.fillStyle = 'rgba(8, 8, 8, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#39FF14';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
          const text = charArray[Math.floor(Math.random() * charArray.length)];
          // Fading effect toward center is handled via CSS gradients covering the canvas
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
        return requestAnimationFrame(draw);
      };
      return draw();
    };

    let idLeft = requestAnimationFrame(() => initMatrix(matrixLeftRef.current));
    let idRight = requestAnimationFrame(() => initMatrix(matrixRightRef.current));

    return () => {
      cancelAnimationFrame(idLeft);
      cancelAnimationFrame(idRight);
    };
  }, []);

  // --- 3. Intersection Observers (Reveal & Stats) ---
  useEffect(() => {
    // Reveal Observer
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Optional: unobserve after revealing once
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealElements.forEach(el => revealObserver.observe(el));

    // Stats Count-up Observer
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !statsVisible) {
        setStatsVisible(true);
        // Animate count up
        const duration = 1500;
        const steps = 60;
        let currentStep = 0;
        const interval = setInterval(() => {
          currentStep++;
          setCounts(targetStats.map(stat => Math.floor((stat.value / steps) * currentStep)));
          if (currentStep >= steps) {
            clearInterval(interval);
            setCounts(targetStats.map(s => s.value));
          }
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    
    if (statsRef.current) statsObserver.observe(statsRef.current);

    // Typewriter Observer
    const typeWriterObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let i = 0;
        setTypeWriterText('');
        const typing = setInterval(() => {
          if (i < fullTypeWriterText.length) {
            setTypeWriterText(fullTypeWriterText.slice(0, i + 1));
            i++;
          } else {
            clearInterval(typing);
          }
        }, 80);
        typeWriterObserver.disconnect();
      }
    }, { threshold: 0.5 });

    if (typeWriterRef.current) typeWriterObserver.observe(typeWriterRef.current);

    return () => {
      revealObserver.disconnect();
      statsObserver.disconnect();
      typeWriterObserver.disconnect();
    };
  }, [statsVisible]);


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
        
        :root {
          --bg: #080808;
          --accent: #39FF14;
          --text-primary: #FFFFFF;
          --text-secondary: #666666;
        }

        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background-color: var(--bg);
          color: var(--text-primary);
          overflow-x: hidden;
        }

        /* 1. Page Load Animation */
        @keyframes pageFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .page-wrap {
          animation: pageFadeIn 0.6s ease-out forwards;
        }

        /* 2. Floating Keywords */
        @keyframes floatAnim {
          0%, 100% { transform: translateY(-8px); }
          50% { transform: translateY(8px); }
        }
        .float-el {
          animation: floatAnim ease-in-out infinite;
        }

        /* 3. Section Reveal Animation */
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .reveal-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* 7. Green Glow Orb Drift */
        @keyframes driftAnim {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(60px, 30px); }
        }
        .orb-drift {
          animation: driftAnim 8s infinite ease-in-out;
        }

        /* 8. Ticker Marquee */
        @keyframes marqueeAnim {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-content {
          display: inline-flex;
          white-space: nowrap;
          animation: marqueeAnim 20s linear infinite;
        }

        /* 9. Hover Card Glow */
        .glass-card {
          background: #111111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .glass-card:hover {
          border-color: rgba(57, 255, 20, 0.4);
          box-shadow: 0 0 30px rgba(57, 255, 20, 0.08);
        }

        /* Stagger Delays for Cards */
        .stagger-0 { transition-delay: 0ms; }
        .stagger-1 { transition-delay: 100ms; }
        .stagger-2 { transition-delay: 200ms; }
        .stagger-3 { transition-delay: 300ms; }

        /* Typography Utilities */
        .hero-head {
          font-size: clamp(40px, 6vw, 80px);
          font-weight: 800;
          line-height: 1.1;
        }
        .section-head {
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 700;
        }
        .body-text {
          font-size: 15px;
          color: #888888;
          line-height: 1.7;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #080808; 
        }
        ::-webkit-scrollbar-thumb {
          background: #1e1e1e; 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #39FF14; 
        }
      `}</style>

      {/* GLOBAL PARTICLE CANVAS */}
      <canvas 
        ref={particleCanvasRef} 
        className="fixed inset-0 pointer-events-none z-0" 
      />

      <div className="page-wrap relative z-10">
        
        {/* ─── SECTION 1: NAVBAR ─── */}
        <nav className="fixed top-0 w-full z-50 backdrop-blur-[12px] bg-[#080808]/80 border-b border-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.4)] flex items-center justify-center">
                <span className="text-black font-black text-xs">SX</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">SmartXerox</span>
            </div>
            
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8 text-white text-[14px]">
              <a href="#" className="hover:text-[#39FF14] transition-colors">Home</a>
              <a href="#how" className="hover:text-[#39FF14] transition-colors">How It Works</a>
              <a href="#programs" className="hover:text-[#39FF14] transition-colors">Programs</a>
              <a href="#faq" className="hover:text-[#39FF14] transition-colors">Support</a>
            </div>

            {/* Right CTA */}
            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block text-[#666666] hover:text-white text-[14px] transition-colors">Free Trial</Link>
              <Link to="/register" className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#39FF14] text-[#39FF14] text-[14px] font-bold hover:bg-[#39FF14] hover:text-black transition-all">
                Get Started <span>→</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* ─── SECTION 2: HERO ─── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6 overflow-hidden text-center">
          {/* Radial Green Glow Blob */}
          <div 
            className="absolute top-0 left-0 w-full h-[80vh] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(57,255,20,0.12) 0%, transparent 70%)' }}
          />

          {/* Floating Decorators */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[
              { t: 'PDF', top: '20%', left: '15%', rot: '-10deg', dur: '6s' },
              { t: 'v2.0', top: '30%', right: '20%', rot: '12deg', dur: '8s' },
              { t: '{ print }', top: '60%', left: '25%', rot: '5deg', dur: '7s' },
              { t: '#queue', top: '70%', right: '15%', rot: '-15deg', dur: '9s' },
              { t: 'A4', top: '40%', left: '8%', rot: '15deg', dur: '10s' },
              { t: '∞', top: '25%', right: '10%', rot: '-5deg', dur: '6s' },
              { t: '2.4x', top: '80%', left: '20%', rot: '8deg', dur: '8s' },
              { t: '$0 fee', top: '55%', right: '25%', rot: '-12deg', dur: '11s' },
            ].map((el, i) => (
              <span 
                key={i} 
                className="absolute text-[20px] text-[#222222] font-mono float-el"
                style={{ top: el.top, left: el.left, right: el.right, transform: `rotate(${el.rot})`, animationDuration: el.dur }}
              >
                {el.t}
              </span>
            ))}
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center reveal-on-scroll">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full text-xs font-semibold text-white mb-8">
              ZERO WAIT TIMES <span className="text-[#39FF14]">✓</span>
            </div>

            <h1 className="hero-head mb-8">
              Smart Printing Infrastructure.<br />
              Zero Physical Queues.
            </h1>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-12">
              {[
                'Instant Price Quotes',
                'Live Queue Tracking',
                '100% Data Privacy',
                'Automated Page Counting'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-[#888888] text-[14px]">
                  <div className="w-4 h-4 rounded-full bg-[#39FF14]/20 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14]" />
                  </div>
                  {text}
                </div>
              ))}
            </div>

            {/* CTA Row */}
            <div className="flex items-center gap-6">
              <Link to="/register" className="px-8 py-4 rounded-full border border-[#39FF14] text-[#39FF14] font-bold hover:bg-[#39FF14] hover:text-black transition-all shadow-[0_0_20px_rgba(57,255,20,0.15)]">
                Get Started →
              </Link>
              <Link to="/login" className="text-white hover:underline underline-offset-4 transition-all">
                See Demo
              </Link>
            </div>
          </div>

          <div className="absolute bottom-8 right-8 text-[#444] text-[12px] uppercase tracking-widest animate-pulse">
            Scroll to explore ↓
          </div>
        </section>

        {/* ─── SECTION 3: STATS BAR ─── */}
        <section ref={statsRef} className="py-24 border-t border-b border-[#111] relative overflow-hidden bg-[#0a0a0a]">
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-[#39FF14] rounded-full blur-[100px] opacity-[0.15] orb-drift" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center reveal-on-scroll">
            <h3 className="text-[#666666] uppercase tracking-[0.2em] text-sm font-bold mb-12">Trusted by thousands</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#1a1a1a] rounded-2xl overflow-hidden bg-[#111111]">
              {targetStats.map((stat, i) => (
                <div key={i} className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-[#1a1a1a] last:border-r-0">
                  <div className="text-4xl md:text-5xl font-black text-white mb-2">
                    {stat.prefix}{counts[i]}{stat.suffix}
                  </div>
                  <div className="text-[#666666] text-[14px]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: ABOUT / VALUE SECTION ─── */}
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="absolute right-[-10%] top-[20%] w-[40vw] h-[40vw] bg-[#39FF14] rounded-full blur-[150px] opacity-[0.05]" />
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="relative reveal-on-scroll">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(57,255,20,0.1)_50%,transparent_52%)] bg-[length:20px_20px]" />
              <div className="glass-card p-16 aspect-square flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-10 left-10 w-32 h-32 border border-[#39FF14]/20 rounded-lg transform rotate-12" />
                <div className="absolute bottom-10 right-10 w-48 h-48 border border-[#39FF14]/10 rounded-full" />
                <h2 className="section-head leading-[1.1] relative z-10">
                  Our Platform<br />
                  <span className="text-[#39FF14]">Your Efficiency</span>
                </h2>
              </div>
            </div>

            {/* Right */}
            <div className="reveal-on-scroll">
              <div className="inline-block px-4 py-1.5 bg-[#111111] rounded-full text-[#666666] text-xs font-bold uppercase tracking-widest border border-[#1a1a1a] mb-8">
                [What is SmartXerox?]
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                The complete operating system for modern document printing.
              </h3>
              <p className="body-text mb-6">
                Smart Xerox bridges the gap between customers and print shop operators. Upload documents remotely, let our engine automatically parse pages for quotes, and track your print job live.
              </p>
              <p className="body-text mb-12">
                No physical USB drives, no manual counting, no standing in lines. Total privacy with auto-deletion after completion.
              </p>
            </div>
          </div>

          {/* Marquee Ticker */}
          <div className="mt-24 w-full overflow-hidden border-y border-[#1a1a1a] bg-[#050505] py-4">
            <div className="marquee-content gap-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-8 items-center">
                  {['PDF Parsing', 'Live Queue', 'AES-256 Security', 'Auto Deletion', 'PWA Support', 'Shop Dashboard', 'Analytics'].map((word, j) => (
                    <React.Fragment key={j}>
                      <span className="text-[#444] font-mono text-sm tracking-widest uppercase">{word}</span>
                      <span className="text-[#222]">•</span>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 5: HOW IT WORKS ─── */}
        <section id="how" className="py-32 bg-[#050505]">
          <div className="max-w-5xl mx-auto px-6 reveal-on-scroll">
            <div className="text-center mb-16">
              <h2 className="section-head mb-4 text-white">How does it work?</h2>
              <p className="text-[#666666] text-[15px]">Your pathway to zero-wait printing</p>
            </div>

            {/* Visual Display Card */}
            <div className="glass-card mb-8 p-12 aspect-[21/9] flex items-center justify-center relative overflow-hidden">
              {/* Fluid Radial Glow inside Card */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.15)_0%,transparent_60%)] animate-pulse" />
              
              <div className="relative z-10 text-center">
                {activeStep === 0 && (
                  <div className="animate-[pageFadeIn_0.5s_ease-out]">
                    <h3 className="text-3xl font-bold text-white mb-2">Upload Files</h3>
                    <p className="text-[#666] max-w-md mx-auto">Upload PDF or images. We automatically parse pages and generate an exact price quote.</p>
                  </div>
                )}
                {activeStep === 1 && (
                  <div className="animate-[pageFadeIn_0.5s_ease-out]">
                    <h3 className="text-3xl font-bold text-white mb-2">Schedule Slot</h3>
                    <p className="text-[#666] max-w-md mx-auto">Pick an available time slot at your preferred shop. Skip the physical queue entirely.</p>
                  </div>
                )}
                {activeStep === 2 && (
                  <div className="animate-[pageFadeIn_0.5s_ease-out]">
                    <h3 className="text-3xl font-bold text-[#39FF14] mb-2">Track & Collect</h3>
                    <p className="text-[#666] max-w-md mx-auto">Watch live updates as your job prints. Walk in and collect exactly when it's ready.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Controls */}
            <div className="flex justify-center gap-8 md:gap-16 border-t border-[#1a1a1a] pt-8">
              {['STEP 1', 'STEP 2', 'STEP 3'].map((step, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`text-sm font-bold tracking-widest pb-4 border-b-2 transition-colors ${activeStep === idx ? 'text-white border-[#39FF14]' : 'text-[#444] border-transparent hover:text-[#666]'}`}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 6: FEATURES / PROGRAMS ─── */}
        <section id="programs" className="py-32 px-6 relative">
          <div className="absolute left-[-10%] top-[40%] w-[30vw] h-[30vw] bg-[#39FF14] rounded-full blur-[150px] opacity-[0.05]" />
          
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 reveal-on-scroll">
              <h2 className="section-head mb-4 text-white">Choose what fits you</h2>
              <p className="text-[#666666] text-[15px]">What do you need?</p>
              
              <div className="inline-flex mt-8 p-1 bg-[#111111] border border-[#1a1a1a] rounded-full">
                <button className="px-6 py-2 bg-[#222222] rounded-full text-white text-sm font-bold">For Customers</button>
                <button className="px-6 py-2 text-[#666] hover:text-white text-sm font-bold">For Shops</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Standard Print', desc: 'A4 Black & White or Color prints. Ideal for assignments and standard documents.' },
                { name: 'Bulk Order', desc: 'Heavy volume printing over 500 pages. Receive prioritized processing and volume discounts.' },
                { name: 'Bound Books', desc: 'Spiral or softcover binding services included with your print run.' },
                { name: 'Custom Media', desc: 'Photo paper, cardstock, or custom sizes. Subject to specific shop availability.' }
              ].map((prog, i) => (
                <div key={i} className={`glass-card p-[28px] reveal-on-scroll stagger-${i}`}>
                  <h3 className="text-xl font-bold text-white mb-4">{prog.name}</h3>
                  <p className="body-text mb-8">{prog.desc}</p>
                  <button className="text-[#39FF14] text-[14px] font-bold hover:underline underline-offset-4">
                    Learn More →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 7: WHY CHOOSE US ─── */}
        <section className="py-32 px-6 bg-[#050505] relative overflow-hidden">
          {/* Top Curved Arc Trick */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] h-[200px] bg-[#080808] border-b border-[#111] rounded-b-[100%] z-0" />
          
          <div className="max-w-7xl mx-auto relative z-10 pt-20">
            <h2 className="section-head text-center mb-16 reveal-on-scroll" ref={typeWriterRef}>
              {typeWriterText}<span className="animate-pulse">_</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: 'Zero Hardware Required', desc: 'Run the shop dashboard entirely from a tablet or browser. No bulky POS needed.' },
                { title: 'Instant Payments', desc: 'Integrated UPI and card payments ensure you get paid before the printer even starts.' },
                { title: 'Automated Workflows', desc: 'Files are neatly organized by time slot in your dashboard. Print them with one click.' },
                { title: 'Analytics Dashboard', desc: 'Track daily revenue, peak hours, and paper consumption all in one place.' }
              ].map((feature, i) => (
                <div key={i} className="bg-[#0f0f0f] border border-[#1e1e1e] rounded-2xl p-8 reveal-on-scroll">
                  <div className="w-12 h-12 bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-6 shadow-[0_0_12px_rgba(57,255,20,0.3)] text-[24px]">
                    ✨
                  </div>
                  <h3 className="text-[18px] font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-[14px] text-[#666666] leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 8: STORY / MISSION ─── */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
            {/* Left */}
            <div className="md:col-span-7 reveal-on-scroll">
              <div className="text-[#666] text-xs font-bold uppercase tracking-widest mb-6">[App Story]</div>
              <h2 className="section-head leading-[1.2] mb-8 text-white">
                Users can skip the queue and print their documents in a <span style={{ color: '#39FF14' }}>surprisingly short</span> time.
              </h2>
              <div className="space-y-6">
                <p className="body-text">
                  We started Smart Xerox because we noticed thousands of hours being wasted every day by students and professionals standing in long queues just to print a few pages.
                </p>
                <p className="body-text">
                  Our mission is to completely digitize the handover process. By moving scheduling, pricing, and file transfer to the cloud, print shops operate 5x faster, and customers regain their valuable time.
                </p>
              </div>
            </div>

            {/* Right: Timeline */}
            <div className="md:col-span-5 relative pl-8 border-l border-[#1e1e1e] reveal-on-scroll">
              {[
                { year: '2022', desc: 'Concept Born' },
                { year: '2023', desc: 'Beta App Launch' },
                { year: '2024', desc: 'First 100 Shops' },
                { year: 'Present', desc: 'Global Expansion' }
              ].map((item, i) => (
                <div key={i} className="mb-12 last:mb-0 relative">
                  <div className="absolute -left-[39px] w-4 h-4 bg-[#0a0a0a] border-2 border-[#39FF14] rounded-full shadow-[0_0_20px_#39FF14]" />
                  <div className="text-white font-bold text-lg mb-1">{item.year}</div>
                  <div className="text-[#666] text-sm">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 9: FAQ ─── */}
        <section id="faq" className="py-32 px-6 bg-[#080808] relative">
          <div className="max-w-3xl mx-auto relative pl-12 reveal-on-scroll">
            {/* Glowing left bar */}
            <div 
              className="absolute left-0 top-10 w-[3px] h-[200px]"
              style={{ background: 'linear-gradient(to bottom, #39FF14, transparent)', filter: 'blur(8px)' }}
            />
            <div className="absolute left-[1px] top-10 w-[1px] h-[200px] bg-[#39FF14]" />

            <h2 className="section-head mb-12 text-white">Frequently Asked Questions</h2>
            
            <div className="space-y-0">
              {[
                { q: 'Is my data secure?', a: 'Absolutely. We use AES-256 encryption for file uploads, and your documents are automatically permanently deleted from our servers the moment the shop completes your print job.' },
                { q: 'How is the price calculated?', a: 'Our engine parses your PDF immediately upon upload, counting black & white vs color pages, and applies the specific pricing tier of the shop you selected.' },
                { q: 'Do I need an app?', a: 'No app store download is required! Smart Xerox is a PWA (Progressive Web App). You can run it entirely in your browser or click "Add to Home Screen" to install it instantly.' },
                { q: 'What if a shop is closed?', a: 'The app tracks shop operating hours in real-time. You can only book time slots for when the shop is actively accepting orders.' },
                { q: 'Can I cancel an order?', a: 'Orders can be cancelled for a full refund up until 30 minutes before your scheduled print slot.' },
              ].map((faq, i) => (
                <div key={i} className="border-b border-[#1a1a1a]">
                  <button 
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full py-[20px] flex justify-between items-center text-left text-white font-bold hover:text-[#39FF14] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-xl transition-transform duration-300 ${activeFaq === i ? 'rotate-45 text-[#39FF14]' : ''}`}>+</span>
                  </button>
                  <div 
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: activeFaq === i ? '200px' : '0px', opacity: activeFaq === i ? 1 : 0 }}
                  >
                    <div className="pb-[20px] text-[#888888] text-[14px] leading-relaxed pr-8">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button className="px-8 py-3 rounded-full border border-white text-white text-sm font-bold hover:bg-white hover:text-black transition-all">
                View more
              </button>
            </div>
          </div>
        </section>

        {/* ─── SECTION 10: FINAL CTA ─── */}
        <section className="relative py-40 bg-[#080808] overflow-hidden">
          <div className="absolute inset-0 bg-[#050505] opacity-50" />
          
          {/* Left/Right Matrix Canvases */}
          <canvas ref={matrixLeftRef} className="absolute top-0 left-0 h-full z-0 opacity-30" />
          <canvas ref={matrixRightRef} className="absolute top-0 right-0 h-full z-0 opacity-30" />

          {/* Fade masks for matrix */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#080808_0%,transparent_20%,transparent_80%,#080808_100%)] z-0 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center reveal-on-scroll">
            <div className="w-16 h-16 rounded-2xl bg-[#39FF14] flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(57,255,20,0.4)]">
              <span className="text-black text-2xl font-black">SX</span>
            </div>
            
            <h2 className="text-[28px] font-bold text-white mb-10">Join Smart Xerox today</h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/login" className="px-8 py-4 w-full sm:w-auto rounded-full border border-[#333] text-white font-bold hover:bg-[#111] transition-all">
                Try for free
              </Link>
              <Link to="/register" className="px-8 py-4 w-full sm:w-auto rounded-full border border-[#39FF14] text-[#39FF14] font-bold hover:bg-[#39FF14] hover:text-black transition-all shadow-[0_0_20px_rgba(57,255,20,0.15)]">
                Get started
              </Link>
            </div>
          </div>
        </section>

        {/* ─── SECTION 11: FOOTER ─── */}
        <footer className="bg-[#050505] pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 border-b border-[#111111] pb-16">
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded-md bg-[#39FF14]" />
                  <span className="text-white font-bold text-lg">SmartXerox</span>
                </div>
                <Link to="/login" className="inline-block px-6 py-2 rounded-full border border-[#222] text-[#888] text-sm hover:text-white transition-colors">
                  Free trial
                </Link>
              </div>
              
              <div>
                <h4 className="text-white font-bold text-sm mb-6">Programs</h4>
                <ul className="space-y-4 text-[#666666] text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">Customer App</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Shop Dashboard</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Enterprise API</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-6">Company</h4>
                <ul className="space-y-4 text-[#666666] text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-6">Legal</h4>
                <ul className="space-y-4 text-[#666666] text-sm mb-8">
                  <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                </ul>
                <div className="text-[#444] text-sm">support@smartxerox.com</div>
                <div className="flex gap-4 mt-6 text-[#444]">
                  {/* Fake social icons */}
                  <span className="hover:text-white cursor-pointer transition-colors">TW</span>
                  <span className="hover:text-white cursor-pointer transition-colors">IG</span>
                  <span className="hover:text-white cursor-pointer transition-colors">LI</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[#444] text-sm">
              <div>© {new Date().getFullYear()} Smart Xerox. All rights reserved.</div>
              <div>Made with <span className="text-[#39FF14]">♥</span> by Antigravity</div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
