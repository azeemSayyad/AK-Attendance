"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Check, IndianRupee, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCommonExpenses } from "@/actions/commonExpenses";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface ExpenseSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selectedExpenses: { name: string; amount: number }[]) => void;
}

export default function ExpenseSelectorModal({ isOpen, onClose, onSelect }: ExpenseSelectorModalProps) {
    const [commonExpenses, setCommonExpenses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [customExpenses, setCustomExpenses] = useState<{ name: string; amount: string }[]>([]);
    const [customName, setCustomName] = useState("");
    const [customAmount, setCustomAmount] = useState("");

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const data = await getCommonExpenses();
                    setCommonExpenses(data);
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
            setSelectedIds([]);
            setCustomExpenses([]);
            setCustomName("");
            setCustomAmount("");
        }
    }, [isOpen]);

    const toggleCommon = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const addCustom = () => {
        if (!customName || !customAmount) return;
        setCustomExpenses([...customExpenses, { name: customName, amount: customAmount }]);
        setCustomName("");
        setCustomAmount("");
    };

    const removeCustom = (index: number) => {
        setCustomExpenses(customExpenses.filter((_, i) => i !== index));
    };

    const handleConfirm = () => {
        const selectedCommon = commonExpenses
            .filter(exp => selectedIds.includes(exp.id))
            .map(exp => ({ name: exp.name, amount: parseFloat(exp.amount) }));

        const selectedCustom = customExpenses.map(exp => ({
            name: exp.name,
            amount: parseFloat(exp.amount)
        }));

        onSelect([...selectedCommon, ...selectedCustom]);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white w-[calc(100%-2rem)] sm:w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none">Add Expenses</h3>
                                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Select or add custom</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
                            {/* Global Picklist */}
                            <div className="space-y-3">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Common Presets</h4>
                                {isLoading ? (
                                    <div className="py-4 flex justify-center"><Spinner size={20} /></div>
                                ) : commonExpenses.length === 0 ? (
                                    <p className="text-[10px] text-slate-300 font-bold text-center py-4 uppercase italic">No global presets found</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {commonExpenses.map(exp => (
                                            <button
                                                key={exp.id}
                                                onClick={() => toggleCommon(exp.id)}
                                                className={cn(
                                                    "p-3 rounded-2xl border transition-all text-left flex items-center justify-between",
                                                    selectedIds.includes(exp.id)
                                                        ? "bg-blue-50 border-blue-200"
                                                        : "bg-white border-slate-100"
                                                )}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={cn("text-xs font-bold", selectedIds.includes(exp.id) ? "text-blue-700" : "text-slate-700")}>{exp.name}</span>
                                                    <span className="text-[8px] text-slate-400 font-black">₹{parseFloat(exp.amount).toLocaleString()}</span>
                                                </div>
                                                <div className={cn(
                                                    "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    selectedIds.includes(exp.id) ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-200" : "border-slate-200"
                                                )}>
                                                    {selectedIds.includes(exp.id) && <Check size={12} className="text-white" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Custom Addition */}
                            <div className="space-y-3">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">One-time Custom</h4>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-1 xs:grid-cols-[1fr,80px,40px] gap-2">
                                        <input
                                            type="text"
                                            placeholder="Item"
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                        <input
                                            type="number"
                                            placeholder="₹"
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                        <button
                                            onClick={addCustom}
                                            disabled={!customName || !customAmount}
                                            className="flex items-center justify-center p-2 bg-blue-600 text-white rounded-xl active:scale-95 disabled:opacity-30"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    {customExpenses.length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            {customExpenses.map((exp, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{exp.name}</span>
                                                        <span className="text-[8px] text-slate-400 font-bold">₹{parseFloat(exp.amount).toLocaleString()}</span>
                                                    </div>
                                                    <button onClick={() => removeCustom(idx)} className="text-red-400 hover:text-red-500 p-1">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={handleConfirm}
                                disabled={selectedIds.length === 0 && customExpenses.length === 0}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                Confirm Expenses
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
