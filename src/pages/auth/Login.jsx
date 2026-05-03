import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { validateLogin } from '../../utils/validators';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation before API call
    const validation = validateLogin({ email, password });
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }
    setValidationErrors({});

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard'); // Default redirect after login
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white mb-4">
            <Package size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Sign in to your PharmERP account</p>
        </div>

        <div className="bg-card border border-white/5 rounded-2xl p-8 shadow-xl">
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setValidationErrors((v) => ({ ...v, email: undefined })); }}
                  className="w-full bg-background border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="admin@pharmacy.com"
                  required
                />
              </div>
              {validationErrors.email && (
                <p className="text-danger text-xs mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-200">Password</label>
                <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setValidationErrors((v) => ({ ...v, password: undefined })); }}
                  className="w-full bg-background border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              {validationErrors.password && (
                <p className="text-danger text-xs mt-1">{validationErrors.password}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base mt-2" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
