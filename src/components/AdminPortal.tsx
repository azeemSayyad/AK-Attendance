"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import {
    listTenants,
    onboardTenant,
    setTenantStatus,
    changeTenantPin,
    deleteTenant,
    suggestPin,
} from "@/actions/admin";
import type { TenantRow } from "@/lib/types";
import { logout } from "@/actions/auth";
import {
    Building2,
    Users,
    Database,
    Plus,
    Power,
    KeyRound,
    Trash2,
    LogOut,
    Loader2,
    ShieldCheck,
    Copy,
    Check,
    X,
    AlertTriangle,
} from "lucide-react";

export default function AdminPortal({ initialTenants }: { initialTenants: TenantRow[] }) {
    const [tenants, setTenants] = useState<TenantRow[]>(initialTenants);
    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [pending, startTransition] = useTransition();
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Modal state
    const [pinTarget, setPinTarget] = useState<TenantRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TenantRow | null>(null);

    const totals = useMemo(() => {
        const users = tenants.reduce((a, t) => a + t.employeeCount, 0);
        const bytes = tenants.reduce((a, t) => a + t.bytes, 0);
        const mb = bytes / (1024 * 1024);
        return {
            customers: tenants.length,
            users,
            data: mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(2)} MB`,
        };
    }, [tenants]);

    const refresh = async () => {
        const rows = await listTenants();
        setTenants(rows);
    };

    const notify = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(""), 2500);
    };

    const handleSuggest = () => {
        startTransition(async () => {
            setError("");
            const p = await suggestPin();
            setPin(p);
        });
    };

    const handleOnboard = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        startTransition(async () => {
            try {
                await onboardTenant(name, pin);
                setName("");
                setPin("");
                await refresh();
                notify("Customer onboarded successfully");
            } catch (err: any) {
                setError(err?.message || "Failed to onboard");
            }
        });
    };

    const handleToggleStatus = (t: TenantRow) => {
        startTransition(async () => {
            setError("");
            try {
                await setTenantStatus(t.id, t.status === "active" ? "suspended" : "active");
                await refresh();
            } catch (err: any) {
                setError(err?.message || "Failed to update status");
            }
        });
    };

    const copyPin = (t: TenantRow) => {
        navigator.clipboard?.writeText(t.adminPin);
        setCopiedId(t.id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-slate-900 text-white">
                <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-xl">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black leading-tight">Admin Portal</h1>
                            <p className="text-[11px] text-slate-400 font-medium">Super-admin · manage customers</p>
                        </div>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 text-sm font-bold bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-colors"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3">
                    <StatCard icon={<Building2 size={18} />} label="Customers" value={String(totals.customers)} />
                    <StatCard icon={<Users size={18} />} label="Total Workers" value={String(totals.users)} />
                    <StatCard icon={<Database size={18} />} label="Data Used" value={totals.data} />
                </div>

                {/* Onboard form */}
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Plus size={16} /> Onboard a Customer
                    </h2>
                    <form onSubmit={handleOnboard} className="flex flex-col sm:flex-row gap-3">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Business / owner name"
                            maxLength={40}
                            className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                        <div className="flex gap-2">
                            <input
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                placeholder="PIN"
                                inputMode="numeric"
                                className="w-24 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center tracking-widest"
                            />
                            <button
                                type="button"
                                onClick={handleSuggest}
                                disabled={pending}
                                className="px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                            >
                                Generate
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={pending}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {pending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            Add
                        </button>
                    </form>
                    {error && <p className="text-rose-500 text-sm font-bold mt-3">{error}</p>}
                    {success && <p className="text-emerald-600 text-sm font-bold mt-3">{success}</p>}
                </section>

                {/* Tenant list */}
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Customers</h2>
                    </div>

                    {tenants.length === 0 ? (
                        <p className="p-8 text-center text-slate-400 font-medium">No customers yet.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {tenants.map((t) => (
                                <li key={t.id} className="p-4 sm:px-5 flex flex-wrap items-center gap-3">
                                    <div className="flex-1 min-w-[180px]">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-800">{t.name}</span>
                                            <span
                                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                    t.status === "active"
                                                        ? "bg-emerald-50 text-emerald-600"
                                                        : "bg-rose-50 text-rose-500"
                                                }`}
                                            >
                                                {t.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-3 flex-wrap">
                                            <button
                                                onClick={() => copyPin(t)}
                                                className="inline-flex items-center gap-1 font-mono bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded"
                                                title="Copy PIN"
                                            >
                                                PIN {t.adminPin}
                                                {copiedId === t.id ? <Check size={11} /> : <Copy size={11} />}
                                            </button>
                                            <span>{t.employeeCount} workers</span>
                                            <span>{t.clientCount} sites</span>
                                            <span className="inline-flex items-center gap-1">
                                                <Database size={11} /> {t.sizeLabel}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <IconBtn title={t.status === "active" ? "Suspend" : "Activate"} onClick={() => handleToggleStatus(t)}>
                                            <Power size={16} className={t.status === "active" ? "text-amber-500" : "text-emerald-500"} />
                                        </IconBtn>
                                        <IconBtn title="Change PIN" onClick={() => { setError(""); setPinTarget(t); }}>
                                            <KeyRound size={16} className="text-slate-500" />
                                        </IconBtn>
                                        <IconBtn title="Delete" onClick={() => { setError(""); setDeleteTarget(t); }}>
                                            <Trash2 size={16} className="text-rose-500" />
                                        </IconBtn>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>

            {/* Change PIN modal */}
            {pinTarget && (
                <ChangePinModal
                    tenant={pinTarget}
                    onClose={() => setPinTarget(null)}
                    onSaved={async (msg) => {
                        setPinTarget(null);
                        await refresh();
                        notify(msg);
                    }}
                />
            )}

            {/* Delete modal */}
            {deleteTarget && (
                <DeleteTenantModal
                    tenant={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onDeleted={async () => {
                        setDeleteTarget(null);
                        await refresh();
                        notify("Customer deleted");
                    }}
                />
            )}
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="text-slate-400 mb-2">{icon}</div>
            <div className="text-2xl font-black text-slate-900 leading-none">{value}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-1">{label}</div>
        </div>
    );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
            {children}
        </button>
    );
}

/** Shared overlay + card shell. Closes on backdrop click and Escape. */
function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

function ChangePinModal({
    tenant,
    onClose,
    onSaved,
}: {
    tenant: TenantRow;
    onClose: () => void;
    onSaved: (msg: string) => void;
}) {
    const [value, setValue] = useState("");
    const [error, setError] = useState("");
    const [pending, startTransition] = useTransition();

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{4}$/.test(value)) {
            setError("Enter exactly 4 digits");
            return;
        }
        startTransition(async () => {
            try {
                await changeTenantPin(tenant.id, value);
                onSaved("PIN updated");
            } catch (err: any) {
                setError(err?.message || "Failed to change PIN");
            }
        });
    };

    const generate = () => {
        startTransition(async () => {
            setError("");
            const p = await suggestPin();
            setValue(p);
        });
    };

    return (
        <ModalShell onClose={onClose}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                        <KeyRound size={18} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 leading-tight">Change PIN</h3>
                        <p className="text-[11px] text-slate-400 font-medium">{tenant.name}</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100">
                    <X size={18} />
                </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-4">
                <div className="flex gap-2">
                    <input
                        autoFocus
                        value={value}
                        onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        inputMode="numeric"
                        placeholder="––––"
                        className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-xl tracking-[0.5em]"
                    />
                    <button
                        type="button"
                        onClick={generate}
                        disabled={pending}
                        className="px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                    >
                        Generate
                    </button>
                </div>

                {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={pending}
                        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {pending ? <Loader2 size={18} className="animate-spin" /> : null}
                        Save PIN
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function DeleteTenantModal({
    tenant,
    onClose,
    onDeleted,
}: {
    tenant: TenantRow;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [pending, startTransition] = useTransition();
    const matches = confirm.trim() === tenant.name;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!matches) {
            setError("Name does not match");
            return;
        }
        startTransition(async () => {
            try {
                await deleteTenant(tenant.id);
                onDeleted();
            } catch (err: any) {
                setError(err?.message || "Failed to delete");
            }
        });
    };

    return (
        <ModalShell onClose={onClose}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="bg-rose-50 text-rose-500 p-2 rounded-xl">
                        <AlertTriangle size={18} />
                    </div>
                    <h3 className="font-black text-slate-800">Delete customer</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100">
                    <X size={18} />
                </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-4">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    This permanently deletes <span className="font-black text-slate-800">{tenant.name}</span> and{" "}
                    <span className="font-bold text-rose-500">all of their data</span> ({tenant.employeeCount} workers,{" "}
                    {tenant.clientCount} sites, {tenant.sizeLabel}). This cannot be undone.
                </p>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">
                        Type <span className="font-mono text-slate-800">{tenant.name}</span> to confirm
                    </label>
                    <input
                        autoFocus
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                    />
                </div>

                {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={pending || !matches}
                        className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {pending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        Delete
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
