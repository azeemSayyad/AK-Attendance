"use client";

import React, { useState } from "react";
import { ArrowLeft, Plus, Calendar as CalendarIcon, Users, IndianRupee, Trash2, Edit2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ProjectEntryModal from "./ProjectEntryModal";
import ConfirmModal from "./ConfirmModal";
import { deleteClient, deleteProjectEntry } from "@/actions/clients";

interface ClientDetailViewProps {
    role: string;
    client: any;
    employees: any[];
    assignments: any[];
    moneyTaken: any[];
    expenses: any[];
    onBack: () => void;
    onUpdate: () => void;
}

export default function ClientDetailView({
    role,
    client,
    employees,
    assignments,
    moneyTaken,
    expenses,
    onBack,
    onUpdate
}: ClientDetailViewProps) {
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleDeleteClient = async () => {
        setIsDeleting(true);
        try {
            await deleteClient(client.id);
            onUpdate();
            onBack();
        } catch (err) {
            console.error(err);
            alert("Failed to delete client. Make sure all entries are removed if cascade isn't active.");
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
        }
    };

    // Grouping entries by date
    const datesWithData = Array.from(new Set([
        ...assignments.filter(a => a.clientId === client.id).map(a => a.date),
        ...moneyTaken.filter(m => m.clientId === client.id).map(m => m.date),
        ...expenses.filter(e => e.clientId === client.id).map(e => e.date)
    ])).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const getDailyData = (date: string) => {
        const dayAssignments = assignments.filter(a => a.clientId === client.id && a.date === date);
        const dayMoney = moneyTaken.find(m => m.clientId === client.id && m.date === date);
        const dayExpenses = expenses.filter(e => e.clientId === client.id && e.date === date);

        const workforceCost = dayAssignments.reduce((acc, curr) => acc + parseFloat(curr.employee.dailyWage), 0);
        const expensesCost = dayExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

        return {
            assignments: dayAssignments,
            money: dayMoney ? parseFloat(dayMoney.amount) : 0,
            expenses: dayExpenses,
            cost: workforceCost + expensesCost
        };
    };

    const totalCost = assignments
        .filter(a => a.clientId === client.id)
        .reduce((acc, curr) => acc + parseFloat(curr.employee.dailyWage), 0) +
        expenses
            .filter(e => e.clientId === client.id)
            .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    const totalMoney = moneyTaken
        .filter(m => m.clientId === client.id)
        .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    const handleEdit = (date: string) => {
        if (role !== "admin") return;
        const data = getDailyData(date);
        setEditingEntry({
            date,
            employees: data.assignments.map(a => a.employeeId),
            money: data.money,
            expenses: data.expenses
        });
        setIsEntryModalOpen(true);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header / Nav */}
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm relative">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 px-3 py-2 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all active:scale-95"
                >
                    <ArrowLeft size={14} /> Back
                </button>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <h2 className="text-md font-black text-slate-900 uppercase tracking-tighter leading-none">{client.name}</h2>
                    <span className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">{client.location}</span>
                </div>

                <div className="flex items-center gap-2">
                    {role === "admin" && (
                        <button
                            onClick={() => setIsConfirmOpen(true)}
                            disabled={isDeleting}
                            className="p-2 text-red-500 transition-all bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 active:scale-95"
                            title="Delete Project"
                        >
                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Client Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-4 rounded-3xl text-white shadow-lg shadow-rose-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Total Cost</span>
                        <Users size={16} className="opacity-60" />
                    </div>
                    <div className="text-xl font-black italic">₹{totalCost.toLocaleString()}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-3xl text-white shadow-lg shadow-emerald-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Money Taken</span>
                        <IndianRupee size={16} className="opacity-60" />
                    </div>
                    <div className="text-xl font-black italic">₹{totalMoney.toLocaleString()}</div>
                </div>
            </div>

            {/* Entries Section */}
            <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Logs</h3>
                    {role === "admin" && (
                        <button
                            onClick={() => {
                                setEditingEntry(null);
                                setIsEntryModalOpen(true);
                            }}
                            className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-blue-100 transition-colors shadow-sm"
                        >
                            <Plus size={14} /> Add Entry
                        </button>
                    )}
                </div>

                <div className="space-y-2">
                    {datesWithData.map(date => {
                        const data = getDailyData(date);
                        const dateObj = new Date(date);
                        return (
                            <div key={date} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-50 px-3 py-2 rounded-xl text-center min-w-[50px] border border-slate-100">
                                        <div className="text-[11px] font-black text-slate-900 leading-none">{dateObj.getDate()}</div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                            {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(dateObj)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-700 uppercase">
                                                {data.assignments.length} Staff Assigned
                                            </span>
                                            {data.money > 0 && (
                                                <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                                                    Paid: ₹{data.money.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {data.assignments.map(a => (
                                                <span key={a.id} className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                                                    {a.employee.name}
                                                </span>
                                            ))}
                                        </div>
                                        {data.expenses.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {data.expenses.map((e: any) => (
                                                    <span key={e.id} className="text-[8px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        {e.name}: ₹{parseFloat(e.amount).toLocaleString()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-[10px] font-black text-rose-500 italic">Cost: ₹{data.cost.toLocaleString()}</div>
                                    {role === "admin" && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEdit(date)}
                                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                title="Edit Entry"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm(`Delete all entries for ${new Date(date).toLocaleDateString()}? This will remove all workforce, expenses, and money records for this date.`)) {
                                                        try {
                                                            await deleteProjectEntry(client.id, date);
                                                            onUpdate();
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert("Failed to delete entry. Please try again.");
                                                        }
                                                    }
                                                }}
                                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                title="Delete Entry"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {datesWithData.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                            <CalendarIcon className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No entries found for this month</p>
                        </div>
                    )}
                </div>
            </div>

            <ProjectEntryModal
                isOpen={isEntryModalOpen}
                onClose={() => {
                    setIsEntryModalOpen(false);
                    setEditingEntry(null);
                }}
                onSuccess={onUpdate}
                clientId={client.id}
                employees={employees}
                initialDate={editingEntry?.date}
                initialEmployees={editingEntry?.employees}
                initialMoney={editingEntry?.money}
                initialExpenses={editingEntry?.expenses}
                isEditMode={!!editingEntry}
                onDelete={() => {
                    setIsEntryModalOpen(false);
                    setEditingEntry(null);
                    onUpdate();
                }}
            />
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDeleteClient}
                title="Delete Project?"
                message={`Are you sure you want to delete "${client.name}"? This will permanently remove all logs, attendance assignments, and financial records for this site.`}
                confirmText={isDeleting ? "Deleting..." : "Delete Site"}
            />
        </div>
    );
}
