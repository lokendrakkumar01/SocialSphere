import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  Mail,
  Lock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Admin registration passcode toggle
  const [isAdminRegistration, setIsAdminRegistration] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live username availability check
  useEffect(() => {
    if (username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const res = await api.get(`/auth/check-username?username=${encodeURIComponent(username)}`);
        setIsUsernameAvailable(res.data.available);
      } catch {
        setIsUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !displayName || !password) return;
    if (isUsernameAvailable === false) {
      setError('Please choose a different username');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register({
        username,
        email,
        displayName,
        password,
        ...(isAdminRegistration && adminPasscode ? { adminPasscode } : {}),
      } as any);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-slate-900/70 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden relative z-10">
        {/* Left Side: Brand Showcase */}
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-10 bg-gradient-to-br from-brand-950/60 via-slate-900/40 to-purple-950/40 border-r border-slate-800/60 relative">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-400 bg-clip-text text-transparent">
                  SocialSphere
                </span>
                <span className="text-[10px] block font-semibold text-brand-400 tracking-widest uppercase">
                  Community Network
                </span>
              </div>
            </div>

            <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Join the next generation of <br />
              <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
                social networking.
              </span>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-6">
              Create your profile, publish stories, stream short videos, and chat in real-time with verified creators.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Zero Ads & Transparent Feeds</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>Instant Sub-Second Direct Messaging</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>24-Hour Ephemeral Story Channels</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 text-[11px] text-slate-500">
            <span>© 2026 SocialSphere Inc.</span>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          <div className="space-y-1 mb-5">
            <h3 className="text-xl font-bold text-white tracking-tight">Create Account</h3>
            <p className="text-xs text-slate-400">
              Sign up in seconds to start connecting with creators.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Username"
              type="text"
              placeholder="e.g. dev_jane"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              rightIcon={
                isCheckingUsername ? (
                  <span className="text-[10px] text-slate-400">checking...</span>
                ) : isUsernameAvailable === true ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : isUsernameAvailable === false ? (
                  <XCircle className="w-4 h-4 text-rose-500" />
                ) : null
              }
              helperText={
                isUsernameAvailable === false
                  ? 'This username is taken'
                  : 'Letters, numbers, and underscores only'
              }
              required
            />

            <Input
              label="Display Name"
              type="text"
              placeholder="Jane Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            {/* Admin Registration Passcode Box */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> Register as Administrator?
                </span>
                <input
                  type="checkbox"
                  checked={isAdminRegistration}
                  onChange={(e) => setIsAdminRegistration(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {isAdminRegistration && (
                <div className="mt-2.5 p-3 rounded-2xl bg-purple-950/30 border border-purple-800/50 space-y-2 animate-in fade-in zoom-in-95">
                  <Input
                    label="Admin Secret Passcode"
                    type="password"
                    placeholder="Enter master admin key"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    leftIcon={<Key className="w-4 h-4 text-purple-400" />}
                    helperText="Required only for system administrators."
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isUsernameAvailable === false}
              className="w-full !py-3 font-bold !bg-gradient-to-r !from-brand-600 !to-indigo-600 hover:!from-brand-500 hover:!to-indigo-500 shadow-lg shadow-brand-600/20"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-xs text-slate-400 pt-4">
            Already have an account?{' '}
            <NavLink to="/login" className="text-brand-400 font-bold hover:underline">
              Sign In
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
};
