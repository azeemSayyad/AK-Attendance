import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: number;
    className?: string;
}

export const Spinner = ({ size = 24, className, ...props }: SpinnerProps) => {
    return (
        <div
            className={cn("animate-spin text-blue-600", className)}
            style={{ width: size, height: size }}
            {...props}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
        </div>
    );
};
