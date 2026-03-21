"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export default function Header() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const pathname = usePathname();
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    // Simple hide header on home/login page
    if (pathname === "/") return null;

    const handleLogout = () => {
        disconnect();
        localStorage.removeItem("userRole");
        router.push("/");
    };

    return (
        <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">

                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:shadow-brand-500/50 transition-all">
                        In
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                        infr<span className="text-brand-500">Sync</span>
                    </span>
                </Link>

                <nav className="flex items-center gap-6">
                    <Link
                        href="/public"
                        className={`text-sm font-semibold transition-colors ${pathname === '/public' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Public Audit
                    </Link>
                    <Link
                        href="/gov"
                        className={`text-sm font-semibold transition-colors ${pathname === '/gov' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Gov Portal
                    </Link>
                    <Link
                        href="/contractor"
                        className={`text-sm font-semibold transition-colors ${pathname === '/contractor' ? 'text-accent-600 dark:text-accent-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Contractor Portal
                    </Link>

                    {mounted ? (
                        isConnected ? (
                            <button
                                onClick={() => disconnect()}
                                className="ml-2 flex items-center gap-2 text-sm font-medium text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full dark:bg-brand-900/20"
                                title={address}
                            >
                                <Wallet className="w-4 h-4" /> 
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </button>
                        ) : (
                            <button
                                onClick={() => connect({ connector: injected() })}
                                className="ml-2 flex items-center gap-2 text-sm font-medium text-white bg-brand-600 px-3 py-1.5 rounded-full hover:bg-brand-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                            >
                                <Wallet className="w-4 h-4" /> Connect Wallet
                            </button>
                        )
                    ) : (
                        <div className="ml-2 w-32 h-8 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
                    )}

                    <button
                        onClick={handleLogout}
                        className="ml-4 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-full transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </nav>

            </div>
        </header>
    );
}
