// components/FormPanel.jsx
"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  List, 
  Settings, 
  BarChart3,
  Users,
  DollarSign,
  Eye,
  Copy,
  Trash2,
  Share2,
  Download,
  Edit3,
  Type,
  Mail,
  Hash,
  Radio,
  CheckSquare,
  Upload,
  ArrowLeft,
  Save,
  Coins,
  Shield,
  Image,
  X,
  Link,
  FileText,
  AlertCircle,
  CheckCircle,
  Globe,
  Lock
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import FormSubmissions from "./FormSubmissions";
import FormAnalytics from "./FormAnalytics";

export default function FormPanel({ eventId }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'manage'
  const [selectedForm, setSelectedForm] = useState(null);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [publisher, setPublisher] = useState(null);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      // Check session and publisher status
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: publisherData } = await supabase
          .from('publishers')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setPublisher(publisherData);
      }

      // Load forms with submission counts
      const { data: formsData, error } = await supabase
        .from('forms')
        .select(`
          *,
          form_submissions(count),
          form_fields(count)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (!error && formsData) {
        setForms(formsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = () => {
    if (forms.length >= 3) {
      alert("You have reached the maximum limit of 3 forms per event.");
      return;
    }
    setSelectedForm(null);
    setActiveTab('create');
  };

  const handleViewForm = (form) => {
    setSelectedForm(form);
    setActiveTab('manage');
  };

  const handleBackToList = () => {
    setSelectedForm(null);
    setActiveTab('list');
    loadData(); // Refresh the list
  };

  const tabs = [
    { id: 'list', label: 'My Forms', icon: List, description: 'View all your forms' },
    { id: 'create', label: 'Create Form', icon: Plus, description: 'Build a new form' },
    { id: 'manage', label: 'Form Management', icon: Settings, description: 'Manage form settings' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Form Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage forms for your event
              </p>
            </div>
            
            {activeTab !== 'create' && forms.length < 3 && (
              <button
                onClick={handleCreateForm}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Form
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-4">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'manage' && !selectedForm) return;
                    setActiveTab(tab.id);
                  }}
                  disabled={tab.id === 'manage' && !selectedForm}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'list' && (
          <FormListView 
            forms={forms} 
            onViewForm={handleViewForm}
            onCreateForm={handleCreateForm}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'create' && (
          <FormCreatorView 
            eventId={eventId}
            publisher={publisher}
            session={session}
            onBack={handleBackToList}
            onFormCreated={handleBackToList}
          />
        )}

        {activeTab === 'manage' && selectedForm && (
          <FormManagementView 
            form={selectedForm}
            eventId={eventId}
            onBack={handleBackToList}
            onFormUpdated={loadData}
          />
        )}
      </div>
    </div>
  );
}

// Sub-components
function FormListView({ forms, onViewForm, onCreateForm, onRefresh }) {
  const duplicateForm = async (formId) => {
    try {
      // 1. Get the original form
      const { data: originalForm, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (formError) throw formError;

      // 2. Get the form fields
      const { data: originalFields, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('sort_order');

      if (fieldsError) throw fieldsError;

      // 3. Create new form with "Copy of" prefix
      const { data: newForm, error: newFormError } = await supabase
        .from('forms')
        .insert({
          event_id: originalForm.event_id,
          publisher_id: originalForm.publisher_id,
          title: `Copy of ${originalForm.title}`,
          description: originalForm.description,
          image_url: originalForm.image_url,
          terms: originalForm.terms,
          is_paid: originalForm.is_paid,
          token_amount: originalForm.token_amount,
          is_active: originalForm.is_active,
          max_submissions: originalForm.max_submissions,
          is_public: originalForm.is_public
        })
        .select()
        .single();

      if (newFormError) throw newFormError;

      // 4. Duplicate all fields
      if (originalFields && originalFields.length > 0) {
        const newFields = originalFields.map(field => ({
          form_id: newForm.id,
          field_type: field.field_type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          options: field.options,
          validation_rules: field.validation_rules,
          sort_order: field.sort_order
        }));

        const { error: newFieldsError } = await supabase
          .from('form_fields')
          .insert(newFields);

        if (newFieldsError) throw newFieldsError;
      }

      alert('Form duplicated successfully!');
      onRefresh();
    } catch (error) {
      console.error('Error duplicating form:', error);
      alert('Failed to duplicate form.');
    }
  };

  const deleteForm = async (formId) => {
    if (!confirm('Are you sure you want to delete this form? All submissions and fields will also be deleted. This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;

      alert('Form deleted successfully!');
      onRefresh();
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Failed to delete form.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Forms</p>
              <p className="text-2xl font-bold text-gray-900">{forms.length}/3</p>
            </div>
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {forms.reduce((total, form) => total + (form.form_submissions[0]?.count || 0), 0)}
              </p>
            </div>
            <Users className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Forms</p>
              <p className="text-2xl font-bold text-gray-900">
                {forms.filter(f => f.is_active).length}
              </p>
            </div>
            <Eye className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Public Forms</p>
              <p className="text-2xl font-bold text-gray-900">
                {forms.filter(f => f.is_public !== false).length}
              </p>
            </div>
            <Globe className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map(form => (
          <div key={form.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900">{form.title}</h3>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  form.is_public !== false ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {form.is_public !== false ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
            
            {form.image_url && (
              <div className="mb-3">
                <img 
                  src={form.image_url} 
                  alt={form.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {form.description || 'No description'}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{form.form_submissions[0]?.count || 0} submissions</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{form.is_paid ? `${form.token_amount} tokens` : 'Free'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onViewForm(form)}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Manage
              </button>
              
              <button
                onClick={() => duplicateForm(form.id)}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                title="Duplicate form"
              >
                <Copy className="w-4 h-4 text-gray-600" />
              </button>
              
              <button
                onClick={() => deleteForm(form.id)}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                title="Delete form"
              >
                <Trash2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {forms.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No forms created yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first form to start collecting responses from event attendees.
          </p>
          <button
            onClick={onCreateForm}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Your First Form
          </button>
        </div>
      )}

      {/* Form Limit Warning */}
      {forms.length >= 3 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Settings className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-medium text-yellow-800">Form Limit Reached</h4>
              <p className="text-yellow-700 text-sm">
                You have reached the maximum limit of 3 forms per event.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormCreatorView({ eventId, publisher, session, onBack, onFormCreated }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    terms: "",
    is_paid: false,
    token_amount: 0,
    is_active: true,
    max_submissions: null,
    is_public: true // Default to public
  });
  
  const [fields, setFields] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `form-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('forms')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('forms')
        .getPublicUrl(filePath);

      handleFormChange('image_url', publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    handleFormChange('image_url', '');
  };

  const addField = (fieldType) => {
    const newField = {
      id: `temp_${Date.now()}`,
      field_type: fieldType,
      label: "",
      placeholder: "",
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(fieldType) ? [''] : null,
      validation_rules: {},
      sort_order: fields.length
    };
    setFields(prev => [...prev, newField]);
  };

  const updateField = (index, updates) => {
    setFields(prev => prev.map((field, i) => i === index ? { ...field, ...updates } : field));
  };

  const removeField = (index) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const moveField = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newFields = [...fields];
      [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
      setFields(newFields.map((field, i) => ({ ...field, sort_order: i })));
    } else if (direction === 'down' && index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      setFields(newFields.map((field, i) => ({ ...field, sort_order: i })));
    }
  };

  const addOption = (fieldIndex) => {
    setFields(prev => prev.map((field, i) => 
      i === fieldIndex 
        ? { ...field, options: [...field.options, ''] }
        : field
    ));
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    setFields(prev => prev.map((field, i) => 
      i === fieldIndex 
        ? { 
            ...field, 
            options: field.options.map((opt, j) => j === optionIndex ? value : opt)
          }
        : field
    ));
  };

  const removeOption = (fieldIndex, optionIndex) => {
    setFields(prev => prev.map((field, i) => 
      i === fieldIndex 
        ? { 
            ...field, 
            options: field.options.filter((_, j) => j !== optionIndex)
          }
        : field
    ));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = "Form title is required";
    if (formData.title.length > 255) newErrors.title = "Title must be less than 255 characters";
    if (formData.is_paid && formData.token_amount <= 0) newErrors.token_amount = "Token amount must be greater than 0";
    if (fields.length === 0) newErrors.fields = "At least one field is required";
    
    // Validate individual fields
    fields.forEach((field, index) => {
      if (!field.label.trim()) newErrors[`field_${index}_label`] = "Field label is required";
      if (field.label.length > 255) newErrors[`field_${index}_label`] = "Field label must be less than 255 characters";
      
      // Validate options for field types that require them
      if (['radio', 'checkbox', 'select'].includes(field.field_type)) {
        const validOptions = field.options.filter(opt => opt.trim() !== '');
        if (validOptions.length === 0) {
          newErrors[`field_${index}_options`] = `${field.field_type} fields require at least one option`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveForm = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Use session.user.id as publisher_id since publishers.id = auth.users.id
      const publisherId = session?.user?.id;

      if (!publisherId) {
        throw new Error('User not authenticated');
      }

      // Set is_public value: true for public, false for private, null for default public
      const isPublicValue = formData.is_public === false ? false : true;

      // 1. First, create the form
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          event_id: eventId,
          publisher_id: publisherId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          image_url: formData.image_url || null,
          terms: formData.terms.trim() || null,
          is_paid: formData.is_paid,
          token_amount: formData.is_paid ? formData.token_amount : 0,
          is_active: formData.is_active,
          max_submissions: formData.max_submissions || null,
          is_public: isPublicValue
        })
        .select()
        .single();

      if (formError) throw formError;

      // 2. Then create all the form fields
      const formFieldsData = fields.map((field, index) => ({
        form_id: form.id,
        field_type: field.field_type,
        label: field.label.trim(),
        placeholder: field.placeholder?.trim() || null,
        required: field.required,
        options: ['radio', 'checkbox', 'select'].includes(field.field_type) 
          ? field.options.filter(opt => opt.trim() !== '')
          : null,
        validation_rules: field.validation_rules,
        sort_order: index
      }));

      const { error: fieldsError } = await supabase
        .from('form_fields')
        .insert(formFieldsData);

      if (fieldsError) throw fieldsError;

      alert('Form created successfully!');
      onFormCreated();
      
    } catch (error) {
      console.error('Error saving form:', error);
      alert(`Failed to create form: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const fieldTypes = [
    { type: 'text', label: 'Text', icon: Type },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'radio', label: 'Radio', icon: Radio },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { type: 'select', label: 'Dropdown', icon: List },
    { type: 'file', label: 'File', icon: Upload },
  ];

  // Render field options based on field type
  const renderFieldOptions = (field, index) => {
    if (!['radio', 'checkbox', 'select'].includes(field.field_type)) return null;

    return (
      <div className="mt-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Options
        </label>
        <div className="space-y-2">
          {field.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center gap-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                placeholder={`Option ${optionIndex + 1}`}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              {field.options.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOption(index, optionIndex)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addOption(index)}
            className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        </div>
        {errors[`field_${index}_options`] && (
          <p className="text-red-600 text-xs mt-1">{errors[`field_${index}_options`]}</p>
        )}
      </div>
    );
  };

  const ReviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Review Your Form</h3>
            <button
              onClick={() => setShowReview(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Please review your form carefully before creating it. Check all fields, settings, and terms of use.
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Form Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Form Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Title:</span>
                  <span>{formData.title || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Description:</span>
                  <span>{formData.description || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className={formData.is_active ? 'text-green-600' : 'text-red-600'}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Visibility:</span>
                  <span className={formData.is_public !== false ? 'text-blue-600' : 'text-gray-600'}>
                    {formData.is_public !== false ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Form Settings</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Form Type:</span>
                  <span className={formData.is_paid ? 'text-green-600' : 'text-gray-600'}>
                    {formData.is_paid ? `Paid - ${formData.token_amount} tokens` : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Max Submissions:</span>
                  <span>{formData.max_submissions || 'Unlimited'}</span>
                </div>
              </div>
            </div>

            {/* Terms of Use */}
            {formData.terms && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Terms of Use</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{formData.terms}</p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Form Fields ({fields.length})</h4>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.label}</span>
                        <span className="text-xs text-gray-500 capitalize bg-gray-200 px-2 py-1 rounded">
                          {field.field_type}
                        </span>
                        {field.required && (
                          <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">Required</span>
                        )}
                      </div>
                    </div>
                    {field.placeholder && (
                      <p className="text-sm text-gray-600 mb-2">Placeholder: {field.placeholder}</p>
                    )}
                    {field.options && field.options.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Options:</p>
                        <div className="flex flex-wrap gap-1">
                          {field.options.map((option, optIndex) => (
                            <span key={optIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowReview(false)}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Go Back and Edit
            </button>
            <button
              onClick={saveForm}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Creating...' : 'Yes, Create Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Forms
        </button>
        <h3 className="text-lg font-semibold">Create New Form</h3>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Important Notice</h4>
            <p className="text-blue-700 text-sm mt-1">
              Please carefully review all form fields, settings, and terms of use before creating your form. 
              Once created, you can still edit most settings, but it's best to get everything right from the start.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Form Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-200"
                  placeholder="Enter form title"
                  maxLength={255}
                />
                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-200"
                  placeholder="Form description"
                />
              </div>

              {/* Form Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Image (Optional)</label>
                {formData.image_url ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={formData.image_url} 
                      alt="Form preview" 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      id="form-image"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) uploadImage(file);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="form-image"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Image className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Visibility Toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Form Visibility</label>
                  <button
                    type="button"
                    onClick={() => handleFormChange('is_public', !formData.is_public)}
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: formData.is_public !== false ? '#2563eb' : '#d1d5db' }}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      formData.is_public !== false ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {formData.is_public !== false ? (
                    <>
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>Public - Anyone with the link can access this form</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-gray-600" />
                      <span>Private - Only you can access this form</span>
                    </>
                  )}
                </div>
              </div>

              {/* Terms of Use */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms of Use (Optional)
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => handleFormChange('terms', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-200"
                  placeholder="Enter your terms and conditions that users must accept before submitting the form..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Users will need to accept these terms before they can submit the form.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleFormChange('is_active', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active (accepting submissions)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Form Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Settings */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Paid Form</label>
                  <button
                    type="button"
                    onClick={() => handleFormChange('is_paid', !formData.is_paid)}
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: formData.is_paid ? '#2563eb' : '#d1d5db' }}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      formData.is_paid ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                
                {formData.is_paid && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Token Amount *</label>
                    <input
                      type="number"
                      value={formData.token_amount}
                      onChange={(e) => handleFormChange('token_amount', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-200"
                      min="1"
                    />
                    {errors.token_amount && <p className="text-red-600 text-sm mt-1">{errors.token_amount}</p>}
                  </div>
                )}
              </div>

              {/* Max Submissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Submissions (Optional)
                </label>
                <input
                  type="number"
                  value={formData.max_submissions || ''}
                  onChange={(e) => handleFormChange('max_submissions', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-200"
                  min="1"
                  placeholder="Unlimited"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for unlimited submissions
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Form Fields</h4>
              {errors.fields && <p className="text-red-600 text-sm">{errors.fields}</p>}
            </div>

            {/* Field Type Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {fieldTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addField(type)}
                  className="flex flex-col items-center p-3 border border-gray-300 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <Icon className="w-5 h-5 text-gray-600 mb-1" />
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>

            {/* Fields List */}
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-white border border-gray-200 rounded p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Field label"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        maxLength={255}
                      />
                      <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded hidden sm:block">
                        {field.field_type}
                      </span>
                    </div>
                    
                    {/* Field Controls */}
                    <div className="flex items-center gap-1 justify-between sm:justify-start">
                      <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded sm:hidden">
                        {field.field_type}
                      </span>
                      
                      {/* Move buttons */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => moveField(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowLeft className="w-4 h-4 rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(index, 'down')}
                          disabled={index === fields.length - 1}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowLeft className="w-4 h-4 -rotate-90" />
                        </button>
                      </div>
                      
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="hidden sm:inline">Required</span>
                        <span className="sm:hidden">Req.</span>
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Placeholder input for text-based fields */}
                  {['text', 'email', 'number'].includes(field.field_type) && (
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      placeholder="Placeholder text (optional)"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-2"
                    />
                  )}

                  {/* Options for choice fields */}
                  {renderFieldOptions(field, index)}

                  {errors[`field_${index}_label`] && (
                    <p className="text-red-600 text-xs mt-1">{errors[`field_${index}_label`]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
            <div className="space-y-2">
              <button
                onClick={() => setShowReview(true)}
                disabled={fields.length === 0 || !formData.title.trim()}
                className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Review & Create Form
              </button>
              <button
                onClick={onBack}
                className="w-full border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
            <div className="space-y-3 text-sm">
              {formData.image_url && (
                <img 
                  src={formData.image_url} 
                  alt="Form preview" 
                  className="w-full h-20 object-cover rounded-lg"
                />
              )}
              <div className="font-medium">{formData.title || 'Form Title'}</div>
              {formData.description && (
                <p className="text-gray-600">{formData.description}</p>
              )}
              <div className={`flex items-center gap-1 text-xs ${
                formData.is_public !== false ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {formData.is_public !== false ? (
                  <>
                    <Globe className="w-3 h-3" />
                    <span>Public Form</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>Private Form</span>
                  </>
                )}
              </div>
              {formData.is_paid && (
                <div className="bg-blue-50 text-blue-800 text-xs p-2 rounded">
                  Paid: {formData.token_amount} tokens
                </div>
              )}
              {formData.max_submissions && (
                <div className="bg-gray-50 text-gray-800 text-xs p-2 rounded">
                  Max Submissions: {formData.max_submissions}
                </div>
              )}
              {formData.terms && (
                <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded">
                  Has Terms of Use
                </div>
              )}
              <div className="text-gray-500">
                {fields.length} field(s)
              </div>
              
              {/* Fields preview */}
              {fields.length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <div className="text-xs font-medium text-gray-700 mb-1">Fields:</div>
                  {fields.map((field, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                      <span className="capitalize">{field.field_type}</span>
                      <span>: {field.label}</span>
                      {field.required && <span className="text-red-500">*</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Tips</h4>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>• Add clear, descriptive labels for each field</li>
              <li>• Mark required fields appropriately</li>
              <li>• Test your form before publishing</li>
              <li>• Set reasonable token amounts for paid forms</li>
              <li>• Review all settings before creating</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReview && <ReviewModal />}
    </div>
  );
}

function FormManagementView({ form, eventId, onBack, onFormUpdated }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [submissions, setSubmissions] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [editingForm, setEditingForm] = useState(null);
  const [editingFields, setEditingFields] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load submissions and form fields when component mounts
  useEffect(() => {
    loadFormData();
  }, [form.id]);

  const loadFormData = async () => {
    try {
      // Load form fields
      const { data: fields, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', form.id)
        .order('sort_order');

      if (!fieldsError && fields) {
        setFormFields(fields);
      }

      // Load submissions with answers
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('form_submissions')
        .select(`
          *,
          form_submission_answers(*)
        `)
        .eq('form_id', form.id)
        .order('created_at', { ascending: false });

      if (!submissionsError && submissionsData) {
        setSubmissions(submissionsData);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const toggleFormStatus = async () => {
    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_active: !form.is_active })
        .eq('id', form.id);

      if (error) throw error;

      alert(`Form ${!form.is_active ? 'activated' : 'deactivated'} successfully!`);
      onFormUpdated();
    } catch (error) {
      console.error('Error updating form status:', error);
      alert('Failed to update form status.');
    }
  };

  const toggleFormVisibility = async () => {
    try {
      // Toggle between public (true) and private (false)
      const newVisibility = form.is_public !== false ? false : true;
      
      const { error } = await supabase
        .from('forms')
        .update({ is_public: newVisibility })
        .eq('id', form.id);

      if (error) throw error;

      alert(`Form set to ${newVisibility ? 'public' : 'private'} successfully!`);
      onFormUpdated();
    } catch (error) {
      console.error('Error updating form visibility:', error);
      alert('Failed to update form visibility.');
    }
  };

  const shareForm = () => {
    const formUrl = `${window.location.origin}/events/${eventId}/forms/${form.id}`;
    navigator.clipboard.writeText(formUrl).then(() => {
      alert('Form link copied to clipboard!');
    });
  };

  const exportSubmissions = async () => {
    try {
      // Convert submissions to CSV
      const headers = ['Submission ID', 'Submitted At', ...formFields.map(field => field.label)];
      
      const csvData = submissions.map(submission => {
        const row = [submission.id, new Date(submission.created_at).toLocaleString()];
        
        formFields.forEach(field => {
          const answer = submission.form_submission_answers.find(
            ans => ans.field_id === field.id
          );
          row.push(answer?.answer_value || '');
        });
        
        return row;
      });

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.title.replace(/\s+/g, '_')}_submissions.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting submissions:', error);
      alert('Failed to export submissions.');
    }
  };

  const EditFormModal = () => {
  const [editData, setEditData] = useState({
    title: form.title,
    description: form.description,
    image_url: form.image_url,
    terms: form.terms,
    is_paid: form.is_paid,
    token_amount: form.token_amount,
    max_submissions: form.max_submissions,
    is_active: form.is_active,
    is_public: form.is_public !== false
  });

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-auto flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Edit Form Settings</h3>
              <p className="text-sm text-gray-600 mt-1">Update your form configuration</p>
            </div>
            <button
              onClick={() => setEditingForm(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Basic Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Form Title</label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter form title..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                      placeholder="Describe what this form is for..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image URL</label>
                    <input
                      type="url"
                      value={editData.image_url || ''}
                      onChange={(e) => handleChange('image_url', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>

              {/* Visibility & Access */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Visibility & Access
                </h4>
                <div className="space-y-4">
                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Form Visibility
                      </label>
                      <p className="text-sm text-gray-600">
                        {editData.is_public 
                          ? "Public - Anyone with the link can access this form" 
                          : "Private - Only you can access this form"
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('is_public', !editData.is_public)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style={{ backgroundColor: editData.is_public ? '#2563eb' : '#d1d5db' }}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        editData.is_public ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Form Status
                      </label>
                      <p className="text-sm text-gray-600">
                        {editData.is_active 
                          ? "Active - Form is accepting submissions" 
                          : "Inactive - Form is paused"
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('is_active', !editData.is_active)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style={{ backgroundColor: editData.is_active ? '#10b981' : '#d1d5db' }}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        editData.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Settings */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Payment Settings
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Paid Form
                      </label>
                      <p className="text-sm text-gray-600">
                        {editData.is_paid 
                          ? "Users pay tokens to submit this form" 
                          : "Free form submission"
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('is_paid', !editData.is_paid)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style={{ backgroundColor: editData.is_paid ? '#f59e0b' : '#d1d5db' }}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        editData.is_paid ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {editData.is_paid && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <label className="block text-sm font-medium text-amber-800 mb-2">
                        Token Amount Required
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editData.token_amount || ''}
                        onChange={(e) => handleChange('token_amount', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all duration-200"
                        placeholder="Enter token amount..."
                      />
                      <p className="text-xs text-amber-600 mt-2">
                        Users will need to pay this amount of tokens to submit the form
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submission Limits */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Submission Limits
                </h4>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Submissions
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editData.max_submissions || ''}
                    onChange={(e) => handleChange('max_submissions', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Leave empty for unlimited submissions"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Form will stop accepting submissions after reaching this limit
                  </p>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Terms & Conditions
                </h4>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms of Use & Privacy Policy
                  </label>
                  <textarea
                    value={editData.terms || ''}
                    onChange={(e) => handleChange('terms', e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    placeholder="Enter your terms and conditions, privacy policy, or any other legal text that users must agree to before submitting the form..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Users will need to accept these terms before submitting the form
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Action Buttons - DRAMATICALLY REDUCED SIZE */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setEditingForm(null)}
              disabled={saving}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={() => updateForm(editData)}
              disabled={saving}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Save Changes
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

  const EditFieldsModal = () => {
    const [tempFields, setTempFields] = useState([...formFields]);
    const [fieldErrors, setFieldErrors] = useState({});

    const updateTempField = (index, updates) => {
      setTempFields(prev => prev.map((field, i) => i === index ? { ...field, ...updates } : field));
    };

    const removeTempField = (index) => {
      setTempFields(prev => prev.filter((_, i) => i !== index));
    };

    const moveTempField = (index, direction) => {
      if (direction === 'up' && index > 0) {
        const newFields = [...tempFields];
        [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
        setTempFields(newFields.map((field, i) => ({ ...field, sort_order: i })));
      } else if (direction === 'down' && index < tempFields.length - 1) {
        const newFields = [...tempFields];
        [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
        setTempFields(newFields.map((field, i) => ({ ...field, sort_order: i })));
      }
    };

    const addTempOption = (fieldIndex) => {
      setTempFields(prev => prev.map((field, i) => 
        i === fieldIndex 
          ? { ...field, options: [...(field.options || []), ''] }
          : field
      ));
    };

    const updateTempOption = (fieldIndex, optionIndex, value) => {
      setTempFields(prev => prev.map((field, i) => 
        i === fieldIndex 
          ? { 
              ...field, 
              options: field.options.map((opt, j) => j === optionIndex ? value : opt)
            }
          : field
      ));
    };

    const removeTempOption = (fieldIndex, optionIndex) => {
      setTempFields(prev => prev.map((field, i) => 
        i === fieldIndex 
          ? { 
              ...field, 
              options: field.options.filter((_, j) => j !== optionIndex)
            }
          : field
      ));
    };

    const validateFields = () => {
      const newErrors = {};
      
      tempFields.forEach((field, index) => {
        if (!field.label.trim()) newErrors[`field_${index}_label`] = "Field label is required";
        
        if (['radio', 'checkbox', 'select'].includes(field.field_type)) {
          const validOptions = field.options.filter(opt => opt.trim() !== '');
          if (validOptions.length === 0) {
            newErrors[`field_${index}_options`] = `${field.field_type} fields require at least one option`;
          }
        }
      });

      setFieldErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
      if (!validateFields()) return;
      updateFormFields(tempFields);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Form Fields</h3>
              <button
                onClick={() => setEditingFields(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {tempFields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateTempField(index, { label: e.target.value })}
                      placeholder="Field label"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm sm:text-base"
                    />
                    <span className="text-xs sm:text-sm text-gray-500 capitalize bg-gray-200 px-2 py-1 rounded self-start sm:self-center">
                      {field.field_type}
                    </span>
                    <div className="flex items-center gap-2 justify-between sm:justify-start">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveTempField(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ArrowLeft className="w-4 h-4 rotate-90" />
                        </button>
                        <button
                          onClick={() => moveTempField(index, 'down')}
                          disabled={index === tempFields.length - 1}
                          className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ArrowLeft className="w-4 h-4 -rotate-90" />
                        </button>
                      </div>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateTempField(index, { required: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="hidden sm:inline">Required</span>
                        <span className="sm:hidden">Req.</span>
                      </label>
                      <button
                        onClick={() => removeTempField(index)}
                        className="p-1 text-red-600 hover:bg-red-200 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Placeholder for text fields */}
                  {['text', 'email', 'number'].includes(field.field_type) && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => updateTempField(index, { placeholder: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}

                  {/* Options for choice fields */}
                  {['radio', 'checkbox', 'select'].includes(field.field_type) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                      <div className="space-y-2">
                        {field.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateTempOption(index, optionIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                            {field.options.length > 1 && (
                              <button
                                onClick={() => removeTempOption(index, optionIndex)}
                                className="p-1 text-red-600 hover:bg-red-200 rounded flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addTempOption(index)}
                          className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          Add Option
                        </button>
                      </div>
                      {fieldErrors[`field_${index}_options`] && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors[`field_${index}_options`]}</p>
                      )}
                    </div>
                  )}

                  {fieldErrors[`field_${index}_label`] && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors[`field_${index}_label`]}</p>
                  )}
                </div>
              ))}
            </div>

            {tempFields.length === 0 && (
              <div className="text-center py-8">
                <Type className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h5 className="text-lg font-medium text-gray-900 mb-2">No Fields Added</h5>
                <p className="text-gray-600">
                  Add form fields using the field type buttons above.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
              >
                {saving ? 'Saving...' : 'Save Fields'}
              </button>
              <button
                onClick={() => setEditingFields(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Forms
        </button>
        <div>
          <h3 className="text-lg font-semibold">{form.title}</h3>
          <p className="text-gray-600 text-sm">{form.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm rounded-full ${
            form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {form.is_active ? 'Active' : 'Inactive'}
          </span>
          <span className={`px-3 py-1 text-sm rounded-full ${
            form.is_public !== false ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {form.is_public !== false ? 'Public' : 'Private'}
          </span>
          <button
            onClick={toggleFormStatus}
            className={`px-3 py-1 text-sm rounded border ${
              form.is_active 
                ? 'border-red-300 text-red-700 hover:bg-red-50' 
                : 'border-green-300 text-green-700 hover:bg-green-50'
            }`}
          >
            {form.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={toggleFormVisibility}
            className={`px-3 py-1 text-sm rounded border ${
              form.is_public !== false 
                ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                : 'border-blue-300 text-blue-700 hover:bg-blue-50'
            }`}
          >
            {form.is_public !== false ? 'Make Private' : 'Make Public'}
          </button>
        </div>
      </div>

      {/* Management Sections */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'submissions', label: 'Submissions', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Section Content */}
      <div>
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{form.form_submissions[0]?.count || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Fields</p>
                <p className="text-2xl font-bold text-gray-900">{formFields.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {form.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Visibility</p>
                <p className="text-lg font-bold text-gray-900">
                  {form.is_public !== false ? 'Public' : 'Private'}
                </p>
              </div>
            </div>

            {/* Form Image */}
            {form.image_url && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Form Image</h4>
                <img 
                  src={form.image_url} 
                  alt={form.title}
                  className="w-full max-w-md h-48 object-cover rounded-lg mx-auto"
                />
              </div>
            )}

            {/* Terms of Use */}
            {form.terms && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Terms of Use</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{form.terms}</p>
                </div>
              </div>
            )}

            {/* Form Fields Preview */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Form Fields</h4>
                <button
                  onClick={() => setEditingFields(true)}
                  className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Fields
                </button>
              </div>
              <div className="space-y-3">
                {formFields.map((field, index) => (
                  <div key={field.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100">
                    <div className="mb-2 sm:mb-0">
                      <span className="font-medium text-gray-900">{field.label}</span>
                      <span className="text-xs text-gray-500 ml-2 capitalize">({field.field_type})</span>
                      {field.required && <span className="text-red-500 text-xs ml-2">* Required</span>}
                    </div>
                    <div className="text-sm text-gray-600">
                      {field.options ? `${field.options.length} options` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'submissions' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <FormSubmissions formId={form.id} />
          </div>
        )}

        {activeSection === 'analytics' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <FormAnalytics formId={form.id} />
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Form Settings</h4>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">Basic Information</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Title:</span>
                      <span className="font-medium">{form.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Description:</span>
                      <span className="font-medium">{form.description || 'No description'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(form.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Visibility:</span>
                      <span className={`font-medium ${form.is_public !== false ? 'text-blue-600' : 'text-gray-600'}`}>
                        {form.is_public !== false ? 'Public' : 'Private'}
                      </span>
                    </div>
                    {form.image_url && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Image:</span>
                        <img 
                          src={form.image_url} 
                          alt="Form" 
                          className="w-12 h-12 object-cover rounded"
                        />
                      </div>
                    )}
                    {form.terms && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Terms of Use:</span>
                        <span className="font-medium text-green-600">Set</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">Form Settings</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Form Type:</span>
                      <span className={`font-medium ${form.is_paid ? 'text-green-600' : 'text-gray-600'}`}>
                        {form.is_paid ? 'Paid' : 'Free'}
                      </span>
                    </div>
                    {form.is_paid && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Token Amount:</span>
                        <span className="font-medium">{form.token_amount} tokens</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Submissions:</span>
                      <span className="font-medium">{form.max_submissions || 'Unlimited'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${form.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {form.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Form Actions</h5>
                <div className="flex gap-3 flex-wrap">
                  <button 
                    onClick={() => setEditingForm(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Form
                  </button>
                  <button 
                    onClick={() => setEditingFields(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Fields
                  </button>
                  <button 
                    onClick={shareForm}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Form
                  </button>
                  <button 
                    onClick={exportSubmissions}
                    disabled={submissions.length === 0}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Export Data ({submissions.length})
                  </button>
                </div>
              </div>

              {/* Form Link */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Form Link</h5>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/events/${eventId}/forms/${form.id}`}
                    className="flex-1 px-3 py-2 border border-blue-200 rounded text-sm bg-white w-full"
                  />
                  <button
                    onClick={shareForm}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 w-full sm:w-auto justify-center"
                  >
                    <Link className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Form Modal */}
      {editingForm && <EditFormModal />}
      
      {/* Edit Fields Modal */}
      {editingFields && <EditFieldsModal />}
    </div>
  );
}