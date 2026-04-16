import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Check, 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  FileText,
  Search,
  Filter,
  Link as LinkIcon,
  Copy
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { PublicRegistration, Patient } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function RegistrationRequests() {
  const { registrations, updateRegistrationStatus, deleteRegistration, addPatient, user } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const filtered = registrations
    .filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleApprove = async (reg: PublicRegistration) => {
    const newPatient: Patient = {
      id: Math.random().toString(36).substr(2, 9),
      name: reg.name,
      phone: reg.phone,
      email: reg.email,
      birthDate: reg.birthDate,
      gender: reg.gender,
      notes: reg.notes || '',
      initialHistory: '',
      defaultSessionValue: 150,
      totalPaid: 0,
      cpf: reg.cpf,
      address: reg.address,
      medications: reg.medications,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: reg.userId
    };

    await addPatient(newPatient);
    await updateRegistrationStatus(reg.id, 'approved');
    toast.success('Paciente aprovado e cadastrado com sucesso!');
  };

  const copyRegistrationLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/public-registration?ref=${user?.uid}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de pré-cadastro copiado!');
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Solicitações de Cadastro</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie pré-cadastros realizados via link público.</p>
        </div>
        <button
          onClick={copyRegistrationLink}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <LinkIcon size={18} />
          Copiar Link de Cadastro
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.length > 0 ? filtered.map((reg) => (
            <div key={reg.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xl">
                      {reg.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white uppercase">{reg.name}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className={cn(
                          "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                          reg.status === 'pending' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                          reg.status === 'approved' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                          "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        )}>
                          {reg.status === 'pending' ? 'Pendente' : reg.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(reg.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail size={16} className="text-emerald-500" />
                      {reg.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Phone size={16} className="text-emerald-500" />
                      {reg.phone}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar size={16} className="text-emerald-500" />
                      Nasc: {reg.birthDate}
                    </div>
                    {reg.cpf && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <FileText size={16} className="text-emerald-500" />
                        CPF: {reg.cpf}
                      </div>
                    )}
                    {reg.address && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MapPin size={16} className="text-emerald-500" />
                        {reg.address}
                      </div>
                    )}
                  </div>

                  {reg.notes && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Motivo da Procura</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{reg.notes}</p>
                    </div>
                  )}

                  {reg.medications && (
                    <div className="text-sm">
                      <span className="font-bold text-blue-600 dark:text-blue-400">💊 Medicação em uso:</span> {reg.medications}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {reg.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(reg)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <Check size={18} />
                        Aprovar
                      </button>
                      <button
                        onClick={() => updateRegistrationStatus(reg.id, 'rejected')}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 text-red-600 border border-red-100 dark:border-red-900/30 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <X size={18} />
                        Rejeitar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm('Deseja excluir este registro do histórico?')) {
                          deleteRegistration(reg.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 transition-colors p-2"
                    >
                      Excluir do Histórico
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhuma solicitação encontrada</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Divulgue seu link de pré-cadastro para receber novas solicitações aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
