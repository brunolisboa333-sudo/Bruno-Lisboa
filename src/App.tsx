/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Wallet, 
  FileText, 
  Settings,
  Plus,
  Menu,
  X,
  ChevronRight,
  MessageCircle,
  Moon,
  Sun,
  LogOut,
  Clock,
  Mail
} from 'lucide-react';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Pages (to be implemented)
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Agenda from './pages/Agenda';
import Finance from './pages/Finance';
import Records from './pages/Records';
import Confirmations from './pages/Confirmations';
import SettingsPage from './pages/Settings';
import UsersPage from './pages/Users';
import Login from './pages/Login';
import { useStorage } from './hooks/useStorage';
import { Navigate } from 'react-router-dom';
import { Component, ErrorInfo, ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const parsedError = JSON.parse(this.state.error?.message || "{}");
        if (parsedError.error) {
          errorMessage = `Erro de Banco de Dados: ${parsedError.error} (${parsedError.operationType} em ${parsedError.path})`;
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl text-center space-y-6 border border-red-100 dark:border-red-900/30">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
              <X size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ops! Algo deu errado</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm break-words">
                {errorMessage}
              </p>
            </div>
            <div className="pt-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/agenda', icon: Calendar, label: 'Agenda', permission: 'view_agenda' },
  { path: '/confirmations', icon: MessageCircle, label: 'Pendências', permission: 'view_confirmations' },
  { path: '/patients', icon: Users, label: 'Pacientes', permission: 'view_patients' },
  { path: '/finance', icon: Wallet, label: 'Financeiro', permission: 'view_finance' },
  { path: '/records', icon: FileText, label: 'Prontuários', permission: 'view_records' },
];

function Sidebar({ isOpen, setIsOpen, darkMode, setDarkMode }: { 
  isOpen: boolean; 
  setIsOpen: (v: boolean) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const { settings, logout, userProfile, hasPermission } = useStorage();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = NAV_ITEMS.filter(item => !item.permission || hasPermission(item.permission));
  
  if (userProfile?.role === 'admin') {
    navItems.push({ path: '/users', icon: Users, label: 'Equipe' });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                Ψ
              </div>
              <span className="font-semibold text-slate-900 dark:text-white tracking-tight">{settings.clinicName}</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn(
                    "transition-colors",
                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              <div className="flex items-center gap-3">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                <span className="text-sm font-medium">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
              </div>
              <div className={cn(
                "w-10 h-5 rounded-full relative transition-colors",
                darkMode ? "bg-emerald-600" : "bg-slate-200"
              )}>
                <div className={cn(
                  "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                  darkMode ? "left-6" : "left-1"
                )} />
              </div>
            </button>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-medium">
                {settings.professionalInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{settings.professionalName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{settings.specialty}</p>
              </div>
              <Link to="/settings">
                <Settings size={18} className="text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300" />
              </Link>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400 transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function AppContent() {
  const { settings, user, userProfile, loading, error, logout, hasPermission } = useStorage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    console.error("App error state:", error);
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl text-center space-y-6 border border-red-100 dark:border-red-900/30">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
            <X size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Erro de Conexão</h2>
            <p className="text-slate-500 dark:text-slate-400">
              {error}
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              Tentar Novamente
            </button>
            <button 
              onClick={() => logout()}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Sair e entrar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdminEmail = user?.email === 'brunolisboa333@gmail.com';

  if (user && !user.emailVerified && !isAdminEmail) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <Mail size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verifique seu E-mail</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Enviamos um link de confirmação para <strong>{user.email}</strong>. 
              Por favor, verifique sua caixa de entrada (e a pasta de spam) para validar sua conta.
            </p>
          </div>
          <div className="pt-4 space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              Já verifiquei meu e-mail
            </button>
            <button 
              onClick={() => logout()}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user && userProfile && userProfile.status !== 'authorized') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
            <Clock size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Aguardando Autorização</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Sua conta ({user.email}) foi criada com sucesso, mas ainda não foi autorizada por um administrador.
            </p>
          </div>
          <div className="pt-4">
            <button 
              onClick={() => logout()}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Sair e entrar com outra conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-screen font-sans overflow-hidden transition-colors duration-300",
      darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      {user && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
        />
      )}
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {user && (
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu size={20} />
            </button>
            <span className="font-semibold text-slate-900 dark:text-white">{settings.clinicName}</span>
            <div className="w-9" /> {/* Spacer */}
          </header>
        )}

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              
              <Route 
                path="/patients" 
                element={user && hasPermission('view_patients') ? <Patients /> : <Navigate to="/" />} 
              />
              <Route 
                path="/agenda" 
                element={user && hasPermission('view_agenda') ? <Agenda /> : <Navigate to="/" />} 
              />
              <Route 
                path="/finance" 
                element={user && hasPermission('view_finance') ? <Finance /> : <Navigate to="/" />} 
              />
              <Route 
                path="/records" 
                element={user && hasPermission('view_records') ? <Records /> : <Navigate to="/" />} 
              />
              <Route 
                path="/confirmations" 
                element={user && hasPermission('view_confirmations') ? <Confirmations /> : <Navigate to="/" />} 
              />
              
              <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
              <Route path="/users" element={user && userProfile?.role === 'admin' ? <UsersPage /> : <Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
      
      <Toaster position="top-right" richColors theme={darkMode ? 'dark' : 'light'} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

