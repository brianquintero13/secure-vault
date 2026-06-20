import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const links = await prisma.shareLink.findMany({
            where: { creatorEmail: session.user?.email || "" },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(links);
    } catch (error) {
        console.error("LIST_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}