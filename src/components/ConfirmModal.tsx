"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Trash2 } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning";
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger"
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-xs rounded-[2rem] shadow-2xl overflow-hidden p-8"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className={`p-4 rounded-full mb-4 ${variant === "danger" ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"}`}>
                            {variant === "danger" ? <Trash2 size={32} /> : <AlertCircle size={32} />}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                            {message}
                        </p>

                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${variant === "danger"
                                        ? "bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600"
                                        : "bg-amber-500 text-white shadow-lg shadow-amber-200 hover:bg-amber-600"
                                    }`}
                            >
                                {confirmText}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                            >
                                {cancelText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
