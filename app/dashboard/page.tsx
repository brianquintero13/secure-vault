"use client";

import React, { useState } from "react";
import CreateShareLink from "./share/page";
import ArchiveManager from "@/components/ArchiveManager";
import { signOut } from "next-auth/react";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<"generator" | "archive">("generator");

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header with Title and Log Out Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight">Q Capital Connections</h1>
                        <p className="text-zinc-400 text-sm">Secure Document Sharing — Generate secure links and track client views.</p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="text-xs bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white px-4 py-2 rounded border border-zinc-800 transition font-semibold self-start sm:self-center"
                    >
                        Log Out
                    </button>
                </div>

                {/* Tab Selection */}
                <div className="flex gap-6 border-b border-zinc-800 pb-2">
                    <button
                        onClick={() => setActiveTab("generator")}
                        className={`pb-2 px-1 font-semibold transition-colors border-b-2 text-sm ${
                            activeTab === "generator"
                                ? "border-emerald-500 text-emerald-400"
                                : "border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        Create Share Link
                    </button>
                    <button
                        onClick={() => setActiveTab("archive")}
                        className={`pb-2 px-1 font-semibold transition-colors border-b-2 text-sm ${
                            activeTab === "archive"
                                ? "border-emerald-500 text-emerald-400"
                                : "border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        Link Manager & History
                    </button>
                </div>

                <div className="mt-4">
                    {activeTab === "generator" && <CreateShareLink />}
                    {activeTab === "archive" && <ArchiveManager />}
                </div>
            </div>
        </div>
    );
}