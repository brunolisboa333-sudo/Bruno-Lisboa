import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon,
  Filter,
  Trash2,
  Edit2,
  Eye,
  ExternalLink,
  FileText,
  Plus,
  X,
  User,
  Receipt,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStorage } from '../hooks/useStorage';
import { Patient, SessionRecord } from '../types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Patients() {
  const { patients, appointments, records, addPatient, updatePatient, deletePatient, user, settings } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [receiptPatient, setReceiptPatient] = useState<Patient | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.phone && p.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    await deletePatient(id);
    setDeleteConfirmId(null);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const patientData: Partial<Patient> = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      birthDate: formData.get('birthDate') as string,
      gender: formData.get('gender') as string,
      notes: formData.get('notes') as string,
      initialHistory: formData.get('initialHistory') as string,
      guardianName: formData.get('guardianName') as string,
      guardianContact: formData.get('guardianContact') as string,
      medications: formData.get('medications') as string,
      cpf: formData.get('cpf') as string,
      address: formData.get('address') as string,
      defaultSessionValue: parseFloat(formData.get('defaultSessionValue') as string) || 150,
      totalPaid: parseFloat(formData.get('totalPaid') as string) || 0,
    };

    if (editingPatient) {
      await updatePatient(editingPatient.id, patientData);
    } else {
      const newPatient: Patient = {
        id: Math.random().toString(36).substr(2, 9),
        ...patientData as Patient,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user!.uid,
      };
      await addPatient(newPatient);
    }
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const getPatientStats = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    const patientAppointments = appointments.filter(app => app.patientId === patientId);
    const now = new Date();

    const totalReceived = patient?.totalPaid || 0;

    const totalBilled = patientAppointments
      .filter(app => {
        const appDate = new Date(app.dateTime);
        return (app.status === 'completed' || app.isPaid || (app.status !== 'cancelled' && appDate < now));
      })
      .reduce((acc, app) => acc + (app.price || 0), 0);

    return { totalReceived, totalBilled };
  };

  const generateReceiptPDF = (patient: Patient, amount: number, description: string) => {
    const doc = new jsPDF();
    const date = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105); // Emerald-600
    doc.text('RECIBO', 105, 30, { align: 'center' });
    
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 40, 190, 40);
    
    // Content
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55); // Slate-800
    doc.setFont('helvetica', 'normal');
    
    const text = `Recebi de ${patient.name}${patient.cpf ? `, inscrito no CPF sob o nº ${patient.cpf}` : ''}, a importância de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${description}).`;
    
    const splitText = doc.splitTextToSize(text, 170);
    doc.text(splitText, 20, 60);
    
    doc.text(`Data: ${date}`, 20, 90);
    
    // Professional info
    doc.line(60, 140, 150, 140);
    doc.setFontSize(10);
    doc.text(settings.professionalName || 'Profissional', 105, 145, { align: 'center' });
    doc.text(settings.specialty || 'Especialidade', 105, 150, { align: 'center' });
    
    if (settings.clinicName) {
      doc.setFontSize(12);
      doc.text(settings.clinicName, 105, 170, { align: 'center' });
    }

    doc.save(`recibo-${patient.name.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('Recibo gerado com sucesso!');
  };

  const handleGenerateReceipt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!receiptPatient) return;
    
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Por favor, insira um valor válido.');
      return;
    }

    // Update patient total paid
    const newTotalPaid = (receiptPatient.totalPaid || 0) + amount;
    await updatePatient(receiptPatient.id, { totalPaid: newTotalPaid }, true);
    
    generateReceiptPDF(receiptPatient, amount, description);
    setIsReceiptModalOpen(false);
    setReceiptPatient(null);
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pacientes</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie o cadastro e histórico dos seus pacientes.</p>
        </div>
        <button 
          onClick={() => {
            setEditingPatient(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
        >
          <UserPlus size={20} />
          Novo Paciente
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou telefone..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Filter size={20} />
          Filtros
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nascimento</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resumo Financeiro</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{patient.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Phone size={14} className="text-slate-400" />
                        {patient.phone}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Mail size={14} className="text-slate-400" />
                        {patient.email}
                      </div>
                      {patient.guardianName && (
                        <div className="flex flex-col pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Responsável</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400">{patient.guardianName} ({patient.guardianContact})</p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <CalendarIcon size={14} className="text-slate-400" />
                      {patient.birthDate}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Recebido:</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          R$ {getPatientStats(patient.id).totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Faturado:</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          R$ {getPatientStats(patient.id).totalBilled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {deleteConfirmId === patient.id ? (
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 p-1 rounded-lg">
                            <button 
                              onClick={() => handleDelete(patient.id)}
                              className="px-2 py-1 text-[10px] font-bold bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                              Confirmar
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-300 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                setReceiptPatient(patient);
                                setIsReceiptModalOpen(true);
                              }}
                              className="p-2 text-emerald-600 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Gerar Recibo"
                            >
                              <Receipt size={18} />
                            </button>
                            <button 
                              onClick={() => setViewingPatient(patient)}
                              className="p-2 text-slate-900 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-100 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Visualizar Detalhes"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingPatient(patient);
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-emerald-600 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Editar Paciente"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(patient.id)}
                              className="p-2 text-slate-900 hover:text-red-600 hover:bg-red-50 dark:text-slate-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Excluir Paciente"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        <Link 
                          to="/records" 
                          className="p-2 text-emerald-600 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Ver Prontuários"
                        >
                          <FileText size={18} />
                        </Link>
                      </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visualizar */}
      <AnimatePresence>
        {viewingPatient && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xl font-bold">
                    {viewingPatient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewingPatient.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Paciente desde {new Date(viewingPatient.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <button onClick={() => setViewingPatient(null)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informações de Contato</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                          <Mail size={16} className="text-slate-400" />
                          <span className="text-sm">{viewingPatient.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                          <Phone size={16} className="text-slate-400" />
                          <span className="text-sm">{viewingPatient.phone}</span>
                        </div>
                        {viewingPatient.cpf && (
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <FileText size={16} className="text-slate-400" />
                            <span className="text-sm">CPF: {viewingPatient.cpf}</span>
                          </div>
                        )}
                        {viewingPatient.address && (
                          <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                            <ExternalLink size={16} className="text-slate-400 mt-1" />
                            <span className="text-sm">{viewingPatient.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dados Pessoais</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          <span className="font-medium">Nascimento:</span> {viewingPatient.birthDate}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          <span className="font-medium">Gênero:</span> {viewingPatient.gender}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Financeiro</h4>
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">Valor por Sessão</p>
                        <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">R$ {viewingPatient.defaultSessionValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <div className="mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/20 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase mb-1">Total Recebido</p>
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">R$ {getPatientStats(viewingPatient.id).totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase mb-1">Total Faturado</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">R$ {getPatientStats(viewingPatient.id).totalBilled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {viewingPatient.guardianName && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Responsável Legal</h4>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{viewingPatient.guardianName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{viewingPatient.guardianContact}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {viewingPatient.medications && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Medicações</h4>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                      <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-wrap">{viewingPatient.medications}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Histórico Inicial</h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{viewingPatient.initialHistory || 'Nenhum histórico registrado.'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Histórico de Sessões</h4>
                  <div className="space-y-3">
                    {records
                      .filter(r => r.patientId === viewingPatient.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record) => (
                        <div key={record.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {format(new Date(record.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              R$ {record.sessionValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                            {record.clinicalNotes || 'Sem observações clínicas.'}
                          </p>
                        </div>
                      ))}
                    {records.filter(r => r.patientId === viewingPatient.id).length === 0 && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                        <p className="text-sm text-slate-500">Nenhuma sessão registrada ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setReceiptPatient(viewingPatient);
                    setIsReceiptModalOpen(true);
                  }}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-2"
                >
                  <Receipt size={18} />
                  Gerar Recibo
                </button>
                <button 
                  onClick={() => {
                    setViewingPatient(null);
                    setEditingPatient(viewingPatient);
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Edit2 size={18} />
                  Editar Cadastro
                </button>
                <button 
                  onClick={() => setViewingPatient(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Cadastro/Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
                    <input name="name" defaultValue={editingPatient?.name} required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <input name="email" type="email" defaultValue={editingPatient?.email} required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
                    <input name="phone" defaultValue={editingPatient?.phone} required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Nascimento</label>
                    <input 
                      name="birthDate" 
                      type="text" 
                      placeholder="DD/MM/AAAA"
                      defaultValue={editingPatient?.birthDate} 
                      required 
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gênero</label>
                    <select name="gender" defaultValue={editingPatient?.gender} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white">
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Outro">Outro</option>
                      <option value="Prefiro não dizer">Prefiro não dizer</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor por Sessão (R$)</label>
                    <input name="defaultSessionValue" type="number" step="0.01" defaultValue={editingPatient?.defaultSessionValue || 150} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Pago Acumulado (R$)</label>
                    <input name="totalPaid" type="number" step="0.01" defaultValue={editingPatient?.totalPaid || 0} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CPF</label>
                    <input name="cpf" defaultValue={editingPatient?.cpf} placeholder="000.000.000-00" className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</label>
                    <input name="address" defaultValue={editingPatient?.address} placeholder="Rua, número, bairro, cidade..." className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Responsável (Se menor)</label>
                    <input name="guardianName" defaultValue={editingPatient?.guardianName} placeholder="Nome do responsável" className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contato do Responsável</label>
                    <input name="guardianContact" defaultValue={editingPatient?.guardianContact} placeholder="Telefone do responsável" className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Uso de Medicação / Remédios</label>
                  <textarea name="medications" defaultValue={editingPatient?.medications} rows={2} placeholder="Descreva se faz uso de medicação e quais..." className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Histórico Inicial</label>
                  <textarea name="initialHistory" defaultValue={editingPatient?.initialHistory} rows={3} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Gerar Recibo */}
      <AnimatePresence>
        {isReceiptModalOpen && receiptPatient && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Gerar Recibo</h3>
                <button onClick={() => setIsReceiptModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleGenerateReceipt} className="p-6 space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 mb-4">
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">Paciente: {receiptPatient.name}</p>
                  {receiptPatient.cpf && <p className="text-xs text-emerald-600 dark:text-emerald-400">CPF: {receiptPatient.cpf}</p>}
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor Pago (R$)</label>
                  <input 
                    name="amount" 
                    type="number" 
                    step="0.01" 
                    required 
                    autoFocus
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
                  <input 
                    name="description" 
                    defaultValue="Referente a sessões de psicoterapia"
                    required 
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" 
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsReceiptModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2">
                    <Download size={18} />
                    Gerar Recibo PDF
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
