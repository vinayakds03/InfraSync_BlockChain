"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
    onFileUpload: (file: File) => void;
    isLoading: boolean;
    error: string | null;
}

export default function FileUpload({ onFileUpload, isLoading, error }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const processFile = (file: File) => {
        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            alert("Please upload a valid CSV file.");
            return;
        }
        setSelectedFile(file);
        onFileUpload(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 ${isDragging
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-[0_0_30px_rgba(14,165,233,0.3)]"
                        : "border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-400 glass-panel"
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">

                    <div className="relative">
                        <div className={`absolute -inset-4 rounded-full blur-xl opacity-50 transition-all ${isDragging ? 'bg-brand-400' : 'bg-transparent'}`}></div>
                        <div className="relative bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            {isLoading ? (
                                <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
                            ) : selectedFile ? (
                                <FileType className="w-12 h-12 text-accent-500" />
                            ) : (
                                <UploadCloud className={`w-12 h-12 transition-colors duration-300 ${isDragging ? 'text-brand-600' : 'text-slate-400'}`} />
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                            {isLoading ? "Evaluating Bids..." : "Upload Contractor Bids"}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                            {selectedFile && !isLoading
                                ? `Selected: ${selectedFile.name}`
                                : "Drag and drop your CSV file here, or click to browse. We will evaluate bids against our AI model."}
                        </p>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInput}
                        accept=".csv, text/csv"
                        className="hidden"
                        id="file-upload"
                    />

                    {!isLoading && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:scale-105 transition-transform active:scale-95 shadow-md flex items-center gap-2"
                        >
                            Select CSV File
                        </button>
                    )}
                </div>

                {/* Status Indicators */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-3 text-sm flex items-center justify-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </motion.div>
                    )}

                    {selectedFile && !error && !isLoading && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 p-3 text-sm flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Ready to process {selectedFile.name}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
