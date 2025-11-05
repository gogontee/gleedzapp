"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { ChevronDown, Loader2 } from "lucide-react";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const TRANSACTIONS_PER_PAGE = 50;

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

    async function fetchTotalCount() {
      const { count, error } = await supabase
        .from("token_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (!error) {
        setTotalCount(count || 0);
      }
    }

    fetchTotalCount();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    async function fetchTransactions() {
      setLoading(true);
      try {
        const from = 0;
        const to = TRANSACTIONS_PER_PAGE - 1;

        const { data, error } = await supabase
          .from("token_transactions")
          .select("id, created_at, description, tokens_in, tokens_out")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .range(from, to);

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
            created_at: tx.created_at,
          }));
          setTransactions(mapped);
          setHasMore(data.length === TRANSACTIONS_PER_PAGE);
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

  const loadMoreTransactions = async () => {
    if (!userId || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const from = (nextPage - 1) * TRANSACTIONS_PER_PAGE;
      const to = from + TRANSACTIONS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("token_transactions")
        .select("id, created_at, description, tokens_in, tokens_out")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching more transactions:", error.message);
        return;
      }

      if (data.length > 0) {
        const newTransactions = data.map((tx) => ({
          id: tx.id,
          date: new Date(tx.created_at).toLocaleDateString(),
          description: tx.description,
          tokens:
            tx.tokens_in > 0
              ? `+${tx.tokens_in}`
              : `-${tx.tokens_out}`,
          type: tx.tokens_in > 0 ? "credit" : "debit",
          created_at: tx.created_at,
        }));

        setTransactions(prev => [...prev, ...newTransactions]);
        setPage(nextPage);
        setHasMore(data.length === TRANSACTIONS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Unexpected error loading more transactions:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSeeMore = () => {
    loadMoreTransactions();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-yellow-600" />
          <span className="ml-2 text-gray-600">Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No transactions found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        <span className="text-sm text-gray-500">
          {totalCount > 0 && `Total: ${totalCount} transactions`}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 border-b border-gray-200 font-semibold">Date</th>
              <th className="px-4 py-3 border-b border-gray-200 font-semibold">Description</th>
              <th className="px-4 py-3 border-b border-gray-200 font-semibold text-right">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 border-b border-gray-100 text-gray-600">
                  {tx.date}
                </td>
                <td className="px-4 py-3 border-b border-gray-100 text-gray-900">
                  {tx.description}
                </td>
                <td className={`px-4 py-3 border-b border-gray-100 font-semibold text-right ${
                  tx.type === "credit" ? "text-green-600" : "text-red-600"
                }`}>
                  {tx.tokens}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleSeeMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                See More Transactions
              </>
            )}
          </button>
        </div>
      )}

      {!hasMore && transactions.length > 0 && (
        <div className="text-center mt-4">
          <p className="text-gray-500 text-sm">
            You've reached the end of your transaction history
          </p>
        </div>
      )}
    </div>
  );
}