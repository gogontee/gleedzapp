"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the authenticated user
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      } else {
        console.error("No authenticated user found.");
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function fetchTransactions() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("token_transactions")
          .select("id, created_at, description, tokens_in, tokens_out")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching transactions:", error.message);
          setTransactions([]);
        } else {
          // Map the data to match the table format
          const mapped = data.map((tx) => ({
            id: tx.id,
            date: new Date(tx.created_at).toLocaleDateString(),
            description: tx.description,
            tokens:
              tx.tokens_in > 0
                ? `+${tx.tokens_in}`
                : `-${tx.tokens_out}`,
            type: tx.tokens_in > 0 ? "credit" : "debit",
          }));
          setTransactions(mapped);
        }
      } catch (err) {
        console.error("Unexpected error fetching transactions:", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [userId]);

  if (loading) {
    return <p className="text-gray-500">Loading transactions...</p>;
  }

  if (!transactions.length) {
    return <p className="text-gray-500">No transactions found.</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">Transaction History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Description</th>
              <th className="px-4 py-2 border">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{tx.date}</td>
                <td className="px-4 py-2 border">{tx.description}</td>
                <td
                  className={`px-4 py-2 border font-semibold ${
                    tx.type === "credit" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.tokens} Tokens
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
