import React from "react";
import { Building2, IndianRupee, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientCardProps {
    client: any;
    totalCost: number;
    moneyTaken: number;
    onClick: () => void;
}

export default function ClientCard({ client, totalCost, moneyTaken, onClick }: ClientCardProps) {
    const balance = moneyTaken - totalCost;
    const isPositive = balance >= 0;

    return (
        <button
            onClick={onClick}
            className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col gap-3 text-left"
        >
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-2.5 rounded-xl group-hover:from-blue-50 group-hover:to-blue-100 transition-colors">
                        <Building2 className="text-slate-500 group-hover:text-blue-600" size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{client.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{client.location}</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Cost</div>
                    <div className="text-sm font-black text-rose-600">₹{totalCost.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Money Taken</div>
                    <div className="text-sm font-black text-emerald-600">₹{moneyTaken.toLocaleString()}</div>
                </div>
            </div>

            <div className={cn(
                "mt-1 px-3 py-2 rounded-xl flex items-center justify-between transition-all",
                isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}>
                <div className="flex items-center gap-2">
                    <TrendingUp size={14} className={cn(!isPositive && "rotate-180")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isPositive ? "Profit" : "Outstanding"}
                    </span>
                </div>
                <span className="text-xs font-black">₹{Math.abs(balance).toLocaleString()}</span>
            </div>
        </button>
    );
}
