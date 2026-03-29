import { motion } from 'motion/react';
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserX, 
  ShieldAlert,
  Mail,
  Calendar,
  MoreVertical,
  Plus,
  Check,
  X,
  Lock
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { useState } from 'react';
import { toast } from 'sonner';

const AVAILABLE_PERMISSIONS = [
  { id: 'view_patients', label: 'Pacientes', description: 'Visualizar e gerenciar pacientes' },
  { id: 'view_agenda', label: 'Agenda', description: 'Visualizar e gerenciar consultas' },
  { id: 'view_records', label: 'Evoluções', description: 'Visualizar e gerenciar prontuários' },
  { id: 'view_finance', label: 'Financeiro', description: 'Visualizar relatórios e faturamento' },
  { id: 'view_confirmations', label: 'Confirmações', description: 'Gerenciar confirmações de consultas' },
  { id: 'manage_team', label: 'Equipe', description: 'Gerenciar membros da equipe' },
];

export default function UsersPage() {
  const { allUsers, updateUserProfile, userProfile, createInvitation } = useStorage();
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>(['view_patients', 'view_agenda']);
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = (uid: string, status: UserProfile['status']) => {
    updateUserProfile(uid, { status });
  };

  const handleRoleChange = (uid: string, role: UserProfile['role']) => {
    updateUserProfile(uid, { role });
  };

  const togglePermission = (uid: string, currentPermissions: string[] | undefined, permissionId: string) => {
    const permissions = currentPermissions || [];
    const newPermissions = permissions.includes(permissionId)
      ? permissions.filter(p => p !== permissionId)
      : [...permissions, permissionId];
    
    updateUserProfile(uid, { permissions: newPermissions });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) {
      toast.error('Preencha pelo menos o nome e o e-mail.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createInvitation({
        email: newUserEmail,
        displayName: newUserName,
        phone: newUserPhone,
        address: newUserAddress,
        permissions: newUserPermissions
      });
      
      toast.success(`Convite preparado para ${newUserEmail}. Peça para o usuário se cadastrar com este e-mail.`);
      setIsAddingUser(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPhone('');
      setNewUserAddress('');
      setNewUserPermissions(['view_patients', 'view_agenda']);
    } catch (error) {
      console.error("Error creating invitation:", error);
      toast.error("Erro ao criar convite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold">Acesso Restrito</h2>
        <p className="text-slate-500 max-w-md">Apenas administradores podem gerenciar a equipe.</p>
      </div>
    );
  }

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
        <button 
          onClick={() => setIsAddingUser(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm"
        >
          <Plus size={20} />
          Novo Membro
        </button>
      </div>

      {isAddingUser && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg"
        >
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Adicionar Novo Membro</h3>
              <button type="button" onClick={() => setIsAddingUser(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                <input 
                  type="email" 
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                <input 
                  type="tel" 
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Endereço</label>
                <input 
                  type="text" 
                  value={newUserAddress}
                  onChange={(e) => setNewUserAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase">Permissões de Acesso Iniciais</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const isGranted = newUserPermissions.includes(perm.id);
                  return (
                    <button
                      key={perm.id}
                      type="button"
                      onClick={() => {
                        setNewUserPermissions(prev => 
                          prev.includes(perm.id) 
                            ? prev.filter(p => p !== perm.id) 
                            : [...prev, perm.id]
                        );
                      }}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-xl border transition-all text-left",
                        isGranted 
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800" 
                          : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all",
                        isGranted 
                          ? "bg-emerald-600 border-emerald-600 text-white" 
                          : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-transparent"
                      )}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold">{perm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                <span>
                  <strong>Nota:</strong> Devido às políticas de segurança, o novo membro deve realizar o cadastro inicial na tela de login usando este e-mail. Após o cadastro, você poderá autorizar o acesso e definir as permissões.
                </span>
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsAddingUser(false)}
                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : 'Preparar Convite'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {allUsers.map((user) => (
          <div 
            key={user.uid} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-6 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                    {user.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-bold">Tel:</span> {user.phone}
                      </div>
                    )}
                    {user.address && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-bold">End:</span> {user.address}
                      </div>
                    )}
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
                        <button 
                          onClick={() => setEditingPermissions(editingPermissions === user.uid ? null : user.uid)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <Lock size={16} className="text-emerald-500" />
                          Editar Permissões
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

            {/* Permissions Section */}
            {(editingPermissions === user.uid || user.role === 'member') && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Lock size={16} className="text-emerald-600" />
                    Permissões de Acesso
                  </h4>
                  {user.role === 'admin' && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase">Acesso Total</span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isGranted = user.role === 'admin' || (user.permissions || []).includes(perm.id);
                    return (
                      <button
                        key={perm.id}
                        disabled={user.role === 'admin'}
                        onClick={() => togglePermission(user.uid, user.permissions, perm.id)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl border transition-all text-left group",
                          isGranted 
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800" 
                            : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800 opacity-60 hover:opacity-100",
                          user.role === 'admin' && "cursor-default"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all",
                          isGranted 
                            ? "bg-emerald-600 border-emerald-600 text-white" 
                            : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-transparent"
                        )}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <div>
                          <p className={cn(
                            "text-xs font-bold",
                            isGranted ? "text-emerald-900 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
                          )}>
                            {perm.label}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-tight mt-0.5">
                            {perm.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
