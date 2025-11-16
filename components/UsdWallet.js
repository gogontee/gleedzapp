"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Filter, Download, Search, User, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function UsdWallet() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [balance, setBalance] = useState(0);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [senderNames, setSenderNames] = useState({});

  const TRANSACTIONS_PER_PAGE = 20;

  // Get session from Supabase
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) return;
        
        if (session) {
          setSession(session);
          setUser(session.user);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setSession(session);
          setUser(session.user);
        } else {
          setSession(null);
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchTotalCount();
      fetchTransactions();
    }
  }, [user, filter, searchTerm, dateRange]);

  // Fetch sender names when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      fetchSenderNames(transactions);
    }
  }, [transactions]);

  const fetchSenderNames = async (transactionsData) => {
    const userIds = transactionsData
      .filter(tx => tx.user_id && !tx.guest_email)
      .map(tx => tx.user_id)
      .filter((id, index, array) => array.indexOf(id) === index); // Remove duplicates

    if (userIds.length === 0) return;

    try {
      const newSenderNames = {};

      // Fetch from publishers table
      const { data: publishersData, error: publishersError } = await supabase
        .from('publishers')
        .select('id, name')
        .in('id', userIds);

      if (!publishersError && publishersData) {
        publishersData.forEach(publisher => {
          newSenderNames[publisher.id] = publisher.name;
        });
      }

      // Find remaining user IDs that weren't found in publishers
      const remainingUserIds = userIds.filter(id => !newSenderNames[id]);

      if (remainingUserIds.length > 0) {
        // Fetch from fans table
        const { data: fansData, error: fansError } = await supabase
          .from('fans')
          .select('id, full_name')
          .in('id', remainingUserIds);

        if (!fansError && fansData) {
          fansData.forEach(fan => {
            newSenderNames[fan.id] = fan.full_name;
          });
        }
      }

      setSenderNames(prev => ({ ...prev, ...newSenderNames }));
    } catch (error) {
      console.error('Error fetching sender names:', error);
    }
  };

  const getSenderName = (transaction) => {
    // Primary: Use guest_email from fiat_transactions
    if (transaction.guest_email) {
      return transaction.guest_email;
    }
    
    // Fallback: If no guest_email, use fetched sender name
    if (transaction.user_id && senderNames[transaction.user_id]) {
      return senderNames[transaction.user_id];
    }
    
    // If still not found, return formatted user ID
    if (transaction.user_id) {
      return `User ${transaction.user_id.substring(0, 6)}...`;
    }
    
    return "Unknown Sender";
  };

  const fetchTotalCount = async () => {
    if (!user?.id) return;

    try {
      let query = supabase
        .from("fiat_transactions")
        .select("*", { count: "exact", head: true })
        .eq("publisher_id", user.id)
        .or('currency.eq.USD,currency_out.eq.USD'); // Only USD transactions

      if (filter !== "all") {
        query = query.eq('status', filter);
      }

      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,guest_email.ilike.%${searchTerm}%,paystack_transaction_id.ilike.%${searchTerm}%`);
      }

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end + 'T23:59:59');
      }

      const { count, error } = await query;

      if (!error) {
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching total count:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const from = 0;
      const to = TRANSACTIONS_PER_PAGE - 1;

      let query = supabase
        .from("fiat_transactions")
        .select("*")
        .eq("publisher_id", user.id)
        .or('currency.eq.USD,currency_out.eq.USD') // Only USD transactions
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filter !== "all") {
        query = query.eq('status', filter);
      }

      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,guest_email.ilike.%${searchTerm}%,paystack_transaction_id.ilike.%${searchTerm}%`);
      }

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } else {
        setTransactions(data || []);
        setHasMore(data.length === TRANSACTIONS_PER_PAGE);
        setPage(1);
        calculateBalance(data || []);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTransactions = async () => {
    if (!hasMore || !user?.id) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const from = (nextPage - 1) * TRANSACTIONS_PER_PAGE;
      const to = from + TRANSACTIONS_PER_PAGE - 1;

      let query = supabase
        .from("fiat_transactions")
        .select("*")
        .eq("publisher_id", user.id)
        .or('currency.eq.USD,currency_out.eq.USD') // Only USD transactions
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filter !== "all") {
        query = query.eq('status', filter);
      }

      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,guest_email.ilike.%${searchTerm}%,paystack_transaction_id.ilike.%${searchTerm}%`);
      }

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching more transactions:", error);
        return;
      }

      if (data.length > 0) {
        setTransactions(prev => [...prev, ...data]);
        setPage(nextPage);
        setHasMore(data.length === TRANSACTIONS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more transactions:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const calculateBalance = (transactionsData) => {
    const total = transactionsData.reduce((sum, transaction) => {
      if (transaction.status === 'completed') {
        const amountIn = transaction.currency === 'USD' ? (transaction.amount || 0) : 0;
        const amountOut = transaction.currency_out === 'USD' ? (transaction.amount_out || 0) : 0;
        return sum + (amountIn - amountOut);
      }
      return sum;
    }, 0);

    setBalance(total);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Amount In', 'Amount Out', 'Description', 'Date', 'Sender', 'Status'];
    const csvData = transactions.map(transaction => [
      transaction.paystack_transaction_id || 'N/A',
      transaction.amount || 0,
      transaction.amount_out || 0,
      transaction.description || '',
      formatDate(transaction.created_at),
      getSenderName(transaction),
      transaction.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usd-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilter("all");
    setSearchTerm("");
    setDateRange({ start: "", end: "" });
  };

  const handleSeeMore = () => {
    loadMoreTransactions();
  };

  const refreshData = () => {
  if (!user?.id) return;
  
  fetchTransactions();
  calculateBalance(transactions); // Pass current transactions
  fetchTotalCount();
};

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 px-2 sm:px-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">USD Wallet</h1>
        <button
          onClick={refreshData}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Auth Status */}
      {!user ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Wallet className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-red-700 font-medium text-sm">Authentication Required</p>
              <p className="text-red-600 text-xs">Please sign in to view your USD Wallet</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                  <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">USD Balance</p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">{formatCurrency(balance)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {transactions.filter(t => t.status === 'completed').length} completed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <TrendingUp className="w-5 h-5 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Transactions</p>
                <p className="text-xs text-gray-500">{totalCount} total</p>
              </div>
            </div>
          </motion.div>

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
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
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
                    Clear
                  </button>
                  <button
                    onClick={exportToCSV}
                    disabled={transactions.length === 0}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Transaction History</h3>
            </div>

            {loading ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2 text-sm">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <Wallet className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No USD transactions found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Your USD transactions will appear here
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sender
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs font-mono text-gray-900">
                              {transaction.paystack_transaction_id ? 
                                `${transaction.paystack_transaction_id.substring(0, 8)}...` : 'N/A'
                              }
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs text-green-600 font-medium">
                                +{formatCurrency(transaction.amount)}
                              </span>
                              {transaction.amount_out > 0 && (
                                <span className="text-xs text-red-600 font-medium">
                                  -{formatCurrency(transaction.amount_out)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="max-w-[100px] sm:max-w-xs">
                              <p className="text-xs text-gray-900 truncate">
                                {transaction.description}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1 max-w-[120px] sm:max-w-[150px]">
                              <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-600 truncate">
                                {getSenderName(transaction)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-xs text-gray-500">
                              {formatDate(transaction.created_at)}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
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
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm w-full sm:w-auto justify-center"
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
                      All transactions loaded
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}