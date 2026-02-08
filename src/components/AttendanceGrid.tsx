"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { toggleAttendance, logAdvance, logMonthlyAdvance } from "@/actions/attendance";
import { Spinner } from "@/components/ui/Spinner";

interface AttendanceGridProps {
    role: string;
    employees: any[];
    attendance: any[];
    advances: any[];
    monthlyAdvances: any[];
    currentDate: Date;
    onUpdate: () => void;
    onEmployeeClick: (employee: any) => void;
    loading?: boolean;
}

const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AttendanceGrid({ role, employees, attendance, advances, monthlyAdvances, currentDate, onUpdate, onEmployeeClick, loading = false }: AttendanceGridProps) {
    const [localAttendance, setLocalAttendance] = React.useState<Record<string, any>>({});
    const [updatingCells, setUpdatingCells] = React.useState<Record<string, boolean>>({});


    const getBillingDates = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const dates: Date[] = [];
        const lastDayOfCurrentMonth = new Date(year, month + 1, 0).getDate();

        // From 2nd to end of current month
        for (let d = 2; d <= lastDayOfCurrentMonth; d++) {
            dates.push(new Date(year, month, d));
        }
        // Add 1st of next month
        dates.push(new Date(year, month + 1, 1));
        return dates;
    };

    const billingDates = getBillingDates(currentDate);

    const getAttendanceStatus = (empId: number, dateStr: string) => {
        const key = `${empId}-${dateStr}`;
        if (localAttendance[key] !== undefined) {
            return localAttendance[key];
        }
        return attendance.find(a => a.employeeId === empId && a.date === dateStr);
    };

    const getAdvanceAmount = (empId: number, dateStr: string) => {
        const adv = advances.find(a => a.employeeId === empId && a.date === dateStr);
        return adv ? adv.amount : null;
    };

    const handleToggle = async (empId: number, dateObj: Date) => {
        if (role !== "admin") return;
        const dateStr = dateObj.toISOString().split("T")[0];
        const key = `${empId}-${dateStr}`;
        const current = getAttendanceStatus(empId, dateStr);

        const currentMult = current ? Number(current.multiplier) : 1.0;

        let isPresent = true;
        let nextMultiplier = 1.0;

        if (!current) {
            isPresent = true;
            nextMultiplier = 1.0;
        } else if (current.present && currentMult === 1.0) {
            isPresent = false;
            nextMultiplier = 1.0;
        } else if (!current.present) {
            isPresent = true;
            nextMultiplier = 0.5;
        } else if (currentMult === 0.5) {
            isPresent = true;
            nextMultiplier = 1.5;
        } else if (currentMult === 1.5) {
            isPresent = true;
            nextMultiplier = 2.0;
        } else if (currentMult === 2.0) {
            isPresent = true;
            nextMultiplier = 3.0;
        } else if (currentMult === 3.0) {
            isPresent = true;
            nextMultiplier = 1.0;
        }

        // 1. Update local state immediately
        const optimisticUpdate = { employeeId: empId, date: dateStr, present: isPresent, multiplier: nextMultiplier };
        setLocalAttendance(prev => ({ ...prev, [key]: optimisticUpdate }));

        // 2. Set loading state
        setUpdatingCells(prev => ({ ...prev, [key]: true }));

        try {
            await toggleAttendance(empId, dateStr, isPresent, nextMultiplier);
            onUpdate();
        } catch (err) {
            console.error("Failed to save attendance:", err);
            // Revert optimistic update if needed, but for now we just log
        } finally {
            setUpdatingCells(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };



    const handleMonthlyAdvanceChange = async (empId: number, amount: string) => {
        if (role !== "admin") return;
        const key = `monthly-${empId}`;
        setUpdatingCells(prev => ({ ...prev, [key]: true }));
        try {
            let val = amount === "" ? 0 : parseFloat(amount);
            if (val > 1000000) val = 1000000;
            await logMonthlyAdvance(empId, currentDate.getFullYear(), currentDate.getMonth(), val);
            onUpdate();
        } finally {
            setUpdatingCells(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const handleAdvanceChange = async (empId: number, dateObj: Date, amount: string) => {
        if (role !== "admin") return;
        const dateStr = dateObj.toISOString().split("T")[0];
        const key = `adv-${empId}-${dateStr}`;
        setUpdatingCells(prev => ({ ...prev, [key]: true }));

        try {
            let val = amount === "" ? 0 : parseFloat(amount);
            if (val > 1000000) val = 1000000;
            await logAdvance(empId, dateStr, val);
            onUpdate();
        } finally {
            setUpdatingCells(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm max-h-[70vh] flex flex-col relative">
            {loading && (
                <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                    <Spinner size={40} className="text-blue-600" />
                </div>
            )}
            <div className="overflow-auto no-scrollbar relative">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-40 bg-gray-100">
                        <tr className="bg-gray-100 border-b border-slate-200">
                            <th className="sticky left-0 top-0 z-50  p-2 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 min-w-[100px]">
                                Date
                            </th>
                            {employees.map(emp => (
                                <th key={emp.id} className="sticky top-0 z-30 p-0 border-r border-slate-200 min-w-[110px]">
                                    <button
                                        onClick={() => onEmployeeClick(emp)}
                                        className="w-full h-full p-2 text-left hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate">{emp.name}</div>
                                        <div className="text-[9px] text-slate-400 font-normal mt-0.5">₹{emp.dailyWage}/day</div>
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Previous Advance Row */}
                        <tr className="bg-blue-50/30 border-b border-blue-100">
                            <td className="sticky left-0 z-20 bg-blue-100 p-2 text-[10px] font-bold text-blue-700 border-r border-slate-200 uppercase tracking-tighter">
                                Advance
                            </td>
                            {employees.map(emp => {
                                const mAdv = monthlyAdvances.find(m =>
                                    m.employeeId === emp.id &&
                                    m.year === currentDate.getFullYear() &&
                                    m.month === currentDate.getMonth()
                                );
                                return (
                                    <td key={emp.id} className="p-1.5 border-r border-blue-100 bg-blue-50/10 relative">
                                        {updatingCells[`monthly-${emp.id}`] ? (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Spinner size={16} />
                                            </div>
                                        ) : (
                                            <input
                                                key={`${emp.id}-${currentDate.getMonth()}-${currentDate.getFullYear()}`}
                                                disabled={role !== "admin"}
                                                type="number"
                                                max={1000000}
                                                placeholder="0"
                                                className="w-full text-[11px] py-1 px-1.5 border-none focus:ring-1 focus:ring-blue-300 rounded bg-white transition-all font-black text-blue-700 shadow-sm"
                                                defaultValue={mAdv ? mAdv.amount : ""}
                                                onBlur={(e) => handleMonthlyAdvanceChange(emp.id, e.target.value)}
                                            />
                                        )}
                                    </td>
                                );
                            })}
                        </tr>

                        {billingDates.map(dateObj => {
                            const dateStr = dateObj.toISOString().split("T")[0];
                            const isToday = new Date().toDateString() === dateObj.toDateString();
                            const isFuture = dateObj > new Date();
                            const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateObj);
                            const dayNum = dateObj.getDate();
                            const monthShort = monthNamesShort[dateObj.getMonth()];

                            return (
                                <tr
                                    key={dateStr}
                                    className={cn(
                                        "border-b border-slate-100 hover:bg-slate-50/50 transition-colors",
                                        isToday && "bg-blue-50/20"
                                    )}
                                >
                                    <td className={cn(
                                        "sticky left-0 z-20 p-2 text-[11px] border-r border-slate-200",
                                        isToday ? "bg-gray-100 text-black" : "text-slate-600 bg-gray-100"
                                    )}>
                                        <div className="font-black leading-none">{dayNum} {monthShort}</div>
                                        <div className="text-[8px] uppercase font-bold text-slate-400 mt-1">{dayName}</div>
                                    </td>
                                    {employees.map(emp => {
                                        const status = getAttendanceStatus(emp.id, dateStr);
                                        const isPresent = status ? status.present : false;
                                        const multiplier = status ? Number(status.multiplier) : 1.0;
                                        const advance = getAdvanceAmount(emp.id, dateStr);

                                        return (
                                            <td key={emp.id} className={cn(
                                                "p-1.5 border-r border-slate-100 align-top bg-slate-50/30",
                                                isToday && "bg-gray-200 text-black"
                                            )}>
                                                <div className="flex flex-col gap-1">
                                                    {/* Advance Input */}
                                                    <div className="relative group min-h-[24px]">
                                                        {updatingCells[`adv-${emp.id}-${dateStr}`] ? (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <Spinner size={14} />
                                                            </div>
                                                        ) : (
                                                            <input
                                                                disabled={role !== "admin" || isFuture}
                                                                type="number"
                                                                max={1000000}
                                                                placeholder="₹0"
                                                                className={cn(
                                                                    "w-full text-[10px] py-1 px-1.5 border-none focus:ring-1 focus:ring-blue-300 rounded bg-white transition-all font-bold shadow-sm",
                                                                    advance > 0 && "bg-amber-100 text-amber-800",
                                                                    (role !== "admin" || isFuture) && "cursor-not-allowed opacity-50 shadow-none"
                                                                )}
                                                                defaultValue={advance || ""}
                                                                onBlur={(e) => handleAdvanceChange(emp.id, dateObj, e.target.value)}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Attendance Toggle */}
                                                    <button
                                                        disabled={role !== "admin" || isFuture || updatingCells[`${emp.id}-${dateStr}`]}
                                                        onClick={() => handleToggle(emp.id, dateObj)}
                                                        className={cn(
                                                            "w-full h-8 rounded-lg flex flex-col items-center justify-center transition-all",
                                                            isPresent
                                                                ? (multiplier === 0.5 ? "bg-amber-400 text-white shadow-sm font-black" :
                                                                    multiplier === 1.5 ? "bg-indigo-600 text-white shadow-md font-black" :
                                                                        multiplier === 2.0 ? "bg-purple-600 text-white shadow-md font-black" :
                                                                            multiplier === 3.0 ? "bg-pink-600 text-white shadow-md font-black" :
                                                                                "bg-emerald-500 text-white shadow-sm font-black")
                                                                : status
                                                                    ? "bg-rose-500 text-white font-black"
                                                                    : "bg-white text-slate-300 border border-slate-200 shadow-sm",
                                                            (role !== "admin" || isFuture) && "cursor-default shadow-none opacity-50",
                                                            updatingCells[`${emp.id}-${dateStr}`] && "opacity-80 cursor-wait"
                                                        )}
                                                    >
                                                        {updatingCells[`${emp.id}-${dateStr}`] ? (
                                                            <Spinner size={16} className="text-current" />
                                                        ) : (
                                                            <span className="text-[11px] font-black tracking-tighter">
                                                                {isPresent ? (multiplier === 1 ? "X" : `x${multiplier}`) : status ? "0" : " "}
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
