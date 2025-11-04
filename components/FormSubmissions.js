// components/FormSubmissions.jsx
"use client";

import { useState, useEffect } from "react";
import { Download, Search, User, Calendar, FileText, RefreshCw, X, Mail, Phone, MapPin, Globe, Image as ImageIcon, ExternalLink } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// Submission Detail Modal Component
function SubmissionDetailModal({ submission, formFields, isOpen, onClose }) {
  if (!isOpen || !submission) return null;

  const getFieldValue = (fieldId) => {
    if (!submission.answers) return null;
    return submission.answers[fieldId];
  };

  const handleDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderFieldValue = (field, value) => {
    if (!value) return <span className="text-gray-400">Not provided</span>;
    
    switch (field.field_type) {
      case 'image':
        return (
          <div className="space-y-3">
            {/* Image Thumbnail with Actions */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0 w-20 h-20 rounded-lg border border-gray-300 overflow-hidden bg-white">
                <img 
                  src={value} 
                  alt={field.label}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full bg-gray-100 items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">Image</p>
                <p className="text-xs text-gray-500 mb-3">Click the buttons below to view or download</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => window.open(value, '_blank')}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Full Size
                  </button>
                  <button
                    onClick={() => handleDownload(value, `${field.label}-${submission.id}.jpg`)}
                    className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'file':
        return (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Uploaded File</p>
              <p className="text-xs text-gray-500 mt-1">Click to download</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(value, '_blank')}
                className="flex items-center gap-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View
              </button>
              <button
                onClick={() => handleDownload(value, `${field.label}-${submission.id}`)}
                className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          </div>
        );
      
      case 'email':
        return (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Mail className="w-4 h-4 text-blue-600" />
            <a href={`mailto:${value}`} className="text-blue-700 hover:text-blue-800">
              {value}
            </a>
          </div>
        );
      
      case 'tel':
        return (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <Phone className="w-4 h-4 text-green-600" />
            <a href={`tel:${value}`} className="text-green-700 hover:text-green-800">
              {value}
            </a>
          </div>
        );
      
      case 'url':
        return (
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <Globe className="w-4 h-4 text-purple-600" />
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-purple-700 hover:text-purple-800 truncate">
              {value}
            </a>
          </div>
        );
      
      case 'checkbox':
      case 'multiselect':
        return Array.isArray(value) ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {value.map((item, index) => (
                <span key={index} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-3 py-1.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  {item}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {value.length} option(s) selected
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              {value}
            </span>
          </div>
        );
      
      default:
        if (Array.isArray(value)) {
          return (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {value.map((item, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 text-sm px-3 py-1.5 rounded-lg">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {value.length} item(s)
              </p>
            </div>
          );
        }
        return <span className="whitespace-pre-wrap text-gray-900">{value}</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Submission Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Submitted on {new Date(submission.submitted_at).toLocaleDateString()} at{' '}
              {new Date(submission.submitted_at).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* User Information Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {submission.user_id ? `User ${submission.user_id.substring(0, 8)}...` : 'Anonymous User'}
                    </p>
                    <p className="text-sm text-gray-600">Submitted by</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">Submission date</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Responses Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Responses</h3>
              <div className="space-y-4">
                {formFields.map((field) => {
                  const value = getFieldValue(field.id);
                  return (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {field.label}
                            </label>
                            {field.required && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Required
                              </span>
                            )}
                          </div>
                          <div className="text-gray-900">
                            {renderFieldValue(field, value)}
                          </div>
                        </div>
                        <div className="lg:w-40 flex-shrink-0">
                          <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                            <div className="font-medium text-gray-700">{field.field_type}</div>
                            <div className="mt-1">{field.required ? 'Required field' : 'Optional field'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submission Metadata */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Submission ID</p>
                  <p className="text-gray-600 font-mono text-xs">{submission.id}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Form ID</p>
                  <p className="text-gray-600 font-mono text-xs">{submission.form_id}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Total Fields</p>
                  <p className="text-gray-600">{formFields.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FormSubmissions({ formId }) {
  const [submissions, setSubmissions] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (formId) {
      loadSubmissions();
    }
  }, [formId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      
      console.log('Loading submissions for form:', formId);

      // Load form fields
      const { data: fields, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('sort_order');

      if (fieldsError) {
        console.error('Fields error:', fieldsError);
        throw fieldsError;
      }
      setFormFields(fields || []);
      console.log('Form fields loaded:', fields?.length);

      // Load submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Submissions error:', submissionsError);
        throw submissionsError;
      }

      console.log('Submissions loaded:', submissionsData?.length);
      setSubmissions(submissionsData || []);

    } catch (error) {
      console.error('Error loading submissions:', error);
      alert('Failed to load submissions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  const exportToCSV = () => {
    if (submissions.length === 0) return;

    const headers = ['Submission ID', 'Submitted At', 'User ID', ...formFields.map(field => field.label)];
    
    const csvData = submissions.map(submission => {
      const row = [
        submission.id,
        new Date(submission.submitted_at).toLocaleString(),
        submission.user_id || 'Anonymous'
      ];
      
      // Add answers for each field from JSONB answers
      formFields.forEach(field => {
        const answer = submission.answers ? submission.answers[field.id] : null;
        if (Array.isArray(answer)) {
          row.push(answer.join(', '));
        } else if (answer) {
          row.push(answer);
        } else {
          row.push('');
        }
      });
      
      return row;
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions_${formId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Component to render field value in table cell
  const renderTableCell = (field, value) => {
    if (!value) return <span className="text-gray-400">-</span>;

    switch (field.field_type) {
      case 'image':
        return (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50">
              <img 
                src={value} 
                alt={field.label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full bg-gray-100 items-center justify-center">
                <ImageIcon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <span className="text-xs text-gray-500">Image</span>
          </div>
        );
      
      case 'file':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <FileText className="w-4 h-4" />
            <span className="text-xs">File</span>
          </div>
        );
      
      case 'email':
        return (
          <div className="text-sm text-gray-900 truncate">
            {value}
          </div>
        );
      
      case 'checkbox':
      case 'multiselect':
        return Array.isArray(value) ? (
          <div className="text-sm text-gray-900">
            {value.slice(0, 2).map((item, index) => (
              <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded mr-1 mb-1">
                {item}
              </span>
            ))}
            {value.length > 2 && (
              <span className="text-xs text-gray-500">+{value.length - 2} more</span>
            )}
          </div>
        ) : (
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
            {value}
          </span>
        );
      
      default:
        if (Array.isArray(value)) {
          return (
            <div className="text-sm text-gray-900">
              {value.slice(0, 2).join(', ')}
              {value.length > 2 && `... (+${value.length - 2})`}
            </div>
          );
        }
        return (
          <div className="text-sm text-gray-900 truncate">
            {String(value).substring(0, 50)}
            {String(value).length > 50 && '...'}
          </div>
        );
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in user ID
    if (submission.user_id && submission.user_id.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in answers
    if (submission.answers) {
      return Object.values(submission.answers).some(answer => 
        String(answer).toLowerCase().includes(searchLower)
      );
    }
    
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Form Submissions</h3>
            <p className="text-gray-600 text-sm">
              {submissions.length} total submission(s)
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64"
              />
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={loadSubmissions}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={submissions.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {submissions.length === 0 ? 'No submissions yet' : 'No matching submissions'}
              </h4>
              <p className="text-gray-600 max-w-md mx-auto">
                {submissions.length === 0 
                  ? 'Form submissions will appear here once users start submitting the form.'
                  : 'Try adjusting your search terms to find what you\'re looking for.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Submitted</th>
                    {formFields.slice(0, 3).map(field => (
                      <th key={field.id} className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        {field.label}
                      </th>
                    ))}
                    {formFields.length > 3 && (
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        +{formFields.length - 3} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {submission.user_id ? `User ${submission.user_id.substring(0, 8)}...` : 'Anonymous'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(submission.submitted_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      {formFields.slice(0, 3).map(field => (
                        <td key={field.id} className="py-3 px-4">
                          <div className="max-w-xs">
                            {submission.answers ? (
                              renderTableCell(field, submission.answers[field.id])
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      ))}
                      {formFields.length > 3 && (
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleViewSubmission(submission)}
                            className="text-blue-600 text-sm hover:text-blue-700 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Submission Detail Modal */}
      <SubmissionDetailModal
        submission={selectedSubmission}
        formFields={formFields}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
}