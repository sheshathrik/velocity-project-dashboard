import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Layers, ShieldAlert, Briefcase, Code2, ArrowRight, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setIsLoading(true);
    setError('');
    try {
      await login(demoEmail, 'Password123!');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 items-center justify-center shadow-xl shadow-cyan-500/20 mb-4">
          <Layers className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Velocity Dashboard
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Real-Time Client Project Management & Role-Based Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@velozity.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Grid for Assessment */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              1-Click Assessment Roles
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@velozity.com')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin: Alex Vance</span>
                </span>
                <span className="text-[10px] text-purple-400">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('pm.sarah@velozity.com')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>PM: Sarah Connor</span>
                </span>
                <span className="text-[10px] text-blue-400">Own Projects Only</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('pm.michael@velozity.com')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>PM: Michael Scott</span>
                </span>
                <span className="text-[10px] text-blue-400">Banking App PM</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('dev.ravi@velozity.com')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4" />
                  <span>Dev: Ravi Kumar</span>
                </span>
                <span className="text-[10px] text-emerald-400">Assigned Tasks Only</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('dev.anita@velozity.com')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4" />
                  <span>Dev: Anita Desai</span>
                </span>
                <span className="text-[10px] text-emerald-400">Assigned Tasks Only</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

