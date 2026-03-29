import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  X,
  Clock,
  Wallet,
  Trash2
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { 
  format, 
  isSameMonth, 
  isSameYear, 
  isAfter, 
  subDays, 
  startOfMonth, 
  startOfYear, 
  subMonths 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { cn } from '../lib/utils';
import { Expense } from '../types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Finance() {
  const { appointments, records, patients, expenses, addExpense, updateAppointment, deleteExpense, user, settings } = useStorage();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly' | 'custom' | 'all'>('monthly');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentFilter, setPaymentFilter] = useState<'pending' | 'paid'>('pending');

  const now = new Date();

  const handleTogglePayment = async (id: string) => {
    const app = appointments.find(a => a.id === id);
    if (!app) return;
    await updateAppointment(id, { isPaid: !app.isPaid });
  };

  const filteredRecords = records.filter(rec => {
    const date = new Date(rec.date);
    if (period === 'monthly') return isSameMonth(date, now) && isSameYear(date, now);
    if (period === 'quarterly') return isAfter(date, subMonths(now, 3));
    if (period === 'yearly') return isSameYear(date, now);
    if (period === 'custom') {
      const d = format(date, 'yyyy-MM-dd');
      return d >= startDate && d <= endDate;
    }
    return true;
  });

  const filteredExpenses = expenses.filter(exp => {
    const date = new Date(exp.date);
    if (period === 'monthly') return isSameMonth(date, now) && isSameYear(date, now);
    if (period === 'quarterly') return isAfter(date, subMonths(now, 3));
    if (period === 'yearly') return isSameYear(date, now);
    if (period === 'custom') {
      const d = format(date, 'yyyy-MM-dd');
      return d >= startDate && d <= endDate;
    }
    return true;
  });

  const filteredAppointments = appointments.filter(app => {
    const date = new Date(app.dateTime);
    if (period === 'monthly') return isSameMonth(date, now) && isSameYear(date, now);
    if (period === 'quarterly') return isAfter(date, subMonths(now, 3));
    if (period === 'yearly') return isSameYear(date, now);
    if (period === 'custom') {
      const d = format(date, 'yyyy-MM-dd');
      return d >= startDate && d <= endDate;
    }
    return true;
  });

  const totalFaturado = filteredAppointments
    .filter(app => app.status === 'completed' || app.isPaid || (app.status !== 'cancelled' && new Date(app.dateTime) < now))
    .reduce((acc, app) => acc + (app.price || 0), 0);
  
  const sessoesRealizadas = filteredRecords.length;
  const sessoesAgendadas = filteredAppointments.filter(a => a.status === 'scheduled').length;

  // Calculate received based on appointments marked as paid in this period
  const totalRecebido = filteredAppointments.reduce((acc, app) => {
    if (app.isPaid) {
      return acc + (app.price || 0);
    }
    return acc;
  }, 0);

  const totalDespesas = filteredExpenses.reduce((acc, exp) => acc + (exp.value || 0), 0);
  const lucroLiquido = totalRecebido - totalDespesas;
  const totalPendente = Math.max(0, totalFaturado - totalRecebido);

  const stats = [
    { label: 'Faturamento (Total)', value: `R$ ${totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-slate-900', bg: 'bg-slate-50' },
    { label: 'Total Recebido', value: `R$ ${totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Pendente', value: `R$ ${totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Lucro Líquido', value: `R$ ${lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: lucroLiquido >= 0 ? 'text-emerald-600' : 'text-red-600', bg: lucroLiquido >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
  ];

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      description: formData.get('description') as string,
      value: parseFloat(formData.get('value') as string),
      date: formData.get('date') as string,
      category: formData.get('category') as any,
      userId: user!.uid
    };
    await addExpense(newExpense);
    setIsExpenseModalOpen(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const { clinicName, professionalName } = settings;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // Emerald-600
    doc.text(clinicName || 'Psicanálise App', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Profissional: ${professionalName}`, 14, 28);
    doc.text(`Data do Relatório: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 33);

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('Extrato Financeiro', 14, 45);

    // Summary Table
    autoTable(doc, {
      startY: 50,
      head: [['Resumo', 'Valor']],
      body: [
        ['Faturamento Total', `R$ ${totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Recebido (Caixa)', `R$ ${totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Total Pendente', `R$ ${totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Despesas Totais', `R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Lucro Líquido', `R$ ${lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Transactions Table
    const allTransactions = [
      ...filteredAppointments
        .filter(app => app.status === 'completed' || app.isPaid || (app.status !== 'cancelled' && new Date(app.dateTime) < now))
        .map(app => ({
          date: format(new Date(app.dateTime), 'dd/MM/yyyy'),
          rawDate: new Date(app.dateTime),
          desc: `Sessão: ${app.patientName}`,
          type: app.isPaid ? 'Entrada (Pago)' : 'Entrada (Pendente)',
          val: app.price || 0,
          isExpense: false
        })),
      ...filteredExpenses.map(exp => ({
        date: format(new Date(exp.date), 'dd/MM/yyyy'),
        rawDate: new Date(exp.date),
        desc: exp.description,
        type: 'Saída',
        val: exp.value,
        isExpense: true
      }))
    ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(14);
    doc.text('Detalhamento de Lançamentos', 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Data', 'Descrição', 'Tipo', 'Valor']],
      body: allTransactions.map(t => [
        t.date,
        t.desc,
        t.type,
        `R$ ${t.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]),
      columnStyles: {
        3: { halign: 'right' }
      },
      headStyles: { fillColor: [51, 65, 85] }, // Slate-700
    });

    doc.save(`extrato-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('Extrato exportado com sucesso!');
  };

  // Group records by month for the chart
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1); // Set to 1st to avoid month skipping on 31st
    d.setMonth(d.getMonth() - (5 - i));
    return {
      name: format(d, 'MMM', { locale: ptBR }),
      month: d.getMonth(),
      year: d.getFullYear(),
      valor: 0
    };
  });

  // Group revenue by month for the chart
  appointments.forEach(app => {
    const appDate = new Date(app.dateTime);
    if (app.status === 'completed' || app.isPaid || (app.status !== 'cancelled' && appDate < now)) {
      const monthData = last6Months.find(m => m.month === appDate.getMonth() && m.year === appDate.getFullYear());
      if (monthData) {
        monthData.valor += (app.price || 0);
      }
    }
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
    .slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-500">Controle de faturamento, despesas e lucro real.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['monthly', 'quarterly', 'yearly', 'custom', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  period === p 
                    ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {p === 'monthly' ? 'Mensal' : p === 'quarterly' ? 'Trimestral' : p === 'yearly' ? 'Anual' : p === 'custom' ? 'Personalizado' : 'Tudo'}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm border-none focus:ring-0 dark:text-white"
              />
              <span className="text-slate-400">até</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm border-none focus:ring-0 dark:text-white"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-medium hover:bg-red-100 transition-colors shadow-sm"
            >
              <Plus size={20} />
              Nova Despesa
            </button>
            <button 
              onClick={exportToPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download size={20} />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">Fluxo de Caixa (Faturamento)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last6Months}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {last6Months.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === last6Months.length - 1 ? '#10b981' : '#e2e8f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">Sessões Agendadas no Período ({sessoesAgendadas})</h3>
            <div className="space-y-3">
              {filteredAppointments.filter(a => a.status === 'scheduled').length > 0 ? (
                filteredAppointments.filter(a => a.status === 'scheduled').sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()).map(app => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                        {app.patientName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{app.patientName}</p>
                        <p className="text-xs text-slate-500">{format(new Date(app.dateTime), "dd/MM 'às' HH:mm")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">R$ {app.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-white rounded-full font-bold uppercase">Agendada</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-slate-500 text-sm">Nenhuma sessão agendada para este período.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">Sessões por Status de Pagamento</h3>
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setPaymentFilter('pending')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                    paymentFilter === 'pending' 
                      ? "bg-white text-red-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setPaymentFilter('paid')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                    paymentFilter === 'paid' 
                      ? "bg-white text-emerald-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Pagos
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {paymentFilter === 'pending' ? (
                filteredAppointments.filter(a => !a.isPaid && (a.status === 'completed' || new Date(a.dateTime) < new Date())).length > 0 ? (
                  filteredAppointments.filter(a => !a.isPaid && (a.status === 'completed' || new Date(a.dateTime) < new Date())).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()).map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-600 font-bold border border-red-200">
                          {app.patientName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{app.patientName}</p>
                          <p className="text-xs text-slate-500">{format(new Date(app.dateTime), "dd/MM 'às' HH:mm")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">R$ {app.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold uppercase">Pendente</span>
                        </div>
                        <button 
                          onClick={() => handleTogglePayment(app.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm text-xs font-bold"
                          title="Confirmar Pagamento"
                        >
                          <DollarSign size={14} />
                          Pagamento Feito
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-500 text-sm">Nenhum pagamento pendente para sessões realizadas.</p>
                )
              ) : (
                filteredAppointments.filter(a => a.isPaid).length > 0 ? (
                  filteredAppointments.filter(a => a.isPaid).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()).map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 font-bold border border-emerald-200">
                          {app.patientName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{app.patientName}</p>
                          <p className="text-xs text-slate-500">{format(new Date(app.dateTime), "dd/MM 'às' HH:mm")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">R$ {app.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold uppercase">Pago</span>
                        </div>
                        <button 
                          onClick={() => handleTogglePayment(app.id)}
                          className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors shadow-sm"
                          title="Estornar Pagamento"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-500 text-sm">Nenhum pagamento confirmado neste período.</p>
                )
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-6">Últimos Lançamentos</h3>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  transaction.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {transaction.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {transaction.title}
                  </p>
                  <p className="text-xs text-slate-500">{transaction.date}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className={cn(
                      "text-sm font-bold",
                      transaction.type === 'income' ? "text-emerald-600" : "text-red-600"
                    )}>
                      {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {transaction.type === 'income' ? 'Recebido' : 'Pago'}
                    </p>
                  </div>
                  {transaction.type === 'expense' && (
                    <button 
                      onClick={() => {
                        if (confirm('Deseja excluir esta despesa?')) {
                          deleteExpense(transaction.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Nova Despesa */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Nova Despesa</h3>
                <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Descrição</label>
                  <input name="description" required placeholder="Ex: Aluguel, Supervisão..." className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Valor (R$)</label>
                    <input name="value" type="number" step="0.01" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Data</label>
                    <input name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Categoria</label>
                  <select name="category" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="aluguel">Aluguel</option>
                    <option value="supervisao">Supervisão</option>
                    <option value="marketing">Marketing</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
                    Salvar Despesa
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
