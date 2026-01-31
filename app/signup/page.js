'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Users, Star, X, Check, Camera, XCircle } from 'lucide-react';

function PasswordInput({ value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        name="password"
        placeholder="Password (8 or more characters)"
        required
        value={value}
        onChange={onChange}
        className="w-full p-3 border rounded-lg bg-white text-black focus:outline-none focus:border-orange-500 pr-10"
      />
      <div
        className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-orange-600"
        onClick={() => setShowPassword(prev => !prev)}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </div>
    </div>
  );
}

export default function Signup() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  // Load saved form data from localStorage on initial render
  const [form, setForm] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gleedz_signup_data');
      return saved ? JSON.parse(saved) : {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        country: '',
        state: '',
        city: '',
        role: 'publisher',
      };
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      country: '',
      state: '',
      city: '',
      role: 'publisher',
    };
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPublisherInfo, setShowPublisherInfo] = useState(false);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gleedz_signup_data', JSON.stringify(form));
      
      // Also save avatar preview if it exists
      if (avatarPreview) {
        localStorage.setItem('gleedz_signup_avatar_preview', avatarPreview);
      }
    }
  }, [form, avatarPreview]);

  // Load avatar preview from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreview = localStorage.getItem('gleedz_signup_avatar_preview');
      if (savedPreview) {
        setAvatarPreview(savedPreview);
      }
      
      // Load terms agreement state
      const savedAgreement = localStorage.getItem('gleedz_signup_agreed');
      if (savedAgreement) {
        setAgreedToTerms(JSON.parse(savedAgreement));
      }
    }
  }, []);

  // Save terms agreement state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gleedz_signup_agreed', JSON.stringify(agreedToTerms));
    }
  }, [agreedToTerms]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If user is switching to publisher, show the info popup
    if (name === 'role' && value === 'publisher' && form.role !== 'publisher') {
      setShowPublisherInfo(true);
      // Don't change the role yet, wait for user confirmation
      return;
    }
    
    // If user is switching to participant, just update the form
    if (name === 'role' && value === 'fans') {
      setForm(prev => ({ ...prev, role: 'fans' }));
      return;
    }
    
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContinueAsPublisher = () => {
    // User confirmed they want to be a publisher
    setForm(prev => ({ ...prev, role: 'publisher' }));
    setShowPublisherInfo(false);
  };

  const handleSwitchToParticipant = () => {
    // User wants to switch to participant
    setForm(prev => ({ ...prev, role: 'fans' }));
    setShowPublisherInfo(false);
  };

  const handleCancelPublisherInfo = () => {
    // User cancels, stay on current role (which should be fans)
    setShowPublisherInfo(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file');
      return;
    }
    
    setAvatarFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setErrorMsg(''); // Clear any previous error
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gleedz_signup_avatar_preview');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms of Service to continue.');
      return;
    }

    setLoading(true);
    const { email, password, firstName, lastName, role, country, state, city } = form;

    const userRole = form.role; // 'publisher' or 'fans'
    const profileTable = userRole === 'publisher' ? 'publishers' : 'fans';

    // 1️⃣ Sign up user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: userRole } }
    });

    if (signUpError || !authData?.user?.id) {
      setErrorMsg(signUpError?.message || 'Failed to sign up.');
      setLoading(false);
      return;
    }

    const userId = authData.user.id;
    const fullName = `${firstName} ${lastName}`;

    // 2️⃣ Upload profile picture if provided
    let avatarUrl = null;
    if (avatarFile) {
      const folder = role === 'publisher' ? 'publishers' : 'fans';
      const filePath = `${folder}/${userId}-${Date.now()}-${avatarFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('profilephoto')
        .upload(filePath, avatarFile);

      if (uploadError) {
        setErrorMsg(`Image upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('profilephoto')
        .getPublicUrl(filePath);
      avatarUrl = publicUrlData.publicUrl;
    }

    // 3️⃣ Upsert into users table
    const { error: userTableError } = await supabase.from('users').upsert(
      [{ id: userId, role: userRole }],
      { onConflict: ['id'] }
    );
    if (userTableError) {
      setErrorMsg('Failed to assign user role.');
      setLoading(false);
      return;
    }

    // 4️⃣ Insert into profile table
    let profilePayload;
    if (userRole === 'fans') {
      profilePayload = {
        id: userId,
        full_name: fullName,
        email,
        phone: '',
        avatar_url: avatarUrl,
        country: country || null,
        state: state || null,
        city: city || null,
      };
    } else {
      profilePayload = {
        id: userId,
        name: fullName,
        company: 'N/A',
        email,
        phone: '',
        full_address: '',
        avatar_url: avatarUrl,
        bio: '',
        id_card_url: null,
      };
    }

    const { error: profileError } = await supabase.from(profileTable).insert([profilePayload]);
    if (profileError) {
      console.error(profileError);
      setErrorMsg('Database error: ' + JSON.stringify(profileError));
      setLoading(false);
      return;
    }

    // Clear saved form data after successful signup
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gleedz_signup_data');
      localStorage.removeItem('gleedz_signup_avatar_preview');
      localStorage.removeItem('gleedz_signup_agreed');
    }

    setSuccessMsg('Account created successfully!');
    setLoading(false);

    setTimeout(() => router.push('/login'), 1500);
  };

  // Clear all saved form data (for testing)
  const clearSavedData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gleedz_signup_data');
      localStorage.removeItem('gleedz_signup_avatar_preview');
      localStorage.removeItem('gleedz_signup_agreed');
    }
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      country: '',
      state: '',
      city: '',
      role: 'publisher',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setAgreedToTerms(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white px-4 pt-20 pb-10">
      {/* Publisher Info Modal */}
      <AnimatePresence>
        {showPublisherInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
            onClick={handleCancelPublisherInfo}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-lg shadow-lg max-w-xs w-full p-3 md:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start mb-2">
                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-yellow-100 flex items-center justify-center mr-2 flex-shrink-0">
                  <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-1">
                      Event Producer Account
                    </h3>
                    <button
                      onClick={handleCancelPublisherInfo}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-600 leading-tight">
                    This account is for event organizers who want to create and launch events on Gleedz. You'll be able to create events, sell tickets, and manage participants.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSwitchToParticipant}
                  className="flex-1 py-1.5 px-2 text-[10px] md:text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium"
                >
                  Switch to Participant
                </button>
                <button
                  onClick={handleContinueAsPublisher}
                  className="flex-1 py-1.5 px-2 text-[10px] md:text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors font-medium flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6">
        <Image
          src="https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/glogo.png"
          alt="Gleedz Logo"
          width={100}
          height={30}
          priority
        />
      </div>

      {/* Form Data Status Indicator */}
      <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${form.firstName || form.email ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span>Your progress is automatically saved</span>
        <button 
          onClick={clearSavedData}
          className="text-xs text-red-500 hover:text-red-700 underline ml-4"
          type="button"
        >
          Clear saved data
        </button>
      </div>

      <form
        onSubmit={handleSignup}
        className="w-full max-w-4xl bg-white border rounded-xl shadow p-5 space-y-4"
      >
        <h2 className="text-xl md:text-2xl font-bold text-black text-center">
          Create your Gleedz Account
        </h2>

        {/* Profile Picture Upload with Preview */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative group">
            <div 
              className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 cursor-pointer hover:border-yellow-500 transition-colors"
              onClick={triggerFileInput}
            >
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              {/* Upload overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            
            {/* Remove photo button */}
            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          <div className="text-center">
            <button
              type="button"
              onClick={triggerFileInput}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
            >
              {avatarPreview ? 'Change Profile Photo' : 'Upload Profile Photo'}
            </button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 5MB</p>
          </div>
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            name="firstName"
            placeholder="First name"
            required
            value={form.firstName}
            onChange={handleChange}
            className="p-2 text-sm border rounded-lg bg-white text-black focus:outline-none focus:border-gold-700"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last name"
            required
            value={form.lastName}
            onChange={handleChange}
            className="p-2 text-sm border rounded-lg bg-white text-black focus:outline-none focus:border-gold-700"
          />
        </div>

        {/* Email + Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="email"
            name="email"
            placeholder="Work email address"
            required
            value={form.email}
            onChange={handleChange}
            className="p-2 text-sm border rounded-lg bg-white text-black focus:outline-none focus:border-gold-700"
          />
          <PasswordInput value={form.password} onChange={handleChange} />
        </div>

        {/* Country / State / City */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            list="countries"
            type="text"
            name="country"
            placeholder="Country"
            value={form.country}
            onChange={handleChange}
            className="p-2 text-sm border rounded-lg bg-white text-black focus:outline-none focus:border-gold-700"
            required
          />
          <input
            type="text"
            name="state"
            placeholder="State"
            value={form.state}
            onChange={handleChange}
            className="p-2 text-sm border rounded-lg bg-white text-black focus:outline-none focus:border-gold-700"
          />
          <input
            type="text"
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            className="p-2 text-sm border rounded-lg bg-white text-black focus:outline-none focus:border-gold-700"
          />
        </div>

        <datalist id="countries">
          {[
            "Nigeria","Ghana","Kenya","South Africa","United States","United Kingdom","Canada",
            "Australia","Germany","France","India","China","Brazil","Mexico","Japan","Italy","Spain",
            "Egypt","Ethiopia","Uganda","Tanzania","Cameroon","Senegal","Ivory Coast","Rwanda","Zambia",
            "Zimbabwe","Malawi","Mozambique","South Sudan","Morocco","Tunisia","Algeria","Turkey",
            "Saudi Arabia","United Arab Emirates","Qatar","Russia","Ukraine","Netherlands","Sweden",
            "Norway","Denmark","Switzerland","Belgium","Portugal","Poland","Argentina","Chile",
            "Colombia","Peru","Venezuela","Pakistan","Bangladesh","Philippines","Malaysia","Singapore"
          ].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        {/* Role selection */}
        <div className="flex flex-col md:flex-row md:space-x-6">
          <label className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
            <input
              type="radio"
              name="role"
              value="publisher"
              checked={form.role === 'publisher'}
              onChange={handleChange}
              className="accent-gold-700"
            />
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-yellow-600" />
              <span>I'm an Event Producer</span>
            </div>
          </label>
          <label className="flex items-center space-x-2 mt-2 md:mt-0 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
            <input
              type="radio"
              name="role"
              value="fans"
              checked={form.role === 'fans'}
              onChange={handleChange}
              className="accent-gold-700"
            />
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-2 text-blue-600" />
              <span>I'm a Participant</span>
            </div>
          </label>
        </div>

        {/* Role description hint */}
        <div className="text-xs text-gray-500 italic mt-1">
          {form.role === 'publisher' ? (
            <span className="flex items-center">
              <Star className="w-3 h-3 mr-1 text-yellow-600" />
              Event Producers can create and manage events on Gleedz
            </span>
          ) : (
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1 text-blue-600" />
              Participants can join events, vote, and buy tickets
            </span>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start space-x-2 text-sm">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={e => setAgreedToTerms(e.target.checked)}
            className="mt-1 accent-gold-700"
            required
          />
          <label className="text-gray-700 text-sm">
            Yes, I understand and agree to Gleedz&nbsp;
            <Link href="/terms-agreement-policy" className="text-gold-700 hover:text-gold-500 underline">Terms of Service, User Agreement and Privacy Policy</Link>.
          </label>
        </div>

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
        {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

        {/* Submit button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading || !agreedToTerms}
          className="w-full p-3 rounded-lg bg-yellow-700 text-white hover:bg-yellow-500 transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create my account'}
        </motion.button>

        <div className="text-sm text-center text-gray-600">
          If you have an account,&nbsp;
          <Link href="/login" className="text-yellow-700 hover:text-yellow-500 font-semibold">login</Link>
        </div>

        <div className="text-sm text-center">
          <Link href="/auth/reset-password" className="text-gray-600 hover:text-gold-500 underline">Forgot password? Reset</Link>
        </div>
      </form>
    </div>
  );
}