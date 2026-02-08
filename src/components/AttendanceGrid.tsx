"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { toggleAttendance, logAdvance, logMonthlyAdvance, saveBatchChanges } from "@/actions/attendance";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";

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
    onPendingChangesChange?: (has: boolean, saveFn: () => void, isSaving: boolean) => void;
}

const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AttendanceGrid({ role, employees, attendance, advances, monthlyAdvances, currentDate, onUpdate, onEmployeeClick, loading = false, onPendingChangesChange }: AttendanceGridProps) {
    // Local state to track purely what overrides server data
    const [localAttendance, setLocalAttendance] = React.useState<Record<string, any>>({});
    const [localAdvances, setLocalAdvances] = React.useState<Record<string, number>>({});
    const [localMonthlyAdvances, setLocalMonthlyAdvances] = React.useState<Record<string, number>>({});

    // Derived state to know if we have pending changes
    const hasPendingChanges = Object.keys(localAttendance).length > 0 || Object.keys(localAdvances).length > 0 || Object.keys(localMonthlyAdvances).length > 0;

    const [isSaving, setIsSaving] = React.useState(false);
    const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Auto-save timer (5 minutes)
    const resetAutoSaveTimer = () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        autoSaveTimerRef.current = setTimeout(() => {
            saveAllChanges();
        }, 5 * 60 * 1000); // 5 minutes
    };

    // Construct the batch payload and save
    const saveAllChanges = async () => {
        if (!hasPendingChanges) return;
        setIsSaving(true);

        try {
            // Convert local state maps to arrays needed by server action
            const attendanceUpdates = Object.values(localAttendance);

            const advanceUpdates = Object.entries(localAdvances).map(([key, amount]) => {
                // key is like "empId-dateStr" or "adv-empId-dateStr" - wait, we used simpler keys for advances?
                // Let's check how we store them. 
                // We will store them as `${empId}-${dateStr}` in localAdvances
                const [empIdStr, ...dateParts] = key.split("-");
                const dateStr = dateParts.join("-");
                return { employeeId: parseInt(empIdStr), date: dateStr, amount };
            });

            const monthlyAdvanceUpdates = Object.entries(localMonthlyAdvances).map(([key, amount]) => {
                // key is `monthly-${empId}`. But we need year/month which are capable of being derived from currentDate props
                // actually, `monthly-empId` only supports current view. Correct.
                const empId = parseInt(key.replace("monthly-", ""));
                return { employeeId: empId, year: currentDate.getFullYear(), month: currentDate.getMonth(), amount };
            });

            await saveBatchChanges({
                attendance: attendanceUpdates,
                advances: advanceUpdates,
                monthlyAdvances: monthlyAdvanceUpdates
            });

            // Clear local pending state on success
            setLocalAttendance({});
            setLocalAdvances({});
            setLocalMonthlyAdvances({});

            // Trigger parent refresh
            onUpdate();
        } catch (error) {
            console.error("Failed to save batch changes:", error);
            alert("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        }
    };

    // Notify parent when pending state or saving state changes
    React.useEffect(() => {
        if (onPendingChangesChange) onPendingChangesChange(hasPendingChanges, saveAllChanges, isSaving);
    }, [hasPendingChanges, isSaving]);

    // Warn before unloading if unsaved
    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasPendingChanges) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasPendingChanges]);

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, []);

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
        const key = `${empId}-${dateStr}`;
        if (localAdvances[key] !== undefined) {
            return localAdvances[key];
        }
        const adv = advances.find(a => a.employeeId === empId && a.date === dateStr);
        return adv ? adv.amount : 0;
    };

    const getMonthlyAdvanceAmount = (empId: number) => {
        const key = `monthly-${empId}`;
        if (localMonthlyAdvances[key] !== undefined) {
            return localMonthlyAdvances[key];
        }
        const mAdv = monthlyAdvances.find(m =>
            m.employeeId === empId &&
            m.year === currentDate.getFullYear() &&
            m.month === currentDate.getMonth()
        );
        return mAdv ? mAdv.amount : "";
    };

    const handleToggle = (empId: number, dateObj: Date) => {
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

        const update = { employeeId: empId, date: dateStr, present: isPresent, multiplier: nextMultiplier };
        setLocalAttendance(prev => ({ ...prev, [key]: update }));
        resetAutoSaveTimer();
    };


    const handleMonthlyAdvanceChange = (empId: number, amount: string) => {
        if (role !== "admin") return;
        const key = `monthly-${empId}`;
        let val = amount === "" ? 0 : parseFloat(amount);
        if (val > 1000000) val = 1000000;

        setLocalMonthlyAdvances(prev => ({ ...prev, [key]: val }));
        resetAutoSaveTimer();
    };

    const handleAdvanceChange = (empId: number, dateObj: Date, amount: string) => {
        if (role !== "admin") return;
        const dateStr = dateObj.toISOString().split("T")[0];
        const key = `${empId}-${dateStr}`;
        let val = amount === "" ? 0 : parseFloat(amount);
        if (val > 1000000) val = 1000000;

        setLocalAdvances(prev => ({ ...prev, [key]: val }));
        resetAutoSaveTimer();
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm max-h-[70vh] flex flex-col relative">
            {loading && (
                <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                    <Spinner size={40} className="text-blue-600" />
                </div>
            )}

            {/* Save button is rendered by parent (Dashboard) so it can sit under the search bar. */}

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
                                const amount = getMonthlyAdvanceAmount(emp.id);
                                const isDirty = localMonthlyAdvances[`monthly-${emp.id}`] !== undefined;

                                return (
                                    <td key={emp.id} className={cn(
                                        "p-1.5 border-r border-blue-100 bg-blue-50/10 relative",
                                        isDirty && "bg-amber-50"
                                    )}>
                                        <input
                                            key={`${emp.id}-${currentDate.getMonth()}-${currentDate.getFullYear()}`}
                                            disabled={role !== "admin"}
                                            type="number"
                                            max={1000000}
                                            placeholder="0"
                                            className={cn(
                                                "w-full text-[11px] py-1 px-1.5 border-none focus:ring-1 focus:ring-blue-300 rounded bg-white transition-all font-black text-blue-700 shadow-sm",
                                                isDirty && "ring-1 ring-amber-400 bg-amber-50/50"
                                            )}
                                            value={amount === 0 ? "" : amount}
                                            onChange={(e) => handleMonthlyAdvanceChange(emp.id, e.target.value)}
                                        />
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
                                        isToday ? "bg-gray-200 text-black" : "text-slate-600 bg-gray-100"
                                    )}>
                                        <div className="font-black leading-none">{dayNum} {monthShort}</div>
                                        <div className="text-[8px] uppercase font-bold text-slate-400 mt-1">{dayName}</div>
                                    </td>
                                    {employees.map(emp => {
                                        const status = getAttendanceStatus(emp.id, dateStr);
                                        const isPresent = status ? status.present : false;
                                        const multiplier = status ? Number(status.multiplier) : 1.0;
                                        const advance = getAdvanceAmount(emp.id, dateStr);

                                        const isDirtyAttendance = localAttendance[`${emp.id}-${dateStr}`] !== undefined;
                                        const isDirtyAdvance = localAdvances[`${emp.id}-${dateStr}`] !== undefined;

                                        return (
                                            <td key={emp.id} className={cn(
                                                "p-1.5 border-r border-slate-100 align-top bg-slate-50/30",
                                                isToday && "bg-gray-200 text-black"
                                            )}>
                                                <div className="flex flex-col gap-1">
                                                    {/* Advance Input */}
                                                    <div className="relative group min-h-[24px]">
                                                        <input
                                                            disabled={role !== "admin" || isFuture}
                                                            type="number"
                                                            max={1000000}
                                                            placeholder="₹0"
                                                            className={cn(
                                                                "w-full text-[10px] py-1 px-1.5 border-none focus:ring-1 focus:ring-blue-300 rounded bg-white transition-all font-bold shadow-sm",
                                                                advance > 0 && "bg-amber-100 text-amber-800",
                                                                (role !== "admin" || isFuture) && "cursor-not-allowed opacity-50 shadow-none",
                                                                isDirtyAdvance && "ring-1 ring-amber-400 bg-amber-50/50"
                                                            )}
                                                            value={advance || ""}
                                                            onChange={(e) => handleAdvanceChange(emp.id, dateObj, e.target.value)}
                                                        />
                                                    </div>

                                                    {/* Attendance Toggle */}
                                                    <button
                                                        disabled={role !== "admin" || isFuture}
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
                                                            isDirtyAttendance && "ring-2 ring-amber-400 ring-offset-1"
                                                        )}
                                                    >
                                                        <span className="text-[11px] font-black tracking-tighter">
                                                            {isPresent ? (multiplier === 1 ? "X" : `x${multiplier}`) : status ? "0" : " "}
                                                        </span>
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
