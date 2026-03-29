import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  FileText, 
  Plus, 
  Calendar, 
  ChevronRight,
  History,
  Edit3,
  BookOpen,
  Download,
  X,
  DollarSign,
  Trash2
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SessionRecord } from '../types';
import { toast } from 'sonner';

export default function Records() {
  const { patients, records, appointments, addRecord, updateRecord, updatePatient, updateAppointment, deleteRecord, deletePatient, user } = useStorage();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SessionRecord | null>(null);
  const [deletePatientConfirm, setDeletePatientConfirm] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const patientRecords = records.filter(r => r.patientId === selectedPatient).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const activePatient = patients.find(p => p.id === selectedPatient);

  const handleDeletePatient = async () => {
    if (selectedPatient) {
      await deletePatient(selectedPatient);
      setSelectedPatient(null);
      setDeletePatientConfirm(false);
    }
  };

  const handleSubmitRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const formData = new FormData(e.currentTarget);
    const sessionValue = parseFloat(formData.get('sessionValue') as string);
    const date = new Date(formData.get('date') as string).toISOString();
    const clinicalNotes = formData.get('clinicalNotes') as string;
    const evolution = formData.get('evolution') as string;
    const paid = formData.get('isPaid') === 'on';

    if (editingRecord) {
      await updateRecord(editingRecord.id, { date, clinicalNotes, evolution, sessionValue });

      // Update appointment payment status if linked
      if (editingRecord.appointmentId !== 'manual') {
        await updateAppointment(editingRecord.appointmentId, { isPaid: paid });
      }

      if (activePatient) {
        const diff = sessionValue - (editingRecord.sessionValue || 0);
        await updatePatient(selectedPatient, { totalPaid: (activePatient.totalPaid || 0) + diff });
      }
    } else {
      const recordId = Math.random().toString(36).substr(2, 9);
      
      // Try to find a matching appointment to link
      const matchingApp = appointments.find(app => 
        app.patientId === selectedPatient && 
        format(new Date(app.dateTime), 'yyyy-MM-dd') === format(new Date(date), 'yyyy-MM-dd') &&
        app.status === 'scheduled'
      );

      const newRecord: SessionRecord = {
        id: recordId,
        patientId: selectedPatient,
        appointmentId: matchingApp ? matchingApp.id : 'manual',
        date,
        clinicalNotes,
        evolution,
        sessionValue,
        userId: user!.uid,
      };

      await addRecord(newRecord);

      // Update appointment status and payment if linked
      if (matchingApp) {
        await updateAppointment(matchingApp.id, { status: 'completed' as const, isPaid: paid });
      }
      
      if (activePatient) {
        await updatePatient(selectedPatient, { totalPaid: (activePatient.totalPaid || 0) + sessionValue });
      }
    }

    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const generateReceipt = (record: SessionRecord) => {
    if (!activePatient) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text('RECIBO DE SESSÃO', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Consultório de Psicanálise - Dr. Bruno Lisboa', 105, 30, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(20, 40, 190, 40);
    
    // Content
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.text('Paciente:', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(activePatient.name, 50, 60);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Data:', 20, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(record.date), 'dd/MM/yyyy'), 50, 70);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Valor:', 20, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`R$ ${record.sessionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 50, 80);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição:', 20, 90);
    doc.setFont('helvetica', 'normal');
    doc.text('Sessão de Psicanálise', 50, 90);
    
    // Footer
    doc.line(20, 120, 190, 120);
    doc.setFontSize(10);
    doc.text('Assinatura do Profissional', 105, 140, { align: 'center' });
    doc.line(70, 135, 140, 135);
    
    doc.save(`Recibo_${activePatient.name}_${format(new Date(record.date), 'dd-MM-yyyy')}.pdf`);
    toast.success('Recibo gerado com sucesso');
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Prontuários</h1>
          <p className="text-slate-500 dark:text-slate-400">Acompanhamento clínico e evolução dos pacientes.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Patient List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar paciente..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                  selectedPatient === patient.id ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                  selectedPatient === patient.id ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}>
                  {patient.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{patient.name}</p>
                  <p className="text-xs opacity-70">Última sessão: 24/03</p>
                </div>
                <ChevronRight size={16} className={cn(
                  "transition-transform",
                  selectedPatient === patient.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100"
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* Records Detail */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          {selectedPatient ? (
            <>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200 dark:shadow-none">
                    {activePatient?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activePatient?.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Prontuário Clínico • {patientRecords.length} sessões registradas</p>
                      {activePatient?.medications && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">💊 Medicação: {activePatient.medications}</p>
                      )}
                      {activePatient?.guardianName && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">👤 Resp: {activePatient.guardianName} ({activePatient.guardianContact})</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {deletePatientConfirm ? (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-xl border border-red-100 dark:border-red-800">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">Excluir paciente?</span>
                      <button 
                        onClick={handleDeletePatient}
                        className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Sim
                      </button>
                      <button 
                        onClick={() => setDeletePatientConfirm(false)}
                        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeletePatientConfirm(true)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      title="Excluir Paciente"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setEditingRecord(null);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Plus size={18} />
                    Nova Evolução
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {patientRecords.length > 0 ? patientRecords.map((record, i) => (
                  <div key={record.id} className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-emerald-500" />
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                          <Calendar size={16} className="text-emerald-600 dark:text-emerald-400" />
                          {format(new Date(record.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                            R$ {record.sessionValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                            Evolução: {record.evolution}/10
                          </span>
                          <button 
                            onClick={() => generateReceipt(record)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Gerar Recibo"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir esta evolução?')) {
                                deleteRecord(record.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Excluir Evolução"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingRecord(record);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar Evolução"
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Observações Clínicas</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {record.clinicalNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <BookOpen size={40} className="text-slate-200 dark:text-slate-700" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum registro encontrado</h4>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
                      Inicie o acompanhamento clínico deste paciente registrando a primeira sessão.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <FileText size={48} className="text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Selecione um Paciente</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                Escolha um paciente na lista ao lado para visualizar e gerenciar seu prontuário completo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Evolução */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingRecord ? 'Editar Evolução Clínica' : 'Nova Evolução Clínica'}
                </h3>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingRecord(null);
                  }} 
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <form key={editingRecord ? editingRecord.id : 'new'} onSubmit={handleSubmitRecord} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data da Sessão</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        name="date" 
                        type="date" 
                        defaultValue={editingRecord ? format(new Date(editingRecord.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')} 
                        required 
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor da Sessão (R$)</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        name="sessionValue" 
                        type="number" 
                        step="0.01" 
                        defaultValue={editingRecord ? editingRecord.sessionValue : (activePatient?.defaultSessionValue || 150)} 
                        required 
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Evolução (1-10)</label>
                  <input 
                    name="evolution" 
                    type="number" 
                    min="1" 
                    max="10" 
                    defaultValue={editingRecord ? editingRecord.evolution : "5"} 
                    required 
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Observações Clínicas</label>
                  <textarea 
                    name="clinicalNotes" 
                    rows={5} 
                    defaultValue={editingRecord ? editingRecord.clinicalNotes : ""} 
                    required 
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                    placeholder="Descreva o que foi trabalhado na sessão..." 
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <input 
                    type="checkbox" 
                    name="isPaid" 
                    id="isPaid"
                    defaultChecked={editingRecord ? appointments.find(a => a.id === editingRecord.appointmentId)?.isPaid : false}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" 
                  />
                  <label htmlFor="isPaid" className="text-sm font-medium text-emerald-700 dark:text-emerald-400 cursor-pointer">
                    Confirmar Pagamento desta Sessão
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingRecord(null);
                    }} 
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">
                    {editingRecord ? 'Salvar Alterações' : 'Salvar Evolução'}
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

import { cn } from '../lib/utils';
