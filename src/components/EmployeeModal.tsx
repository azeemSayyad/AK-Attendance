"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { addEmployee } from "@/actions/employees";

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeeModal({ isOpen, onClose, onSuccess }: EmployeeModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        dailyWage: "",
        phone: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await addEmployee({
                name: formData.name,
                dailyWage: parseFloat(formData.dailyWage),
                phone: formData.phone || undefined,
            });
            onSuccess();
            onClose();
            setFormData({ name: "", dailyWage: "", phone: "" });
        } catch (err: any) {
            setError(err.message || "Failed to add employee");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
                <div className="flex justify-between items-center p-6 pb-0">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add Staff</h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-2.5 bg-rose-50 text-rose-600 text-[11px] font-bold rounded-xl text-center border border-rose-100">
                            {error}
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name (Max 15)</label>
                        <input
                            required
                            maxLength={15}
                            type="text"
                            placeholder="e.g. Rajesh Kumar"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-bold"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Daily Wage (₹)</label>
                        <input
                            required
                            type="number"
                            placeholder="e.g. 800"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-bold"
                            value={formData.dailyWage}
                            onChange={(e) => setFormData({ ...formData, dailyWage: e.target.value })}
                        />
                    </div>

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black py-3 rounded-2xl shadow-lg shadow-blue-100 hover:opacity-90 transition-all disabled:opacity-50 mt-4 text-sm uppercase tracking-widest"
                    >
                        {loading ? "Saving..." : "Save Employee"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
