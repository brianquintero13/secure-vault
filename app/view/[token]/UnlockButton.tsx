"use client";

import { useState } from "react";

export default function UnlockButton({
                                         token,
                                         onUnlock
                                     }: {
    token: string;
    onUnlock: (token: string) => Promise<void>
}) {
    const [isUnlocking, setIsUnlocking] = useState(false);

    const handleClick = async () => {
        setIsUnlocking(true);
        try {
            await onUnlock(token);
        } catch (error) {
            console.error("Unlock failed", error);
            setIsUnlocking(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isUnlocking}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition disabled:bg-gray-400"
        >
            {isUnlocking ? "Decrypting Protocol..." : "Decrypt and View Document"}
        </button>
    );
}