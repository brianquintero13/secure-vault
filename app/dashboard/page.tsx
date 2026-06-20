"use client";

import React, { useState } from "react";
import CreateShareLink from "./share/page";
import ArchiveManager from "@/components/ArchiveManager";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<"generator" | "archive">("generator");

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
                    <h1 className="text-3xl font-extrabold tracking-tight">Q Capital Connections Vault</h1>
                    <p className="text-zinc-400">Secure enterprise data room dashboard — Management of outbound burner links.</p>
                </div>

                {/* Dynamic Tab Panel */}
                <div className="flex gap-6 border-b border-zinc-800 pb-2">
                    <button
                        onClick={() => setActiveTab("generator")}
                        className={`pb-2 px-1 font-semibold transition-colors border-b-2 text-sm ${
                            activeTab === "generator"
                                ? "border-emerald-500 text-emerald-400"
                                : "border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        Forging Console
                    </button>
                    <button
                        onClick={() => setActiveTab("archive")}
                        className={`pb-2 px-1 font-semibold transition-colors border-b-2 text-sm ${
                            activeTab === "archive"
                                ? "border-emerald-500 text-emerald-400"
                                : "border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        Vault Archives & Auditing
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