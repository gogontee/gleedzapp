'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

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

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    country: '',
    state: '',
    city: '',
    role: 'publisher',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setAvatarFile(e.target.files[0]);
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
      const folder = role === 'client' ? 'publishers' : 'fans';
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

    setSuccessMsg('Account created successfully!');
    setLoading(false);

    setTimeout(() => router.push('/login'), 1500);
  };

  return (
  <div className="min-h-screen flex flex-col items-center justify-start bg-white px-4 pt-20 pb-10">
    <div className="mb-6">
      <Image
        src="https://mttimgygxzfqzmnirfyq.supabase.co/storage/v1/object/public/assets/glogo.png"
        alt="Gleedz Logo"
        width={100}
        height={30}
        priority
      />
    </div>

    <form
      onSubmit={handleSignup}
      className="w-full max-w-4xl bg-white border rounded-xl shadow p-5 space-y-4"
    >
      <h2 className="text-xl md:text-2xl font-bold text-black text-center">
        Create your Gleedz Account
      </h2>

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

      {/* Profile picture upload */}
      <div>
        <label className="block text-gray-700 mb-1 text-sm">Profile Picture</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-2 text-sm border rounded-lg bg-white text-black focus:outline-none focus:border-gold-700"
        />
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
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="radio"
            name="role"
            value="publisher"
            checked={form.role === 'publisher'}
            onChange={handleChange}
            className="accent-gold-700"
          />
          <span>I'm an Event Producer</span>
        </label>
        <label className="flex items-center space-x-2 mt-2 md:mt-0 text-sm">
          <input
            type="radio"
            name="role"
            value="fans"
            checked={form.role === 'fans'}
            onChange={handleChange}
            className="accent-gold-700"
          />
          <span>I'm a Fans</span>
        </label>
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
          <Link href="/terms" className="text-gold-700 hover:text-gold-500 underline">Terms of Service</Link>, including the&nbsp;
          <Link href="/user-agreement" className="text-gold-700 hover:text-gold-500 underline">User Agreement</Link>&nbsp;and&nbsp;
          <Link href="/privacy-policy" className="text-gold-700 hover:text-gold-500 underline">Privacy Policy</Link>.
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
