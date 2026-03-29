import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  ChevronRight,
  Plus,
  MessageCircle,
  X,
  Video,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  DollarSign,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Appointment } from '../types';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function Dashboard() {
  const { patients, appointments, addAppointment, addPatient, updateAppointment, records, settings, user, expenses, hasPermission } = useStorage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);

  const canViewFinance = hasPermission('view_finance');

  const today = new Date();
  const todayAppointments = appointments.filter(app => 
    format(new Date(app.dateTime), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );

  const totalFaturadoMes = appointments
    .filter(app => {
      const d = new Date(app.dateTime);
      return (app.status === 'completed' || app.isPaid || (app.status !== 'cancelled' && d < today)) && 
             d.getMonth() === today.getMonth() && 
             d.getFullYear() === today.getFullYear();
    })
    .reduce((acc, app) => acc + (app.price || 0), 0);

  const totalSessoes = appointments.length;
  const sessoesConfirmadas = appointments.filter(app => app.isConfirmed).length;
  const taxaPresenca = totalSessoes > 0 ? Math.round((sessoesConfirmadas / totalSessoes) * 100) : 0;
  
  const ticketMedio = records.length > 0 ? Math.round(records.reduce((acc, r) => acc + (r.sessionValue || 0), 0) / records.length) : 0;

  const upcomingPendingConfirmation = appointments.filter(app => {
    const appDate = new Date(app.dateTime);
    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + (48 * 60 * 60 * 1000));
    return appDate > now && appDate <= fortyEightHoursFromNow && !app.isConfirmed && app.status !== 'cancelled';
  });

  const pendingPayments = appointments.filter(app => {
    const appDate = new Date(app.dateTime);
    const now = new Date();
    return appDate < now && !app.isPaid && app.status !== 'cancelled';
  });

  const sendWhatsApp = (app: Appointment) => {
    const patient = patients.find(p => p.id === app.patientId);
    if (!patient) return;

    const message = `Olá, ${patient.name}, sua sessão está confirmada para hoje às ${format(new Date(app.dateTime), "HH:mm")}. Caso precise remarcar, me avise.`;
    const phone = patient.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');

    if (!app.isConfirmed) {
      toast('Mensagem enviada! Deseja marcar esta consulta como confirmada?', {
        action: {
          label: 'Confirmar',
          onClick: () => toggleConfirmation(app.id)
        },
      });
    }
  };

  const toggleConfirmation = async (id: string) => {
    const app = appointments.find(a => a.id === id);
    if (!app) return;
    await updateAppointment(id, { isConfirmed: !app.isConfirmed });
    toast.success('Consulta confirmada com sucesso');
  };

  const handleAddAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let patientId = formData.get('patientId') as string;
    let patient = patients.find(p => p.id === patientId);
    
    if (isNewPatient) {
      const newPatientName = formData.get('newPatientName') as string;
      const newPatientPhone = formData.get('newPatientPhone') as string;
      const newPatientBirthDate = formData.get('newPatientBirthDate') as string;
      
      const newPatient = {
        id: Math.random().toString(36).substr(2, 9),
        name: newPatientName,
        phone: newPatientPhone,
        birthDate: newPatientBirthDate,
        email: '',
        gender: 'Prefiro não dizer',
        notes: '',
        initialHistory: '',
        defaultSessionValue: parseFloat(formData.get('price') as string),
        totalPaid: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user!.uid
      };
      
      await addPatient(newPatient);
      patient = newPatient;
      patientId = newPatient.id;
    }

    if (!patient) return;

    const [h, m] = (formData.get('time') as string).split(':');
    const dateStr = formData.get('date') as string;
    const baseDate = new Date(dateStr + 'T' + h + ':' + m + ':00');

    const recurrence = formData.get('recurrence') as 'none' | 'weekly' | 'biweekly';
    const seriesId = recurrence !== 'none' ? Math.random().toString(36).substr(2, 9) : undefined;
    const price = parseFloat(formData.get('price') as string);
    const type = formData.get('type') as 'online' | 'presencial';

    const occurrences = recurrence === 'none' ? 1 : 12;
    const createdAppointments: Appointment[] = [];

    for (let i = 0; i < occurrences; i++) {
      const appDate = new Date(baseDate);
      if (recurrence === 'weekly') {
        appDate.setDate(baseDate.getDate() + (i * 7));
      } else if (recurrence === 'biweekly') {
        appDate.setDate(baseDate.getDate() + (i * 14));
      }

      const newApp: Appointment = {
        id: Math.random().toString(36).substr(2, 9),
        patientId: patient.id,
        patientName: patient.name,
        dateTime: appDate.toISOString(),
        type,
        status: 'scheduled',
        isConfirmed: false,
        isPaid: false,
        price,
        userId: user!.uid,
        recurrence,
        seriesId
      };
      
      await addAppointment(newApp, i > 0);
      createdAppointments.push(newApp);
    }

    setIsModalOpen(false);
    
    // Automatic notification
    const firstApp = createdAppointments[0];
    const message = `Olá, ${patient.name}, sua sessão foi agendada para ${format(new Date(firstApp.dateTime), "dd/MM 'às' HH:mm")}.`;
    const phone = patient.phone.replace(/\D/g, '');
    
    toast.success('Consulta agendada! Enviando notificação...');
    setTimeout(() => {
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }, 1000);
  };

  const stats = [
    { label: 'Total de Pacientes', value: patients.length, icon: Users, color: 'text-slate-900', bg: 'bg-slate-50 dark:bg-slate-800/50' },
    { label: 'Faturamento Mensal', value: `R$ ${totalFaturadoMes.toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', hidden: !canViewFinance },
    { label: 'Taxa de Presença', value: `${taxaPresenca}%`, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Ticket Médio', value: `R$ ${ticketMedio}`, icon: Clock, color: 'text-slate-900', bg: 'bg-slate-50 dark:bg-slate-800/50', hidden: !canViewFinance },
  ].filter(s => !s.hidden);

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const chartData = daysOfWeek.map(day => {
    const dayAppointments = appointments.filter(app => 
      isSameDay(new Date(app.dateTime), day) && (app.status === 'completed' || app.isPaid)
    );
    return {
      name: format(day, 'EEE', { locale: ptBR }),
      valor: dayAppointments.reduce((acc, app) => acc + (app.price || 0), 0)
    };
  });

  const recentTransactions = [
    ...appointments
      .filter(app => app.isPaid)
      .map(app => ({
        id: app.id,
        title: `Sessão: ${app.patientName}`,
        date: format(new Date(app.dateTime), 'dd MMM yyyy', { locale: ptBR }),
        amount: app.price || 0,
        type: 'income' as const,
        timestamp: new Date(app.dateTime).getTime()
      })),
    ...expenses.map(e => ({
      id: e.id,
      title: e.description,
      date: format(new Date(e.date), 'dd MMM yyyy', { locale: ptBR }),
      amount: e.value,
      type: 'expense' as const,
      timestamp: new Date(e.date).getTime()
    }))
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bem-vindo, {settings.professionalName}</h1>
          <p className="text-slate-500 dark:text-slate-400">Aqui está o resumo do seu consultório hoje.</p>
        </div>
        {hasPermission('view_agenda') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
          >
            <Plus size={20} />
            Nova Consulta
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      {(upcomingPendingConfirmation.length > 0 || (pendingPayments.length > 0 && canViewFinance)) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {upcomingPendingConfirmation.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl flex gap-4 items-start">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <Bell size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">Confirmações Pendentes</h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Você tem {upcomingPendingConfirmation.length} {upcomingPendingConfirmation.length === 1 ? 'consulta' : 'consultas'} nas próximas 48h aguardando confirmação.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {upcomingPendingConfirmation.slice(0, 3).map(app => (
                    <button 
                      key={app.id}
                      onClick={() => sendWhatsApp(app)}
                      className="text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors truncate max-w-[150px]"
                    >
                      {app.patientName.split(' ')[0]} ({format(new Date(app.dateTime), 'HH:mm')})
                    </button>
                  ))}
                  {upcomingPendingConfirmation.length > 3 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 self-center font-medium">+{upcomingPendingConfirmation.length - 3} mais</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {pendingPayments.length > 0 && canViewFinance && (
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 p-4 rounded-2xl flex gap-4 items-start">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 shrink-0">
                <DollarSign size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-100">Pagamentos Pendentes</h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                  Existem {pendingPayments.length} {pendingPayments.length === 1 ? 'sessão' : 'sessões'} realizadas que ainda não foram marcadas como pagas.
                </p>
                <Link 
                  to="/finance"
                  className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                >
                  Ver no Financeiro
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {canViewFinance && (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-white">Desempenho Semanal</h3>
              <select className="text-sm border-none bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 focus:ring-0 dark:text-slate-300">
                <option>Esta semana</option>
                <option>Mês passado</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className={cn("bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm", !canViewFinance && "lg:col-span-3")}>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Próximas Consultas</h3>
          <div className="space-y-4">
            {todayAppointments.length > 0 ? todayAppointments.map((app, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold">
                  {app.patientName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{app.patientName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(app.dateTime), 'HH:mm')} • {app.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      sendWhatsApp(app);
                    }}
                    className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    title="Confirmar via WhatsApp"
                  >
                    <MessageCircle size={18} />
                  </button>
                  <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400" />
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar size={24} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma consulta para hoje.</p>
              </div>
            )}
            {hasPermission('view_agenda') && (
              <Link to="/agenda" className="block w-full py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors mt-2 text-center">
                Ver agenda completa
              </Link>
            )}
          </div>
        </div>
      </div>

      {canViewFinance && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Últimos Lançamentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTransactions.length > 0 ? recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group border border-slate-100 dark:border-slate-800">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  transaction.type === 'income' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                )}>
                  {transaction.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {transaction.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                    {transaction.type === 'income' ? 'Recebido' : 'Pago'}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm col-span-full">Nenhum lançamento recente.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal Agendamento */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Agendar Sessão</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddAppointment} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Paciente</label>
                  <button 
                    type="button"
                    onClick={() => setIsNewPatient(!isNewPatient)}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    {isNewPatient ? 'Selecionar Existente' : '+ Novo Paciente'}
                  </button>
                </div>

                {isNewPatient ? (
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase">Nome do Paciente</label>
                      <input name="newPatientName" required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder="Nome completo" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase">WhatsApp</label>
                        <input name="newPatientPhone" required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder="(00) 00000-0000" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase">Nascimento</label>
                        <input name="newPatientBirthDate" type="text" placeholder="DD/MM/AAAA" className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <select name="patientId" required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white">
                      <option value="">Selecione um paciente</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data</label>
                  <input 
                    name="date" 
                    type="date" 
                    defaultValue={format(new Date(), 'yyyy-MM-dd')} 
                    required 
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Horário</label>
                    <input 
                      name="time" 
                      type="time" 
                      defaultValue="09:00" 
                      required 
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor (R$)</label>
                    <input name="price" type="number" defaultValue={settings.defaultSessionValue || "150"} required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Atendimento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center justify-center gap-2 p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 has-[:checked]:bg-emerald-50 dark:has-[:checked]:bg-emerald-900/20 has-[:checked]:border-emerald-500 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-emerald-400 transition-all">
                      <input type="radio" name="type" value="online" defaultChecked className="hidden" />
                      <Video size={18} />
                      <span className="text-sm font-medium">Online</span>
                    </label>
                    <label className="flex items-center justify-center gap-2 p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 has-[:checked]:bg-emerald-50 dark:has-[:checked]:bg-emerald-900/20 has-[:checked]:border-emerald-500 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-emerald-400 transition-all">
                      <input type="radio" name="type" value="presencial" className="hidden" />
                      <MapPin size={18} />
                      <span className="text-sm font-medium">Presencial</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Recorrência</label>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex flex-col items-center justify-center gap-1 p-2 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 has-[:checked]:bg-emerald-50 dark:has-[:checked]:bg-emerald-900/20 has-[:checked]:border-emerald-500 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-emerald-400 transition-all">
                      <input type="radio" name="recurrence" value="none" defaultChecked className="hidden" />
                      <span className="text-xs font-medium">Única</span>
                    </label>
                    <label className="flex flex-col items-center justify-center gap-1 p-2 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 has-[:checked]:bg-emerald-50 dark:has-[:checked]:bg-emerald-900/20 has-[:checked]:border-emerald-500 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-emerald-400 transition-all">
                      <input type="radio" name="recurrence" value="weekly" className="hidden" />
                      <span className="text-xs font-medium">Semanal</span>
                    </label>
                    <label className="flex flex-col items-center justify-center gap-1 p-2 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 has-[:checked]:bg-emerald-50 dark:has-[:checked]:bg-emerald-900/20 has-[:checked]:border-emerald-500 has-[:checked]:text-emerald-700 dark:has-[:checked]:text-emerald-400 transition-all">
                      <input type="radio" name="recurrence" value="biweekly" className="hidden" />
                      <span className="text-xs font-medium">Quinzenal</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
