import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  UserPlus, 
  Send, 
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  User,
  MoreVertical,
  FileText,
  MapPin,
  Stethoscope
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import type { PublicRegistration as PublicRegistrationType } from '../types';
import { toast } from 'sonner';

export default function PublicRegistration() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const { addPublicRegistration, settings } = useStorage();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ref) {
      toast.error('Link de registro inválido. Solicite um novo link ao seu profissional.');
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const newReg: PublicRegistrationType = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      birthDate: formData.get('birthDate') as string,
      gender: formData.get('gender') as string,
      notes: formData.get('notes') as string,
      cpf: formData.get('cpf') as string,
      address: formData.get('address') as string,
      medications: formData.get('medications') as string,
      status: 'pending',
      createdAt: new Date().toISOString(),
      userId: ref
    };

    try {
      await addPublicRegistration(newReg);
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-xl border border-slate-100 dark:border-slate-800"
        >
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Solicitação Recebida!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Seus dados foram enviados com sucesso para o profissional <strong>{settings.professionalName}</strong>. 
            Em breve você receberá um retorno para agendamento.
          </p>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-400">Poderá fechar esta janela agora.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!ref) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Link Inválido</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Este link de pré-cadastro expirou ou é inválido. Por favor, entre em contato diretamente com o profissional.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
          <div className="bg-emerald-600 px-8 py-10 text-white text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-black/5 pointer-events-none" />
             <div className="relative z-10 space-y-2">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 text-2xl font-bold">
                  Ψ
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Pré-Cadastro Clínico</h1>
                <p className="text-emerald-50 text-opacity-80 max-w-sm mx-auto">
                  Por favor, preencha os dados abaixo para darmos início ao seu processo de atendimento com {settings.professionalName}.
                </p>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-full">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="name" 
                    type="text" 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white" 
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">WhatsApp / Celular</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="phone" 
                    type="tel" 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white" 
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="email" 
                    type="email" 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white" 
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Data de Nascimento</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="birthDate" 
                    type="date" 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gênero</label>
                <div className="relative">
                  <MoreVertical className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    name="gender" 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white appearance-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Não-binário">Não-binário</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">CPF (Opcional)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="cpf" 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white" 
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Endereço Completo</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="address" 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white" 
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-full">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Medicações em uso (se houver)</label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-3 text-slate-400" size={18} />
                  <textarea 
                    name="medications" 
                    rows={2}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white resize-none" 
                    placeholder="Informe se utiliza alguma medicação contínua..."
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-full">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Motivo da Procura / Observações</label>
                <textarea 
                  name="notes" 
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white resize-none" 
                  placeholder="Conte-nos brevemente o que o(a) motiva a buscar atendimento psicológico neste momento..."
                />
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={20} />
                    Enviar Solicitação de Cadastro
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center text-xs text-slate-400">
              Ao enviar, seus dados serão processados de forma segura e ética, 
              respeitando o sigilo profissional.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
