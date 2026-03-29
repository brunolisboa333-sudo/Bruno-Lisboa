import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon,
  User,
  Building2,
  DollarSign,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { toast } from 'sonner';

export default function Settings() {
  const { settings, saveSettings } = useStorage();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    saveSettings({
      clinicName: formData.get('clinicName') as string,
      professionalName: formData.get('professionalName') as string,
      professionalInitials: formData.get('professionalInitials') as string,
      specialty: formData.get('specialty') as string,
      defaultSessionValue: parseFloat(formData.get('defaultSessionValue') as string) || 150,
      whatsapp: formData.get('whatsapp') as string,
      email: formData.get('email') as string,
      bio: formData.get('bio') as string,
    });
    
    toast.success('Configurações salvas com sucesso');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400">Personalize seu consultório e preferências.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Building2 size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Informações do Consultório</h3>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Consultório / App</label>
              <input 
                name="clinicName" 
                defaultValue={settings.clinicName} 
                required 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Especialidade</label>
              <input 
                name="specialty" 
                defaultValue={settings.specialty} 
                required 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <User size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Perfil Profissional</h3>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Profissional</label>
              <input 
                name="professionalName" 
                defaultValue={settings.professionalName} 
                required 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Iniciais (para o Avatar)</label>
              <input 
                name="professionalInitials" 
                defaultValue={settings.professionalInitials} 
                maxLength={2}
                required 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp de Contato</label>
              <input 
                name="whatsapp" 
                defaultValue={settings.whatsapp} 
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail de Contato</label>
              <input 
                name="email" 
                type="email"
                defaultValue={settings.email} 
                placeholder="contato@exemplo.com"
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
              />
            </div>
            <div className="col-span-full space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Biografia Profissional (para o Site)</label>
              <textarea 
                name="bio" 
                defaultValue={settings.bio} 
                rows={4}
                placeholder="Conte um pouco sobre sua trajetória e abordagem..."
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white resize-none" 
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                <DollarSign size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Padrões Financeiros</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="max-w-xs space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor Padrão da Sessão (R$)</label>
              <input 
                name="defaultSessionValue" 
                type="number"
                step="0.01"
                defaultValue={settings.defaultSessionValue} 
                required 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95"
          >
            <Save size={20} />
            Salvar Configurações
          </button>
        </div>
      </form>
    </motion.div>
  );
}
