"use client";

import React, { useState, useEffect } from "react";
import { updateAdminPin, checkPinAvailableForSelf } from "@/actions/auth";
import { X, Lock, Save, Loader2, Eye, EyeOff } from "lucide-react";

interface ChangePinModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangePinModal({ isOpen, onClose }: ChangePinModalProps) {
    const [currentPin, setCurrentPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [newPinError, setNewPinError] = useState("");
    const [confirmError, setConfirmError] = useState("");
    const [checking, setChecking] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // As soon as the New PIN is fully entered, verify it isn't already taken
    // (by another tenant / employee / super-admin) so the user knows right away.
    useEffect(() => {
        setNewPinError("");
        if (newPin.length < 4) return;
        if (!/^\d{4}$/.test(newPin)) {
            setNewPinError("PIN must be 4 digits");
            return;
        }

        let cancelled = false;
        setChecking(true);
        checkPinAvailableForSelf(newPin)
            .then((res) => {
                if (cancelled) return;
                if (!res.available) setNewPinError("This PIN is already in use");
            })
            .catch(() => { /* fall back to server-side check on submit */ })
            .finally(() => { if (!cancelled) setChecking(false); });

        return () => { cancelled = true; };
    }, [newPin]);

    // Confirm box only checks that both PINs match.
    useEffect(() => {
        setConfirmError("");
        if (confirmPin.length < 4 || newPin.length < 4) return;
        if (newPin !== confirmPin) setConfirmError("PINs do not match");
    }, [newPin, confirmPin]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (newPin !== confirmPin) {
            setError("New PINs do not match");
            setLoading(false);
            return;
        }

        if (newPin.length < 4) {
            setError("PIN must be at least 4 characters");
            setLoading(false);
            return;
        }

        try {
            await updateAdminPin(currentPin, newPin);
            setSuccess("PIN updated successfully!");
            setTimeout(() => {
                onClose();
                setCurrentPin("");
                setNewPin("");
                setConfirmPin("");
                setSuccess("");
            }, 1000);
        } catch (err: any) {
            setError(err.message || "Failed to update PIN");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Lock size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Change Admin PIN</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-100">
                            {success}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current PIN</label>
                        <div className="relative">
                            <input
                                type={showCurrent ? "text" : "password"}
                                value={currentPin}
                                onChange={(e) => setCurrentPin(e.target.value)}
                                className="w-full p-3 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                                placeholder="Enter current PIN"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                tabIndex={-1}
                                aria-label={showCurrent ? "Hide PIN" : "Show PIN"}
                            >
                                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New PIN</label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className={`w-full p-3 pr-16 rounded-xl border focus:outline-none focus:ring-2 transition-all font-mono ${
                                    newPinError
                                        ? "border-red-400 focus:ring-red-400 bg-red-50/40"
                                        : "border-slate-200 focus:ring-blue-500"
                                }`}
                                placeholder="Enter new PIN"
                                required
                            />
                            {checking && (
                                <Loader2 size={16} className="animate-spin text-slate-400 absolute right-10 top-1/2 -translate-y-1/2" />
                            )}
                            <button
                                type="button"
                                onClick={() => setShowNew((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                tabIndex={-1}
                                aria-label={showNew ? "Hide PIN" : "Show PIN"}
                            >
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {newPinError && (
                            <p className="text-red-500 text-xs font-bold mt-1">{newPinError}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New PIN</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                className={`w-full p-3 pr-11 rounded-xl border focus:outline-none focus:ring-2 transition-all font-mono ${
                                    confirmError
                                        ? "border-red-400 focus:ring-red-400 bg-red-50/40"
                                        : "border-slate-200 focus:ring-blue-500"
                                }`}
                                placeholder="Re-enter new PIN"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                tabIndex={-1}
                                aria-label={showConfirm ? "Hide PIN" : "Show PIN"}
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {confirmError && (
                            <p className="text-red-500 text-xs font-bold mt-1">{confirmError}</p>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || checking || !!newPinError || !!confirmError}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Update PIN
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
