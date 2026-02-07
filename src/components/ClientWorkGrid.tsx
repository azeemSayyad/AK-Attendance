import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { assignWork, unassignWork, logClientMoney } from "@/actions/clients";
import { Check, Plus, Minus, IndianRupee } from "lucide-react";

interface ClientWorkGridProps {
    role: string;
    client: any;
    employees: any[];
    assignments: any[];
    moneyTaken: any[];
    billingDates: Date[];
    onUpdate: () => void;
}

export default function ClientWorkGrid({ role, client, employees, assignments, moneyTaken, billingDates, onUpdate }: ClientWorkGridProps) {
    const getClientAssignments = (dateStr: string) => {
        return assignments.filter(a => a.clientId === client.id && a.date === dateStr);
    };

    const getClientMoney = (dateStr: string) => {
        const record = moneyTaken.find(m => m.clientId === client.id && m.date === dateStr);
        return record ? record.amount : 0;
    };

    const handleAssignmentToggle = async (empId: number, dateObj: Date, isAssigned: boolean) => {
        if (role !== "admin") return;
        const dateStr = dateObj.toISOString().split("T")[0];
        if (isAssigned) {
            await unassignWork(empId, client.id, dateStr);
        } else {
            await assignWork(empId, client.id, dateStr);
        }
        onUpdate();
    };

    const handleMoneyChange = async (dateObj: Date, amount: string) => {
        if (role !== "admin") return;
        const dateStr = dateObj.toISOString().split("T")[0];
        let val = amount === "" ? 0 : parseFloat(amount);
        if (val > 1000000) val = 1000000;
        await logClientMoney(client.id, dateStr, val);
        onUpdate();
    };

    const totalMoneyTaken = moneyTaken
        .filter(m => m.clientId === client.id)
        .reduce((s, c) => s + parseFloat(c.amount || 0), 0);

    const totalClientCost = assignments
        .filter(a => a.clientId === client.id)
        .reduce((s, a) => s + parseFloat(a.employee.dailyWage || 0), 0);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{client.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{client.location}</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Total Cost</div>
                        <div className="text-sm font-black text-rose-600">₹{totalClientCost.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Money Taken</div>
                        <div className="text-sm font-black text-emerald-600">₹{totalMoneyTaken.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="p-2 text-left text-[9px] font-bold text-slate-500 uppercase border-r border-slate-100 min-w-[80px]">Date</th>
                            <th className="p-2 text-left text-[9px] font-bold text-slate-500 uppercase border-r border-slate-100">Workforce</th>
                            <th className="p-2 text-right text-[9px] font-bold text-slate-500 uppercase border-r border-slate-100 w-[100px]">Money Taken</th>
                            <th className="p-2 text-right text-[9px] font-bold text-slate-500 uppercase w-[100px]">Daily Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {billingDates.map(dateObj => {
                            const dateStr = dateObj.toISOString().split("T")[0];
                            const dayAssignments = getClientAssignments(dateStr);
                            const dailyCost = dayAssignments.reduce((s, a) => s + parseFloat(a.employee.dailyWage), 0);
                            const dailyMoney = getClientMoney(dateStr);

                            return (
                                <tr key={dateStr} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-2 text-[10px] font-bold text-slate-600 border-r border-slate-100">
                                        {dateObj.getDate()} {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(dateObj)}
                                    </td>
                                    <td className="p-2 border-r border-slate-100">
                                        <div className="flex flex-wrap gap-1">
                                            {employees.map(emp => {
                                                const isAssigned = dayAssignments.some(a => a.employeeId === emp.id);
                                                return (
                                                    <button
                                                        key={emp.id}
                                                        disabled={role !== "admin"}
                                                        onClick={() => handleAssignmentToggle(emp.id, dateObj, isAssigned)}
                                                        className={cn(
                                                            "text-[9px] px-1.5 py-0.5 rounded-md font-bold transition-all border",
                                                            isAssigned
                                                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-sm"
                                                                : "bg-white text-slate-400 border-slate-200 hover:border-blue-300"
                                                        )}
                                                    >
                                                        {emp.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="p-1 border-r border-slate-100">
                                        <div className="relative">
                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                                            <input
                                                type="number"
                                                max={1000000}
                                                disabled={role !== "admin"}
                                                className="w-full text-right text-[10px] py-1 px-1.5 pl-4 border-none focus:ring-1 focus:ring-emerald-300 rounded bg-emerald-50/30 font-bold text-emerald-700"
                                                value={dailyMoney || ""}
                                                placeholder="0"
                                                onChange={(e) => handleMoneyChange(dateObj, e.target.value)}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-2 text-right text-[10px] font-black text-slate-700">
                                        ₹{dailyCost.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
