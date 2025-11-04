"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function TokenWallet({ userId }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBalance() {
      setLoading(true);
      const { data, error } = await supabase
        .from("token_wallets") // Correct table name
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching token balance:", error);
        setBalance(0);
      } else if (data) {
        setBalance(data.balance ?? 0);
      }
      setLoading(false);
    }

    if (userId) fetchBalance();
  }, [userId]);

  return (
    <div className="p-4 border rounded-md shadow-sm bg-white">
      <h3 className="font-semibold text-gray-700">Token Wallet</h3>
      <p className="text-xl font-bold text-orange-600">
        {loading ? "Loading..." : `${balance} Tokens`}
      </p>
    </div>
  );
}
