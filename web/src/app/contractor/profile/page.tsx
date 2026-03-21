"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Award, ShieldCheck, HardHat, Loader2, ExternalLink, Calendar, IndianRupee, Hash } from "lucide-react";
import { useAccount, usePublicClient } from 'wagmi';
import { parseAbi, formatUnits } from 'viem';

// ─── Contract Config ────────────────────────────────────────────────────────
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const;

const ABI = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
    "function getCertificateInfo(uint256 tokenId) view returns (uint256 tenderId, uint96 bidAmount, uint64 awardedAt, address winner)",
    "event ContractAwarded(uint256 indexed tenderId, address indexed winningBidder, uint256 certificateTokenId, uint96 bidAmount)",
]);

// ─── Types ──────────────────────────────────────────────────────────────────
interface CertData {
    tokenId: bigint;
    tenderId: bigint;
    bidAmount: bigint;
    awardedAt: bigint;
    winner: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatINR(wei: bigint): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Number(wei));
}

function formatDate(timestamp: bigint): string {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

// ─── Certificate Card ────────────────────────────────────────────────────────
function CertificateCard({ cert, index }: { cert: CertData; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.12 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 p-[2px] shadow-2xl"
        >
            {/* Holographic background */}
            <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none">
                <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id={`hex-${cert.tokenId}`} width="22" height="22" patternUnits="userSpaceOnUse">
                            <path d="M11 0 L22 5.5 L22 16.5 L11 22 L0 16.5 L0 5.5 Z" fill="none" stroke="white" strokeWidth="0.6" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#hex-${cert.tokenId})`} />
                </svg>
            </div>

            <div className="relative bg-slate-900 rounded-[22px] p-7 flex flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 font-bold tracking-widest text-xs uppercase">Official Certificate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-white/10 px-2.5 py-1 rounded-full text-white text-[10px] font-mono border border-white/20 tracking-widest">
                            SOULBOUND · NFT
                        </span>
                    </div>
                </div>

                {/* Title */}
                <div>
                    <h2 className="text-2xl font-black text-white leading-tight">Infrastructure<br/>Excellence Award</h2>
                    <p className="text-slate-400 text-xs mt-1">Awarded securely on the Ethereum Blockchain</p>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Hash className="w-3 h-3" /> Token ID
                        </p>
                        <p className="text-yellow-400 font-bold font-mono text-lg">#{cert.tokenId.toString()}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Award className="w-3 h-3" /> Tender ID
                        </p>
                        <p className="text-white font-bold font-mono text-lg">#{cert.tenderId.toString()}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" /> Awarded Bid
                        </p>
                        <p className="text-green-400 font-bold text-sm">{formatINR(cert.bidAmount)}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Awarded On
                        </p>
                        <p className="text-white font-semibold text-sm">{formatDate(cert.awardedAt)}</p>
                    </div>
                </div>

                {/* Winner wallet */}
                <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Verified Contractor Wallet</p>
                    <p className="text-yellow-400 font-mono text-xs break-all">{cert.winner}</p>
                </div>

                {/* Etherscan-style link placeholder */}
                <a
                    href={`#token-${cert.tokenId}`}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-yellow-400 transition-colors self-end"
                >
                    <ExternalLink className="w-3 h-3" /> View on Explorer
                </a>
            </div>
        </motion.div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ContractorProfile() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();

    const [certs, setCerts] = useState<CertData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all ContractAwarded events for this wallet, then load cert metadata
    const loadCertificates = useCallback(async () => {
        if (!address || !publicClient) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Get all ContractAwarded events from block 0
            const rawLogs = await publicClient.getLogs({
                address: CONTRACT_ADDRESS,
                event: parseAbi(["event ContractAwarded(uint256 indexed tenderId, address indexed winningBidder, uint256 certificateTokenId, uint96 bidAmount)"])[0],
                fromBlock: BigInt(0),
                toBlock: 'latest',
            });
            console.log("Raw logs found:", rawLogs);

            // Manual filter bypassing strict RPC topic maps
            const logs = rawLogs.filter((log: any) => 
                log.args.winningBidder?.toLowerCase() === address.toLowerCase()
            );

            if (logs.length === 0) {
                setCerts([]);
                return;
            }

            // 2. For each event, read on-chain certificate metadata
            const certDataArr = await Promise.all(
                logs.map(async (log: any) => {
                    const tokenId = log.args.certificateTokenId as bigint;
                    const info = await publicClient.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: ABI,
                        functionName: 'getCertificateInfo',
                        args: [tokenId],
                    }) as readonly [bigint, bigint, bigint, string];

                    return {
                        tokenId,
                        tenderId:  info[0],
                        bidAmount: info[1],
                        awardedAt: info[2],
                        winner:    info[3],
                    } satisfies CertData;
                })
            );

            setCerts(certDataArr);
        } catch (e: any) {
            console.error("Failed to load certificates:", e);
            setError("Could not load certificates. Make sure the local Hardhat node is running.");
        } finally {
            setLoading(false);
        }
    }, [address, publicClient]);

    useEffect(() => {
        if (isConnected && address) loadCertificates();
    }, [isConnected, address, loadCertificates]);

    return (
        <main className="min-h-screen relative p-8 md:p-12 w-full max-w-5xl mx-auto">
            {/* Page header */}
            <div className="flex items-center gap-4 mb-12">
                <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-2xl text-purple-600 dark:text-purple-400">
                    <Award className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Contractor Reputation</h1>
                    <p className="text-slate-500 dark:text-slate-400">Your Immutable Soulbound NFT Certificates — visible directly from your wallet</p>
                </div>
            </div>

            {!mounted ? (
                <div className="flex justify-center p-12">
                    <div className="w-32 h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
                </div>
            ) : !isConnected ? (
                <div className="text-center p-12 glass-panel rounded-3xl text-slate-500">
                    Please connect your MetaMask wallet in the top right to view your certificates.
                </div>
            ) : loading ? (
                <div className="flex flex-col items-center justify-center gap-4 p-16">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                    <p className="text-slate-400 text-sm">Reading certificates from the blockchain…</p>
                </div>
            ) : error ? (
                <div className="text-center p-12 glass-panel rounded-3xl text-red-500 border border-red-200 dark:border-red-800">
                    {error}
                    <button
                        onClick={loadCertificates}
                        className="block mt-4 mx-auto text-sm text-purple-500 hover:underline"
                    >
                        Retry
                    </button>
                </div>
            ) : certs.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center p-16 glass-panel rounded-3xl text-slate-500 border border-slate-200 dark:border-slate-800"
                >
                    <HardHat className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Certificates Yet</h2>
                    <p>Go to the Contractor Portal, submit valid bids, and win government tenders to earn your first Soulbound NFT.</p>
                </motion.div>
            ) : (
                <>
                    <div className="mb-6 flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-semibold">
                            <ShieldCheck className="w-4 h-4" />
                            {certs.length} Certificate{certs.length > 1 ? 's' : ''} Earned
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {certs.map((cert, i) => (
                            <CertificateCard key={cert.tokenId.toString()} cert={cert} index={i} />
                        ))}
                    </div>
                </>
            )}
        </main>
    );
}
