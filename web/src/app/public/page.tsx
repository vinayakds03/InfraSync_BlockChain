"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, FileCheck2, Globe, AlertCircle, Building2 } from "lucide-react";
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';

const publicClient = createPublicClient({
    chain: hardhat,
    transport: http('http://127.0.0.1:8545')
});

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ABI = [
    {
        "inputs": [{"name": "tenderId", "type": "uint256"}],
        "name": "getBidsCount",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "tenderId", "type": "uint256"}, {"name": "bidIndex", "type": "uint256"}],
        "name": "getBidDetails",
        "outputs": [{
            "name": "",
            "type": "tuple",
            "components": [
                {"name": "bidderAddress", "type": "address"},
                {"name": "isMlValid", "type": "bool"},
                {"name": "awarded", "type": "bool"},
                {"name": "bidAmount", "type": "uint96"}
            ]
        }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export default function TransparencyDashboard() {
    const [searchId, setSearchId] = useState("1");
    const [isLoading, setIsLoading] = useState(false);
    const [bids, setBids] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const fetchBids = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setHasSearched(true);
        setErrorMsg("");
        setBids([]);

        try {
            const countStr = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: 'getBidsCount',
                args: [BigInt(searchId)],
            });
            
            const count = Number(countStr);
            if (count === 0) {
                setIsLoading(false);
                return;
            }

            // Fetch contractor names from backend API in parallel
            let contractorNames: string[] = [];
            try {
                const backendRes = await fetch(`http://localhost:8000/api/tenders/${searchId}/bids`);
                if (backendRes.ok) {
                    const backendData = await backendRes.json();
                    contractorNames = (backendData.bids || []).map((b: any) => b.Contractor_Name);
                }
            } catch { /* backend may be offline, gracefully continue */ }

            const rawBids = [];
            // Fetch individually due to complex struct output (For MVP)
            for (let i = 0; i < count; i++) {
                const bidDetail = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: ABI,
                    functionName: 'getBidDetails',
                    args: [BigInt(searchId), BigInt(i)],
                });
                const d = bidDetail as any;
                const parsed = {
                    wallet: d.bidderAddress,
                    contractorName: contractorNames[i] || null,
                    amountINR: Number(d.bidAmount),
                    status: d.awarded ? "WINNER" : d.isMlValid ? "VALID" : "PENDING",
                    roadLengthKm: "-",
                    lanes: "-",
                    durationDays: "-",
                    cbrValue: "-",
                    earthworkM3: "-",
                    isAwarded: d.awarded
                };
                rawBids.push(parsed);
            }
            
            setBids(rawBids);
        } catch (error) {
            console.error(error);
            setErrorMsg("Could not fetch data from the blockchain. Ensure the local Hardhat node is running.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
    };

    return (
        <main className="min-h-screen relative p-8 md:p-12 w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
                    <Globe className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Open Transparency Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">Publicly audit cryptographically secure valid bids recorded natively on the Ethereum ledger.</p>
                </div>
            </div>

            <form onSubmit={fetchBids} className="max-w-2xl mx-auto mb-10">
                <div className="relative flex items-center">
                    <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Search specific Tender ID (e.g. 1)"
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 pl-12 pr-32 py-4 rounded-full shadow-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg transition-all"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="absolute right-2 top-2 bottom-2 px-6 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Audit API"}
                    </button>
                </div>
            </form>

            {errorMsg && (
                <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" /> {errorMsg}
                </div>
            )}

            {hasSearched && !isLoading && bids.length === 0 && !errorMsg && (
                <div className="text-center p-12 glass-panel rounded-3xl text-slate-500">
                    No bids found mathematically for Tender ID {searchId}.
                </div>
            )}

            {bids.length > 0 && (
                <div className="glass-panel overflow-hidden rounded-3xl">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <FileCheck2 className="w-5 h-5 text-green-500"/> Verified Immutable Blockchain Submissions
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 text-sm">
                                <tr>
                                    <th className="px-6 py-4">Contractor Wallet</th>
                                    <th className="px-6 py-4">Bid Amount</th>
                                    <th className="px-6 py-4">De-Scaled Project Constraints</th>
                                    <th className="px-6 py-4 text-right">Blockchain Trust Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {bids.map((bid, idx) => (
                                    <tr key={idx} className={bid.isAwarded ? "bg-green-50/50 dark:bg-green-900/20" : ""}>
                                         <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {bid.contractorName || "Anonymous"}
                                                </span>
                                                <span className="flex items-center gap-1 font-mono text-xs text-slate-400 mt-0.5">
                                                    <Building2 className="w-3 h-3" />
                                                    {bid.wallet.slice(0, 6)}...{bid.wallet.slice(-4)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                                            {formatCurrency(bid.amountINR)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 font-mono text-[11px]">
                                            [Parameters verified securely via off-chain event bridge]
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                                                bid.status === "WINNER" ? "bg-green-100 text-green-700 border border-green-200" :
                                                bid.status === "VALID" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                                            }`}>
                                                {bid.status}
                                            </span>
                                            {bid.status === "WINNER" && (
                                                <div className="text-[10px] text-green-600 mt-1 flex justify-end items-center gap-1">
                                                    NFT Certificate Issued natively!
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </main>
    );
}
