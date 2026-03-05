"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowDown, ArrowUp, CheckCircle, AlertCircle, IndianRupee } from "lucide-react";

export interface BidResult {
    contractor: string;
    bid: number;
    predicted: number;
    lower_bound: number;
    status: string;
    is_valid: boolean;
}

interface BidResultsProps {
    results: BidResult[];
    winner: BidResult | null;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
};

export default function BidResults({ results, winner }: BidResultsProps) {
    if (!results || results.length === 0) return null;

    return (
        <div className="w-full max-w-5xl mx-auto mt-12 space-y-8 pb-20">

            {/* Winner Spotlight Card */}
            {winner ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-accent-600 p-1 shadow-2xl"
                >
                    {/* Animated background lines */}
                    <div className="absolute inset-0 opacity-20">
                        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M0 40V0H40" fill="none" stroke="white" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                        </svg>
                    </div>

                    <div className="relative h-full w-full bg-white dark:bg-slate-900 rounded-[22px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-shrink-0 bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/40 dark:to-accent-900/40 p-6 rounded-full shadow-inner">
                            <Trophy className="w-16 h-16 text-accent-500" />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <p className="text-sm font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-accent-500 uppercase mb-2">
                                Winning Contractor
                            </p>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
                                {winner.contractor}
                            </h2>

                            <div className="flex flex-col sm:flex-row items-center gap-6 mt-6">
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex-1 w-full border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bid Amount</p>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center md:justify-start">
                                        {formatCurrency(winner.bid)}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex-1 w-full border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Predicted Value</p>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center md:justify-start">
                                        {formatCurrency(winner.predicted)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:flex absolute top-6 right-6">
                            <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                                <CheckCircle className="w-4 h-4" />
                                Optimal Value
                            </span>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-3xl p-8 text-center"
                >
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No Valid Bids Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">All submitted bids were either too high or suspiciously low based on the AI model predictions (-3% margin).</p>
                </motion.div>
            )}

            {/* Comprehensive Results Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-panel overflow-hidden rounded-3xl"
            >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        Detailed Evaluation Report
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-medium">
                            <tr>
                                <th className="px-6 py-4">Contractor</th>
                                <th className="px-6 py-4">Bid Amount</th>
                                <th className="px-6 py-4">AI Prediction</th>
                                <th className="px-6 py-4">Difference</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {results.map((result, idx) => {
                                const diffPct = ((result.bid - result.predicted) / result.predicted) * 100;
                                const isWinner = winner?.contractor === result.contractor;

                                return (
                                    <motion.tr
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + (idx * 0.05) }}
                                        key={idx}
                                        className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${isWinner ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            {isWinner && <Trophy className="w-4 h-4 text-accent-500" />}
                                            <span className={`font-semibold ${isWinner ? 'text-brand-600 dark:text-brand-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {result.contractor}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                            {formatCurrency(result.bid)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {formatCurrency(result.predicted)}
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-1 font-medium">
                                            {diffPct > 0 ? (
                                                <span className="text-red-500 flex items-center gap-1">
                                                    <ArrowUp className="w-3 h-3" /> +{diffPct.toFixed(2)}%
                                                </span>
                                            ) : (
                                                <span className={result.is_valid ? "text-green-500 flex items-center gap-1" : "text-yellow-600 flex items-center gap-1"}>
                                                    <ArrowDown className="w-3 h-3" /> {diffPct.toFixed(2)}%
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${result.status === "Accepted"
                                                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30"
                                                    : result.status.includes("High")
                                                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30"
                                                        : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30"
                                                }`}>
                                                {result.status}
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
