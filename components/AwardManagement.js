"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit, Trash2, Award, Users, Vote, CheckCircle, XCircle, 
  Clock, DollarSign, Eye, EyeOff, Save, X, Calendar, MapPin,
  TrendingUp, BarChart3, Coins, Image as ImageIcon
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function AwardManagement({ event }) {
  const [categories, setCategories] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showNomineeForm, setShowNomineeForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingNominee, setEditingNominee] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    is_paid: false,
    vote_amount: 0,
    is_public_vote: true,
    vote_begin: "",
    vote_end: "",
    category_image: ""
  });
  const [nomineeForm, setNomineeForm] = useState({
    name: "",
    description: "",
    location: "",
    image_url: ""
  });
  const [userRole, setUserRole] = useState(null);
  const [activeView, setActiveView] = useState("categories");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const pageColor = event?.page_color || "#D4AF37";

  useEffect(() => {
    if (!event?.id) return;
    
    fetchUserRole();
    fetchCategories();
    checkActiveStatus();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('award-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'award_categories' },
        () => {
          fetchCategories();
          if (activeView === "analytics") fetchAnalytics();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'award_nominees' },
        () => {
          selectedCategory && fetchNominees(selectedCategory.id);
          if (activeView === "analytics") fetchAnalytics();
        }
      )
      .subscribe();

    // Check active status every minute
    const interval = setInterval(checkActiveStatus, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [event?.id, selectedCategory, activeView]);

  useEffect(() => {
    if (activeView === "analytics") {
      fetchAnalytics();
    }
  }, [activeView]);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      setUserRole(userData?.role);
    }
  };

  const fetchCategories = async () => {
    if (!event?.id) return;
    
    const { data, error } = await supabase
      .from("award_categories")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });
    
    if (!error) setCategories(data || []);
  };

  const fetchNominees = async (categoryId) => {
    const { data, error } = await supabase
      .from("award_nominees")
      .select("*")
      .eq("category_id", categoryId)
      .order("vote_count", { ascending: false });
    
    if (!error) setNominees(data || []);
  };

  const checkActiveStatus = async () => {
    if (!event?.id) return;
    
    const now = new Date().toISOString();
    
    // Update categories that should be active (within voting period)
    const { data: activeCategories } = await supabase
      .from("award_categories")
      .update({ is_active: true })
      .eq("event_id", event.id)
      .lte('vote_begin', now)
      .gte('vote_end', now)
      .select();

    // Update categories that should be inactive (before vote_begin or after vote_end)
    await supabase
      .from("award_categories")
      .update({ is_active: false })
      .eq("event_id", event.id)
      .or(`vote_begin.gt.${now},vote_end.lt.${now}`);

    if (activeCategories) {
      fetchCategories();
    }
  };

  const fetchAnalytics = async () => {
    if (!event?.id) return;

    try {
      // Get total categories and nominees
      const { data: categoriesData } = await supabase
        .from("award_categories")
        .select("id, name, is_active, vote_count")
        .eq("event_id", event.id);

      // Get all nominees with their vote counts
      const { data: nomineesData } = await supabase
        .from("award_nominees")
        .select("id, name, category_id, vote_count")
        .in("category_id", categoriesData?.map(cat => cat.id) || []);

      // Calculate total votes across all categories
      const totalVotes = categoriesData?.reduce((sum, cat) => sum + (cat.vote_count || 0), 0) || 0;

      // Find top performing nominees
      const topNominees = [...(nomineesData || [])]
        .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
        .slice(0, 5);

      // Calculate category statistics
      const categoryStats = categoriesData?.map(category => {
        const categoryNominees = nomineesData?.filter(nominee => nominee.category_id === category.id) || [];
        const totalCategoryVotes = categoryNominees.reduce((sum, nominee) => sum + (nominee.vote_count || 0), 0);
        
        return {
          ...category,
          nomineeCount: categoryNominees.length,
          totalVotes: totalCategoryVotes,
          topNominee: categoryNominees.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))[0]
        };
      }).sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));

      setAnalytics({
        totalCategories: categoriesData?.length || 0,
        totalNominees: nomineesData?.length || 0,
        totalVotes,
        activeCategories: categoriesData?.filter(cat => cat.is_active).length || 0,
        topNominees,
        categoryStats: categoryStats || []
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
      is_paid: false,
      vote_amount: 0,
      is_public_vote: true,
      vote_begin: "",
      vote_end: "",
      category_image: ""
    });
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      is_paid: category.is_paid,
      vote_amount: category.vote_amount || 0,
      is_public_vote: category.is_public_vote,
      vote_begin: category.vote_begin ? category.vote_begin.slice(0, 16) : "",
      vote_end: category.vote_end ? category.vote_end.slice(0, 16) : "",
      category_image: category.category_image || ""
    });
    setShowCategoryForm(true);
  };

  const handleCategoryImageUpload = async (file) => {
    if (!event?.id) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `awards/${event.id}/categories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-assets')
        .getPublicUrl(filePath);

      setCategoryForm({ ...categoryForm, category_image: publicUrl });
    } catch (error) {
      console.error('Error uploading category image:', error);
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert("Category name is required");
      return;
    }

    if (categoryForm.is_paid && categoryForm.vote_amount <= 0) {
      alert("Vote amount must be greater than 0 for paid categories");
      return;
    }

    setLoading(true);
    try {
      const categoryData = {
        event_id: event.id,
        name: categoryForm.name,
        description: categoryForm.description,
        is_paid: categoryForm.is_paid,
        vote_amount: categoryForm.is_paid ? Math.floor(categoryForm.vote_amount) : 0,
        is_public_vote: categoryForm.is_public_vote,
        vote_begin: categoryForm.vote_begin,
        vote_end: categoryForm.vote_end,
        category_image: categoryForm.category_image
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("award_categories")
          .update(categoryData)
          .eq("id", editingCategory.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("award_categories")
          .insert([categoryData])
          .select();

        if (error) throw error;
      }

      setShowCategoryForm(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Error saving category: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNominee = (category) => {
    setSelectedCategory(category);
    setEditingNominee(null);
    setNomineeForm({
      name: "",
      description: "",
      location: "",
      image_url: ""
    });
    setShowNomineeForm(true);
  };

  const handleEditNominee = (nominee) => {
    setEditingNominee(nominee);
    setNomineeForm({
      name: nominee.name,
      description: nominee.description || "",
      location: nominee.location || "",
      image_url: nominee.image_url || ""
    });
    setShowNomineeForm(true);
  };

  const handleSaveNominee = async () => {
    if (!nomineeForm.name.trim()) {
      alert("Nominee name is required");
      return;
    }

    setLoading(true);
    try {
      const nomineeData = {
        category_id: selectedCategory.id,
        name: nomineeForm.name,
        description: nomineeForm.description,
        location: nomineeForm.location,
        image_url: nomineeForm.image_url
      };

      if (editingNominee) {
        const { error } = await supabase
          .from("award_nominees")
          .update(nomineeData)
          .eq("id", editingNominee.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("award_nominees")
          .insert([nomineeData])
          .select();

        if (error) throw error;
      }

      setShowNomineeForm(false);
      fetchNominees(selectedCategory.id);
    } catch (error) {
      console.error("Error saving nominee:", error);
      alert("Error saving nominee: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Are you sure you want to delete this category? All nominees will also be deleted.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("award_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      setCategories(categories.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error deleting category: " + error.message);
    }
  };

  const handleDeleteNominee = async (nomineeId) => {
    if (!confirm("Are you sure you want to delete this nominee?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("award_nominees")
        .delete()
        .eq("id", nomineeId);

      if (error) throw error;

      setNominees(nominees.filter(nom => nom.id !== nomineeId));
    } catch (error) {
      console.error("Error deleting nominee:", error);
      alert("Error deleting nominee: " + error.message);
    }
  };

  const handleImageUpload = async (file) => {
    if (!event?.id) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `awards/${event.id}/nominees/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-assets')
        .getPublicUrl(filePath);

      setNomineeForm({ ...nomineeForm, image_url: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const CountdownTimer = ({ targetDate, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const target = new Date(targetDate).getTime();
        const difference = target - now;

        if (difference <= 0) {
          clearInterval(timer);
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          onComplete?.();
          return;
        }

        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [targetDate, onComplete]);

    if (!targetDate) return null;

    return (
      <div className="flex items-center gap-1 text-sm">
        <Clock className="w-4 h-4" />
        <span className="font-mono">
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {timeLeft.hours.toString().padStart(2, '0')}:
          {timeLeft.minutes.toString().padStart(2, '0')}:
          {timeLeft.seconds.toString().padStart(2, '0')}
        </span>
      </div>
    );
  };

  if (!event) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Event Not Found
        </h3>
        <p className="text-gray-600">
          Please select a valid event to manage awards.
        </p>
      </div>
    );
  }

  if (userRole !== "publisher") {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Publisher Access Required
        </h3>
        <p className="text-gray-600">
          Only publishers can manage award categories and nominees.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Category Form Modal */}
      <AnimatePresence>
        {showCategoryForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h3>
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ focusRingColor: pageColor }}
                      placeholder="Enter category name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ focusRingColor: pageColor }}
                      placeholder="Enter category description"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Thumbnail
                    </label>
                    <div className="flex items-center gap-4">
                      {categoryForm.category_image && (
                        <img 
                          src={categoryForm.category_image} 
                          alt="Preview" 
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}
                      <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleCategoryImageUpload(file);
                          }}
                        />
                        <div className="flex flex-col items-center gap-2">
                          {uploading ? (
                            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          )}
                          <span className="text-sm text-gray-600">
                            {uploading ? 'Uploading...' : 'Upload Thumbnail'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Vote Start
                    </label>
                    <input
                      type="datetime-local"
                      value={categoryForm.vote_begin}
                      onChange={(e) => setCategoryForm({ ...categoryForm, vote_begin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ focusRingColor: pageColor }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Vote End
                    </label>
                    <input
                      type="datetime-local"
                      value={categoryForm.vote_end}
                      onChange={(e) => setCategoryForm({ ...categoryForm, vote_end: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ focusRingColor: pageColor }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_paid}
                      onChange={(e) => setCategoryForm({ 
                        ...categoryForm, 
                        is_paid: e.target.checked,
                        vote_amount: e.target.checked ? categoryForm.vote_amount : 0
                      })}
                      className="rounded border-gray-300"
                      style={{ color: pageColor }}
                    />
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      Paid Voting
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_public_vote}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_public_vote: e.target.checked })}
                      className="rounded border-gray-300"
                      style={{ color: pageColor }}
                    />
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      {categoryForm.is_public_vote ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      Public Vote Count
                    </label>
                  </div>

                  {categoryForm.is_paid && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vote Amount (Tokens) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Coins className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          value={categoryForm.vote_amount}
                          onChange={(e) => setCategoryForm({ ...categoryForm, vote_amount: Math.floor(parseFloat(e.target.value) || 0) })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ focusRingColor: pageColor }}
                          placeholder="0"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={loading || !categoryForm.name.trim()}
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  style={{ backgroundColor: pageColor }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingCategory ? "Update" : "Create"} Category
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nominee Form Modal */}
      <AnimatePresence>
        {showNomineeForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingNominee ? "Edit Nominee" : "Add Nominee to " + selectedCategory?.name}
                </h3>
                <button
                  onClick={() => setShowNomineeForm(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nominee Name *
                    </label>
                    <input
                      type="text"
                      value={nomineeForm.name}
                      onChange={(e) => setNomineeForm({ ...nomineeForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ focusRingColor: pageColor }}
                      placeholder="Enter nominee name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why the Nominee
                    </label>
                    <textarea
                      value={nomineeForm.description}
                      onChange={(e) => setNomineeForm({ ...nomineeForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ focusRingColor: pageColor }}
                      placeholder="Describe why this nominee deserves the award"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={nomineeForm.location}
                      onChange={(e) => setNomineeForm({ ...nomineeForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ focusRingColor: pageColor }}
                      placeholder="Enter nominee location"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nominee Image
                    </label>
                    <div className="flex items-center gap-4">
                      {nomineeForm.image_url && (
                        <img 
                          src={nomineeForm.image_url} 
                          alt="Preview" 
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}
                      <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleImageUpload(file);
                          }}
                        />
                        <div className="flex flex-col items-center gap-2">
                          {uploading ? (
                            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-6 h-6 text-gray-400" />
                          )}
                          <span className="text-sm text-gray-600">
                            {uploading ? 'Uploading...' : 'Upload Image'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowNomineeForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNominee}
                  disabled={loading || !nomineeForm.name.trim()}
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  style={{ backgroundColor: pageColor }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingNominee ? "Update" : "Add"} Nominee
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Award Management</h1>
          <p className="text-gray-600">Manage award categories and nominees</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setActiveView("categories");
                setSelectedCategory(null);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "categories" 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveView("analytics")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "analytics" 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </div>

          {activeView === "categories" && !selectedCategory && (
            <button
              onClick={handleAddCategory}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
              style={{ backgroundColor: pageColor }}
            >
              <Plus size={20} />
              Add Category
            </button>
          )}

          {selectedCategory && (
            <button
              onClick={() => {
                setSelectedCategory(null);
                setNominees([]);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              <X size={20} />
              Back to Categories
            </button>
          )}
        </div>
      </div>

      {/* Categories View */}
      {activeView === "categories" && !selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-all"
              onClick={() => {
                setSelectedCategory(category);
                fetchNominees(category.id);
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {category.category_image && (
                    <img 
                      src={category.category_image} 
                      alt={category.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(category);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {category.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {category.description}
                </p>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : new Date(category.vote_begin) > new Date()
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.is_active 
                      ? 'Voting Active' 
                      : new Date(category.vote_begin) > new Date()
                        ? 'Upcoming'
                        : 'Ended'
                    }
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {category.is_paid ? (
                      <Coins className="w-4 h-4 text-green-600" />
                    ) : (
                      <Vote className="w-4 h-4 text-blue-600" />
                    )}
                    <span className={category.is_paid ? 'text-green-600' : 'text-blue-600'}>
                      {category.is_paid ? `${category.vote_amount} tokens` : 'Free'}
                    </span>
                  </div>
                </div>

                {category.is_active && category.vote_end && (
                  <CountdownTimer 
                    targetDate={category.vote_end} 
                    onComplete={fetchCategories}
                  />
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{category.nominee_count || 0} nominees</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {category.is_public_vote ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span>{category.is_public_vote ? 'Public' : 'Private'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Nominees View */}
      {activeView === "categories" && selectedCategory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Category Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {selectedCategory.category_image && (
                  <img 
                    src={selectedCategory.category_image} 
                    alt={selectedCategory.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h2>
                  {selectedCategory.description && (
                    <p className="text-gray-600 mt-1">{selectedCategory.description}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAddNominee(selectedCategory)}
                  className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                  style={{ backgroundColor: pageColor }}
                >
                  <Plus size={20} />
                  Add Nominee
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedCategory.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : new Date(selectedCategory.vote_begin) > new Date()
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {selectedCategory.is_active 
                  ? 'Voting Active' 
                  : new Date(selectedCategory.vote_begin) > new Date()
                    ? 'Upcoming'
                    : 'Ended'
                }
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium flex items-center gap-1">
                {selectedCategory.is_paid ? (
                  <Coins className="w-4 h-4" />
                ) : (
                  <Vote className="w-4 h-4" />
                )}
                {selectedCategory.is_paid ? `Paid - ${selectedCategory.vote_amount} tokens` : 'Free Voting'}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium flex items-center gap-1">
                {selectedCategory.is_public_vote ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {selectedCategory.is_public_vote ? 'Public Votes' : 'Private Votes'}
              </span>
            </div>

            {selectedCategory.is_active && selectedCategory.vote_end && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Voting ends in:</span>
                  <CountdownTimer 
                    targetDate={selectedCategory.vote_end} 
                    onComplete={() => {
                      fetchCategories();
                      fetchNominees(selectedCategory.id);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Nominees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nominees.map((nominee) => (
              <motion.div
                key={nominee.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
              >
                <div className="relative">
                  {nominee.image_url ? (
                    <img 
                      src={nominee.image_url} 
                      alt={nominee.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <Award className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button 
                      onClick={() => handleEditNominee(nominee)}
                      className="p-1 bg-white bg-opacity-90 text-blue-600 rounded transition hover:bg-opacity-100"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteNominee(nominee.id)}
                      className="p-1 bg-white bg-opacity-90 text-red-600 rounded transition hover:bg-opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {selectedCategory.is_public_vote && (
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-sm font-medium">
                        {nominee.vote_count} votes
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{nominee.name}</h3>
                  
                  {nominee.location && (
                    <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                      <MapPin className="w-4 h-4" />
                      {nominee.location}
                    </div>
                  )}

                  {nominee.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {nominee.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Added {new Date(nominee.created_at).toLocaleDateString()}
                    </span>
                    {selectedCategory.is_public_vote && (
                      <div className="flex items-center gap-1 text-sm font-medium" style={{ color: pageColor }}>
                        <TrendingUp className="w-4 h-4" />
                        #{nominees.findIndex(n => n.id === nominee.id) + 1}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {nominees.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Nominees Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Add nominees to this category to get started.
              </p>
              <button
                onClick={() => handleAddNominee(selectedCategory)}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90 transition mx-auto"
                style={{ backgroundColor: pageColor }}
              >
                <Plus size={20} />
                Add First Nominee
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Analytics View */}
      {activeView === "analytics" && (
        <div className="space-y-6">
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.totalCategories || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Nominees</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.totalNominees || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Vote className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Votes</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.totalVotes || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.activeCategories || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Nominees */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Nominees</h3>
            {analytics?.topNominees && analytics.topNominees.length > 0 ? (
              <div className="space-y-3">
                {analytics.topNominees.map((nominee, index) => (
                  <div key={nominee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full text-sm font-semibold">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{nominee.name}</p>
                        <p className="text-sm text-gray-600">{nominee.vote_count || 0} votes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium text-gray-900">
                        {analytics.categoryStats?.find(cat => cat.id === nominee.category_id)?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No voting data available yet.
              </div>
            )}
          </div>

          {/* Category Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            {analytics?.categoryStats && analytics.categoryStats.length > 0 ? (
              <div className="space-y-4">
                {analytics.categoryStats.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {category.category_image && (
                          <img 
                            src={category.category_image} 
                            alt={category.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">{category.name}</h4>
                          <p className="text-sm text-gray-600">{category.nomineeCount} nominees</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Votes:</span>
                        <span className="font-semibold">{category.totalVotes || 0}</span>
                      </div>
                      {category.topNominee && (
                        <div className="flex justify-between text-sm">
                          <span>Leading Nominee:</span>
                          <span className="font-semibold">
                            {category.topNominee.name} ({category.topNominee.vote_count || 0} votes)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No categories with voting data yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty States */}
      {activeView === "categories" && !selectedCategory && categories.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Categories Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first award category to get started.
          </p>
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90 transition mx-auto"
            style={{ backgroundColor: pageColor }}
          >
            <Plus size={20} />
            Create First Category
          </button>
        </div>
      )}
    </div>
  );
}