"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit2, Check, IndianRupee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCommonExpenses, addCommonExpense, updateCommonExpense, deleteCommonExpense } from "@/actions/commonExpenses";
import { Spinner } from "@/components/ui/Spinner";
import ConfirmModal from "./ConfirmModal";

interface CommonExpensesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommonExpensesModal({ isOpen, onClose }: CommonExpensesModalProps) {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [newName, setNewName] = useState("");
    const [newAmount, setNewAmount] = useState("");
    const [showInputs, setShowInputs] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getCommonExpenses();
            setExpenses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen]);

    const handleAdd = async () => {
        if (!newName || !newAmount) return;
        setIsSaving(true);
        try {
            await addCommonExpense(newName, parseFloat(newAmount));
            setNewName("");
            setNewAmount("");
            setShowInputs(false);
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setIsSaving(true);
        try {
            await deleteCommonExpense(id);
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                            className="relative bg-white w-[calc(100%-2rem)] sm:w-full max-w-md rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-none">Global Expenses</h2>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Manage common presets</p>
                                </div>
                                <button onClick={onClose} className="p-2 sm:p-3 hover:bg-slate-200 rounded-2xl text-slate-400 transition-all active:scale-95">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto no-scrollbar">
                                {showInputs ? (
                                    <div className="bg-blue-50/50 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-blue-100/50 space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-1">Add New Expense</h4>
                                            <button onClick={() => setShowInputs(false)} className="text-blue-400 hover:text-blue-600">
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Expense Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Petrol"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300 font-bold text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={newAmount}
                                                        onChange={(e) => setNewAmount(e.target.value)}
                                                        className="w-full pl-7 pr-4 py-3 bg-white border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleAdd}
                                            disabled={!newName || !newAmount || isSaving}
                                            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} /> Add to Global List
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowInputs(true)}
                                        className="w-full py-4 bg-white border-2 border-dashed border-blue-100 text-blue-500 font-black rounded-[1.5rem] sm:rounded-[2rem] text-[10px] uppercase tracking-[0.2em] hover:bg-blue-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Add New Expense
                                    </button>
                                )}

                                {/* List */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Managed Presets</h3>
                                    {isLoading ? (
                                        <div className="py-10 flex justify-center"><Spinner size={24} /></div>
                                    ) : expenses.length === 0 ? (
                                        <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest">
                                            No common expenses yet
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {expenses.map((exp) => (
                                                <div key={exp.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-800">{exp.name}</span>
                                                        <span className="text-[10px] font-black text-blue-500 italic">₹{parseFloat(exp.amount).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex gap-1.5 transition-opacity">
                                                        <button
                                                            onClick={() => handleDelete(exp.id)}
                                                            className="p-2  text-slate-400 bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={16} color="red" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
