import React from "react";
import { Users, Calendar, ArrowUpCircle, Wallet, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    isFilled?: boolean;
    className?: string;
}

const SummaryCard = ({ label, value, icon, color, isFilled, className }: SummaryCardProps) => (
    <div className={cn(
        "px-3 py-2 rounded-xl border shadow-sm flex flex-col gap-1.5 transition-all duration-500",
        isFilled ? `${color} text-white` : "bg-white border-slate-100 text-slate-900",
        className
    )}>
        <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            isFilled ? "bg-white bg-opacity-20" : `${color} bg-opacity-10`
        )}>
            {React.cloneElement(icon as React.ReactElement<any>, {
                size: 16,
                className: isFilled ? "text-white" : color.replace("bg-", "text-")
            })}
        </div>
        <div className="flex flex-col">
            <span className={cn("text-xl font-black leading-none mb-0.5", isFilled ? "text-white" : "text-slate-900")}>{value}</span>
            <span className={cn("text-[9px] font-bold uppercase tracking-widest", isFilled ? "text-white text-opacity-70" : "text-slate-400")}>{label}</span>
        </div>
    </div>
);

interface SummaryCardsProps {
    role?: string;
    totalStaff: number;
    daysPresent: number | string;
    totalAdvances: number;
    totalWages: number;
    netPayout: number;
}

export default function SummaryCards({ role, totalStaff, daysPresent, totalAdvances, totalWages, netPayout }: SummaryCardsProps) {
    const getNetPayoutStyles = (amount: number) => {
        const absAmount = Math.abs(amount);
        const isPositive = amount > 0;

        if (amount === 0) return { color: "bg-indigo-600", value: "₹0" };

        let color = "";
        // For employees, positive payout (earning) is green. 
        // For admins, positive payout (paying) is red.
        const isEmployee = role === "employee";

        if (isPositive) {
            if (isEmployee) {
                if (absAmount >= 100000) color = "bg-green-950";
                else if (absAmount >= 75000) color = "bg-emerald-900";
                else if (absAmount >= 50000) color = "bg-emerald-800";
                else if (absAmount >= 30000) color = "bg-emerald-700";
                else if (absAmount >= 20000) color = "bg-emerald-600";
                else if (absAmount >= 10000) color = "bg-emerald-500";
                else if (absAmount >= 5000) color = "bg-emerald-400";
                else color = "bg-emerald-300";
            } else {
                if (absAmount >= 100000) color = "bg-red-950";
                else if (absAmount >= 75000) color = "bg-rose-900";
                else if (absAmount >= 50000) color = "bg-rose-800";
                else if (absAmount >= 30000) color = "bg-rose-700";
                else if (absAmount >= 20000) color = "bg-rose-600";
                else if (absAmount >= 10000) color = "bg-rose-500";
                else if (absAmount >= 5000) color = "bg-rose-400";
                else color = "bg-rose-300";
            }
        } else {
            // Negative payout (employee owes) is red for employee
            if (isEmployee) {
                if (absAmount >= 100000) color = "bg-red-950";
                else if (absAmount >= 75000) color = "bg-rose-900";
                else if (absAmount >= 50000) color = "bg-rose-800";
                else if (absAmount >= 30000) color = "bg-rose-700";
                else if (absAmount >= 20000) color = "bg-rose-600";
                else if (absAmount >= 10000) color = "bg-rose-500";
                else if (absAmount >= 5000) color = "bg-rose-400";
                else color = "bg-rose-300";
            } else {
                if (absAmount >= 100000) color = "bg-green-950";
                else if (absAmount >= 75000) color = "bg-emerald-900";
                else if (absAmount >= 50000) color = "bg-emerald-800";
                else if (absAmount >= 30000) color = "bg-emerald-700";
                else if (absAmount >= 20000) color = "bg-emerald-600";
                else if (absAmount >= 10000) color = "bg-emerald-500";
                else if (absAmount >= 5000) color = "bg-emerald-400";
                else color = "bg-emerald-300";
            }
        }

        return { color, value: `₹${absAmount.toLocaleString()}` };
    };

    const netPayoutStyles = getNetPayoutStyles(netPayout);

    return (
        <div className="grid grid-cols-2 gap-3 mb-6">
            {role !== "employee" && <SummaryCard label="Total Staff" value={totalStaff} icon={<Users />} color="bg-blue-600" />}
            <SummaryCard label="Days Present" value={daysPresent} icon={<Calendar />} color="bg-emerald-600" />
            <SummaryCard label={role === "employee" ? "Monthly Salary" : "Total Wages"} value={`₹${totalWages.toLocaleString()}`} icon={<Banknote />} color="bg-indigo-600" />
            <SummaryCard label="Total Advances" value={`₹${totalAdvances.toLocaleString()}`} icon={<ArrowUpCircle />} color="bg-amber-600" />
            <SummaryCard
                label="Net Payout"
                value={netPayoutStyles.value}
                icon={<Wallet />}
                color={netPayoutStyles.color === "bg-indigo-600" || netPayoutStyles.color === "bg-blue-600" ? "bg-gradient-to-r from-blue-600 to-purple-600" : netPayoutStyles.color}
                isFilled={true}
                className={role !== "employee" ? "col-span-2" : ""}
            />
        </div>
    );
}
