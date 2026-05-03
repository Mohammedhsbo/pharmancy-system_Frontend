import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Languages, Package, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { isArabic, useLanguageStore } from '../../store/useLanguageStore';
import { Button } from '../../components/ui/Button';
import { validateLogin } from '../../utils/validators';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const { login, loading, error } = useAuthStore();
  const { language, t, toggleLanguage } = useLanguageStore();
  const rtl = isArabic(language);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validation = validateLogin({ email, password });
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <button
        onClick={toggleLanguage}
        className={`fixed top-4 ${rtl ? 'left-4' : 'right-4'} h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors`}
        title={t('switchLanguage')}
      >
        <Languages size={16} />
        <span>{language === 'ar' ? 'EN' : 'AR'}</span>
      </button>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white mb-4">
            <Package size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('auth.welcome')}</h1>
          <p className="text-gray-400 mt-2">{t('auth.subtitle')}</p>
        </div>

        <div className="bg-card border border-white/5 rounded-2xl p-8 shadow-xl">
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">{t('auth.email')}</label>
              <div className="relative">
                <Mail className={`absolute ${rtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500`} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setValidationErrors((value) => ({ ...value, email: undefined }));
                  }}
                  className={`w-full bg-background border border-white/10 rounded-lg py-2.5 ${rtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
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
                <label className="text-sm font-medium text-gray-200">{t('auth.password')}</label>
                <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
                  {t('auth.forgotPassword')}
                </a>
              </div>
              <div className="relative">
                <Lock className={`absolute ${rtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500`} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setValidationErrors((value) => ({ ...value, password: undefined }));
                  }}
                  className={`w-full bg-background border border-white/10 rounded-lg py-2.5 ${rtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  placeholder="********"
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
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
