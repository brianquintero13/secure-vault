"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid email or password");
            setLoading(false);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 bg-zinc-900 p-8 rounded-lg border border-zinc-800 shadow-md">
                <h2 className="text-2xl font-bold text-center text-zinc-100">System Access Gate</h2>
                {error && <p className="text-red-500 text-sm text-center bg-red-950/40 p-2 rounded border border-red-900">{error}</p>}
                <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Authorized Email</label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-emerald-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-emerald-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded bg-emerald-600 hover:bg-emerald-700 font-bold tracking-wide transition disabled:opacity-50 text-white"
                >
                    {loading ? "Authenticating..." : "Authenticate"}
                </button>
            </form>
        </div>
    );
}