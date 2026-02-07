"use client";

import React, { useState, useRef } from "react";
import { login } from "@/actions/auth";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function LoginPage() {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const performLogin = async (finalPin: string) => {
        if (finalPin.length !== 4) return;
        setLoading(true);
        setError("");
        const result = await login(finalPin);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
            // Clear PIN on error to allow retry
            setPin("");
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        await performLogin(pin);
    };

    const handlePinChange = (val: string) => {
        if (/^\d{0,4}$/.test(val)) {
            setPin(val);
            if (val.length === 4) {
                performLogin(val);
            }
        }
    };

    const focusInput = () => {
        inputRef.current?.focus();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-center"
            >
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                    <Lock size={32} />
                </div>

                <h1 className="text-2xl font-black text-slate-900 mb-2">AK Attendance</h1>
                <p className="text-slate-500 mb-8 font-medium">Enter your 4-digit PIN to login</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div
                        onClick={focusInput}
                        className="flex justify-center gap-3 cursor-text"
                    >
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${pin.length === i && isFocused
                                    ? "border-blue-500 ring-4 ring-blue-50 bg-white"
                                    : pin.length > i
                                        ? "border-blue-500 bg-blue-50/50 text-blue-600"
                                        : "border-slate-200 bg-slate-50 text-slate-400"
                                    }`}
                            >
                                {pin[i] ? "●" : ""}
                            </div>
                        ))}
                    </div>

                    <input
                        ref={inputRef}
                        type="password"
                        inputMode="numeric"
                        autoFocus
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        value={pin}
                        onChange={(e) => handlePinChange(e.target.value)}
                        className="opacity-0 absolute inset-0 -z-10 cursor-default"
                        style={{ fontSize: '16px' }} // Prevent iOS zoom
                    />

                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-rose-500 text-sm font-bold"
                        >
                            {error}
                        </motion.p>
                    )}

                    <button
                        disabled={loading || pin.length !== 4}
                        type="submit"
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-50">
                    <p className="text-[10px] text-slate-300 uppercase font-black tracking-[0.2em]">Authorized Access Only</p>
                </div>
            </motion.div>
        </div>
    );
}
