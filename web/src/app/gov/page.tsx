"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle, ShieldCheck, Loader2, Play } from "lucide-react";
import BidResults, { BidResult } from "@/components/BidResults";
import { useWriteContract } from 'wagmi';

interface Tender {
    id: string;
    title: string;
    state: string;
    road_length_km: number;
    status: "OPEN" | "CLOSED";
    bidCount: number;
}

export default function GovDashboard() {
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
    const [evalResults, setEvalResults] = useState<{ results: BidResult[], winner: BidResult | null } | null>(null);
    const [isAwarding, setIsAwarding] = useState(false);
    const { writeContractAsync } = useWriteContract();

    // Form State
    const [newTitle, setNewTitle] = useState("");
    const [newState, setNewState] = useState("Gujarat");
    const [newLength, setNewLength] = useState("");

    const fetchTenders = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/tenders");
            const data = await res.json();
            setTenders(data.tenders || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTenders();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await fetch("http://localhost:8000/api/tenders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle,
                    state: newState,
                    road_length_km: Number(newLength)
                })
            });
            setNewTitle("");
            setNewLength("");
            fetchTenders();
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEvaluate = async (tenderId: string) => {
        setEvaluatingId(tenderId);
        setEvalResults(null);
        try {
            const res = await fetch(`http://localhost:8000/api/tenders/${tenderId}/evaluate`, {
                method: "POST"
            });
            const data = await res.json();

            if (res.ok) {
                setEvalResults({
                    results: data.bids,
                    winner: data.winner
                });
                fetchTenders(); // Refresh to show CLOSED status
            } else {
                alert(data.detail || "Error evaluating tender");
            }
        } catch (e) {
            console.error(e);
            alert("Evaluation failed.");
        } finally {
            setEvaluatingId(null);
        }
    };

    const handleAwardBlockchain = async () => {
        setIsAwarding(true);
        try {
            const txHash = await writeContractAsync({
                address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                abi: ["function awardContract(uint256 tenderId, uint256 bidIndex)"],
                functionName: 'awardContract',
                args: [BigInt(1), BigInt(0)] // For MVP, we mock tender 1, bid 0
            });
            console.log("Award Tx Hash:", txHash);
            alert("✅ Contract Awarded! Soulbound NFT Certificate generated and issued to the winner's wallet.");
        } catch(e: any) {
            console.error(e);
            alert(e.message || "MetaMask Transaction failed!");
        } finally {
            setIsAwarding(false);
        }
    };

    return (
        <main className="min-h-screen relative p-8 md:p-12 w-full max-w-7xl mx-auto">
            {/* Background decoration elements */}
            <div className="bg-blob-1 pointer-events-none"></div>

            <div className="flex items-center gap-4 mb-12">
                <div className="bg-brand-100 dark:bg-brand-900/40 p-3 rounded-2xl text-brand-600 dark:text-brand-400">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Government Portal</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage infrastructure tenders and AI evaluations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Create Tender Panel */}
                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel rounded-3xl p-6 shadow-xl border-t-4 border-t-brand-500 sticky top-8"
                    >
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                            <Plus className="w-5 h-5 text-brand-500" /> Release New Tender
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Title</label>
                                <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 px-4 py-2.5 focus:border-brand-500 focus:ring-brand-500" placeholder="e.g. NH-48 Expansion" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project State</label>
                                <select value={newState} onChange={e => setNewState(e.target.value)} className="w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 px-4 py-2.5 focus:border-brand-500 focus:ring-brand-500">
                                    <option value="Gujarat">Gujarat</option>
                                    <option value="Maharashtra">Maharashtra</option>
                                    <option value="Karnataka">Karnataka</option>
                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                    <option value="Rajasthan">Rajasthan</option>
                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Road Length (km)</label>
                                <input required type="number" step="0.1" value={newLength} onChange={e => setNewLength(e.target.value)} className="w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 px-4 py-2.5 focus:border-brand-500 focus:ring-brand-500" placeholder="e.g. 25.5" />
                            </div>

                            <button
                                type="submit"
                                disabled={isCreating}
                                className="w-full py-3 mt-4 rounded-xl bg-brand-600 text-white font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition flex justify-center items-center gap-2"
                            >
                                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Contract"}
                            </button>
                        </form>
                    </motion.div>
                </div>

                {/* Tenders List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center bg-white/50 dark:bg-slate-800/30 p-4 rounded-2xl">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Active Tenders ({tenders.length})</h2>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
                    ) : tenders.length === 0 ? (
                        <div className="text-center p-12 glass-panel rounded-3xl text-slate-500">No tenders created yet.</div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence>
                                {tenders.map((tender, i) => (
                                    <motion.div
                                        key={tender.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row gap-6 md:items-center justify-between transition-all hover:shadow-lg"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{tender.title}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${tender.status === 'OPEN' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    {tender.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-4">
                                                <span>📍 {tender.state}</span>
                                                <span>📏 {tender.road_length_km} km</span>
                                                <span className="font-semibold text-brand-600 dark:text-brand-400">
                                                    {tender.bidCount} Bids Received
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0">
                                            {tender.status === 'OPEN' ? (
                                                <button
                                                    onClick={() => handleEvaluate(tender.id)}
                                                    disabled={tender.bidCount === 0 || evaluatingId === tender.id}
                                                    className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                                                >
                                                    {evaluatingId === tender.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                                    Evaluate & Award
                                                </button>
                                            ) : (
                                                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                                                    <CheckCircle className="w-5 h-5" /> Evaluation Concluded
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Inline Evaluation Results */}
                    <AnimatePresence>
                        {evalResults && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="pt-8 overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-1 rounded-3xl shadow-2xl">
                                    <div className="bg-white dark:bg-slate-950 rounded-[22px] overflow-hidden">
                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-800/30 text-yellow-800 dark:text-yellow-400 text-sm text-center font-bold">
                                            EVALUATION COMPLETE - CONTRACT AWARDED
                                        </div>
                                        <BidResults 
                                            results={evalResults.results} 
                                            winner={evalResults.winner} 
                                            onAward={handleAwardBlockchain}
                                            isAwarding={isAwarding}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
