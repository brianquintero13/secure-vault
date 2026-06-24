import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ active: false });
        }

        const link = await prisma.shareLink.findUnique({
            where: { id: token },
        });

        if (!link) {
            return NextResponse.json({ active: false });
        }

        const isExpired = link.expiresAt && new Date() > link.expiresAt;
        const isLimitExceeded = link.maxViews && link.currentViews >= link.maxViews;
        const isActive = !link.isArchived && !isExpired && !isLimitExceeded;

        return NextResponse.json({ active: isActive });
    } catch (err) {
        return NextResponse.json({ active: false }, { status: 500 });
    }
}