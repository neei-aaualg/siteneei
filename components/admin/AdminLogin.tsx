import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (password: string) => Promise<void>;
  loggingIn: boolean;
  loginError: string | null;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLogin,
  loggingIn,
  loginError,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loggingIn) return;
    onLogin(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-100 dark:bg-[#070e17] text-text-100 dark:text-slate-100">
      <div className="w-full max-w-md bg-white dark:bg-[#0c1724] rounded-3xl border border-gray-200 dark:border-cyan-950/80 shadow-2xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent-200/10 dark:bg-cyan-500/10 border border-accent-200/30 dark:border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-accent-200 dark:text-cyan-400">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-100 dark:text-white">
            Painel de Controlo NEEI
          </h1>
          <p className="text-xs text-text-200 dark:text-slate-400 mt-1">
            Acesso restrito à equipa e órgãos sociais do núcleo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-200 dark:text-slate-400 mb-2">
              Senha de Equipa
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Insere a senha do NEEI"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/40 dark:focus:ring-cyan-500/40"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-300">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loggingIn || !password}
            className="w-full py-3 px-4 bg-primary-300 dark:bg-cyan-600 hover:bg-primary-200 dark:hover:bg-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loggingIn ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>A autenticar...</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Entrar no Painel</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
          <span className="text-[11px] text-gray-400 dark:text-slate-500">
            UAlg LEI • Núcleo de Estudantes de Engenharia Informática
          </span>
        </div>
      </div>
    </div>
  );
};
