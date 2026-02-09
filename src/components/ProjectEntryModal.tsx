"use client";

import React, { useState, useEffect } from "react";
import { X, Users, IndianRupee, Calendar as CalendarIcon, Check, Plus, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { updateWorkforce, logClientMoney, deleteProjectEntry } from "@/actions/clients";
import { addProjectExpense, deleteProjectExpense } from "@/actions/expenses";
import { Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import ConfirmModal from "./ConfirmModal";
import ExpenseSelectorModal from "./ExpenseSelectorModal";

interface ProjectEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    clientId: number;
    employees: any[];
    initialDate?: string;
    initialEmployees?: number[];
    initialMoney?: number;
    initialExpenses?: { id?: number, name: string, amount: number }[];
    isEditMode?: boolean; // Track if editing existing entry
    onDelete?: () => void; // Optional delete callback
}

const DEFAULT_EMPS: number[] = [];

// Sub-component for workforce selection
function WorkforceSelectorModal({
    isOpen,
    onClose,
    employees,
    selectedIds,
    onSelect
}: {
    isOpen: boolean;
    onClose: () => void;
    employees: any[];
    selectedIds: number[];
    onSelect: (ids: number[]) => void;
}) {
    const [tempSelected, setTempSelected] = useState<number[]>(selectedIds);

    useEffect(() => {
        if (isOpen) setTempSelected(selectedIds);
    }, [isOpen, selectedIds]);

    const toggle = (id: number) => {
        setTempSelected(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
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
                        className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 leading-none">Select Staff</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{tempSelected.length} picked</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto no-scrollbar grid grid-cols-1 gap-2">
                            {employees.map(emp => (
                                <button
                                    key={emp.id}
                                    onClick={() => toggle(emp.id)}
                                    className={cn(
                                        "p-3 rounded-2xl border transition-all text-left flex items-center justify-between",
                                        tempSelected.includes(emp.id)
                                            ? "bg-blue-50 border-blue-200"
                                            : "bg-white border-slate-100"
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <span className={cn("text-xs font-bold", tempSelected.includes(emp.id) ? "text-blue-700" : "text-slate-700")}>{emp.name}</span>
                                        <span className="text-[8px] text-slate-400 font-medium tracking-tight">Daily: ₹{emp.dailyWage}</span>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                        tempSelected.includes(emp.id) ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-200" : "border-slate-200"
                                    )}>
                                        {tempSelected.includes(emp.id) && <Check size={12} className="text-white" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    onSelect(tempSelected);
                                    onClose();
                                }}
                                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 text-xs uppercase tracking-widest hover:bg-blue-700 transition-all font-sans"
                            >
                                Confirm Selection
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default function ProjectEntryModal({
    isOpen,
    onClose,
    onSuccess,
    clientId,
    employees,
    initialDate = new Date().toISOString().split("T")[0],
    initialEmployees = DEFAULT_EMPS,
    initialMoney = 0,
    initialExpenses = [],
    isEditMode = false,
    onDelete
}: ProjectEntryModalProps) {
    const [date, setDate] = useState(initialDate);
    const [selectedEmps, setSelectedEmps] = useState<number[]>(initialEmployees);
    const [money, setMoney] = useState<string>(initialMoney.toString());
    const [expenses, setExpenses] = useState<{ id?: number, name: string, amount: string }[]>(
        initialExpenses.map(e => ({ ...e, amount: e.amount.toString() }))
    );
    const [loading, setLoading] = useState(false);
    const [isWorkforceModalOpen, setIsWorkforceModalOpen] = useState(false);
    const [isExpenseSelectorOpen, setIsExpenseSelectorOpen] = useState(false);
    const [showConfirmDeleteEntry, setShowConfirmDeleteEntry] = useState(false);
    const [confirmExpenseIndex, setConfirmExpenseIndex] = useState<number | null>(null);

    // Sync state when props change, but with protection against infinite loops
    // We use JSON stringify because initialEmployees is a new array every time the parent re-renders
    const empsKey = JSON.stringify(initialEmployees);
    const expensesKey = JSON.stringify(initialExpenses);

    useEffect(() => {
        if (isOpen) {
            setDate(initialDate);
            setSelectedEmps(initialEmployees);
            setMoney(initialMoney.toString());
            setExpenses(initialExpenses.map(e => ({ ...e, amount: e.amount.toString() })));
        }
    }, [isOpen, initialDate, empsKey, initialMoney, expensesKey]);


    const calculateTotalCost = () => {
        return selectedEmps.reduce((acc, id) => {
            const emp = employees.find(e => e.id === id);
            return acc + (emp ? parseFloat(emp.dailyWage) : 0);
        }, 0);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Update Workforce
            await updateWorkforce(clientId, date, selectedEmps);

            // Log money taken (10 lakh limit as requested before)
            let moneyVal = money === "" ? 0 : parseFloat(money);
            if (moneyVal > 1000000) moneyVal = 1000000;
            await logClientMoney(clientId, date, moneyVal);

            // Save New Expenses (existing ones are already saved, deletions handled immediately)
            for (const exp of expenses) {
                if (!exp.id && exp.name && exp.amount) {
                    await addProjectExpense(clientId, date, exp.name, parseFloat(exp.amount));
                }
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        // open confirm modal
        setShowConfirmDeleteEntry(true);
    };

    const confirmDeleteEntry = async () => {
        setShowConfirmDeleteEntry(false);
        setLoading(true);
        try {
            await deleteProjectEntry(clientId, date);
            onSuccess();
            onClose();
            if (onDelete) onDelete();
        } catch (err) {
            console.error(err);
            // keep alert for error feedback
            alert("Failed to delete entry. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleExpenseBatchSelect = (selected: { name: string; amount: number }[]) => {
        const newBatch = selected.map(s => ({
            name: s.name,
            amount: s.amount.toString()
        }));
        setExpenses(prev => [...prev, ...newBatch]);
    };

    const removeExpense = async (index: number) => {
        const exp = expenses[index];
        if (exp.id) {
            // open confirm modal for expense
            setConfirmExpenseIndex(index);
        } else {
            setExpenses(expenses.filter((_, i) => i !== index));
        }
    };

    const confirmDeleteExpense = async () => {
        if (confirmExpenseIndex === null) return;
        const idx = confirmExpenseIndex;
        const exp = expenses[idx];
        setConfirmExpenseIndex(null);
        if (!exp || !exp.id) return;
        setLoading(true);
        try {
            await deleteProjectExpense(exp.id);
            setExpenses(prev => prev.filter((_, i) => i !== idx));
        } catch (err) {
            console.error(err);
            alert("Failed to delete expense. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalExpenses = () => {
        return expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    };


    return (
        <>
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
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white rounded-[2rem] sm:rounded-3xl shadow-2xl z-[101] overflow-hidden"
                        >
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Project Entry</h2>
                                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                                {/* Date Selector */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <CalendarIcon size={12} /> Date
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                                    />
                                </div>

                                {/* Workforce Section */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Users size={12} /> Workforce
                                        </label>
                                        <button
                                            onClick={() => setIsWorkforceModalOpen(true)}
                                            className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-blue-100 transition-all uppercase tracking-widest shadow-sm"
                                        >
                                            <UserPlus size={14} /> {selectedEmps.length > 0 ? "Change" : "Add Staff"}
                                        </button>
                                    </div>

                                    {selectedEmps.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200">
                                            {selectedEmps.map(id => {
                                                const emp = employees.find(e => e.id === id);
                                                if (!emp) return null;
                                                return (
                                                    <div key={id} className="bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100 flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700 truncate">{emp.name}</span>
                                                        <span className="text-[8px] text-slate-400 font-bold">₹{parseFloat(emp.dailyWage).toLocaleString()}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No staff selected</p>
                                        </div>
                                    )}

                                    <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Total Daily Cost</span>
                                        <span className="text-sm font-black text-blue-600">₹{(calculateTotalCost() + calculateTotalExpenses()).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Expenses Section */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <IndianRupee size={12} /> Expenses
                                        </label>
                                        <button
                                            onClick={() => setIsExpenseSelectorOpen(true)}
                                            className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-rose-100 transition-all uppercase tracking-widest shadow-sm"
                                        >
                                            <Plus size={14} /> Add Expense
                                        </button>
                                    </div>

                                    {expenses.length > 0 && (
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                            {expenses.map((exp, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{exp.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold">₹{parseFloat(exp.amount).toLocaleString()}</span>
                                                    </div>
                                                    <button onClick={() => removeExpense(idx)} className="text-red-400 hover:text-red-600 p-1">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 sticky bottom-0 bg-white">
                                                Expenses Total: ₹{calculateTotalExpenses().toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Money Taken */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <IndianRupee size={12} /> Money Taken
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            max={1000000}
                                            value={money}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                // If value is "0" followed by other digits, remove the "0"
                                                if (val.length > 1 && val.startsWith("0")) {
                                                    setMoney(val.substring(1));
                                                } else {
                                                    setMoney(val);
                                                }
                                            }}
                                            className="w-full pl-8 pr-4 py-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-emerald-700 text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 bg-slate-50 flex gap-3">
                                {isEditMode && onDelete && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={loading}
                                        className="py-4 px-4 bg-red-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 font-sans flex items-center gap-2"
                                        title="Delete Entry"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 py-4 bg-white text-slate-500 font-black rounded-2xl border border-slate-200 text-xs uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50 font-sans"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 font-sans flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Spinner size={16} className="text-white" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Entry"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <WorkforceSelectorModal
                isOpen={isWorkforceModalOpen}
                onClose={() => setIsWorkforceModalOpen(false)}
                employees={employees}
                selectedIds={selectedEmps}
                onSelect={setSelectedEmps}
            />

            <ExpenseSelectorModal
                isOpen={isExpenseSelectorOpen}
                onClose={() => setIsExpenseSelectorOpen(false)}
                onSelect={handleExpenseBatchSelect}
            />

            <ConfirmModal
                isOpen={showConfirmDeleteEntry}
                onClose={() => setShowConfirmDeleteEntry(false)}
                onConfirm={confirmDeleteEntry}
                title="Delete Project Entry"
                message={`This will remove all workforce, expenses, and money records for ${date}. This action cannot be undone.`}
                confirmText="Delete"
            />

            <ConfirmModal
                isOpen={confirmExpenseIndex !== null}
                onClose={() => setConfirmExpenseIndex(null)}
                onConfirm={confirmDeleteExpense}
                title="Delete Expense"
                message="Are you sure you want to delete this expense? This action cannot be undone."
                confirmText="Delete"
            />
        </>
    );
}
