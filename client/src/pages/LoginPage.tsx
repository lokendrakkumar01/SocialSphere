import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      await login(loginId, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-slate-900/70 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden relative z-10">
        {/* Left Side: Brand Showcase (Visible on medium+ screens) */}
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
                  Enterprise Platform
                </span>
              </div>
            </div>

            <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Real connection. <br />
              <span className="bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
                Zero algorithmic noise.
              </span>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-6">
              Experience lightning-fast feeds, end-to-end Socket.IO messaging, 24-hour video stories, and deep creator autonomy.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Live MongoDB Atlas Cloud Cluster</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>High-Performance Cloudinary Media Pipelines</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Role-Based Protected Admin & Moderation</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>© 2026 SocialSphere Inc.</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live System
            </span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          {/* Mobile Brand Header */}
          <div className="md:hidden text-center mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-2 shadow-lg shadow-brand-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-white">SocialSphere</h1>
            <p className="text-xs text-slate-400">Sign in to your account</p>
          </div>

          <div className="space-y-1 mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight">Sign In</h3>
            <p className="text-xs text-slate-400">
              Enter your credentials to access your dashboard and feed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Email"
              type="text"
              placeholder="e.g. admin or alex_tech"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              required
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
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
              className="w-full !py-3 font-bold !bg-gradient-to-r !from-brand-600 !to-indigo-600 hover:!from-brand-500 hover:!to-indigo-500 shadow-lg shadow-brand-600/20"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to SocialSphere
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-xs text-slate-400 pt-6 mt-2">
            Don't have an account?{' '}
            <NavLink to="/register" className="text-brand-400 font-bold hover:underline">
              Create an account
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
};
