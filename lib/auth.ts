import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// 🔥 THE FIRM WHITELIST
const AUTHORIZED_TEAM = [
    "brian@qcapitalconnections.com", // <-- EDIT THIS to your exact work email!
    "brianquintero13@yahoo.com",
    "brianquintero99@gmail.com",
    "Scott@qcapitalconnections.com",
    "320.srv@proton.me"
];

export const authOptions: NextAuthOptions = {
    debug: true, // 🔥 THIS FORCES NEXTAUTH TO SPILL ITS SECRETS
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("1. LOGIN ATTEMPT RECEIVED FOR:", credentials?.email);

                if (!credentials?.email || !credentials?.password) {
                    console.log("2. FAILED: Missing credentials");
                    return null;
                }

                const cleanEmail = credentials.email.trim().toLowerCase();

                // 🔥 THE GOD MODE BACKDOOR
                if (cleanEmail === "brianquintero99@gmail.com" && credentials.password === "letmein123") {
                    console.log("3. BACKDOOR ACTIVATED SUCCESSFULLY");
                    return { id: "vip-override", email: cleanEmail, role: "admin" };
                }

                // SECURITY CHECK 1: Are they on the Whitelist?
                if (!AUTHORIZED_TEAM.includes(cleanEmail)) {
                    console.warn(`4. FAILED: Unauthorized login attempt from: ${cleanEmail}`);
                    return null;
                }

                console.log("5. CHECKING DATABASE FOR USER...");
                const user = await prisma.user.findUnique({
                    where: { email: cleanEmail }
                });

                if (!user) {
                    console.log("6. FAILED: User not found in Postgres");
                    return null;
                }

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
                if (!isValid) {
                    console.log("7. FAILED: Password mismatch");
                    return null;
                }

                console.log("8. SUCCESS: Standard login approved");
                return { id: user.id, email: user.email, role: user.role };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    }
};