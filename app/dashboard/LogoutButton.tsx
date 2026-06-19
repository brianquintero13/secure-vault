"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
        >
            Sign Out
        </button>
    );
}