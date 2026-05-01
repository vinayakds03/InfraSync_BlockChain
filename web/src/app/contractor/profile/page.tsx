"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Award, ShieldCheck, HardHat, Loader2, ExternalLink, Calendar, IndianRupee, Hash } from "lucide-react";
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { parseAbi, formatUnits } from 'viem';

// ─── Contract Config ────────────────────────────────────────────────────────
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const;

const ABI = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
    "function getCertificateInfo(uint256 tokenId) view returns (uint256 tenderId, uint96 bidAmount, uint64 awardedAt, address winner, bool isMilestone, uint8 milestoneIndex)",
    "event ContractAwarded(uint256 indexed tenderId, address indexed winningBidder, uint256 certificateTokenId, uint96 bidAmount)",
    "function getMilestonesCount(uint256 tenderId) view returns (uint256)",
    "function getMilestoneDetails(uint256 tenderId, uint256 milestoneIndex) view returns ((uint8 percentage, bool isProofSubmitted, bool isApproved, string proofURI))",
    "function submitMilestoneProof(uint256 tenderId, uint256 milestoneIndex, string proofURI)"
]);

// ─── Types ──────────────────────────────────────────────────────────────────
interface CertData {
    tokenId: bigint;
    tenderId: bigint;
    bidAmount: bigint;
    awardedAt: bigint;
    winner: string;
    isMilestone: boolean;
    milestoneIndex: number;
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
function CertificateCard({ cert, index, publicClient, address }: { cert: CertData; index: number; publicClient: any; address: string | undefined }) {
    const { writeContractAsync } = useWriteContract();
    const [milestones, setMilestones] = useState<any[]>([]);
    const [proofURI, setProofURI] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!publicClient) return;
        const fetchMilestones = async () => {
            try {
                const count = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: ABI,
                    functionName: 'getMilestonesCount',
                    args: [cert.tenderId],
                });
                const ms = [];
                for(let i=0; i<Number(count); i++) {
                    const details = await publicClient.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: ABI,
                        functionName: 'getMilestoneDetails',
                        args: [cert.tenderId, BigInt(i)],
                    });
                    ms.push({ index: i, percentage: details.percentage, isProofSubmitted: details.isProofSubmitted, isApproved: details.isApproved, proofURI: details.proofURI });
                }
                setMilestones(ms);
            } catch (e) {
                console.error("Failed to fetch milestones", e);
            }
        };
        fetchMilestones();
    }, [cert.tenderId, publicClient]);

    const handleSubmitProof = async (milestoneIndex: number) => {
        if (!proofURI) return alert("Please enter a Proof URI");
        setSubmitting(true);
        try {
            await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: 'submitMilestoneProof',
                args: [cert.tenderId, BigInt(milestoneIndex), proofURI],
            });
            alert("Proof submitted successfully!");
            // Ideally refetch milestones here
        } catch(e) {
            console.error(e);
            alert("Failed to submit proof");
        }
        setSubmitting(false);
        setProofURI("");
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.12 }}
            className={`relative overflow-hidden rounded-3xl p-[2px] shadow-2xl ${cert.isMilestone ? 'bg-gradient-to-br from-blue-400 via-cyan-500 to-indigo-600' : 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600'}`}
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

            <div className="relative h-full bg-slate-900 rounded-[22px] p-7 flex flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className={`w-5 h-5 ${cert.isMilestone ? 'text-blue-400' : 'text-yellow-400'}`} />
                        <span className={`${cert.isMilestone ? 'text-blue-400' : 'text-yellow-400'} font-bold tracking-widest text-xs uppercase`}>
                            {cert.isMilestone ? `Milestone ${cert.milestoneIndex + 1} Receipt` : 'Official Certificate'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-white/10 px-2.5 py-1 rounded-full text-white text-[10px] font-mono border border-white/20 tracking-widest">
                            SOULBOUND · NFT
                        </span>
                    </div>
                </div>

                {/* Title */}
                <div>
                    <h2 className="text-2xl font-black text-white leading-tight">
                        {cert.isMilestone ? 'Milestone Payout' : 'Infrastructure\nExcellence Award'}
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Awarded securely on the Ethereum Blockchain</p>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Hash className="w-3 h-3" /> Token ID
                        </p>
                        <p className={`font-bold font-mono text-lg ${cert.isMilestone ? 'text-blue-400' : 'text-yellow-400'}`}>#{cert.tokenId.toString()}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Award className="w-3 h-3" /> Tender ID
                        </p>
                        <p className="text-white font-bold font-mono text-lg">#{cert.tenderId.toString()}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" /> {cert.isMilestone ? 'Payout Amount' : 'Awarded Bid'}
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
                    <p className={`font-mono text-xs break-all ${cert.isMilestone ? 'text-blue-400' : 'text-yellow-400'}`}>{cert.winner}</p>
                </div>

                {/* Etherscan-style link placeholder */}
                <a
                    href={`#token-${cert.tokenId}`}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-yellow-400 transition-colors self-end"
                >
                    <ExternalLink className="w-3 h-3" /> View on Explorer
                </a>
                
                {/* Milestones Section - ONLY show on the MAIN certificate, not the milestone receipts! */}
                {!cert.isMilestone && milestones.length > 0 && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <h3 className="text-white font-bold mb-3 text-sm">Milestone Tracking</h3>
                        <div className="space-y-3">
                            {milestones.map((m) => {
                                // Determine if this is the active pending milestone
                                // It is active if: it is not approved AND (it is the first milestone OR the previous milestone is approved)
                                const isPreviousApproved = m.index === 0 || milestones[m.index - 1].isApproved;
                                const isNextPending = !m.isApproved && isPreviousApproved;
                                const isLocked = !m.isApproved && !isPreviousApproved;
                                const cumulativePercentage = milestones.slice(0, m.index + 1).reduce((sum, ms) => sum + ms.percentage, 0);

                                if (isLocked) {
                                    return (
                                        <div key={m.index} className="bg-black/10 p-3 rounded-lg border border-white/5 opacity-50 grayscale flex justify-between items-center text-xs">
                                            <span className="text-slate-400">Milestone {m.index + 1} ({cumulativePercentage}%)</span>
                                            <span className="text-slate-500">🔒 Locked</span>
                                        </div>
                                    );
                                }

                                return (
                                <div key={m.index} className="bg-black/30 p-3 rounded-lg border border-white/5 flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-300 font-semibold">Milestone {m.index + 1} ({cumulativePercentage}%)</span>
                                        <span className={`px-2 py-0.5 rounded-full ${m.isApproved ? 'bg-green-500/20 text-green-400' : m.isProofSubmitted ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {m.isApproved ? 'Approved & Paid' : m.isProofSubmitted ? 'Under Review' : 'Pending Proof'}
                                        </span>
                                    </div>
                                    {!m.isProofSubmitted && isNextPending && (
                                        <div className="flex gap-2 mt-2">
                                            <input 
                                                type="text" 
                                                placeholder="Proof URL (e.g. image link)"
                                                value={proofURI}
                                                onChange={(e) => setProofURI(e.target.value)}
                                                className="flex-1 bg-black/50 border border-white/10 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                            />
                                            <button 
                                                onClick={() => handleSubmitProof(m.index)}
                                                disabled={submitting}
                                                className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs font-bold hover:bg-blue-400 disabled:opacity-50"
                                            >
                                                {submitting ? '...' : 'Submit'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    </div>
                )}
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

    // Fetch all NFTs for this wallet (balanceOf + getCertificateInfo)
    // We do not rely on ContractAwarded event because Milestone NFTs are minted without that event.
    // Instead we query the balance and then fetch each token ID belonging to the user.
    // Wait, ERC721 doesn't have tokenOfOwnerByIndex natively unless it implements ERC721Enumerable.
    // TenderSystem is just ERC721. To find the user's NFTs, we either need Enumerable, or we rely on Transfer events!
    // Every mint emits a Transfer(address(0), to, tokenId) event!
    const loadCertificates = useCallback(async () => {
        if (!address || !publicClient) return;
        setLoading(true);
        setError(null);
        try {
            // Get all Transfer events to this address
            const rawLogs = await publicClient.getLogs({
                address: CONTRACT_ADDRESS,
                event: parseAbi(["event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"])[0],
                args: { to: address },
                fromBlock: BigInt(0),
                toBlock: 'latest',
            });
            console.log("Transfer logs found:", rawLogs);

            const logs = rawLogs.filter((log: any) => 
                log.args.to?.toLowerCase() === address.toLowerCase()
            );

            if (logs.length === 0) {
                setCerts([]);
                return;
            }

            // 2. For each token, read on-chain certificate metadata
            const certDataArr = await Promise.all(
                logs.map(async (log: any) => {
                    const tokenId = log.args.tokenId as bigint;
                    const info = await publicClient.readContract({
                        address: CONTRACT_ADDRESS,
                        abi: ABI,
                        functionName: 'getCertificateInfo',
                        args: [tokenId],
                    }) as readonly [bigint, bigint, bigint, string, boolean, number];

                    return {
                        tokenId,
                        tenderId:  info[0],
                        bidAmount: info[1],
                        awardedAt: info[2],
                        winner:    info[3],
                        isMilestone: info[4],
                        milestoneIndex: info[5],
                    } satisfies CertData;
                })
            );

            // Sort so that Main Awards are first, then milestones sequentially
            certDataArr.sort((a, b) => {
                if (a.tenderId !== b.tenderId) return Number(b.tenderId - a.tenderId);
                if (a.isMilestone !== b.isMilestone) return a.isMilestone ? 1 : -1;
                return a.milestoneIndex - b.milestoneIndex;
            });

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
                    {/* items-start prevents cards from stretching vertically to match the tallest card in the row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {certs.map((cert, i) => (
                            <CertificateCard key={cert.tokenId.toString()} cert={cert} index={i} publicClient={publicClient} address={address} />
                        ))}
                    </div>
                </>
            )}
        </main>
    );
}
