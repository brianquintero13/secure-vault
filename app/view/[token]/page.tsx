import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import React from "react";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";

interface ViewPageProps {
    params: Promise<{
        token: string;
    }>;
    searchParams: Promise<{
        password?: string;
    }>;
}

// Helper function to extract file name from any S3 URL
function getS3KeyFromUrl(url: string): string {
    try {
        const parsedUrl = new URL(url);
        return decodeURIComponent(parsedUrl.pathname.slice(1));
    } catch (e) {
        return url;
    }
}

export default async function ViewDocumentPage({ params, searchParams }: ViewPageProps) {
    // Await parameters
    const { token } = await params;
    const { password: submittedPassword } = await searchParams;

    // 1. Fetch the share link from Postgres
    const shareLink = await prisma.shareLink.findUnique({
        where: { id: token },
    });

    if (!shareLink) {
        return notFound();
    }

    // 2. Fetch connection metadata
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const userAgent = headerList.get("user-agent") || "Unknown Device";
    const city = headerList.get("x-vercel-ip-city") || "Unknown City";

    // 3. PASSWORD GATE: Check password if it is required
    if (shareLink.requirePassword && shareLink.passwordHash) {
        let passwordGranted = false;

        if (submittedPassword) {
            passwordGranted = await bcrypt.compare(submittedPassword, shareLink.passwordHash);
        }

        if (!passwordGranted) {
            return (
                <div className="flex h-screen items-center justify-center bg-black text-white p-6 font-sans">
                    <form action={`/view/${token}`} method="GET" className="text-center max-w-sm w-full border border-zinc-800 p-8 rounded-lg bg-zinc-950 space-y-6">
                        <h1 className="text-xl font-bold text-zinc-100 font-sans">Password Required</h1>
                        <p className="text-zinc-400 text-sm">This document is password protected. Please enter the password to view it.</p>

                        {submittedPassword && (
                            <p className="text-red-500 text-xs font-semibold">Incorrect password. Please try again.</p>
                        )}

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter password"
                            className="w-full p-2.5 rounded bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-emerald-500 text-center"
                            required
                        />

                        <button type="submit" className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-700 font-semibold text-sm transition">
                            View Document
                        </button>
                    </form>
                </div>
            );
        }
    }

    // 4. SECURITY CHECK: Has the hard expiration date passed?
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white p-6 font-sans">
                <div className="text-center max-w-md border border-zinc-800 p-8 rounded-lg bg-zinc-950">
                    <h1 className="text-xl font-bold text-zinc-200 mb-2">Link Expired</h1>
                    <p className="text-zinc-400 text-sm">This secure share link has expired and is no longer active. Please contact the sender to request access.</p>
                </div>
            </div>
        );
    }

    // 5. SECURITY CHECK: Has it exceeded maximum allowed opens?
    if (shareLink.maxViews && shareLink.currentViews >= shareLink.maxViews) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white p-6 font-sans">
                <div className="text-center max-w-md border border-zinc-800 p-8 rounded-lg bg-zinc-950">
                    <h1 className="text-xl font-bold text-zinc-200 mb-2">Access Limit Reached</h1>
                    <p className="text-zinc-400 text-sm">This document link has reached its maximum view limit. Please contact the sender if you need to view it again.</p>
                </div>
            </div>
        );
    }

    // 6. SECURITY CHECK: Is the time-bomb duration active from the first open?
    if (shareLink.firstOpenedAt && shareLink.expiresAfterOpenMinutes) {
        const timeLimit = new Date(shareLink.firstOpenedAt.getTime() + shareLink.expiresAfterOpenMinutes * 60000);
        if (new Date() > timeLimit) {
            return (
                <div className="flex h-screen items-center justify-center bg-black text-white p-6 font-sans">
                    <div className="text-center max-w-md border border-zinc-800 p-8 rounded-lg bg-zinc-950">
                        <h1 className="text-xl font-bold text-zinc-200 mb-2">Viewing Session Ended</h1>
                        <p className="text-zinc-400 text-sm">The viewing duration allowed for this document has ended. Please request a new link if you need more time.</p>
                    </div>
                </div>
            );
        }
    }

    // 7. Log access details & increment views
    const isFirstOpen = !shareLink.firstOpenedAt;

    await prisma.shareLink.update({
        where: { id: token },
        data: {
            currentViews: { increment: 1 },
            firstOpenedAt: isFirstOpen ? new Date() : undefined,
            logs: {
                create: {
                    ipAddress: ip,
                    city: city,
                    country: headerList.get("x-vercel-ip-country") || "Unknown Country",
                    deviceOS: userAgent.substring(0, 50),
                }
            }
        }
    });

    // 8. Generate a secure, temporary S3 view URL on-the-fly
    let secureViewUrl = shareLink.documentUrl;
    try {
        const s3Key = getS3KeyFromUrl(shareLink.documentUrl);
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
        });
        // Generate a temporary link that expires in 15 minutes (900 seconds)
        secureViewUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    } catch (err) {
        console.error("Failed to generate secure S3 link: ", err);
    }

    return (
        <div className="relative h-screen w-screen bg-zinc-900 text-white select-none overflow-hidden font-sans">
            <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { display: none !important; }
        }
      `}} />

            {/* Diagonal watermark */}
            <div className="pointer-events-none absolute inset-0 z-50 grid grid-cols-3 grid-rows-3 gap-4 opacity-10 rotate-[-30deg] scale-125 select-none font-mono text-xs text-white">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-center whitespace-nowrap">
                        {shareLink.watermarkText || "CONFIDENTIAL"} | IP: {ip} | {city}
                    </div>
                ))}
            </div>

            <div className="flex h-12 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 z-10 relative">
                <span className="text-sm font-medium tracking-wide text-zinc-300">{shareLink.fileName}</span>
                <div className="flex items-center gap-4 text-xs text-zinc-500 font-sans">
                    <span>Views: {shareLink.currentViews + 1} / {shareLink.maxViews || "∞"}</span>
                    <span className="h-3 w-px bg-zinc-800" />
                    <span className="text-emerald-400 font-medium">Secured View Mode</span>
                </div>
            </div>

            <div className="flex h-[calc(100vh-48px)] w-full items-center justify-center p-4 bg-zinc-900">
                <iframe
                    src={`${secureViewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="h-full w-full max-w-4xl rounded border border-zinc-800 shadow-2xl bg-white"
                />
            </div>
        </div>
    );
}