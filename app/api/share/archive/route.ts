import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { linkId, archive } = await request.json();
        if (!linkId) {
            return NextResponse.json({ error: "Missing link ID" }, { status: 400 });
        }

        const updatedLink = await prisma.shareLink.update({
            where: { id: linkId },
            data: { isArchived: archive }
        });

        return NextResponse.json({ success: true, link: updatedLink });
    } catch (error) {
        console.error("ARCHIVE_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}