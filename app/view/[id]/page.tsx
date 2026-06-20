import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import React from "react";

interface ViewPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ViewDocumentPage({ params }: ViewPageProps) {
    // Await the asynchronous route parameters
    const { id: linkId } = await params;

    // 1. Fetch parameters
    const shareLink = await prisma.shareLink.findUnique({
        where: { id: linkId },
    });

    if (!shareLink) {
        return notFound();
    }

    // 2. Fetch connection metadata
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const userAgent = headerList.get("user-agent") || "Unknown Device";
    const city = headerList.get("x-vercel-ip-city") || "Unknown City";
    const country = headerList.get("x-vercel-ip-country") || "Unknown Country";

    // 3. Expiration checks
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white p-6">
                <div className="text-center max-w-md border border-red-900 p-8 rounded-lg bg-zinc-950">
                    <h1 className="text-xl font-bold text-red-500 mb-2">Link Expired</h1>
                    <p className="text-zinc-400 text-sm">This secure data room link has reached its expiration limit and has been dissolved.</p>
                </div>
            </div>
        );
    }

    // 4. Maximum view limit check
    if (shareLink.maxViews && shareLink.currentViews >= shareLink.maxViews) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white p-6">
                <div className="text-center max-w-md border border-red-900 p-8 rounded-lg bg-zinc-950">
                    <h1 className="text-xl font-bold text-red-500 mb-2">Access Limit Reached</h1>
                    <p className="text-zinc-400 text-sm">This document link has exceeded its maximum allowed views.</p>
                </div>
            </div>
        );
    }

    // 5. Dynamic Time-Bomb check
    if (shareLink.firstOpenedAt && shareLink.expiresAfterOpenMinutes) {
        const timeLimit = new Date(shareLink.firstOpenedAt.getTime() + shareLink.expiresAfterOpenMinutes * 60000);
        if (new Date() > timeLimit) {
            return (
                <div className="flex h-screen items-center justify-center bg-black text-white p-6">
                    <div className="text-center max-w-md border border-red-900 p-8 rounded-lg bg-zinc-950">
                        <h1 className="text-xl font-bold text-red-500 mb-2">Time Window Expired</h1>
                        <p className="text-zinc-400 text-sm">The duration allowed to view this document has ended.</p>
                    </div>
                </div>
            );
        }
    }

    // 6. Log access & adjust views
    const isFirstOpen = !shareLink.firstOpenedAt;

    await prisma.shareLink.update({
        where: { id: linkId },
        data: {
            currentViews: { increment: 1 },
            firstOpenedAt: isFirstOpen ? new Date() : undefined,
            logs: {
                create: {
                    ipAddress: ip,
                    city: city,
                    country: country,
                    deviceOS: userAgent.substring(0, 50),
                }
            }
        }
    });

    return (
        <div className="relative h-screen w-screen bg-zinc-900 text-white select-none overflow-hidden">
            {/* CSS print override rule */}
            <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { display: none !important; }
        }
      `}} />

            {/* Repeating Diagonal Watermark Layer */}
            <div className="pointer-events-none absolute inset-0 z-50 grid grid-cols-3 grid-rows-3 gap-4 opacity-10 rotate-[-30deg] scale-125 select-none font-mono text-xs text-white">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-center whitespace-nowrap">
                        {shareLink.watermarkText || "CONFIDENTIAL"} | IP: {ip} | {city}
                    </div>
                ))}
            </div>

            <div className="flex h-12 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 z-10 relative">
                <span className="text-sm font-medium tracking-wide text-zinc-300">{shareLink.fileName}</span>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>Views: {shareLink.currentViews + 1} / {shareLink.maxViews || "∞"}</span>
                    <span className="h-3 w-px bg-zinc-800" />
                    <span className="text-red-400 font-medium">Outbound Security Enabled</span>
                </div>
            </div>

            <div className="flex h-[calc(100vh-48px)] w-full items-center justify-center p-4 bg-zinc-900">
                <iframe
                    src={`${shareLink.documentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="h-full w-full max-w-4xl rounded border border-zinc-800 shadow-2xl bg-white"
                />
            </div>
        </div>
    );
}