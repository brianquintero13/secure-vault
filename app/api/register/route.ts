import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const AUTHORIZED_TEAM = [
    "brian@qcapitalconnections.com",
    "brianquintero13@yahoo.com",
    "brianquintero99@gmail.com",
    "scott@qcapitalconnections.com",
    "320.srv@proton.me"
];

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const cleanEmail = email.trim().toLowerCase();

        if (!AUTHORIZED_TEAM.includes(cleanEmail)) {
            return NextResponse.json({ error: "This email is not authorized on the system whitelist." }, { status: 403 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: cleanEmail }
        });

        if (existingUser) {
            return NextResponse.json({ error: "Account already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: cleanEmail,
                passwordHash: hashedPassword,
                role: "admin"
            }
        });

        return NextResponse.json({ message: "User created successfully", userId: user.id }, { status: 201 });
    } catch (error) {
        console.error("Registration route failure:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}