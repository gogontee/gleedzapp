"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { ChevronDown, Loader2, Download, Search, Filter, Calendar, ArrowUp, ArrowDown } from "lucide-react";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [tokenFilter, setTokenFilter] = useState("all"); // all, in, out

  const TRANSACTIONS_PER_PAGE = 50;

  useEffect(() => {
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
      let query = supabase
        .from("token_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (tokenFilter === "in") {
        query = query.gt('tokens_in', 0);
      } else if (tokenFilter === "out") {
        query = query.gt('tokens_out', 0);
      }

      const { count, error } = await query;

      if (!error) {
        setTotalCount(count || 0);
      }
    }

    fetchTotalCount();
  }, [userId, tokenFilter]);

  useEffect(() => {
    if (!userId) return;

    async function fetchTransactions() {
      setLoading(true);
      try {
        const from = 0;
        const to = TRANSACTIONS_PER_PAGE - 1;

        let query = supabase
          .from("token_transactions")
          .select("id, created_at, description, tokens_in, tokens_out")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .range(from, to);

        // Token type filter
        if (tokenFilter === "in") {
          query = query.gt('tokens_in', 0);
        } else if (tokenFilter === "out") {
          query = query.gt('tokens_out', 0);
        }

        if (searchTerm) {
          query = query.ilike('description', `%${searchTerm}%`);
        }

        if (dateRange.start) {
          query = query.gte('created_at', dateRange.start);
        }
        if (dateRange.end) {
          query = query.lte('created_at', dateRange.end + 'T23:59:59');
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching transactions:", error.message);
          setTransactions([]);
        } else {
          const mapped = data.map((tx) => ({
            id: tx.id,
            date: new Date(tx.created_at).toLocaleDateString(),
            description: tx.description,
            tokens: tx.tokens_in > 0 ? `+${tx.tokens_in}` : `-${tx.tokens_out}`,
            type: tx.tokens_in > 0 ? "credit" : "debit",
            created_at: tx.created_at,
            tokens_in: tx.tokens_in,
            tokens_out: tx.tokens_out,
          }));
          setTransactions(mapped);
          setHasMore(data.length === TRANSACTIONS_PER_PAGE);
          setPage(1);
        }
      } catch (err) {
        console.error("Unexpected error fetching transactions:", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [userId, searchTerm, dateRange, tokenFilter]);

  const loadMoreTransactions = async () => {
    if (!userId || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const from = (nextPage - 1) * TRANSACTIONS_PER_PAGE;
      const to = from + TRANSACTIONS_PER_PAGE - 1;

      let query = supabase
        .from("token_transactions")
        .select("id, created_at, description, tokens_in, tokens_out")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      // Token type filter
      if (tokenFilter === "in") {
        query = query.gt('tokens_in', 0);
      } else if (tokenFilter === "out") {
        query = query.gt('tokens_out', 0);
      }

      if (searchTerm) {
        query = query.ilike('description', `%${searchTerm}%`);
      }

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching more transactions:", error.message);
        return;
      }

      if (data.length > 0) {
        const newTransactions = data.map((tx) => ({
          id: tx.id,
          date: new Date(tx.created_at).toLocaleDateString(),
          description: tx.description,
          tokens: tx.tokens_in > 0 ? `+${tx.tokens_in}` : `-${tx.tokens_out}`,
          type: tx.tokens_in > 0 ? "credit" : "debit",
          created_at: tx.created_at,
          tokens_in: tx.tokens_in,
          tokens_out: tx.tokens_out,
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

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange({ start: "", end: "" });
    setTokenFilter("all");
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Tokens In', 'Tokens Out', 'Net Tokens', 'Type'];
    const csvData = transactions.map(transaction => [
      transaction.date,
      transaction.description,
      transaction.tokens_in || 0,
      transaction.tokens_out || 0,
      transaction.tokens,
      transaction.type
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `token-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getFilterStats = () => {
    const tokenInCount = transactions.filter(tx => tx.type === "credit").length;
    const tokenOutCount = transactions.filter(tx => tx.type === "debit").length;
    
    return { tokenInCount, tokenOutCount };
  };

  const { tokenInCount, tokenOutCount } = getFilterStats();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 px-2 sm:px-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Token Transactions</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {totalCount} total
          </span>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:ring-blue-500 text-xs"
              />
            </div>

            {/* Token Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setTokenFilter("all")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  tokenFilter === "all" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Filter className="w-3 h-3" />
                All
              </button>
              <button
                onClick={() => setTokenFilter("in")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  tokenFilter === "in" 
                    ? "bg-green-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ArrowDown className="w-3 h-3" />
                Token In
              </button>
              <button
                onClick={() => setTokenFilter("out")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  tokenFilter === "out" 
                    ? "bg-red-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ArrowUp className="w-3 h-3" />
                Token Out
              </button>
            </div>
          </div>

          {/* Date Range and Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Date Range */}
            <div className="flex gap-2 flex-1">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:border-transparent focus:ring-blue-500"
                placeholder="Start"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:border-transparent focus:ring-blue-500"
                placeholder="End"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={exportToCSV}
                disabled={transactions.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Filter Stats */}
          {transactions.length > 0 && (
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Showing: {transactions.length} transactions</span>
              {tokenFilter === "all" && (
                <>
                  <span className="flex items-center gap-1">
                    <ArrowDown className="w-3 h-3 text-green-600" />
                    {tokenInCount} incoming
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-red-600" />
                    {tokenOutCount} outgoing
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Transaction History</h3>
        </div>

        {loading ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-gray-500 mt-2 text-xs">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-500 text-xs">No transactions found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm || dateRange.start || dateRange.end || tokenFilter !== "all" ? 
                "Try adjusting your filters" : 
                "Your transactions will appear here"
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens In
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens Out
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-xs text-gray-600 font-medium">
                          {tx.date}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="max-w-[150px] sm:max-w-xs">
                          <p className="text-xs text-gray-900 truncate">
                            {tx.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        {tx.tokens_in > 0 ? (
                          <span className="text-xs text-green-600 font-medium">
                            +{tx.tokens_in}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        {tx.tokens_out > 0 ? (
                          <span className="text-xs text-red-600 font-medium">
                            -{tx.tokens_out}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          tx.type === "credit" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {tx.tokens}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="flex justify-center mt-4 pb-4 px-4">
                <button
                  onClick={handleSeeMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-xs w-full sm:w-auto justify-center"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}

            {!hasMore && transactions.length > 0 && (
              <div className="text-center mt-2 pb-4">
                <p className="text-gray-500 text-xs">
                  You've reached the end of your transaction history
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}