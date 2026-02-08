"use client";

import React, { useState } from "react";
import { updateAdminPin } from "@/actions/auth";
import { X, Lock, Save, Loader2 } from "lucide-react";

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
                        <input
                            type="password"
                            value={currentPin}
                            onChange={(e) => setCurrentPin(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                            placeholder="Enter current PIN"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New PIN</label>
                        <input
                            type="password"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                            placeholder="Enter new PIN"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New PIN</label>
                        <input
                            type="password"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                            placeholder="Re-enter new PIN"
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
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
