import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const AUTHORIZED_TEAM = [
    "brian@qcapitalconnections.com",
    "brianquintero13@yahoo.com",
    "brianquintero99@gmail.com",
    "scott@qcapitalconnections.com",
    "320.srv@proton.me"
];

export const authOptions: NextAuthOptions = {
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
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const cleanEmail = credentials.email.trim().toLowerCase();

                // Whitelist Verification
                if (!AUTHORIZED_TEAM.includes(cleanEmail)) {
                    console.warn(`Unauthorized login attempt blocked from: ${cleanEmail}`);
                    return null;
                }

                // Fetch database record
                const user = await prisma.user.findUnique({
                    where: { email: cleanEmail }
                });

                if (!user) {
                    return null;
                }

                // Check hashed password
                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
                if (!isValid) {
                    return null;
                }

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