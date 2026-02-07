import React, { useState } from "react";
import { addClient } from "@/actions/clients";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ClientModal({ isOpen, onClose, onSuccess }: ClientModalProps) {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await addClient(name, location);
            setName("");
            setLocation("");
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden"
                    >
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-base font-black text-slate-900 tracking-tight">Add New Client/Site</h2>
                            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {error && <div className="p-2 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg border border-rose-100">{error}</div>}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Client/Project Name</label>
                                <input
                                    required
                                    maxLength={15}
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
                                    placeholder="e.g. Area A"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Location/Tag</label>
                                <input
                                    required
                                    maxLength={15}
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
                                    placeholder="e.g. Sector 12"
                                />
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-blue-200 hover:opacity-90 transition-all disabled:opacity-50 mt-2"
                            >
                                {loading ? "Adding..." : "Add Client"}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
