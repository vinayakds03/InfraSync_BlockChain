"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardHat, Loader2, ArrowLeft, ArrowRight, CheckCircle, Award } from "lucide-react";
import Link from "next/link";
import BidForm from "@/components/BidForm";
import { useWriteContract, useAccount } from 'wagmi';
import { stringToHex, pad, parseAbi } from 'viem';
import { toast } from "sonner";

interface Tender {
    id: string;
    title: string;
    state: string;
    road_length_km: number;
    status: "OPEN" | "CLOSED";
    bidCount: number;
}

export default function ContractorDashboard() {
    const { isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Selection
    const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

    const handleBidSubmit = async (formData: Record<string, any>) => {
        if (!selectedTender) return;
        if (!isConnected) {
            toast.error("Web3 Security Error", { description: "Please connect your MetaMask Wallet using the button in the top right corner before submitting a bid!" });
            return;
        }
        setSubmitting(true);
        setSuccessMsg(null);

        const finalData: Record<string, any> & { State: string; Road_Length_km: number } = {
            ...formData,
            State: selectedTender.state,
            Road_Length_km: selectedTender.road_length_km
        };

        try {
            // Ensure state code is exactly 32 bytes for the smart contract
            const stateCodeBytes32 = pad(stringToHex(finalData.State.substring(0, 2).toUpperCase() || "MH"), { size: 32 });

            // Step 1: Submit bid data to backend for ML evaluation first (10s timeout)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            let backendRes: Response;
            try {
                backendRes = await fetch(`http://localhost:8000/api/tenders/${selectedTender.id}/bids`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(finalData),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
            } catch (fetchErr: any) {
                clearTimeout(timeoutId);
                if (fetchErr.name === 'AbortError') {
                    throw new Error("⏱️ Backend timed out (10s). Is 'uvicorn api:app --reload' running in a terminal?");
                }
                throw new Error("🔌 Cannot reach backend at localhost:8000. Start the Python API server first.");
            }

            if (!backendRes.ok) {
                const errData = await backendRes.json();
                throw new Error(errData.detail || "Backend rejected the bid.");
            }

            // Step 2: Submit bid to blockchain via MetaMask
            toast.info("Bid saved to backend", { description: "MetaMask will now open to record it on the blockchain. Please check your browser extension." });

            // fd = safe any-cast for dynamic form fields (all filled at runtime by BidForm)
            const fd = finalData as Record<string, any>;
            const txHash = await writeContractAsync({
                address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                abi: parseAbi([
                    "function submitBid(uint256 tenderId, uint96 bidAmount, bytes32 stateCode, uint8 roadType, uint8 terrainType, uint8 soilType, uint256 roadLengthMeters, uint8 lanes, uint256 numWorkers, uint256 durationDays, uint256 subgradeCBRValueX100, uint256 pavementThicknessMm, uint256 earthworkVolumeM3, uint8 bridgeCount, uint8 culvertCount)"
                ]),
                functionName: 'submitBid',
                args: [
                    BigInt(selectedTender.id || 1),
                    BigInt(fd.Bid_Amount || 0),
                    stateCodeBytes32,
                    0, // RoadType.Highway
                    0, // TerrainType.Flat
                    0, // SoilType.Clay
                    BigInt(Math.floor(finalData.Road_Length_km * 1000)),
                    Number(fd.Lanes || 2),
                    BigInt(fd.Num_Workers || 0),
                    BigInt(fd.Duration_days || 0),
                    BigInt(Math.floor((fd.Subgrade_CBR_Value || 0) * 100)),
                    BigInt(fd.Pavement_Thickness_mm || 0),
                    BigInt(fd.Earthwork_Volume_m3 || 0),
                    Number(fd.Bridge_Count || 0),
                    Number(fd.Culvert_Count || 0)
                ],
                gas: BigInt(500000)
            });

            console.log("✅ Blockchain Txn Hash:", txHash);
            setSuccessMsg("Bid submitted to AI evaluation and recorded on the Blockchain!");
            setTimeout(() => {
                setSelectedTender(null);
                setSuccessMsg(null);
                fetchTenders();
            }, 3000);
        } catch (err: any) {
            console.error("Submission error:", err);
            toast.error("Transaction failed", { description: err.shortMessage || err.message || "Check MetaMask." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen relative p-8 md:p-12 w-full max-w-7xl mx-auto">
            {/* Background decoration elements */}
            <div className="bg-blob-2 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                    <div className="bg-accent-100 dark:bg-accent-900/40 p-3 rounded-2xl text-accent-600 dark:text-accent-400">
                        <HardHat className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Contractor Portal</h1>
                        <p className="text-slate-500 dark:text-slate-400">Find and bid on infrastructure projects</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {!selectedTender ? (
                        <Link
                            href="/contractor/profile"
                            className="flex items-center gap-2 text-accent-600 hover:text-accent-800 bg-accent-100/50 dark:bg-accent-900/30 px-4 py-2 rounded-full transition-colors font-medium border border-accent-200 dark:border-accent-800 shadow-sm"
                        >
                            <Award className="w-5 h-5" /> View NFT Certificates
                        </Link>
                    ) : (
                        <button
                            onClick={() => setSelectedTender(null)}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
                        >
                            <ArrowLeft className="w-5 h-5" /> Back to Tenders
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!selectedTender ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {isLoading ? (
                            <div className="col-span-full flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent-500" /></div>
                        ) : tenders.length === 0 ? (
                            <div className="col-span-full text-center p-12 glass-panel rounded-3xl text-slate-500">No tenders available exactly right now. Please check back later.</div>
                        ) : (
                            tenders.map((tender, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={tender.id}
                                    className={`glass-panel p-6 rounded-3xl flex flex-col justify-between transition-all ${tender.status === 'OPEN' ? 'hover:shadow-2xl hover:border-accent-500 hover:-translate-y-1 cursor-pointer' : 'opacity-70 grayscale'}`}
                                    onClick={() => tender.status === 'OPEN' && setSelectedTender(tender)}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{tender.title}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${tender.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                {tender.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-6 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <span className="text-slate-400">Location</span>
                                                <span className="text-slate-800 dark:text-slate-200">{tender.state}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <span className="text-slate-400">Road Length</span>
                                                <span className="text-slate-800 dark:text-slate-200">{tender.road_length_km} km</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Competition</span>
                                                <span className="text-accent-600 dark:text-accent-400">{tender.bidCount} Bids Submitted</span>
                                            </div>
                                        </div>
                                    </div>

                                    {tender.status === 'OPEN' ? (
                                        <div className="text-accent-600 dark:text-accent-400 text-sm font-semibold flex flex-row items-center justify-between">
                                            <span>Prepare Bid</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    ) : (
                                        <div className="text-slate-500 text-sm font-semibold text-center italic">
                                            Bidding Closed
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full"
                    >
                        <div className="glass-panel rounded-3xl p-6 mb-8 border-l-4 border-l-accent-500">
                            <h2 className="text-xl font-bold mb-1">Bidding on: {selectedTender.title}</h2>
                            <p className="text-slate-500 flex items-center gap-4 text-sm font-medium">
                                <span>Constraints:</span>
                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-800 dark:text-slate-300">📍 {selectedTender.state}</span>
                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-800 dark:text-slate-300">📏 {selectedTender.road_length_km} km</span>
                                <span className="text-xs italic text-slate-400">(Pre-filled & Locked in Form below)</span>
                            </p>
                        </div>

                        {successMsg ? (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-8 text-center glass-panel rounded-3xl bg-green-50/50 dark:bg-green-900/10 border-green-200">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">Success!</h2>
                                <p className="text-green-600 dark:text-green-500 mt-2">{successMsg}</p>
                            </motion.div>
                        ) : (
                            <BidForm onSubmit={handleBidSubmit} isLoading={submitting} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
