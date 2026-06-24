import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            documentUrl,
            fileName,
            requirePassword,
            password,
            maxViews,
            expiresInDays,
            expiresAfterOpenMinutes,
            watermarkText,
            lockToFirstDevice,
            maxUniqueDevices,
        } = body;

        if (!documentUrl || !fileName) {
            return NextResponse.json({ error: "Missing document details" }, { status: 400 });
        }

        let expiresAt: Date | null = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
        }

        let passwordHash: string | null = null;
        if (requirePassword && password) {
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(password, salt);
        }

        const newLink = await prisma.shareLink.create({
            data: {
                documentUrl,
                fileName,
                creatorEmail: session.user.email,
                requirePassword: !!requirePassword,
                passwordHash,
                maxViews: maxViews ? parseInt(maxViews) : null,
                expiresAt,
                expiresAfterOpenMinutes: expiresAfterOpenMinutes ? parseInt(expiresAfterOpenMinutes) : null,
                watermarkText: watermarkText || "CONFIDENTIAL",
                lockToFirstDevice: !!lockToFirstDevice,
                maxUniqueDevices: maxUniqueDevices ? parseInt(maxUniqueDevices) : null,
            },
        });

        const baseUrl = process.env.NEXTAUTH_URL || "https://secure-vault-coral.vercel.app";
        const finalShareUrl = `${baseUrl}/view/${newLink.id}`;

        return NextResponse.json({
            success: true,
            shareUrl: finalShareUrl,
            linkId: newLink.id
        });

    } catch (error) {
        console.error("LINK_GENERATION_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}