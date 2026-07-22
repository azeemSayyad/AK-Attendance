"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Calendar, Wallet, ArrowUpCircle, X, IndianRupee, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteEmployee } from "@/actions/employees";
import ConfirmModal from "./ConfirmModal";

interface EmployeeSummarySheetProps {
    role: string;
    employee: any | null;
    attendanceData: any[];
    totalAdvances: number;
    onClose: () => void;
    onUpdate: () => void;
}

export default function EmployeeSummarySheet({ role, employee, attendanceData, totalAdvances, onClose, onUpdate }: EmployeeSummarySheetProps) {
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    if (!employee) return null;

    const daysPresent = attendanceData
        .filter(a => a.present)
        .reduce((acc, curr) => acc + (parseFloat(curr.multiplier) || 1), 0);

    const grossEarnings = attendanceData.reduce((acc, curr) => {
        return acc + (curr.present ? (parseFloat(employee.dailyWage) * parseFloat(curr.multiplier)) : 0);
    }, 0);

    const calculatedTotalAdvances = totalAdvances;
    const netSalary = grossEarnings - calculatedTotalAdvances;

    const getPayoutColor = (amount: number) => {
        const absAmount = Math.abs(amount);
        const isPositive = amount >= 0;
        const isEmployee = role === "employee";

        if (isPositive) {
            if (isEmployee) {
                if (absAmount >= 100000) return "bg-green-950 text-white";
                if (absAmount >= 75000) return "bg-emerald-900 text-white";
                if (absAmount >= 50000) return "bg-emerald-800 text-white";
                if (absAmount >= 30000) return "bg-emerald-700 text-white";
                if (absAmount >= 20000) return "bg-emerald-600 text-white";
                if (absAmount >= 10000) return "bg-emerald-500 text-white";
                if (absAmount >= 5000) return "bg-emerald-400 text-white";
                return "bg-emerald-200 text-emerald-900";
            } else {
                if (absAmount >= 100000) return "bg-red-950 text-white";
                if (absAmount >= 75000) return "bg-rose-900 text-white";
                if (absAmount >= 50000) return "bg-rose-800 text-white";
                if (absAmount >= 30000) return "bg-rose-700 text-white";
                if (absAmount >= 20000) return "bg-rose-600 text-white";
                if (absAmount >= 10000) return "bg-rose-500 text-white";
                if (absAmount >= 5000) return "bg-rose-400 text-white";
                return "bg-rose-200 text-rose-900";
            }
        } else {
            if (isEmployee) {
                if (absAmount >= 100000) return "bg-red-950 text-white";
                if (absAmount >= 75000) return "bg-rose-900 text-white";
                if (absAmount >= 50000) return "bg-rose-800 text-white";
                if (absAmount >= 30000) return "bg-rose-700 text-white";
                if (absAmount >= 20000) return "bg-rose-600 text-white";
                if (absAmount >= 10000) return "bg-rose-500 text-white";
                if (absAmount >= 5000) return "bg-rose-400 text-white";
                return "bg-rose-200 text-rose-900";
            } else {
                if (absAmount >= 100000) return "bg-green-950 text-white";
                if (absAmount >= 75000) return "bg-emerald-900 text-white";
                if (absAmount >= 50000) return "bg-emerald-800 text-white";
                if (absAmount >= 30000) return "bg-emerald-700 text-white";
                if (absAmount >= 20000) return "bg-emerald-600 text-white";
                if (absAmount >= 10000) return "bg-emerald-500 text-white";
                if (absAmount >= 5000) return "bg-emerald-400 text-white";
                return "bg-emerald-200 text-emerald-900";
            }
        }
    };

    const handleArchive = async () => {
        await deleteEmployee(employee.id);
        onUpdate();
        onClose();
    };

    return (
        <>
            <AnimatePresence>
                {employee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-4 sm:p-5"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex flex-col">
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{employee.name}</h2>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Summary</span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {role === "admin" && employee.pin && (
                                <div className="mb-3 flex items-center justify-between px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Login PIN</span>
                                    <span className="text-xl font-black text-blue-600 tracking-[0.2em]">{employee.pin}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-indigo-600">
                                        <IndianRupee size={13} />
                                        <span className="text-[8px] uppercase font-bold tracking-wider">Per Day</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">₹{parseFloat(employee.dailyWage).toLocaleString()}</div>
                                </div>

                                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-blue-600">
                                        <Calendar size={13} />
                                        <span className="text-[8px] uppercase font-bold tracking-wider">Days Present</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">{daysPresent % 1 === 0 ? daysPresent : daysPresent.toFixed(1)} <span className="text-[10px] font-medium text-slate-400">days</span></div>
                                </div>

                                <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-emerald-600">
                                        <TrendingUp size={13} />
                                        <span className="text-[8px] uppercase font-bold tracking-wider">Total Income</span>
                                    </div>
                                    <div className="text-2xl font-black text-emerald-700">₹{grossEarnings.toLocaleString()}</div>
                                </div>

                                <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-100 flex flex-col items-center text-center">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-amber-600">
                                        <ArrowUpCircle size={13} />
                                        <span className="text-[8px] uppercase font-bold tracking-wider">Advances Taken</span>
                                    </div>
                                    <div className="text-2xl font-black text-amber-700">₹{calculatedTotalAdvances.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Earnings breakdown ledger */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 mb-3 space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 tracking-wide">Income ({daysPresent % 1 === 0 ? daysPresent : daysPresent.toFixed(1)} × ₹{parseFloat(employee.dailyWage).toLocaleString()})</span>
                                    <span className="text-xs font-black text-emerald-600">+₹{grossEarnings.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 tracking-wide">Advances taken</span>
                                    <span className="text-xs font-black text-amber-600">−₹{calculatedTotalAdvances.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className={cn(
                                "rounded-[2rem] p-4 mb-4 shadow-xl transition-all duration-500",
                                getPayoutColor(netSalary)
                            )}>
                                <div className="flex justify-between items-center mb-2 opacity-80">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                                        {netSalary >= 0 ? "Balance To Pay" : "Balance To Return"}
                                    </span>
                                    <Wallet size={18} />
                                </div>
                                <div className="text-3xl font-black mb-1">₹{Math.abs(netSalary).toLocaleString()}</div>
                                <div className="text-[9px] font-bold bg-black/10 inline-block px-2.5 py-1 rounded-full backdrop-blur-sm">
                                    {netSalary >= 0
                                        ? "Payable to staff"
                                        : "Advances exceed earnings — staff returns this"}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {role === "admin" && (
                                    <button
                                        onClick={() => setIsConfirmOpen(true)}
                                        className="flex-1 bg-rose-50 text-rose-500 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-all text-xs uppercase tracking-widest"
                                    >
                                        <Trash2 size={18} />
                                        Archive Staff
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl transition-all text-xs uppercase tracking-widest"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleArchive}
                title="Archive Staff?"
                message={`Are you sure you want to archive ${employee.name}? All historical data will be preserved but they will be removed from the active list.`}
                confirmText="Archive"
            />
        </>
    );
}
