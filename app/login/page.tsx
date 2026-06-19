"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid email or password");
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                <h1 className="mb-6 text-2xl font-bold text-gray-900 text-center">Data Room Login</h1>

                {error && <p className="mb-4 text-sm font-medium text-red-600 text-center bg-red-50 py-2 rounded-md">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button type="submit" className="w-full rounded-md bg-black px-4 py-2 text-white font-medium hover:bg-gray-800 transition">
                        Sign In
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Need an account? <Link href="/register" className="text-blue-600 hover:underline font-medium">Register here</Link>
                </p>
            </div>
        </div>
    );
}