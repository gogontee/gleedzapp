// components/FormsDisplay.jsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { DollarSign, Users, CheckCircle, FileText, Shield, Zap, Loader2, Eye, EyeOff, Settings, Coins, FileText as TermsIcon, X } from "lucide-react";

export default function FormsDisplay({ eventId, colors = {}, isPublisher = false }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});
  const [formResponses, setFormResponses] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState({});
  const [selectedForm, setSelectedForm] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [currentTerms, setCurrentTerms] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const currentColors = colors || {
    primary: '#3b82f6',
    secondary: '#1e40af', 
    background: '#f8fafc',
    text: '#1f2937',
    card: '#ffffff',
    border: '#e5e7eb'
  };

  useEffect(() => {
    loadCurrentUser();
    loadForms();
  }, [eventId]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadForms = async () => {
    try {
      const { data: formsData, error } = await supabase
        .from('forms')
        .select(`
          *,
          form_fields(*)
        `)
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (!error && formsData) {
        const filteredForms = isPublisher 
          ? formsData 
          : formsData.filter(form => form.is_public !== false);
        
        setForms(filteredForms);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFormVisibility = async (formId, currentVisibility) => {
    try {
      const newVisibility = !currentVisibility;
      
      const { error } = await supabase
        .from('forms')
        .update({ is_public: newVisibility })
        .eq('id', formId);

      if (error) throw error;

      setForms(forms.map(form => 
        form.id === formId 
          ? { ...form, is_public: newVisibility }
          : form
      ));

    } catch (error) {
      console.error('Error updating form visibility:', error);
      alert('Failed to update form visibility');
    }
  };

  const handleFormResponse = (formId, fieldId, value) => {
    setFormResponses(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [fieldId]: value
      }
    }));
  };

  const handleFileUpload = async (formId, fieldId, file) => {
    try {
      if (!file) return null;

      const form = forms.find(f => f.id === formId);
      if (!form) throw new Error('Form not found');

      // Generate unique file name
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      const filePath = `formdata/${eventId}/${formId}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('forms') // Make sure this bucket exists
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('forms')
        .getPublicUrl(filePath);

      // Update form responses with the file URL
      handleFormResponse(formId, fieldId, publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  };

  const handleTermsAcceptance = (formId, accepted) => {
    setAcceptedTerms(prev => ({
      ...prev,
      [formId]: accepted
    }));
  };

  const showTermsAndConditions = (terms) => {
    setCurrentTerms(terms);
    setShowTermsModal(true);
  };

  const deductTokens = async (formId, tokenAmount) => {
    try {
      if (!currentUser) throw new Error('User not authenticated');

      const { data: wallet, error: walletError } = await supabase
        .from('token_wallets')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (walletError) throw walletError;

      if (wallet.balance < tokenAmount) {
        throw new Error(`Insufficient tokens. Required: ${tokenAmount}, Available: ${wallet.balance}`);
      }

      const { error: updateError } = await supabase
        .from('token_wallets')
        .update({
          balance: wallet.balance - tokenAmount,
          last_action: `Paid ${tokenAmount} tokens for ${forms.find(f => f.id === formId)?.title || 'form submission'}`
        })
        .eq('user_id', currentUser.id);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error deducting tokens:', error);
      throw error;
    }
  };

  const submitForm = async (formId) => {
    if (!acceptedTerms[formId]) {
      alert('Please accept the terms of use and privacy policy to submit the form.');
      return;
    }

    setSubmitting(prev => ({ ...prev, [formId]: true }));
    
    const form = forms.find(f => f.id === formId);
    const responses = formResponses[formId] || {};

    // Validate required fields
    const requiredFields = form.form_fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => {
      const value = responses[field.id];
      return !value || value === '' || (Array.isArray(value) && value.length === 0);
    });

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      setSubmitting(prev => ({ ...prev, [formId]: false }));
      return;
    }

    try {
      // Handle paid forms
      if (form.is_paid) {
        const proceed = confirm(
          `This form requires ${form.token_amount} tokens to submit. ${form.token_amount} tokens will be deducted from your wallet. Do you want to proceed?`
        );

        if (!proceed) {
          setSubmitting(prev => ({ ...prev, [formId]: false }));
          return;
        }

        await deductTokens(formId, form.token_amount);
      }

      // Process file uploads first
      const processedResponses = { ...responses };
      
      for (const [fieldId, value] of Object.entries(responses)) {
        const field = form.form_fields.find(f => f.id === fieldId);
        if (field?.field_type === 'file' && value instanceof File) {
          const fileUrl = await handleFileUpload(formId, fieldId, value);
          processedResponses[fieldId] = fileUrl;
        }
      }

      console.log('📤 Submitting form data:', {
        formId,
        userId: currentUser?.id,
        answers: processedResponses
      });

      // Create form submission with answers in JSONB column
      const { data: submission, error: submissionError } = await supabase
        .from('form_submissions')
        .insert({
          form_id: formId,
          user_id: currentUser?.id, // This will be null if user is not authenticated
          answers: processedResponses, // Store all answers as JSONB
          ip_address: null, // You can capture this if needed
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (submissionError) {
        console.error('❌ Form submission error:', submissionError);
        throw new Error(`Failed to submit form: ${submissionError.message}`);
      }

      console.log('✅ Form submitted successfully:', submission);

      alert('Form submitted successfully!');
      
      // Reset form state
      setFormResponses(prev => ({ ...prev, [formId]: {} }));
      setAcceptedTerms(prev => ({ ...prev, [formId]: false }));
      
      // Reload forms to update counts
      loadForms();
      
      // Close modal
      if (showFormModal) {
        setShowFormModal(false);
        setSelectedForm(null);
      }

    } catch (error) {
      console.error('💥 Form submission failed:', error);
      alert(error.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(prev => ({ ...prev, [formId]: false }));
    }
  };

  const openFormModal = (form) => {
    setSelectedForm(form);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setSelectedForm(null);
  };

  const renderField = (field, formId) => {
    const value = formResponses[formId]?.[field.id] || '';

    const baseInputClass = "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-offset-1 transition-all duration-200 bg-white/80 backdrop-blur-sm";
    
    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.field_type}
            value={value}
            onChange={(e) => handleFormResponse(formId, field.id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className={baseInputClass}
            style={{
              borderColor: value ? currentColors.primary : currentColors.border,
              borderWidth: value ? '2px' : '1px',
              focusBorderColor: currentColors.primary,
              focusRingColor: `${currentColors.primary}20`
            }}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFormResponse(formId, field.id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            rows={4}
            className={baseInputClass}
            style={{
              borderColor: value ? currentColors.primary : currentColors.border,
              borderWidth: value ? '2px' : '1px',
              focusBorderColor: currentColors.primary,
              focusRingColor: `${currentColors.primary}20`
            }}
            required={field.required}
          />
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name={`${formId}-${field.id}`}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFormResponse(formId, field.id, e.target.value)}
                  className="h-4 w-4 border-gray-300 focus:ring-2 focus:ring-offset-1"
                  style={{ 
                    color: currentColors.primary,
                    borderColor: value === option ? currentColors.primary : undefined
                  }}
                  required={field.required}
                />
                <span className="text-gray-700 font-medium">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {field.options?.map((option, index) => {
              const currentValues = Array.isArray(value) ? value : [];
              const isChecked = currentValues.includes(option);
              
              return (
                <label key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    value={option}
                    checked={isChecked}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter(v => v !== option);
                      handleFormResponse(formId, field.id, newValues);
                    }}
                    className="h-4 w-4 border-gray-300 rounded focus:ring-2 focus:ring-offset-1"
                    style={{ 
                      color: currentColors.primary,
                      borderColor: isChecked ? currentColors.primary : undefined
                    }}
                  />
                  <span className="text-gray-700 font-medium">{option}</span>
                </label>
              );
            })}
          </div>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFormResponse(formId, field.id, e.target.value)}
            className={baseInputClass}
            style={{
              borderColor: value ? currentColors.primary : currentColors.border,
              borderWidth: value ? '2px' : '1px',
              focusBorderColor: currentColors.primary,
              focusRingColor: `${currentColors.primary}20`
            }}
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'file':
        return (
          <div className="space-y-3">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleFormResponse(formId, field.id, file);
                }
              }}
              className={`${baseInputClass} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100`}
              style={{
                borderColor: currentColors.border,
                focusBorderColor: currentColors.primary,
                focusRingColor: `${currentColors.primary}20`
              }}
              required={field.required}
            />
            {value && (
              <div 
                className="flex items-center space-x-2 text-sm rounded-lg p-3"
                style={{ 
                  backgroundColor: `${currentColors.primary}10`,
                  color: currentColors.primary
                }}
              >
                <Shield className="w-4 h-4" />
                <span>File selected: {value.name || value}</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFormResponse(formId, field.id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            required={field.required}
            className={baseInputClass}
            style={{
              borderColor: value ? currentColors.primary : currentColors.border,
              borderWidth: value ? '2px' : '1px',
              focusBorderColor: currentColors.primary,
              focusRingColor: `${currentColors.primary}20`
            }}
          />
        );
    }
  };

  const renderFormCard = (form) => (
    <div 
      key={form.id} 
      className="rounded-2xl shadow-lg border overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer"
      style={{ 
        backgroundColor: currentColors.card,
        borderColor: currentColors.border,
        borderTopColor: currentColors.primary,
        borderTopWidth: '4px'
      }}
      onClick={() => openFormModal(form)}
    >
      {/* Form Banner Image */}
      {form.image_url && (
        <div className="w-full h-24 overflow-hidden">
          <img 
            src={form.image_url} 
            alt={form.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Form Card Header */}
      <div 
        className="px-6 py-5 border-b"
        style={{ 
          borderColor: currentColors.border,
          background: `linear-gradient(135deg, ${currentColors.card} 0%, ${currentColors.background} 100%)`
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: currentColors.primary }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 
                className="text-xl font-bold mb-2"
                style={{ color: currentColors.text }}
              >
                {form.title}
              </h3>
              {form.description && (
                <p 
                  className="text-sm leading-relaxed opacity-80 line-clamp-2"
                  style={{ color: currentColors.text }}
                >
                  {form.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Publisher Controls */}
          {isPublisher && (
            <div 
              className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 border"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => toggleFormVisibility(form.id, form.is_public)}
                className={`p-2 rounded-md transition-colors ${
                  form.is_public === false 
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
                title={form.is_public === false ? 'Make Public' : 'Make Private'}
              >
                {form.is_public === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Card Footer */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            {form.is_paid && (
              <div 
                className="flex items-center space-x-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-semibold"
              >
                <Coins className="w-3 h-3" />
                <span>{form.token_amount} tokens</span>
              </div>
            )}
            {/* Submission count removed from here */}
          </div>
          <div 
            className="text-xs font-medium px-3 py-1 rounded-full border cursor-pointer"
            style={{ 
              backgroundColor: form.is_public === false ? '#fef3c7' : `${currentColors.primary}10`,
              color: form.is_public === false ? '#92400e' : currentColors.primary,
              borderColor: form.is_public === false ? '#fbbf24' : `${currentColors.primary}20`
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isPublisher) {
                toggleFormVisibility(form.id, form.is_public);
              }
            }}
          >
            {form.is_public === false ? 'Private' : 'Public'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTermsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: currentColors.card }}
      >
        {/* Modal Header */}
        <div 
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: currentColors.border }}
        >
          <div className="flex items-center space-x-3">
            <TermsIcon className="w-6 h-6" style={{ color: currentColors.primary }} />
            <h2 
              className="text-2xl font-bold"
              style={{ color: currentColors.text }}
            >
              Terms and Conditions
            </h2>
          </div>
          <button
            onClick={() => setShowTermsModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            style={{ color: currentColors.text }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div 
            className="prose prose-lg max-w-none"
            style={{ color: currentColors.text }}
          >
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {currentTerms}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t bg-gray-50" style={{ borderColor: currentColors.border }}>
          <button
            onClick={() => setShowTermsModal(false)}
            className="w-full py-3 px-6 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:ring-4 focus:ring-offset-2"
            style={{ 
              backgroundColor: currentColors.primary,
              focusRingColor: `${currentColors.primary}40`
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );

  const renderFormModal = () => {
    if (!selectedForm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          style={{ backgroundColor: currentColors.card }}
        >
          {/* Modal Header */}
          <div 
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: currentColors.border }}
          >
            <h2 
              className="text-2xl font-bold"
              style={{ color: currentColors.text }}
            >
              {selectedForm.title}
            </h2>
            <button
              onClick={closeFormModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              style={{ color: currentColors.text }}
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Form Banner Image */}
            {selectedForm.image_url && (
              <div className="w-full h-32 mb-6 rounded-lg overflow-hidden">
                <img 
                  src={selectedForm.image_url} 
                  alt={selectedForm.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {selectedForm.description && (
              <p 
                className="mb-6 p-4 rounded-lg bg-gray-50 border"
                style={{ 
                  color: currentColors.text,
                  borderColor: currentColors.border
                }}
              >
                {selectedForm.description}
              </p>
            )}

            <div className="space-y-6">
              {selectedForm.form_fields
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((field) => (
                  <div key={field.id} className="space-y-3">
                    <label 
                      className="block text-lg font-semibold"
                      style={{ color: currentColors.text }}
                    >
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field, selectedForm.id)}
                    {field.placeholder && !['radio', 'checkbox', 'select'].includes(field.field_type) && (
                      <p 
                        className="text-sm italic opacity-75"
                        style={{ color: currentColors.text }}
                      >
                        {field.placeholder}
                      </p>
                    )}
                  </div>
                ))}
            </div>

            {/* Terms and Conditions Section */}
            <div className="mt-8 pt-6 border-t" style={{ borderColor: currentColors.border }}>
              {/* Read Terms Button - Only show if terms exist */}
              {selectedForm.terms && (
                <div className="mb-4">
                  <button
                    onClick={() => showTermsAndConditions(selectedForm.terms)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                    style={{ 
                      borderColor: currentColors.border,
                      color: currentColors.primary
                    }}
                  >
                    <TermsIcon className="w-4 h-4" />
                    <span className="font-medium">Read Terms and Conditions</span>
                  </button>
                </div>
              )}

              {/* Terms Acceptance Checkbox */}
              <label className="flex items-start space-x-3 p-4 rounded-lg border bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms[selectedForm.id] || false}
                  onChange={(e) => handleTermsAcceptance(selectedForm.id, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded focus:ring-2 focus:ring-offset-1"
                  style={{ 
                    color: currentColors.primary,
                    borderColor: acceptedTerms[selectedForm.id] ? currentColors.primary : undefined
                  }}
                />
                <div>
                  <span className="font-medium" style={{ color: currentColors.text }}>
                    I accept the Terms of Use and Privacy Policy
                    {selectedForm.terms && " (Please read the terms above)"}
                  </span>
                  <p className="text-sm opacity-75 mt-1" style={{ color: currentColors.text }}>
                    By checking this box, you agree to our terms and conditions and acknowledge our privacy policy.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t bg-gray-50" style={{ borderColor: currentColors.border }}>
            <button
              onClick={() => submitForm(selectedForm.id)}
              disabled={submitting[selectedForm.id] || !acceptedTerms[selectedForm.id]}
              className="w-full py-3 px-6 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ 
                backgroundColor: currentColors.primary,
                focusRingColor: `${currentColors.primary}40`
              }}
            >
              {submitting[selectedForm.id] ? (
                <span className="flex items-center justify-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </span>
              ) : selectedForm.is_paid ? (
                <span className="flex items-center justify-center space-x-3">
                  <Coins className="w-5 h-5" />
                  <span>Submit Form - {selectedForm.token_amount} tokens</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>Submit Form</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: currentColors.primary }} />
          <p style={{ color: currentColors.text }}>Loading forms...</p>
        </div>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div 
        className="text-center py-16 rounded-2xl shadow-sm border"
        style={{ 
          backgroundColor: currentColors.card,
          borderColor: currentColors.border
        }}
      >
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: currentColors.text }} />
        <h3 
          className="text-2xl font-bold mb-3"
          style={{ color: currentColors.text }}
        >
          No Forms Available
        </h3>
        <p 
          className="max-w-md mx-auto mb-6 opacity-75"
          style={{ color: currentColors.text }}
        >
          {isPublisher 
            ? "You haven't created any forms for this event yet." 
            : "There are no registration forms to fill out for this event yet."
          }
        </p>
        <div 
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium border"
          style={{ 
            backgroundColor: `${currentColors.primary}10`,
            color: currentColors.primary,
            borderColor: `${currentColors.primary}20`
          }}
        >
          <Zap className="w-4 h-4" />
          <span>Check back later for updates</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map(renderFormCard)}
      </div>

      {/* Progress Summary */}
      <div 
        className="rounded-2xl shadow-lg border p-6 backdrop-blur-sm"
        style={{ 
          backgroundColor: currentColors.card,
          borderColor: currentColors.border,
          borderLeftColor: currentColors.primary,
          borderLeftWidth: '4px'
        }}
      >
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6" style={{ color: currentColors.primary }} />
          <div>
            <h4 
              className="font-semibold"
              style={{ color: currentColors.text }}
            >
              Registration Progress
            </h4>
            <p 
              className="text-sm opacity-75"
              style={{ color: currentColors.text }}
            >
              Complete {forms.length} form{forms.length > 1 ? 's' : ''} to finish your registration
            </p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showFormModal && renderFormModal()}

      {/* Terms and Conditions Modal */}
      {showTermsModal && renderTermsModal()}
    </div>
  );
}