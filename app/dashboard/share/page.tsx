"use client";

import React, { useState } from "react";

export default function CreateShareLink() {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    const [documentUrl, setDocumentUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [requirePassword, setRequirePassword] = useState(false);
    const [password, setPassword] = useState("");
    const [maxViews, setMaxViews] = useState("");
    const [expiresInDays, setExpiresInDays] = useState("");
    const [expiresAfterOpenMinutes, setExpiresAfterOpenMinutes] = useState("");
    const [watermarkText, setWatermarkText] = useState("");

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        // Set display name automatically (removes file extension like .pdf)
        setFileName(file.name.replace(/\.[^/.]+$/, ""));

        try {
            // 1. Get the secure upload token (presigned URL) from your backend
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    size: file.size,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to generate upload tokens");
            }

            const { uploadUrl, fileKey } = await response.json();

            // 2. Upload the file binary directly from your browser to Amazon S3
            const s3Upload = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type,
                },
                body: file,
            });

            if (!s3Upload.ok) {
                throw new Error("Failed to transmit file to S3 storage");
            }

            // 3. Construct the secure private document S3 URL and auto-fill the form
            const s3Url = `https://secure-dataroom-vault-brian.s3.us-east-2.amazonaws.com/${fileKey}`;
            setDocumentUrl(s3Url);

        } catch (err: any) {
            console.error("Direct S3 Upload error:", err);
            alert(err.message || "File upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

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
                alert("Failed to generate link: " + data.error);
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
        <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 text-white font-sans">
            <h2 className="text-xl font-bold mb-4 text-zinc-100 border-b border-zinc-800 pb-2">Generate Secure Share Link</h2>

            <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">1. Document Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Upload PDF / Document</label>
                            <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                onChange={handleFileUpload}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-white text-sm file:mr-4 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                            />
                            {uploading && <p className="text-xs text-emerald-400 mt-1">Uploading directly to S3...</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Document Display Name</label>
                            <input required value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g. Project Pitch Deck" className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-zinc-400 mb-1">Document Source URL (Auto-filled upon upload)</label>
                            <input required value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="Paste the link manually or let the uploader fill this automatically" className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-400 font-mono text-xs" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-900">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">2. Security & Access Settings</h3>

                    <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded border border-zinc-800">
                        <input type="checkbox" id="requirePassword" checked={requirePassword} onChange={(e) => setRequirePassword(e.target.checked)} className="h-5 w-5 accent-emerald-500" />
                        <div className="flex-1">
                            <label htmlFor="requirePassword" className="font-medium text-zinc-200">Require Password to View</label>
                            <p className="text-xs text-zinc-500">Forces the client to enter a password before they can view the document.</p>
                        </div>
                        {requirePassword && (
                            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set Password" className="bg-black border border-zinc-700 rounded p-2 text-white" />
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                            <label className="block font-medium text-zinc-200 mb-1">Maximum Views Allowed</label>
                            <p className="text-xs text-zinc-500 mb-2">The link will automatically turn off after being opened this many times.</p>
                            <input type="number" value={maxViews} onChange={(e) => setMaxViews(e.target.value)} placeholder="Leave blank for unlimited" className="w-full bg-black border border-zinc-700 rounded p-2 text-white" />
                        </div>

                        <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                            <label className="block font-medium text-zinc-200 mb-1">Hard Expiration (Days)</label>
                            <p className="text-xs text-zinc-500 mb-2">The link will expire completely after this many days.</p>
                            <input type="number" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} placeholder="e.g. 7 days" className="w-full bg-black border border-zinc-700 rounded p-2 text-white" />
                        </div>

                        <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                            <label className="block font-medium text-zinc-200 mb-1">Viewing Time Limit (Minutes)</label>
                            <p className="text-xs text-zinc-500 mb-2">The link expires this many minutes after the client opens it for the first time.</p>
                            <input type="number" value={expiresAfterOpenMinutes} onChange={(e) => setExpiresAfterOpenMinutes(e.target.value)} placeholder="e.g. 30 minutes" className="w-full bg-black border border-zinc-700 rounded p-2 text-white" />
                        </div>

                        <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                            <label className="block font-medium text-zinc-200 mb-1">Security Watermark Text</label>
                            <p className="text-xs text-zinc-500 mb-2">Adds a background watermark with this text, the viewer's IP, and city.</p>
                            <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="CONFIDENTIAL" className="w-full bg-black border border-zinc-700 rounded p-2 text-white" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded transition">
                    {loading ? "Generating Secure Link..." : "Create Secure Link"}
                </button>
            </form>

            {generatedLink && (
                <div className="mt-8 p-6 bg-emerald-950/40 border border-emerald-900 rounded-xl text-center">
                    <h3 className="text-emerald-500 font-bold text-lg mb-2">Secure Link Created</h3>
                    <p className="text-emerald-200/70 text-xs mb-4">This link is now active and client views will be logged in your dashboard history.</p>
                    <div className="flex items-center gap-2 bg-black p-3 rounded border border-emerald-900/50">
                        <input readOnly value={generatedLink} className="flex-1 bg-transparent text-emerald-400 outline-none select-all text-sm font-mono" />
                        <button onClick={copyToClipboard} className="bg-emerald-800 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 transition">Copy</button>
                    </div>
                </div>
            )}
        </div>
    );
}