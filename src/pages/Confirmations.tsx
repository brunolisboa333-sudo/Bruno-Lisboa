import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  CheckCircle2, 
  Clock, 
  Calendar,
  User,
  ExternalLink,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { format, isAfter, startOfToday, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Appointment } from '../types';

export default function Confirmations() {
  const { appointments, patients, updateAppointment, updatePatient } = useStorage();
  const [activeTab, setActiveTab] = useState<'confirm' | 'pay'>('confirm');

  const pendingConfirmations = appointments
    .filter(app => !app.isConfirmed && isAfter(new Date(app.dateTime), startOfToday()))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const pendingPayments = appointments
    .filter(app => !app.isPaid && (app.status === 'completed' || app.status === 'pending_payment' || isBefore(new Date(app.dateTime), new Date())))
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const sendWhatsApp = (app: Appointment, type: 'confirm' | 'pay') => {
    const patient = patients.find(p => p.id === app.patientId);
    if (!patient) return;

    const message = type === 'confirm' 
      ? `Olá, ${patient.name}, sua sessão está confirmada para ${format(new Date(app.dateTime), "dd/MM 'às' HH:mm")}. Caso precise remarcar, me avise.`
      : `Olá, ${patient.name}, notei que o pagamento da nossa última sessão (${format(new Date(app.dateTime), "dd/MM")}) ainda consta como pendente. Poderia verificar, por favor?`;
    
    const phone = patient.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');

    if (type === 'confirm') {
      toast('Mensagem enviada! Deseja marcar esta consulta como confirmada?', {
        action: {
          label: 'Confirmar',
          onClick: () => toggleConfirmation(app.id)
        },
      });
    } else {
      toast.success('Lembrete de pagamento enviado!');
    }
  };

  const toggleConfirmation = async (id: string) => {
    const app = appointments.find(a => a.id === id);
    if (!app) return;
    await updateAppointment(id, { isConfirmed: !app.isConfirmed });
  };

  const markAsPaid = async (app: Appointment) => {
    await updateAppointment(app.id, { status: 'completed', isPaid: true });
    
    // Update patient totalPaid
    const patient = patients.find(p => p.id === app.patientId);
    if (patient) {
      await updatePatient(patient.id, { totalPaid: (patient.totalPaid || 0) + app.price });
    }
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
          <h1 className="text-2xl font-bold text-slate-900">Pendências</h1>
          <p className="text-slate-500">Gerencie confirmações de presença e pagamentos em atraso.</p>
        </div>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('confirm')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
            activeTab === 'confirm' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Confirmações ({pendingConfirmations.length})
        </button>
        <button 
          onClick={() => setActiveTab('pay')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
            activeTab === 'pay' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Pagamentos ({pendingPayments.length})
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeTab === 'confirm' ? (
          pendingConfirmations.length > 0 ? (
            pendingConfirmations.map((app) => (
              <div 
                key={app.id} 
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{app.patientName}</h3>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar size={14} className="text-emerald-500" />
                        {format(new Date(app.dateTime), "dd 'de' MMMM", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Clock size={14} className="text-emerald-500" />
                        {format(new Date(app.dateTime), "HH:mm")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => sendWhatsApp(app, 'confirm')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </button>
                  <button 
                    onClick={() => toggleConfirmation(app.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
                  >
                    <CheckCircle2 size={18} />
                    Confirmar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tudo em dia!</h3>
              <p className="text-slate-500 mt-1">Não há consultas pendentes de confirmação.</p>
            </div>
          )
        ) : (
          pendingPayments.length > 0 ? (
            pendingPayments.map((app) => (
              <div 
                key={app.id} 
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{app.patientName}</h3>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar size={14} className="text-amber-500" />
                        Sessão de {format(new Date(app.dateTime), "dd/MM")}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-amber-600">
                        R$ {app.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => sendWhatsApp(app, 'pay')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-medium hover:bg-amber-100 transition-colors"
                  >
                    <MessageCircle size={18} />
                    Lembrar WhatsApp
                  </button>
                  <button 
                    onClick={() => markAsPaid(app)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors shadow-sm shadow-amber-200"
                  >
                    <CheckCircle2 size={18} />
                    Baixar Pagamento
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign size={32} className="text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sem pendências!</h3>
              <p className="text-slate-500 mt-1">Todos os pagamentos registrados estão em dia.</p>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
