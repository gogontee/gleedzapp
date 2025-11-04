"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import PosterShowcase from "../../components/PosterShowcase";
import PosterShowcaseMobile from "../../components/PosterShowcaseMobile";
import { motion } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let emailToUse = identifier;
      let userId = null;

      // If username is entered, resolve to email and get user ID
      if (!identifier.includes("@")) {
        // Check both publishers and fans for the username
        let profile = await supabase
          .from("publishers")
          .select("id")
          .eq("username", identifier)
          .single();

        if (!profile.data) {
          profile = await supabase
            .from("fans")
            .select("id")
            .eq("username", identifier)
            .single();
        }

        if (!profile.data) throw new Error("Username not found");

        const { data, error: userError } = await supabase.auth.admin.getUserById(profile.data.id);
        if (userError || !data?.user) throw new Error("Could not resolve username");

        emailToUse = data.user.email;
        userId = profile.data.id;
      }

      // Sign in
      const { data: signInData, error: loginError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (loginError) throw loginError;
      
      // Use the userId from username resolution or get from signInData
      const finalUserId = userId || signInData.user.id;

      // Fetch role from users table
      const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", finalUserId)
        .single();

      if (roleError || !userData?.role) throw new Error("Failed to determine user role");

      // Redirect based on role with actual user ID
      if (userData.role === "publisher") {
        router.push(`/publisherdashboard/${finalUserId}`);
      } else if (userData.role === "fans") {
        router.push(`/fansdashboard/${finalUserId}`);
      } else {
        throw new Error("Unknown user role");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile poster */}
      <div className="md:hidden">
        <PosterShowcaseMobile />
      </div>

      <div className="min-h-screen flex flex-col md:flex-row md:items-center md:justify-center md:gap-8 bg-white">
        {/* Poster on desktop */}
        <div className="hidden md:flex md:w-[480px]">
          <PosterShowcase />
        </div>

        {/* Login Section */}
        <div className="flex-1 flex justify-center items-center px-6 py-12">
          <motion.div
            className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/glogo.png"
                alt="Logo"
                width={120}
                height={50}
                className="object-contain"
              />
            </div>

            <h2 className="text-center text-2xl font-bold mb-6 text-gray-800">
              Welcome Back
            </h2>

            {error && (
              <p className="text-red-600 text-center mb-4 text-sm">{error}</p>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Enter email or username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Enter password"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-700 transition"
              >
                {loading ? "Logging in..." : "Login"}
              </motion.button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/signup")}
                className="text-yellow-600 hover:underline"
              >
                Sign up
              </button>
            </div>

            <div className="mt-2 text-center text-sm">
              <button
                onClick={() => router.push("/auth/reset-password")}
                className="text-gray-500 hover:underline"
              >
                Forgot password? Reset here
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}