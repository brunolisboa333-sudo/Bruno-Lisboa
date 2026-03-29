import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, ChevronRight, AlertCircle, User, ArrowLeft } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { toast } from 'sonner';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithEmail, registerWithEmail } = useStorage();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao entrar com Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegistering && !name)) {
      toast.error('Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password, name);
        setIsRegistering(false);
      } else {
        await loginWithEmail(email, password);
        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (error: any) {
      console.error(error);
      let msg = 'Ocorreu um erro.';
      if (error.code === 'auth/user-not-found') msg = 'Usuário não encontrado.';
      if (error.code === 'auth/wrong-password') msg = 'Senha incorreta.';
      if (error.code === 'auth/email-already-in-use') msg = 'E-mail já cadastrado.';
      if (error.code === 'auth/weak-password') msg = 'Senha muito fraca.';
      toast.error(msg);
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isRegistering ? 'Criar Conta' : 'Acesso Restrito'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-center mt-2">
              {isRegistering 
                ? 'Preencha os dados abaixo para se cadastrar.' 
                : 'Entre com sua conta para acessar o sistema.'}
            </p>
          </div>

          <div className="space-y-6">
            {!isRegistering && (
              <button
                onClick={handleGoogleLogin}
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
            )}

            {!isRegistering && (
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">Ou use e-mail</span>
                </div>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        placeholder="Seu nome"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegistering ? 'Criar Conta' : 'Entrar'}
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
              </button>
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
