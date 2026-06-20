import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 🔥 Must match the whitelist in lib/auth.ts
const AUTHORIZED_TEAM = [
    "brian@qcapitalconnections.com", // <-- EDIT THIS to match the auth.ts file!
    "brianquintero13@yahoo.com",
    "Scott@qcapitalconnections.com",
    "320.srv@proton.me"
];

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Whitelist Gate
        if (!AUTHORIZED_TEAM.includes(email)) {
            return NextResponse.json({ error: "Email is not authorized on the system whitelist." }, { status: 403 });
        }

        // Check Duplication
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "Account already exists" }, { status: 400 });
        }

        // Securely Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role: "admin"
            }
        });

        return NextResponse.json({ message: "User created successfully", userId: user.id }, { status: 201 });
    } catch (error) {
        console.error("Registration endpoint failure:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}