"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();

    // Simple hide header on home/login page
    if (pathname === "/") return null;

    const handleLogout = () => {
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
