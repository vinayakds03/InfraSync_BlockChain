"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";

interface BidFormProps {
    onSubmit: (formData: Record<string, any>) => void;
    isLoading: boolean;
}

export default function BidForm({ onSubmit, isLoading }: BidFormProps) {
    const [formData, setFormData] = useState({
        Contractor_Name: "",
        Bid_Amount: "",
        State: "Gujarat",
        Road_Type: "National Highway",
        Terrain_Type: "Plain",
        Soil_Type: "Clay",
        Pavement_Type: "Bituminous",
        Road_Length_km: "",
        Lanes: "",
        Road_Width_m: "",
        Num_Workers: "",
        Duration_days: "",
        Average_Daily_Wage_INR: "",
        Subgrade_CBR_Value: "",
        Pavement_Thickness_mm: "",
        Earthwork_Volume_m3: "",
        Embankment_Height_m: "",
        Bridge_Count: "",
        Culvert_Count: "",
        Drainage_Length_m: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Convert numeric fields from string to number
        const processedData = {
            ...formData,
            Bid_Amount: Number(formData.Bid_Amount),
            Road_Length_km: Number(formData.Road_Length_km),
            Lanes: Number(formData.Lanes),
            Road_Width_m: Number(formData.Road_Width_m),
            Num_Workers: Number(formData.Num_Workers),
            Duration_days: Number(formData.Duration_days),
            Average_Daily_Wage_INR: Number(formData.Average_Daily_Wage_INR),
            Subgrade_CBR_Value: Number(formData.Subgrade_CBR_Value),
            Pavement_Thickness_mm: Number(formData.Pavement_Thickness_mm),
            Earthwork_Volume_m3: Number(formData.Earthwork_Volume_m3),
            Embankment_Height_m: Number(formData.Embankment_Height_m),
            Bridge_Count: Number(formData.Bridge_Count),
            Culvert_Count: Number(formData.Culvert_Count),
            Drainage_Length_m: Number(formData.Drainage_Length_m)
        };

        onSubmit(processedData);
    };

    const inputClasses = "w-full rounded-xl border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 px-4 py-3 text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:ring-brand-500 transition-colors shadow-sm";
    const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-5xl mx-auto mt-8 glass-panel rounded-3xl overflow-hidden"
        >
            <div className="bg-gradient-to-r from-brand-600 to-accent-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Contractor Bid Submission Form</h2>
                <p className="text-brand-100 mt-1">Fill out the project details to evaluate your bid against the AI-predicted cost.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Core Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">Contractor & Bid Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClasses}>Contractor Name</label>
                            <input required type="text" name="Contractor_Name" value={formData.Contractor_Name} onChange={handleChange} className={inputClasses} placeholder="e.g. Alpha Construction" />
                        </div>
                        <div>
                            <label className={labelClasses}>Total Bid Amount (INR)</label>
                            <input required type="number" step="0.01" name="Bid_Amount" value={formData.Bid_Amount} onChange={handleChange} className={inputClasses} placeholder="e.g. 350000000" />
                        </div>
                    </div>
                </div>

                {/* Project Type */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">Location & Terrain Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className={labelClasses}>State</label>
                            <select name="State" value={formData.State} onChange={handleChange} className={inputClasses}>
                                <option value="Karnataka">Karnataka</option>
                                <option value="Tamil Nadu">Tamil Nadu</option>
                                <option value="Uttar Pradesh">Uttar Pradesh</option>
                                <option value="Gujarat">Gujarat</option>
                                <option value="Rajasthan">Rajasthan</option>
                                <option value="Kerala">Kerala</option>
                                <option value="Punjab">Punjab</option>
                                <option value="Haryana">Haryana</option>
                                <option value="Madhya Pradesh">Madhya Pradesh</option>
                                <option value="Maharashtra">Maharashtra</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Road Type</label>
                            <select name="Road_Type" value={formData.Road_Type} onChange={handleChange} className={inputClasses}>
                                <option value="National Highway">National Highway</option>
                                <option value="State Highway">State Highway</option>
                                <option value="Urban Road">Urban Road</option>
                                <option value="Village Road">Village Road</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Terrain Type</label>
                            <select name="Terrain_Type" value={formData.Terrain_Type} onChange={handleChange} className={inputClasses}>
                                <option value="Plain">Plain</option>
                                <option value="Hilly">Hilly</option>
                                <option value="Coastal">Coastal</option>
                                <option value="Desert">Desert</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Soil Type</label>
                            <select name="Soil_Type" value={formData.Soil_Type} onChange={handleChange} className={inputClasses}>
                                <option value="Sandy">Sandy</option>
                                <option value="Rocky">Rocky</option>
                                <option value="Black Cotton">Black Cotton</option>
                                <option value="Clay">Clay</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">Road Dimensions & Materials</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className={labelClasses}>Road Length (km)</label>
                            <input required type="number" step="0.1" name="Road_Length_km" value={formData.Road_Length_km} onChange={handleChange} className={inputClasses} placeholder="15" />
                        </div>
                        <div>
                            <label className={labelClasses}>Number of Lanes</label>
                            <input required type="number" name="Lanes" value={formData.Lanes} onChange={handleChange} className={inputClasses} placeholder="4" />
                        </div>
                        <div>
                            <label className={labelClasses}>Road Width (m)</label>
                            <input required type="number" step="0.1" name="Road_Width_m" value={formData.Road_Width_m} onChange={handleChange} className={inputClasses} placeholder="14.0" />
                        </div>
                        <div>
                            <label className={labelClasses}>Pavement Type</label>
                            <select name="Pavement_Type" value={formData.Pavement_Type} onChange={handleChange} className={inputClasses}>
                                <option value="Bituminous">Bituminous</option>
                                <option value="Concrete">Concrete</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Subgrade CBR Value</label>
                            <input required type="number" step="0.1" name="Subgrade_CBR_Value" value={formData.Subgrade_CBR_Value} onChange={handleChange} className={inputClasses} placeholder="8" />
                        </div>
                        <div>
                            <label className={labelClasses}>Pavement Thickness (mm)</label>
                            <input required type="number" name="Pavement_Thickness_mm" value={formData.Pavement_Thickness_mm} onChange={handleChange} className={inputClasses} placeholder="600" />
                        </div>
                    </div>
                </div>

                {/* Construction Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">Construction & Labor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className={labelClasses}>Earthwork Vol (m³)</label>
                            <input required type="number" step="1" name="Earthwork_Volume_m3" value={formData.Earthwork_Volume_m3} onChange={handleChange} className={inputClasses} placeholder="120000" />
                        </div>
                        <div>
                            <label className={labelClasses}>Embankment Height (m)</label>
                            <input required type="number" step="0.1" name="Embankment_Height_m" value={formData.Embankment_Height_m} onChange={handleChange} className={inputClasses} placeholder="0.8" />
                        </div>
                        <div>
                            <label className={labelClasses}>Bridge Count</label>
                            <input required type="number" name="Bridge_Count" value={formData.Bridge_Count} onChange={handleChange} className={inputClasses} placeholder="1" />
                        </div>
                        <div>
                            <label className={labelClasses}>Culvert Count</label>
                            <input required type="number" name="Culvert_Count" value={formData.Culvert_Count} onChange={handleChange} className={inputClasses} placeholder="6" />
                        </div>
                        <div>
                            <label className={labelClasses}>Drainage Length (m)</label>
                            <input required type="number" step="1" name="Drainage_Length_m" value={formData.Drainage_Length_m} onChange={handleChange} className={inputClasses} placeholder="15000" />
                        </div>
                        <div>
                            <label className={labelClasses}>Number of Workers</label>
                            <input required type="number" name="Num_Workers" value={formData.Num_Workers} onChange={handleChange} className={inputClasses} placeholder="300" />
                        </div>
                        <div>
                            <label className={labelClasses}>Duration (days)</label>
                            <input required type="number" name="Duration_days" value={formData.Duration_days} onChange={handleChange} className={inputClasses} placeholder="150" />
                        </div>
                        <div>
                            <label className={labelClasses}>Avg Daily Wage (INR)</label>
                            <input required type="number" step="1" name="Average_Daily_Wage_INR" value={formData.Average_Daily_Wage_INR} onChange={handleChange} className={inputClasses} placeholder="650" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 transition-transform active:scale-95 shadow-xl flex items-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Evaluating Bid...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" /> Submit Bid for AI Evaluation
                            </>
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
