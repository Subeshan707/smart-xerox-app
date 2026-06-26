import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const bentoFeatures = [
  {
    title: 'Reserve Time Slots',
    desc: 'Skip the line. Book your dedicated printing window online before you even arrive.',
    colSpan: 'md:col-span-2',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-slate-50',
  },
  {
    title: 'Instant Quotes',
    desc: 'Our engine parses PDFs to instantly calculate accurate page counts and pricing.',
    colSpan: 'md:col-span-1',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    bg: 'bg-white',
  },
  {
    title: '100% Data Privacy',
    desc: 'Enterprise-grade security. Files are securely wiped from our servers the moment your print is completed.',
    colSpan: 'md:col-span-1',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    bg: 'bg-slate-900 text-white',
  },
  {
    title: 'Live Queue Tracking',
    desc: 'View real-time updates and notifications as your document moves from the queue to the printer tray.',
    colSpan: 'md:col-span-2',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    bg: 'bg-blue-50',
  },
];

const steps = [
  { num: '1', title: 'Schedule', desc: 'Select a shop and book a time slot.' },
  { num: '2', title: 'Upload', desc: 'Attach documents and review the quote.' },
  { num: '3', title: 'Collect', desc: 'Pick up your prints when notified.' },
];

export default function LandingPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navbar (Crisp Frosted Glass) */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">SmartXerox</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Sign in</Link>
            <Link to="/register" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-md shadow-sm transition-all">
              Create Account
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 shadow-sm rounded-full text-xs font-semibold text-slate-600 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Production Ready PWA
          </motion.div>

          <motion.h1 variants={item} className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tighter leading-[1.1]">
            Document printing,<br className="hidden sm:block" /> streamlined.
          </motion.h1>

          <motion.p variants={item} className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            A comprehensive infrastructure for print shops and customers. Schedule slots, automate page counts, and track your jobs in real-time.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link to="/register" className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] transition-all">
              Start Booking Now
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 rounded-lg shadow-sm transition-all">
              Operator Console
            </Link>
          </motion.div>

        </motion.div>
      </section>

      {/* Metrics Row */}
      <section className="border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
            {[
              { label: 'Uptime', value: '99.9%' },
              { label: 'Average Wait', value: '< 4m' },
              { label: 'Secure Storage', value: '256-bit' },
              { label: 'File Deletion', value: 'Instant' },
            ].map((metric, i) => (
              <div key={metric.label} className={i !== 0 ? "pl-8" : ""}>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{metric.value}</div>
                <div className="text-sm font-medium text-slate-500 mt-1">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Box Features */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Everything you need to run a modern print operation.
            </h2>
            <p className="text-lg text-slate-500">
              Built with precision to eliminate queues, reduce manual counting errors, and ensure absolute data privacy.
            </p>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {bentoFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={item}
                className={`group relative p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${feature.colSpan} ${feature.bg} transition-shadow hover:shadow-md`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${feature.bg === 'bg-slate-900 text-white' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700 shadow-sm'}`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-bold mb-2 tracking-tight ${feature.bg === 'bg-slate-900 text-white' ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                <p className={`leading-relaxed ${feature.bg === 'bg-slate-900 text-white' ? 'text-slate-300' : 'text-slate-500'}`}>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflows (Steps) */}
      <section className="py-24 px-6 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Seamless Workflow</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative max-w-4xl mx-auto">
            <div className="hidden md:block absolute top-6 left-[15%] right-[15%] h-[1px] bg-slate-200" />
            
            {steps.map((step) => (
              <div key={step.num} className="relative z-10 bg-white pt-2 text-center">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-6 shadow-md border-4 border-white">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 px-6 bg-slate-900 text-white text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Ready to upgrade your workflow?
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            Join the platform that is redefining document printing with precision and privacy.
          </p>
          <Link to="/register" className="inline-block px-8 py-4 bg-white text-slate-900 font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Get Started For Free
          </Link>
        </motion.div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 border-t border-slate-800 bg-slate-950 text-slate-500 text-center text-sm font-medium">
        <p>© {new Date().getFullYear()} SmartXerox Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
