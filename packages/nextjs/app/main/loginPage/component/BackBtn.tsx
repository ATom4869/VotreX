"use client"
import React from "react";
import { useRouter } from "next/navigation";

interface Props {
    buttonLabel: string;
    linkDest?: string; // Make linkDest optional
}

const BackBtn: React.FC<Props> = ({ linkDest, buttonLabel }) => {
    const router = useRouter();

    const handleBack = () => {
        if (linkDest) {
            // Navigate to the provided link destination
            router.push(linkDest);
        } else {
            // Navigate to the previous page
            router.back();
        }
    };

    return (
        <button onClick={handleBack} className="btn btn-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd" d="M9.53 2.47a.75.75 0 0 1 0 1.06L4.81 8.25H15a6.75 6.75 0 0 1 0 13.5h-3a.75.75 0 0 1 0-1.5h3a5.25 5.25 0 1 0 0-10.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>

            <span>{buttonLabel}</span>
        </button>
    );
};

export default BackBtn;
