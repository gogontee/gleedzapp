// components/FormAnalytics.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, TrendingUp, Calendar } from 'lucide-react';

export default function FormAnalytics({ formId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (formId) {
      loadAnalytics();
    }
  }, [formId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get form fields
      const { data: fields, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('sort_order');

      if (fieldsError) throw fieldsError;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      // Get submissions with JSONB answers
      const { data: submissions, error: submissionsError } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', formId)
        .gte('submitted_at', startDate.toISOString())
        .order('submitted_at', { ascending: true });

      if (submissionsError) throw submissionsError;

      // Process analytics data
      const processedData = processAnalyticsData(fields, submissions || [], timeRange);
      setAnalytics(processedData);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (fields, submissions, range) => {
    // Field analytics
    const fieldAnalytics = fields.map(field => {
      const fieldAnswers = submissions.map(submission => 
        submission.answers[field.id]
      ).filter(answer => answer !== undefined && answer !== null && answer !== '');

      let chartData = [];
      let completionRate = 0;
      
      if (submissions.length > 0) {
        completionRate = Math.round((fieldAnswers.length / submissions.length) * 100);
      }

      if (['radio', 'select', 'checkbox'].includes(field.field_type)) {
        const counts = {};
        
        fieldAnswers.forEach(answer => {
          if (field.field_type === 'checkbox' && Array.isArray(answer)) {
            answer.forEach(value => {
              counts[value] = (counts[value] || 0) + 1;
            });
          } else if (typeof answer === 'string' && answer.includes(',')) {
            answer.split(',').forEach(value => {
              const trimmed = value.trim();
              if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1;
            });
          } else {
            counts[answer] = (counts[answer] || 0) + 1;
          }
        });

        chartData = Object.entries(counts).map(([name, value]) => ({
          name: name || 'No response',
          value,
          percentage: Math.round((value / fieldAnswers.length) * 100) || 0
        })).sort((a, b) => b.value - a.value);
      }

      return {
        ...field,
        totalResponses: fieldAnswers.length,
        completionRate,
        chartData,
        sampleAnswers: fieldAnswers.slice(0, 5),
        emptyResponses: submissions.length - fieldAnswers.length
      };
    });

    // Submission trends
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const submissionTrends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const count = submissions.filter(submission => 
        submission.submitted_at.startsWith(dateString)
      ).length;
      
      submissionTrends.push({
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        fullDate: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        submissions: count
      });
    }

    // Overall stats
    const peakDay = findPeakSubmissionDay(submissions);
    const overallStats = {
      totalSubmissions: submissions.length,
      averageCompletionRate: fieldAnalytics.length > 0 
        ? Math.round(fieldAnalytics.reduce((sum, field) => sum + field.completionRate, 0) / fieldAnalytics.length)
        : 0,
      submissionsThisPeriod: submissions.length,
      peakSubmissionDay: peakDay
    };

    return {
      overallStats,
      fields: fieldAnalytics,
      submissionTrends,
      rawSubmissions: submissions,
      lastUpdated: new Date().toISOString()
    };
  };

  const findPeakSubmissionDay = (submissions) => {
    if (submissions.length === 0) return null;
    
    const dailyCounts = {};
    submissions.forEach(submission => {
      const date = new Date(submission.submitted_at).toLocaleDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    const peakDay = Object.entries(dailyCounts).reduce((max, [date, count]) => 
      count > max.count ? { date, count } : max, 
      { date: '', count: 0 }
    );
    
    return peakDay;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h4>
        <p className="text-gray-600">Analytics data will appear here once you have form submissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Form Analytics</h2>
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7D' },
            { value: '30d', label: '30D' },
            { value: '90d', label: '90D' }
          ].map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1 text-sm rounded-lg border ${
                timeRange === range.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overallStats.totalSubmissions}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Form Fields</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.fields.length}</p>
            </div>
            <FileText className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overallStats.averageCompletionRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Peak Day</p>
              <p className="text-lg font-bold text-gray-900">
                {analytics.overallStats.peakSubmissionDay 
                  ? `${analytics.overallStats.peakSubmissionDay.count} subs`
                  : 'No data'
                }
              </p>
              {analytics.overallStats.peakSubmissionDay && (
                <p className="text-xs text-gray-500">
                  {new Date(analytics.overallStats.peakSubmissionDay.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Submission Trends - FIXED CHART CONTAINER */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Submission Trends</h3>
          <p className="text-sm text-gray-600">
            {analytics.overallStats.submissionsThisPeriod} submissions in this period
          </p>
        </div>
        {/* Fixed: Added min-height to ensure chart has dimensions */}
        <div className="h-64 min-h-[16rem] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={analytics.submissionTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={timeRange === '90d' ? 6 : 0}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => [`${value} submissions`, 'Count']}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullDate;
                  }
                  return label;
                }}
              />
              <Bar 
                dataKey="submissions" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                name="Submissions"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Field-wise Analytics */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Field Analysis</h3>
        
        {analytics.fields.map((field) => (
          <div key={field.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Field Info */}
              <div className="lg:w-1/3">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">{field.label}</h4>
                    <p className="text-sm text-gray-600 capitalize">{field.field_type} field</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    field.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                    field.completionRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {field.completionRate}% completed
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Responses:</span>
                    <span className="font-medium">{field.totalResponses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Empty:</span>
                    <span className="font-medium text-red-600">{field.emptyResponses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Field Type:</span>
                    <span className="font-medium capitalize">{field.field_type}</span>
                  </div>
                </div>

                {/* Sample Answers */}
                {field.sampleAnswers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Sample responses:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {field.sampleAnswers.map((answer, index) => (
                        <p key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                          {Array.isArray(answer) ? answer.join(', ') : answer}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chart - FIXED CONTAINER */}
              <div className="lg:w-2/3">
                {field.chartData.length > 0 ? (
                  <div className="h-64 min-h-[16rem] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={field.chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percentage }) => `${name} (${percentage}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {field.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${value} (${props.payload.percentage}%)`, 
                            props.payload.name
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <FileText className="w-12 h-12 mb-2 opacity-50" />
                    <p>No chart data available</p>
                    <p className="text-sm">This field type doesn't support visualization</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {analytics.fields.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Form Fields</h4>
            <p className="text-gray-600">Add fields to your form to see analytics here.</p>
          </div>
        )}
      </div>
    </div>
  );
}