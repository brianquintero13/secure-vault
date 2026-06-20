"use client";

import React, { useState } from "react";

export default function CreateShareLink() {
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    const [documentUrl, setDocumentUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [requirePassword, setRequirePassword] = useState(false);
    const [password, setPassword] = useState("");
    const [maxViews, setMaxViews] = useState("");
    const [expiresInDays, setExpiresInDays] = useState("");
    const [expiresAfterOpenMinutes, setExpiresAfterOpenMinutes] = useState("");
    const [watermarkText, setWatermarkText] = useState("");

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setGeneratedLink(null);

        try {
            const response = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documentUrl,
                    fileName,
                    requirePassword,
                    password: requirePassword ? password : null,
                    maxViews: maxViews ? parseInt(maxViews) : null,
                    expiresInDays: expiresInDays ? parseInt(expiresInDays) : null,
                    expiresAfterOpenMinutes: expiresAfterOpenMinutes ? parseInt(expiresAfterOpenMinutes) : null,
                    watermarkText: watermarkText || "CONFIDENTIAL - DO NOT DISTRIBUTE",
                }),
            });

            const data = await response.json();

            if (data.success) {
                setGeneratedLink(data.shareUrl);
            } else {
                alert("Failed: " + data.error);
            }
        } catch (error) {
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 text-white">
            <h2 className="text-xl font-bold mb-4 text-zinc-100 border-b border-zinc-800 pb-2">Outbound Control Generator</h2>
            <form onSubmit={handleGenerate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">File Name</label>
                        <input required value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g. Q-Capital-Deck.pdf" className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Document URL (AWS S3 Link)</label>
                        <input required value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="https://s3.amazonaws.com/..." className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white" />
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded border border-zinc-800">
                    <input type="checkbox" id="requirePassword" checked={requirePassword} onChange={(e) => setRequirePassword(e.target.checked)} className="h-5 w-5 accent-emerald-500" />
                    <div className="flex-1">
                        <label htmlFor="requirePassword" className="font-medium text-zinc-200">Enforce Access Password</label>
                        <p className="text-xs text-zinc-500">Enforces a password check before showing the document.</p>
                    </div>
                    {requirePassword && (
                        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Define password" className="bg-black border border-zinc-700 rounded p-2 text-white" />
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                        <label className="block font-medium text-zinc-200 mb-1">Maximum Opens</label>
                        <input type="number" value={maxViews} onChange={(e) => setMaxViews(e.target.value)} placeholder="e.g. 5" className="w-full bg-black border border-zinc-700 rounded p-2 text-white" />
                    </div>

                    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                        <label className="block font-medium text-zinc-200 mb-1">Hard Expiration (Days)</label>
                        <input type="number" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} placeholder="e.g. 7" className="w-full bg-black border border-zinc-700 rounded p-2 text-white" />
                    </div>

                    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                        <label className="block font-medium text-zinc-200 mb-1">Time-Bomb (Minutes)</label>
                        <input type="number" value={expiresAfterOpenMinutes} onChange={(e) => setExpiresAfterOpenMinutes(e.target.value)} placeholder="e.g. 30" className="w-full bg-black border border-zinc-700 rounded p-2 text-white" />
                    </div>

                    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                        <label className="block font-medium text-zinc-200 mb-1">Forensic Watermark Text</label>
                        <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="CONFIDENTIAL" className="w-full bg-black border border-zinc-700 rounded p-2 text-white" />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded transition">
                    {loading ? "Forging Vault Link..." : "Generate Secure Link"}
                </button>
            </form>

            {generatedLink && (
                <div className="mt-8 p-6 bg-emerald-950/40 border border-emerald-900 rounded-xl text-center">
                    <h3 className="text-emerald-500 font-bold text-lg mb-2">Vault Link Forged</h3>
                    <p className="text-emerald-200/70 text-xs mb-4">This link has been mapped to your security policies and logged in the database.</p>
                    <div className="flex items-center gap-2 bg-black p-3 rounded border border-emerald-900/50">
                        <input readOnly value={generatedLink} className="flex-1 bg-transparent text-emerald-400 outline-none select-all text-sm font-mono" />
                        <button onClick={copyToClipboard} className="bg-emerald-800 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 transition">Copy</button>
                    </div>
                </div>
            )}
        </div>
    );
}