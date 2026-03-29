import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useStorage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login();
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error('Ocorreu um erro ao tentar entrar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-emerald-200 dark:shadow-none">
              Ψ
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h1>
            <p className="text-slate-500 dark:text-slate-400 text-center mt-2">
              Entre com sua conta Google para acessar o sistema de forma segura.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  Entrar com Google
                </>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">Ou use e-mail (em breve)</span>
              </div>
            </div>

            <div className="space-y-4 opacity-50 pointer-events-none">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none text-slate-900 dark:text-white"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none text-slate-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex gap-3 border border-amber-100 dark:border-amber-900/30">
            <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <strong>Nota:</strong> Este sistema contém informações confidenciais de pacientes. 
              O acesso não autorizado é estritamente proibido.
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-400 dark:text-slate-600 text-sm">
          &copy; 2024 Psicanálise App. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
}
