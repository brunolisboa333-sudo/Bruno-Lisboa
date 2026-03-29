import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Video,
  MoreHorizontal,
  X,
  MessageCircle,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Repeat
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Appointment } from '../types';

export default function Agenda() {
  const { appointments, patients, addAppointment, updateAppointment, addPatient, updatePatient, deleteAppointment, user } = useStorage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date, hour: number } | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i));
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = addDays(calendarStart, 41); // 6 weeks
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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

    const occurrences = recurrence === 'weekly' ? 12 : recurrence === 'biweekly' ? 6 : 1;

    for (let i = 0; i < occurrences; i++) {
      const appDate = new Date(baseDate);
      if (recurrence === 'weekly') {
        appDate.setDate(baseDate.getDate() + (i * 7));
      } else if (recurrence === 'biweekly') {
        appDate.setDate(baseDate.getDate() + (i * 14));
      }

      const newAppointment: Appointment = {
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
      
      await addAppointment(newAppointment, i > 0);
    }

    setIsModalOpen(false);
    setSelectedSlot(null);

    // Automatic notification
    const message = `Olá, ${patient.name}, sua sessão foi agendada para ${format(baseDate, "dd/MM 'às' HH:mm")}.`;
    const phone = patient.phone.replace(/\D/g, '');
    
    toast.success(recurrence === 'none' ? 'Consulta agendada! Enviando notificação...' : `${occurrences} sessões agendadas! Enviando notificação...`);
    
    setTimeout(() => {
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }, 1000);
  };

  const handleDeleteAppointment = async (mode: 'single' | 'series') => {
    if (!appointmentToDelete) return;

    try {
      if (mode === 'single') {
        await deleteAppointment(appointmentToDelete.id);
      } else {
        const seriesAppointments = appointments.filter(app => app.seriesId === appointmentToDelete.seriesId);
        for (const app of seriesAppointments) {
          await deleteAppointment(app.id);
        }
        toast.success('Série de sessões excluída com sucesso');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }

    setIsDeleteModalOpen(false);
    setAppointmentToDelete(null);
  };

  const sendWhatsApp = (app: Appointment) => {
    const patient = patients.find(p => p.id === app.patientId);
    if (!patient) return;

    const message = `Olá, ${patient.name}, sua sessão está confirmada para ${format(new Date(app.dateTime), "dd/MM 'às' HH:mm")}. Caso precise remarcar, me avise.`;
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
  };

  const togglePayment = async (id: string) => {
    const app = appointments.find(a => a.id === id);
    if (!app) return;
    
    const newIsPaid = !app.isPaid;
    const updateData: any = { isPaid: newIsPaid };
    
    if (newIsPaid) {
      updateData.status = 'completed';
    }
    
    await updateAppointment(id, updateData);

    // Update patient totalPaid
    const patient = patients.find(p => p.id === app.patientId);
    if (patient) {
      const adjustment = newIsPaid ? app.price : -app.price;
      await updatePatient(patient.id, { totalPaid: (patient.totalPaid || 0) + adjustment });
    }
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'day') {
      setCurrentDate(direction === 'prev' ? addDays(currentDate, -1) : addDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agenda</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie seus horários e sessões.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 flex">
            <button 
              onClick={() => setView('day')}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-all", view === 'day' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}
            >
              Dia
            </button>
            <button 
              onClick={() => setView('week')}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-all", view === 'week' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}
            >
              Semana
            </button>
            <button 
              onClick={() => setView('month')}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-all", view === 'month' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}
            >
              Mês
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
          >
            <Plus size={20} />
            Agendar
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('prev')} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Hoje</button>
              <button onClick={() => navigate('next')} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {view === 'month' ? (
            <div className="grid grid-cols-7 h-full min-h-[600px]">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="p-4 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{day}</span>
                </div>
              ))}
              {calendarDays.map((day, i) => {
                const dayAppointments = appointments.filter(app => isSameDay(new Date(app.dateTime), day));
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "p-2 border-b border-r border-slate-100 dark:border-slate-800 min-h-[100px] transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50 group relative",
                      !isSameMonth(day, currentDate) && "bg-slate-50/30 dark:bg-slate-800/10 text-slate-400 dark:text-slate-600",
                      isSameDay(day, new Date()) && "bg-emerald-50/30 dark:bg-emerald-900/10"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full",
                        isSameDay(day, new Date()) ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {dayAppointments.length === 0 && (
                        <button 
                          onClick={() => {
                            setSelectedSlot({ date: day, hour: 9 });
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map(app => (
                        <div 
                          key={app.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(app);
                            setIsDetailsModalOpen(true);
                          }}
                          className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-medium truncate border-l-2 flex items-center justify-between group/app cursor-pointer",
                            app.isConfirmed 
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-500" 
                              : "bg-slate-900 text-white border-slate-900"
                          )}
                        >
                          <span className="truncate">{format(new Date(app.dateTime), 'HH:mm')} {app.patientName}</span>
                          <div className="flex items-center gap-1">
                            {!app.isConfirmed && <MessageCircle size={8} className="flex-shrink-0" />}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setAppointmentToDelete(app);
                                setIsDeleteModalOpen(true);
                              }}
                              className="opacity-0 group-hover/app:opacity-100 p-0.5 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded transition-opacity"
                            >
                              <Trash2 size={8} className="text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pl-1">
                          + {dayAppointments.length - 3} sessões
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="min-w-[800px]">
              {/* Header */}
              <div className={cn(
                "grid border-b border-slate-100 dark:border-slate-800",
                view === 'day' ? "grid-cols-[80px_1fr]" : "grid-cols-[80px_repeat(7,1fr)]"
              )}>
                <div className="p-4"></div>
                {(view === 'day' ? [currentDate] : weekDays).map((day, i) => (
                  <div key={i} className={cn(
                    "p-4 text-center border-l border-slate-100 dark:border-slate-800",
                    isSameDay(day, new Date()) && "bg-emerald-50/50 dark:bg-emerald-900/10"
                  )}>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{format(day, 'EEE', { locale: ptBR })}</p>
                    <p className={cn(
                      "text-lg font-bold mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full",
                      isSameDay(day, new Date()) ? "bg-emerald-600 text-white" : "text-slate-900 dark:text-white"
                    )}>
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Body */}
              <div className="relative">
                {hours.map((hour) => (
                  <div key={hour} className={cn(
                    "grid border-b border-slate-50 dark:border-slate-800/50 h-20 group",
                    view === 'day' ? "grid-cols-[80px_1fr]" : "grid-cols-[80px_repeat(7,1fr)]"
                  )}>
                    <div className="p-2 text-right">
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{hour}:00</span>
                    </div>
                    {(view === 'day' ? [currentDate] : weekDays).map((day, i) => {
                      const dayAppointments = appointments.filter(app => {
                        const appDate = new Date(app.dateTime);
                        return isSameDay(appDate, day) && appDate.getHours() === hour;
                      });

                      return (
                        <div key={i} className="border-l border-slate-100 dark:border-slate-800 p-1 relative group/slot hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          {dayAppointments.map((app) => (
                            <div 
                              key={app.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(app);
                                setIsDetailsModalOpen(true);
                              }}
                              className={cn(
                                "absolute inset-x-1 top-1 bottom-1 rounded-lg p-2 text-xs shadow-sm border-l-4 overflow-hidden cursor-pointer hover:brightness-95 transition-all",
                                app.isConfirmed 
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400" 
                                  : "bg-slate-900 border-slate-900 text-white"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold truncate">{app.patientName}</span>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleConfirmation(app.id);
                                    }}
                                    className={cn(
                                      "p-1.5 rounded-md transition-colors",
                                      app.isConfirmed ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40" : "text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 bg-white/20 dark:bg-slate-800/20"
                                    )}
                                    title={app.isConfirmed ? "Confirmado" : "Marcar como confirmado"}
                                  >
                                    <CheckCircle2 size={16} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendWhatsApp(app);
                                    }}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 rounded-md transition-colors"
                                    title="Confirmar via WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAppointmentToDelete(app);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                    title="Excluir sessão"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  {app.type === 'online' ? <Video size={10} /> : <MapPin size={10} />}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-70">
                                <Clock size={10} />
                                <span>{format(new Date(app.dateTime), 'HH:mm')}</span>
                              </div>
                            </div>
                          ))}
                          {dayAppointments.length === 0 && (
                            <button 
                              onClick={() => {
                                setSelectedSlot({ date: day, hour });
                                setIsModalOpen(true);
                              }}
                              className="absolute inset-0 opacity-0 group-hover/slot:opacity-100 flex items-center justify-center bg-emerald-50/20 dark:bg-emerald-900/10 text-emerald-600 transition-opacity"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
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
                    defaultValue={selectedSlot ? format(selectedSlot.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')} 
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
                      defaultValue={selectedSlot ? `${selectedSlot.hour.toString().padStart(2, '0')}:00` : "09:00"} 
                      required 
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor (R$)</label>
                    <input name="price" type="number" defaultValue="150" required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
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

      {/* Modal Detalhes da Consulta */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedAppointment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Detalhes da Sessão</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Informações completas do agendamento</p>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Paciente */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                    {selectedAppointment.patientName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{selectedAppointment.patientName}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Paciente</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Clock size={16} />
                      <span className="text-xs font-medium uppercase tracking-wider">Data e Hora</span>
                    </div>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {format(new Date(selectedAppointment.dateTime), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                      {format(new Date(selectedAppointment.dateTime), "HH:mm")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Repeat size={16} />
                      <span className="text-xs font-medium uppercase tracking-wider">Recorrência</span>
                    </div>
                    <p className="text-slate-900 dark:text-white font-medium capitalize">
                      {selectedAppointment.recurrence === 'none' ? 'Única' : 
                       selectedAppointment.recurrence === 'weekly' ? 'Semanal' : 'Quinzenal'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      {selectedAppointment.type === 'online' ? <Video size={16} /> : <MapPin size={16} />}
                      <span className="text-xs font-medium uppercase tracking-wider">Tipo</span>
                    </div>
                    <p className="text-slate-900 dark:text-white font-medium capitalize">
                      {selectedAppointment.type === 'online' ? 'Atendimento Online' : 'Atendimento Presencial'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <span className="text-xs font-bold">R$</span>
                      <span className="text-xs font-medium uppercase tracking-wider">Valor</span>
                    </div>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAppointment.price)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status do Pagamento</span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      selectedAppointment.isPaid 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {selectedAppointment.isPaid ? 'Pago' : 'Pendente'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status da Confirmação</span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      selectedAppointment.isConfirmed 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-slate-900 text-white"
                    )}>
                      {selectedAppointment.isConfirmed ? 'Confirmada' : 'Pendente'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button 
                      onClick={() => {
                        togglePayment(selectedAppointment.id);
                        setSelectedAppointment(prev => prev ? { ...prev, isPaid: !prev.isPaid } : null);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all",
                        selectedAppointment.isPaid
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none"
                      )}
                    >
                      <CheckCircle2 size={18} />
                      {selectedAppointment.isPaid ? 'Estornar Pagamento' : 'Pagamento Feito'}
                    </button>
                    <button 
                      onClick={() => sendWhatsApp(selectedAppointment)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 transition-all dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                    >
                      <MessageCircle size={18} />
                      WhatsApp
                    </button>
                  </div>

                  <div className="grid grid-cols-1">
                    <button 
                      onClick={() => {
                        toggleConfirmation(selectedAppointment.id);
                        setSelectedAppointment(prev => prev ? { ...prev, isConfirmed: !prev.isConfirmed } : null);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all",
                        selectedAppointment.isConfirmed
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                          : "bg-slate-900 text-white hover:opacity-90"
                      )}
                    >
                      <CheckCircle2 size={18} />
                      {selectedAppointment.isConfirmed ? 'Desconfirmar Presença' : 'Confirmar Presença'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <button 
                  onClick={() => {
                    setAppointmentToDelete(selectedAppointment);
                    setIsDeleteModalOpen(true);
                    setIsDetailsModalOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-colors"
                >
                  <Trash2 size={18} />
                  Excluir
                </button>
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-6 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Excluir */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Excluir Consulta</h3>
                <button onClick={() => setIsDeleteModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600 dark:text-slate-400">Como você deseja excluir esta consulta?</p>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleDeleteAppointment('single')}
                    className="w-full px-4 py-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Somente esta sessão</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Exclui apenas o horário selecionado</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-400" />
                  </button>
                  {appointmentToDelete?.seriesId && (
                    <button 
                      onClick={() => handleDeleteAppointment('series')}
                      className="w-full px-4 py-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-900/50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-bold text-red-600 dark:text-red-400">Toda a série</p>
                        <p className="text-xs text-red-400 dark:text-red-500">Exclui todas as sessões recorrentes</p>
                      </div>
                      <ChevronRight size={18} className="text-red-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
