"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Globe, HardHat, ArrowRight, ArrowLeft, Mail, Lock, Building, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

// Hardcoded credentials
const GOV_EMAIL = "gov@infrsync.in";
const GOV_PASSWORD = "GovSecure@2024";
const CONTRACTOR_EMAIL = "contractor@infrsync.in";
const CONTRACTOR_PASSWORD = "Contractor@2024";

export default function Home() {
  const router = useRouter();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const [activeLogin, setActiveLogin] = useState<'gov' | 'contractor' | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Validate credentials
    if (activeLogin === 'gov') {
      if (email !== GOV_EMAIL || password !== GOV_PASSWORD) {
        setAuthError("Invalid credentials. Please check your email and password.");
        return;
      }
    } else {
      if (email !== CONTRACTOR_EMAIL || password !== CONTRACTOR_PASSWORD) {
        setAuthError("Invalid credentials. Please check your email and password.");
        return;
      }
    }

    setIsLoggingIn(true);
    
    // Attempt Web3 MetaMask Wallet Connection alongside Web2 Auth
    connectAsync({ connector: injected() }).then(() => {
        if (activeLogin === 'contractor' && company.trim() !== '') {
            localStorage.setItem('contractorName', company);
        }
        localStorage.setItem('userRole', activeLogin!);
        router.push(`/${activeLogin}`);
    }).catch(async (err) => {
        console.error(err);
        
        // If they were already connected somehow but it errored, let's just proceed for robustness,
        // otherwise throw auth error.
        if (err.name === 'ConnectorAlreadyConnectedError') {
             if (activeLogin === 'contractor' && company.trim() !== '') {
                localStorage.setItem('contractorName', company);
            }
            localStorage.setItem('userRole', activeLogin!);
            router.push(`/${activeLogin}`);
            return;
        }

        setAuthError("You must approve the MetaMask connection to securely login.");
        setIsLoggingIn(false);
    });
  };

  const resetForm = () => {
    setActiveLogin(null);
    setEmail("");
    setPassword("");
    setCompany("");
    setIsLoggingIn(false);
    setAuthError(null);
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center px-4 overflow-x-hidden w-full">
      {/* Background decoration elements */}
      <div className="bg-blob-1 pointer-events-none"></div>
      <div className="bg-blob-2 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl">

        <AnimatePresence mode="wait">
          {!activeLogin ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            >
              <div className="text-left md:pr-8">
                <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 text-xs font-bold tracking-widest mb-4">
                  SMART TENDER PLATFORM
                </span>
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                  Transparent <br />
                  <span className="text-gradient">Infrastructure</span> <br />
                  Bidding.
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-md">
                  AI-powered evaluation matching critical government infrastructure projects with optimal contractor bids seamlessly.
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 px-2">Select your Portal</h2>

                {/* Gov Login Card Select */}
                <div
                  onClick={() => setActiveLogin('gov')}
                  className="group cursor-pointer glass-panel rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:border-brand-500 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-400 to-brand-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  <div className="flex items-center gap-6">
                    <div className="bg-brand-50 dark:bg-brand-900/40 p-4 rounded-2xl text-brand-600 dark:text-brand-400">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Government Official</h3>
                      <span className="text-brand-600 dark:text-brand-400 text-sm font-semibold flex items-center gap-1 mt-1 group-hover:gap-2 transition-all">
                        Proceed to Login <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contractor Login Card Select */}
                <div
                  onClick={() => setActiveLogin('contractor')}
                  className="group cursor-pointer glass-panel rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:border-accent-500 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-accent-400 to-accent-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  <div className="flex items-center gap-6">
                    <div className="bg-accent-50 dark:bg-accent-900/40 p-4 rounded-2xl text-accent-600 dark:text-accent-400">
                      <HardHat className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Valid Contractor</h3>
                      <span className="text-accent-600 dark:text-accent-400 text-sm font-semibold flex items-center gap-1 mt-1 group-hover:gap-2 transition-all">
                        Proceed to Login <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Public Audit Card Select */}
                <div
                  onClick={() => router.push('/public')}
                  className="group cursor-pointer glass-panel rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:border-blue-500 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  <div className="flex items-center gap-6">
                    <div className="bg-blue-50 dark:bg-blue-900/40 p-4 rounded-2xl text-blue-600 dark:text-blue-400">
                      <Globe className="w-8 h-8" /> 
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Public Transparency</h3>
                      <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center gap-1 mt-1 group-hover:gap-2 transition-all">
                        Audit Blockchain Bids <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div
              key="loginForm"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="max-w-md mx-auto"
            >
              <button
                onClick={resetForm}
                className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium px-2 py-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Portal Selection
              </button>

              <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
                <div className={`p-8 text-center bg-gradient-to-br ${activeLogin === 'gov' ? 'from-brand-600 to-brand-800' : 'from-accent-600 to-accent-800'}`}>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
                    {activeLogin === 'gov' ? <ShieldCheck className="w-8 h-8 text-white" /> : <HardHat className="w-8 h-8 text-white" />}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {activeLogin === 'gov' ? 'Government Secure Login' : 'Contractor Portal Login'}
                  </h2>
                  <p className="text-white/80 text-sm">
                    Enter your credentials to access the infrastructure network.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="p-8 space-y-5 bg-white/50 dark:bg-slate-900/50">
                  {activeLogin === 'contractor' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Registered Company Name</label>
                      <div className="relative">
                        <Building className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input required type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition-all shadow-sm" placeholder="e.g. Alpha Infra Ltd." />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 outline-none transition-all shadow-sm ${activeLogin === 'gov' ? 'focus:ring-brand-500 focus:border-brand-500' : 'focus:ring-accent-500 focus:border-accent-500'}`} placeholder="name@example.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 outline-none transition-all shadow-sm ${activeLogin === 'gov' ? 'focus:ring-brand-500 focus:border-brand-500' : 'focus:ring-accent-500 focus:border-accent-500'}`} placeholder="••••••••" />
                    </div>
                  </div>
                  {authError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className={`w-full mt-2 py-3.5 rounded-xl text-white font-bold shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${activeLogin === 'gov'
                      ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30'
                      : 'bg-accent-600 hover:bg-accent-700 shadow-accent-500/30'
                      }`}
                  >
                    {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate Identity"}
                  </button>

                  <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-4">
                    Prototype Version 1.0 (Simulation Mode)
                  </p>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
