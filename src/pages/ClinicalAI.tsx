import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  History, 
  Send, 
  User, 
  ChevronRight,
  Sparkles,
  BarChart2,
  ListRestart,
  Download,
  Plus,
  FileText
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { SessionRecord, ClinicalEvolutionReport, ClinicalChatSession, ClinicalChatMessage } from '../types';
import { analyzeEvolution, getClinicalChatResponse, getBestApiKey } from '../lib/gemini';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export default function ClinicalAI() {
  const { patients, records, clinicalReports, clinicalChats, addClinicalReport, saveClinicalChat, user, settings } = useStorage();
  const [activeTab, setActiveTab] = useState<'evolution' | 'chat'>('evolution');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Evolution Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ClinicalEvolutionReport | null>(null);

  // Chat States
  const [chatApproach, setChatApproach] = useState('Psicanálise');
  const [chatMessages, setChatMessages] = useState<ClinicalChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const patientRecords = records.filter(r => r.patientId === selectedPatientId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const patientReports = clinicalReports.filter(r => r.patientId === selectedPatientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleRunAnalysis = async () => {
    if (!selectedPatientId || !selectedPatient) return;
    if (patientRecords.length < 2) {
      toast.error('É necessário pelo menos 2 sessões registradas para uma análise de evolução.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const apiKey = getBestApiKey(settings);
      const result = await analyzeEvolution(selectedPatient.name, patientRecords, apiKey);
      const newReport: ClinicalEvolutionReport = {
        id: Math.random().toString(36).substr(2, 9),
        patientId: selectedPatientId,
        period: {
          start: patientRecords[0].date,
          end: patientRecords[patientRecords.length - 1].date
        },
        summary: result.summary || '',
        status: result.status as any || 'evoluindo',
        patterns: result.patterns || [],
        recommendations: result.recommendations || [],
        createdAt: new Date().toISOString(),
        userId: user!.uid
      };
      await addClinicalReport(newReport);
      setSelectedReport(newReport);
      toast.success('Relatório de evolução gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar análise de evolução.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedPatientId || isChatLoading) return;

    const userMessage: ClinicalChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const recordsText = patientRecords.map(r => `Data: ${r.date}${r.sessionValue ? `, Valor: R$ ${r.sessionValue}` : ''}\nNota Clínica: ${r.clinicalNotes}${r.transcription ? `\nTranscrição: ${r.transcription}` : ''}`).join('\n\n---\n\n');
      const apiKey = getBestApiKey(settings);
      const response = await getClinicalChatResponse(newMessages, recordsText, chatApproach, apiKey);
      
      const assistantMessage: ClinicalChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...newMessages, assistantMessage];
      setChatMessages(finalMessages);

      // Optionally save session
      const chatSession: ClinicalChatSession = {
        id: selectedPatientId + '_current',
        patientId: selectedPatientId,
        theoreticalApproach: chatApproach,
        messages: finalMessages,
        createdAt: new Date().toISOString(),
        userId: user!.uid
      };
      await saveClinicalChat(chatSession);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar mensagem do chat.');
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="text-emerald-600" />
            Supervisão & Evolução Clíncia (IA)
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Inteligência Artificial aplicada à análise clínica e discussão de casos.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        {/* Sidebar: Patients Selection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User size={18} className="text-emerald-600" />
              Pacientes
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => {
                  setSelectedPatientId(patient.id);
                  setSelectedReport(null);
                  setChatMessages([]);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                  selectedPatientId === patient.id ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0",
                  selectedPatientId === patient.id ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}>
                  {patient.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate uppercase">{patient.name}</p>
                  <p className="text-[10px] opacity-70 uppercase font-medium">{records.filter(r => r.patientId === patient.id).length} sessões</p>
                </div>
                <ChevronRight size={16} className={cn(
                  "transition-transform",
                  selectedPatientId === patient.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100"
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-3 flex flex-col space-y-6 overflow-hidden">
          {!selectedPatientId ? (
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-12 text-center shadow-sm">
               <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                  <Sparkles size={48} />
               </div>
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Selecione um Paciente</h2>
               <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                 Escolha um paciente na lista ao lado para iniciar uma análise de evolução ou discutir o caso clínico com a IA.
               </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="flex p-4 gap-4">
                    <button
                      onClick={() => setActiveTab('evolution')}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                        activeTab === 'evolution' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <TrendingUp size={18} />
                      Análise de Evolução
                    </button>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                        activeTab === 'chat' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <MessageSquare size={18} />
                      Chat Clínico (Supervisão)
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden p-6 relative">
                  <AnimatePresence mode="wait">
                    {activeTab === 'evolution' ? (
                      <motion.div
                        key="evolution"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="h-full flex flex-col space-y-6 overflow-y-auto pr-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Relatórios de Evolução</h3>
                          <button
                            onClick={handleRunAnalysis}
                            disabled={isAnalyzing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                          >
                            {isAnalyzing ? (
                               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                               <Sparkles size={18} />
                            )}
                            Nova Análise Geral
                          </button>
                        </div>

                        {selectedReport ? (
                          <div className="space-y-6">
                            <div className="flex items-center gap-4">
                               <button 
                                 onClick={() => setSelectedReport(null)}
                                 className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                               >
                                 <History size={20} />
                               </button>
                               <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">Análise em {format(new Date(selectedReport.createdAt), "dd/MM/yyyy HH:mm")}</h4>
                                    <span className={cn(
                                       "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold",
                                       selectedReport.status === 'evoluindo' ? "bg-emerald-100 text-emerald-600" :
                                       selectedReport.status === 'estagnado' ? "bg-amber-100 text-amber-600" :
                                       "bg-red-100 text-red-600"
                                    )}>
                                      Status: {selectedReport.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500">Período: {format(new Date(selectedReport.period.start), "dd/MM/yy")} - {format(new Date(selectedReport.period.end), "dd/MM/yy")}</p>
                               </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-6">
                               <div className="space-y-2">
                                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                     <FileText size={14} /> Resumo Clínico
                                  </h5>
                                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed markdown-body">
                                     <ReactMarkdown>{selectedReport.summary}</ReactMarkdown>
                                  </div>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                     <h5 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                        <BarChart2 size={14} /> Padrões Identificados
                                     </h5>
                                     <ul className="space-y-2">
                                        {selectedReport.patterns.map((p, i) => (
                                          <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                             {p}
                                          </li>
                                        ))}
                                     </ul>
                                  </div>
                                  <div className="space-y-2">
                                     <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles size={14} /> Recomendações Terapêuticas
                                     </h5>
                                     <ul className="space-y-2">
                                        {selectedReport.recommendations.map((r, i) => (
                                          <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                             {r}
                                          </li>
                                        ))}
                                     </ul>
                                  </div>
                               </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                             {patientReports.length > 0 ? (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {patientReports.map(report => (
                                    <button
                                      key={report.id}
                                      onClick={() => setSelectedReport(report)}
                                      className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-emerald-500 transition-all group"
                                    >
                                       <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-bold text-slate-400 uppercase">{format(new Date(report.createdAt), "dd MMM yyyy", { locale: ptBR })}</span>
                                          <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                                       </div>
                                       <h5 className={cn(
                                         "text-sm font-bold truncate mb-1 uppercase",
                                         report.status === 'evoluindo' ? "text-emerald-600" :
                                         report.status === 'estagnado' ? "text-amber-600" :
                                         "text-red-600"
                                       )}>Status: {report.status}</h5>
                                       <p className="text-xs text-slate-500 dark:text-slate-400 overflow-hidden line-clamp-2">{report.summary.replace(/[#*]/g, '')}</p>
                                    </button>
                                  ))}
                               </div>
                             ) : (
                               <div className="py-12 flex flex-col items-center justify-center text-center opacity-70">
                                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                     <History size={32} className="text-slate-400" />
                                  </div>
                                  <h5 className="font-bold text-slate-900 dark:text-white">Nenhum relatório gerado</h5>
                                  <p className="text-xs text-slate-500 mt-1">Clique em "Nova Análise" para processar a evolução do paciente.</p>
                               </div>
                             )}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="chat"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="h-full flex flex-col overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
                           <div className="flex items-center gap-3">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Abordagem:</label>
                              <select 
                                value={chatApproach}
                                onChange={(e) => setChatApproach(e.target.value)}
                                className="text-sm font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-600 dark:text-emerald-400"
                              >
                                <option value="Psicanálise">Psicanálise</option>
                                <option value="Neuropsicanálise">Neuropsicanálise</option>
                                <option value="TCC">TCC</option>
                                <option value="Existencial-Humanista">Existencial-Humanista</option>
                                <option value="Psicodinâmica">Psicodinâmica</option>
                                <option value="Sistêmica">Sistêmica</option>
                              </select>
                           </div>
                           <button 
                             onClick={() => setChatMessages([])}
                             className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                           >
                             <ListRestart size={14} />
                             Reiniciar Conversa
                           </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 scroll-smooth custom-scrollbar">
                           {chatMessages.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                <Sparkles size={48} className="text-emerald-600 mb-4" />
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase">Olá, Bruno.</h4>
                                <p className="text-xs text-slate-500 max-w-xs mt-2">
                                   Discuta o caso de <strong>{selectedPatient?.name}</strong> sob a ótica da <strong>{chatApproach}</strong>. 
                                   Tenho acesso a todo o histórico clínico para te ajudar com insights e direcionamentos.
                                </p>
                             </div>
                           ) : (
                             chatMessages.map((msg, i) => (
                               <div key={i} className={cn(
                                 "flex gap-4 max-w-[85%]",
                                 msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                               )}>
                                 <div className={cn(
                                   "w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center",
                                   msg.role === 'user' ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                 )}>
                                   {msg.role === 'user' ? <User size={20} /> : <Brain size={20} />}
                                 </div>
                                 <div className={cn(
                                   "p-4 rounded-2xl text-sm leading-relaxed",
                                   msg.role === 'user' 
                                     ? "bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-200 dark:shadow-none" 
                                     : "bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-none shadow-sm markdown-body"
                                 )}>
                                   <ReactMarkdown>{msg.content}</ReactMarkdown>
                                 </div>
                               </div>
                             ))
                           )}
                           {isChatLoading && (
                             <div className="flex gap-4 max-w-[85%]">
                                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                   <Brain size={20} className="animate-pulse" />
                                </div>
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-tl-none">
                                   <div className="flex gap-1">
                                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                                   </div>
                                </div>
                             </div>
                           )}
                        </div>

                        <form onSubmit={handleSendMessage} className="relative shrink-0">
                           <input 
                             type="text" 
                             value={chatInput}
                             onChange={(e) => setChatInput(e.target.value)}
                             placeholder="Digite sua dúvida ou observação clínica..."
                             className="w-full pl-6 pr-14 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all dark:text-white text-sm"
                           />
                           <button 
                             type="submit"
                             disabled={isChatLoading || !chatInput.trim()}
                             className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-colors disabled:opacity-50"
                           >
                             <Send size={18} />
                           </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
