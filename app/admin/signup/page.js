'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function AdminAuth() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    avatar_file: null // Fixed: consistent naming
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size must be less than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        avatar_file: file // Fixed: consistent naming
      }));
    }
  };

  const uploadProfilePicture = async (file, userId) => {
    try {
      setUploadProgress(30);
      
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/profile.${fileExt}`;
      
      // Upload to Supabase Storage :cite[1]
      const { data, error } = await supabase.storage
        .from('admin')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      setUploadProgress(80);
      
      // Get public URL :cite[1]
      const { data: { publicUrl } } = supabase.storage
        .from('admin')
        .getPublicUrl(fileName);

      setUploadProgress(100);
      return publicUrl;
      
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload profile picture: ' + error.message);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // Login logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          setMessage('Login successful! Redirecting to admin panel...');
          setTimeout(() => {
            router.push('/gleedzadmin');
          }, 1000);
        }
      } else {
        // Signup logic with file upload
        let avatarUrl = null;
        
        // First create the user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              role: 'admin',
              full_name: formData.full_name,
              phone: formData.phone,
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Upload profile picture if selected - FIXED: using correct variable name
          if (formData.avatar_file) {
            avatarUrl = await uploadProfilePicture(formData.avatar_file, authData.user.id);
            
            // Update user metadata with the actual avatar URL :cite[1]
            const { error: updateError } = await supabase.auth.updateUser({
              data: { 
                role: 'admin',
                full_name: formData.full_name,
                phone: formData.phone,
                avatar_url: avatarUrl 
              }
            });

            if (updateError) throw updateError;
          }

          // Insert into users table with admin role - FIXED: This was missing
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              role: 'admin',
              attempts: 0
            });

          if (userError) {
            console.error('Error inserting into users table:', userError);
            throw new Error('Failed to create user record: ' + userError.message);
          }

          // Update admin table with avatar URL - FIXED: This was missing
          if (avatarUrl) {
            const { error: adminUpdateError } = await supabase
              .from('admins')
              .update({ avatar_url: avatarUrl })
              .eq('id', authData.user.id); // :cite[1]:cite[7]

            if (adminUpdateError) {
              console.error('Error updating admin table:', adminUpdateError);
              // Don't throw here as the user is already created
            }
          }

          setMessage('Admin account created successfully! Please check your email for verification.');
          setTimeout(() => {
            setIsLogin(true);
            setFormData(prev => ({ 
              ...prev, 
              full_name: '', 
              phone: '', 
              avatar_file: null 
            }));
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setMessage('');
    setFormData(prev => ({
      ...prev,
      full_name: '',
      phone: '',
      avatar_file: null
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-yellow-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-800 mb-2">
            {isLogin ? 'Admin Login' : 'Admin Signup'}
          </h1>
          <p className="text-yellow-600">
            {isLogin ? 'Sign in to your administrator account' : 'Create administrator account'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Only show these fields for signup */}
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-1">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                />
                <p className="text-xs text-yellow-600 mt-1">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
                
                {/* File preview - FIXED: using correct variable name */}
                {formData.avatar_file && (
                  <div className="mt-2">
                    <p className="text-sm text-yellow-700">Selected: {formData.avatar_file.name}</p>
                    <img 
                      src={URL.createObjectURL(formData.avatar_file)} 
                      alt="Preview" 
                      className="mt-2 w-20 h-20 rounded-lg object-cover border border-yellow-300"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Common fields for both login and signup */}
          <div>
            <label className="block text-sm font-medium text-yellow-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-yellow-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          {/* Upload progress indicator */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-yellow-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            {loading 
              ? (isLogin ? 'Signing In...' : 'Creating Account...') 
              : (isLogin ? 'Sign In' : 'Create Admin Account')
            }
          </button>
        </form>

        {/* Toggle between login and signup */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-yellow-600 hover:text-yellow-800 font-medium"
          >
            {isLogin 
              ? "Don't have an admin account? Sign up here" 
              : "Already have an admin account? Sign in here"
            }
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center ${
            message.includes('Error') || message.includes('error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}