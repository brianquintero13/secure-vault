"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "An error occurred during registration.");
            } else {
                router.push("/login");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 bg-zinc-900 p-8 rounded-lg border border-zinc-800 shadow-md">
                <h2 className="text-2xl font-bold text-center text-zinc-100">Create Secure Account</h2>
                {error && <p className="text-red-500 text-sm text-center bg-red-950/40 p-2 rounded border border-red-900">{error}</p>}
                <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">Email Address</label>
                    <input
                        type="email"
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
                    {loading ? "Registering..." : "Register"}
                </button>

                {/* Direct Link to Login */}
                <div className="text-center pt-2">
                    <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="text-sm text-zinc-400 hover:text-white transition"
                    >
                        Already have an account? <span className="text-emerald-400 font-semibold hover:underline">Log in here</span>
                    </button>
                </div>
            </form>
        </div>
    );
}