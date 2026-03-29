import { motion } from 'motion/react';
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserX, 
  ShieldAlert,
  Mail,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

export default function UsersPage() {
  const { allUsers, updateUserProfile, userProfile } = useStorage();

  const handleStatusChange = (uid: string, status: UserProfile['status']) => {
    updateUserProfile(uid, { status });
  };

  const handleRoleChange = (uid: string, role: UserProfile['role']) => {
    updateUserProfile(uid, { role });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciamento de Equipe</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie os membros da sua equipe e suas permissões de acesso.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {allUsers.map((user) => (
          <div 
            key={user.uid} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-14 h-14 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xl">
                    {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center",
                  user.role === 'admin' ? "bg-amber-500" : "bg-blue-500"
                )}>
                  {user.role === 'admin' ? <Shield size={10} className="text-white" /> : <Users size={10} className="text-white" />}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">{user.displayName || 'Usuário sem nome'}</h3>
                  {user.uid === userProfile?.uid && (
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">Você</span>
                  )}
                </div>
                <div className="flex flex-col space-y-1 mt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Mail size={12} />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar size={12} />
                    Entrou em {format(new Date(user.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5",
                  user.status === 'authorized' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  user.status === 'pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {user.status === 'authorized' ? <UserCheck size={12} /> : 
                   user.status === 'pending' ? <ShieldAlert size={12} /> : 
                   <UserX size={12} />}
                  {user.status === 'authorized' ? 'Autorizado' : 
                   user.status === 'pending' ? 'Pendente' : 
                   'Bloqueado'}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargo</span>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5",
                  user.role === 'admin' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}>
                  {user.role === 'admin' ? 'Administrador' : 'Membro'}
                </div>
              </div>

              {user.uid !== userProfile?.uid && (
                <div className="flex items-center gap-2 ml-4">
                  {user.status !== 'authorized' ? (
                    <button 
                      onClick={() => handleStatusChange(user.uid, 'authorized')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      Autorizar
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStatusChange(user.uid, 'blocked')}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors"
                    >
                      Bloquear
                    </button>
                  )}
                  
                  <div className="relative group">
                    <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                      <MoreVertical size={20} />
                    </button>
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                      <button 
                        onClick={() => handleRoleChange(user.uid, user.role === 'admin' ? 'member' : 'admin')}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <Shield size={16} className="text-amber-500" />
                        Tornar {user.role === 'admin' ? 'Membro' : 'Admin'}
                      </button>
                      {user.status === 'blocked' && (
                        <button 
                          onClick={() => handleStatusChange(user.uid, 'pending')}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <ShieldAlert size={16} className="text-amber-500" />
                          Mover para Pendente
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
