import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users2, 
  BookOpen, 
  MessageSquareQuote, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ExternalLink, 
  MessageCircle, 
  Save, 
  Star,
  Sparkles,
  DollarSign,
  Briefcase,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { toast } from 'sonner';
import { Course, Testimonial, ClinicSettings } from '../types';

export default function Dashboard() {
  const { 
    settings, 
    saveSettings, 
    registrations, 
    updateRegistrationStatus, 
    deleteRegistration 
  } = useStorage();

  const [activeTab, setActiveTab] = useState<'leads' | 'courses' | 'testimonials' | 'profile'>('leads');

  // Local state for profile configurations
  const [profileForm, setProfileForm] = useState<ClinicSettings>({
    clinicName: settings.clinicName || '',
    professionalName: settings.professionalName || '',
    professionalInitials: settings.professionalInitials || '',
    specialty: settings.specialty || '',
    defaultSessionValue: settings.defaultSessionValue || 150,
    whatsapp: settings.whatsapp || '',
    email: settings.email || '',
    bio: settings.bio || '',
    heroImageUrl: settings.heroImageUrl || '',
    geminiKeys: settings.geminiKeys || [],
    courses: settings.courses || [],
    testimonials: settings.testimonials || []
  });

  // Keep profileForm in sync with loaded settings
  useEffect(() => {
    if (settings) {
      setProfileForm(prev => ({
        ...prev,
        clinicName: settings.clinicName || '',
        professionalName: settings.professionalName || '',
        professionalInitials: settings.professionalInitials || '',
        specialty: settings.specialty || '',
        defaultSessionValue: settings.defaultSessionValue || 150,
        whatsapp: settings.whatsapp || '',
        email: settings.email || '',
        bio: settings.bio || '',
        heroImageUrl: settings.heroImageUrl || '',
        geminiKeys: settings.geminiKeys || [],
        courses: settings.courses || [],
        testimonials: settings.testimonials || []
      }));
    }
  }, [settings]);

  // State for Course creation / editing
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<Omit<Course, 'id'>>({
    title: '',
    description: '',
    price: 'R$ 297',
    linkUrl: '',
    imageUrl: ''
  });

  // State for Testimonial creation / editing
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] = useState<Omit<Testimonial, 'id' | 'date' | 'approved'>>({
    patientName: '',
    content: '',
    rating: 5
  });

  // Save basic profile variables
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mergedSettings: ClinicSettings = {
        ...settings,
        ...profileForm,
        courses: settings.courses || [],
        testimonials: settings.testimonials || []
      };
      await saveSettings(mergedSettings);
      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar as alterações do perfil.');
    }
  };

  // Course operations
  const openAddCourse = () => {
    setEditingCourseId(null);
    setCourseForm({ title: '', description: '', price: 'R$ 297', linkUrl: '', imageUrl: '' });
    setIsCourseModalOpen(true);
  };

  const openEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title,
      description: course.description,
      price: course.price,
      linkUrl: course.linkUrl,
      imageUrl: course.imageUrl || ''
    });
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.linkUrl) {
      toast.error('Por favor, informe pelo menos o Título e o Link de Vendas do curso.');
      return;
    }

    const currentCourses = settings.courses || [];
    let updatedCourses: Course[] = [];

    if (editingCourseId) {
      // Editing Mode
      updatedCourses = currentCourses.map(c => 
        c.id === editingCourseId ? { ...c, ...courseForm } : c
      );
    } else {
      // Adding Mode
      const newCourse: Course = {
        id: Math.random().toString(36).substring(2, 11),
        ...courseForm
      };
      updatedCourses = [...currentCourses, newCourse];
    }

    try {
      await saveSettings({
        ...settings,
        courses: updatedCourses
      });
      setIsCourseModalOpen(false);
      setEditingCourseId(null);
      toast.success(editingCourseId ? 'Curso atualizado com sucesso!' : 'Novo curso adicionado com sucesso!');
    } catch (err) {
      toast.error('Ocorreu um erro ao gravar o curso.');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Tem certeza de que deseja remover este curso?')) return;
    const currentCourses = settings.courses || [];
    const updatedCourses = currentCourses.filter(c => c.id !== courseId);
    
    try {
      await saveSettings({
        ...settings,
        courses: updatedCourses
      });
      toast.success('Curso removido com sucesso!');
    } catch (err) {
      toast.error('Erro ao deletar o curso.');
    }
  };

  // Testimonial operations
  const openAddTestimonial = () => {
    setEditingTestimonialId(null);
    setTestimonialForm({ patientName: '', content: '', rating: 5 });
    setIsTestimonialModalOpen(true);
  };

  const openEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonialId(testimonial.id);
    setTestimonialForm({
      patientName: testimonial.patientName,
      content: testimonial.content,
      rating: testimonial.rating
    });
    setIsTestimonialModalOpen(true);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.patientName || !testimonialForm.content) {
      toast.error('Por favor, preencha o Nome do paciente e o Depoimento.');
      return;
    }

    const currentTestimonials = settings.testimonials || [];
    let updatedTestimonials: Testimonial[] = [];

    if (editingTestimonialId) {
      updatedTestimonials = currentTestimonials.map(t => 
        t.id === editingTestimonialId ? { ...t, ...testimonialForm } : t
      );
    } else {
      const newTestimonial: Testimonial = {
        id: Math.random().toString(36).substring(2, 11),
        ...testimonialForm,
        date: new Date().toLocaleDateString('pt-BR'),
        approved: true // Testimonials submitted inside the admin are approved by default
      };
      updatedTestimonials = [...currentTestimonials, newTestimonial];
    }

    try {
      await saveSettings({
        ...settings,
        testimonials: updatedTestimonials
      });
      setIsTestimonialModalOpen(false);
      setEditingTestimonialId(null);
      toast.success(editingTestimonialId ? 'Depoimento atualizado!' : 'Novo depoimento registrado com sucesso!');
    } catch (err) {
      toast.error('Ocorreu um erro ao gravar o depoimento.');
    }
  };

  const handleApproveTestimonial = async (testimonialId: string) => {
    const currentTestimonials = settings.testimonials || [];
    const updated = currentTestimonials.map(t => 
      t.id === testimonialId ? { ...t, approved: true } : t
    );
    try {
      await saveSettings({
        ...settings,
        testimonials: updated
      });
      toast.success('Depoimento aprovado! Ele já está publicamente disponível no site.');
    } catch (err) {
      toast.error('Erro ao aprovar o depoimento.');
    }
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    if (!window.confirm('Excluir este depoimento permanentemente?')) return;
    const currentTestimonials = settings.testimonials || [];
    const updated = currentTestimonials.filter(t => t.id !== testimonialId);
    
    try {
      await saveSettings({
        ...settings,
        testimonials: updated
      });
      toast.success('Depoimento removido.');
    } catch (err) {
      toast.error('Erro ao remover o depoimento.');
    }
  };

  const handleContactWhatsAppLead = (lead: any) => {
    const message = `Olá, ${lead.name}! Vi sua solicitação de agendamento de terapia em meu site comercial e estou entrando em contato para combinarmos nossa consulta clínica. Como vai você?`;
    const cleanPhone = lead.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header and overview info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
            Painel Geral do Profissional
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controle de matrículas de cursos, contatos terapêuticos e avaliações recebidas.
          </p>
        </div>
        
        {/* Short stats */}
        <div className="flex gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 py-2 border border-emerald-100/30 px-4 rounded-xl flex items-center gap-2">
            <Users2 className="text-emerald-700" size={16} />
            <span className="text-xs font-bold text-emerald-800">
              {registrations.length} Contatos Pendentes
            </span>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-xl flex items-center gap-2">
            <BookOpen className="text-slate-600 dark:text-slate-400" size={16} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {(settings.courses || []).length} Cursos Ativos
            </span>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto gap-1">
        <button 
          onClick={() => setActiveTab('leads')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'leads' ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <Users2 size={16} />
          Solicitações de Atendimento ({registrations.length})
        </button>
        <button 
          onClick={() => setActiveTab('courses')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'courses' ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <BookOpen size={16} />
          Gerenciar Meus Cursos ({(settings.courses || []).length})
        </button>
        <button 
          onClick={() => setActiveTab('testimonials')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'testimonials' ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <MessageSquareQuote size={16} />
          Depoimentos de Pacientes ({(settings.testimonials || []).length})
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 ${activeTab === 'profile' ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          <Settings size={16} />
          Configurações do Site
        </button>
      </div>

      {/* Dynamic Tab Switchboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        
        {/* LEADS PANEL */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-950 dark:text-white">Formulário de Contato e Resgate</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Leads gerados voluntariamente através da Landing Page pública.</p>
              </div>
            </div>

            {registrations.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Users2 className="mx-auto text-slate-300 mb-3" size={48} />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Nenhum lead pendente</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Quando um visitante solicitar um agendamento no site, a notificação com os detalhes da queixa aparecerá instantaneamente aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map((lead) => (
                  <div 
                    key={lead.id}
                    className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 grid md:grid-cols-12 gap-4 items-center"
                  >
                    <div className="md:col-span-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-950 dark:text-white">{lead.name}</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] uppercase font-bold rounded">
                          {lead.status || 'Pendente'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">WhatsApp: {lead.phone}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Email: {lead.email}</p>
                    </div>

                    <div className="md:col-span-5 space-y-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-3 rounded-lg text-xs text-slate-600 dark:text-slate-300">
                      <p className="font-semibold text-[10px] text-slate-400 uppercase tracking-widest">Queixa Inicial / Notas</p>
                      <p className="italic font-serif leading-relaxed">
                        "{lead.notes || 'Nenhuma queixa preenchida.'}"
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 text-right">DDN: {lead.birthDate || 'N/A'}</p>
                    </div>

                    <div className="md:col-span-3 flex md:justify-end gap-2">
                      <button 
                        onClick={() => handleContactWhatsAppLead(lead)}
                        className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition" 
                        title="Contatar no WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </button>
                      
                      <button 
                        onClick={() => updateRegistrationStatus(lead.id, 'approved')}
                        className="p-3 bg-white border border-slate-200 text-emerald-700 rounded-xl hover:bg-emerald-50 transition"
                        title="Aprovar/Arquivar Solicitado"
                      >
                        <Check size={18} />
                      </button>

                      <button 
                        onClick={() => deleteRegistration(lead.id)}
                        className="p-3 bg-white border border-slate-200 text-red-600 rounded-xl hover:bg-red-50 transition"
                        title="Remover Lead"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-950 dark:text-white">Meus Cursos à Venda</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Insira, delete ou edite os links de checkout dos seus infoprodutos e e-books.</p>
              </div>
              <button 
                onClick={openAddCourse}
                className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl hover:bg-emerald-800 transition flex items-center gap-1.5"
              >
                <Plus size={16} />
                Adicionar Curso
              </button>
            </div>

            {(settings.courses || []).length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <BookOpen className="mx-auto text-slate-300 mb-3" size={48} />
                <h4 className="font-bold text-slate-700 dark:text-slate-400">Nenhum curso cadastrado</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Clique no botão acima para adicionar seu primeiro livro, curso ou palestra online com link externo de pagamento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(settings.courses || []).map((course) => (
                  <div 
                    key={course.id}
                    className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 rounded-2xl p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-950 dark:text-white font-display text-lg">{course.title}</h4>
                        <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 font-bold rounded-lg text-xs shrink-0 self-start">
                          {course.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed line-clamp-3">
                        {course.description}
                      </p>
                      {course.imageUrl && (
                        <p className="text-[10px] text-slate-400 truncate">Imagem: {course.imageUrl}</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 gap-2">
                      <a 
                        href={course.linkUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-bold text-emerald-800 flex items-center gap-1 hover:underline"
                      >
                        Ver página de vendas
                        <ExternalLink size={12} />
                      </a>
                      
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => openEditCourse(course)}
                          className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition"
                          title="Editar"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-2 border border-slate-200 text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TESTIMONIALS TAB */}
        {activeTab === 'testimonials' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-950 dark:text-white">Depoimentos dos Meus Pacientes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Escreva relatos manualmente ou aprove as solicitações de depoimentos pendentes.</p>
              </div>
              <button 
                onClick={openAddTestimonial}
                className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl hover:bg-emerald-800 transition flex items-center gap-1.5"
              >
                <Plus size={16} />
                Registrar Depoimento
              </button>
            </div>

            {(settings.testimonials || []).length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <MessageSquareQuote className="mx-auto text-slate-300 mb-3" size={48} />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Nenhum depoimento encontrado</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Clique para adicionar depoimentos autorizados, ou visualize os enviados voluntariamente para você.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(settings.testimonials || []).map((testimonial) => (
                  <div 
                    key={testimonial.id}
                    className={`p-5 rounded-2xl border ${testimonial.approved ? 'bg-slate-50 border-slate-100 dark:border-slate-800/80' : 'bg-amber-50/50 border-amber-200/50'} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{testimonial.patientName}</span>
                        {!testimonial.approved && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] uppercase font-bold rounded">
                            Aguardando Aprovação
                          </span>
                        )}
                        <div className="flex text-amber-500">
                          {Array.from({ length: testimonial.rating }).map((_, i) => (
                            <Star key={i} size={12} fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-xs italic text-slate-600 dark:text-slate-350 leading-relaxed font-serif">
                        "{testimonial.content}"
                      </p>
                      
                      <p className="text-[10px] text-slate-400">Publicado em: {testimonial.date}</p>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      {!testimonial.approved && (
                        <button 
                          onClick={() => handleApproveTestimonial(testimonial.id)}
                          className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition flex items-center gap-1"
                        >
                          <Check size={12} />
                          Aprovar
                        </button>
                      )}
                      <button 
                        onClick={() => openEditTestimonial(testimonial)}
                        className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTestimonial(testimonial.id)}
                        className="p-2 border border-slate-200 text-red-600 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE/SETTINGS TAB */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">Configurações Clínicas & Textos do Site</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Controles fundamentais para atualizar cabeçalhos, redes sociais e foto do site.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome do Profissional</label>
                <input 
                  type="text" 
                  value={profileForm.professionalName}
                  onChange={(e) => setProfileForm({...profileForm, professionalName: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none dark:text-white text-sm" 
                  placeholder="Nome completo" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Iniciais (Logo)</label>
                <input 
                  type="text" 
                  value={profileForm.professionalInitials}
                  onChange={(e) => setProfileForm({...profileForm, professionalInitials: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none dark:text-white text-sm" 
                  placeholder="BL" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Título Clínico / Especialidade</label>
                <input 
                  type="text" 
                  value={profileForm.specialty}
                  onChange={(e) => setProfileForm({...profileForm, specialty: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none dark:text-white text-sm" 
                  placeholder="Ex: Psicanálise Clínica & Neuropsicanálise" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome comercial da clínica</label>
                <input 
                  type="text" 
                  value={profileForm.clinicName}
                  onChange={(e) => setProfileForm({...profileForm, clinicName: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none dark:text-white text-sm" 
                  placeholder="Clínica Bruno Lisboa" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">WhatsApp de contato comercial</label>
                <input 
                  type="text" 
                  value={profileForm.whatsapp}
                  onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none dark:text-white text-sm" 
                  placeholder="31 999215840" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-mail Comercial</label>
                <input 
                  type="email" 
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none dark:text-white text-sm" 
                  placeholder="bruno@email.com" 
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Link de Imagem do Banner / Foto De Perfil</label>
                <input 
                  type="text" 
                  value={profileForm.heroImageUrl}
                  onChange={(e) => setProfileForm({...profileForm, heroImageUrl: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none dark:text-white text-sm" 
                  placeholder="URL de imagem Unsplash ou repositório público" 
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Breve Biografia / Frase Destaque</label>
                <textarea 
                  rows={4} 
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none dark:text-white text-sm resize-none" 
                  placeholder="Sua bio profissional exibida em destaque..." 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="submit"
                className="px-6 py-3 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase hover:bg-emerald-800 transition flex items-center gap-1.5"
              >
                <Save size={16} />
                Salvar Configurações
              </button>
            </div>
          </form>
        )}

      </div>

      {/* MODAL WINDOWS FOR EDITING/ADDING */}

      {/* Course Modal */}
      <AnimatePresence>
        {isCourseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {editingCourseId ? 'Editar Curso' : 'Novo Curso'}
                </h3>
                <button 
                  onClick={() => setIsCourseModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Título do Curso *</label>
                  <input 
                    type="text" 
                    required
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white text-sm" 
                    placeholder="Ex: Domando o Inconsciente" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preço Sugerido (R$) *</label>
                    <input 
                      type="text" 
                      required
                      value={courseForm.price}
                      onChange={(e) => setCourseForm({...courseForm, price: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white text-sm" 
                      placeholder="R$ 297" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link de Vendas (Hotmart/Eduzz) *</label>
                    <input 
                      type="url" 
                      required
                      value={courseForm.linkUrl}
                      onChange={(e) => setCourseForm({...courseForm, linkUrl: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white text-sm" 
                      placeholder="https://..." 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">URL de Imagem Thumbnail</label>
                  <input 
                    type="text" 
                    value={courseForm.imageUrl}
                    onChange={(e) => setCourseForm({...courseForm, imageUrl: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white text-sm" 
                    placeholder="https://images.unsplash.com/..." 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição Curta *</label>
                  <textarea 
                    rows={4} 
                    required
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white text-sm resize-none" 
                    placeholder="Resuma a proposta de valor do curso..." 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsCourseModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase hover:bg-emerald-800 transition"
                  >
                    Gravar Curso
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Testimonial Modal */}
      <AnimatePresence>
        {isTestimonialModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {editingTestimonialId ? 'Editar Depoimento' : 'Novo Depoimento'}
                </h3>
                <button 
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveTestimonial} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identificação do Paciente *</label>
                  <input 
                    type="text" 
                    required
                    value={testimonialForm.patientName}
                    onChange={(e) => setTestimonialForm({...testimonialForm, patientName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white text-sm" 
                    placeholder="Ex: Adriana S." 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantidade de Estrelas *</label>
                  <div className="flex gap-2 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTestimonialForm({...testimonialForm, rating: star})}
                        className="hover:scale-110 transition"
                      >
                        <Star size={24} fill={star <= testimonialForm.rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Texto do Depoimento *</label>
                  <textarea 
                    rows={4} 
                    required
                    value={testimonialForm.content}
                    onChange={(e) => setTestimonialForm({...testimonialForm, content: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white text-sm resize-none" 
                    placeholder="Insira o texto que o paciente enviou..." 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsTestimonialModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase hover:bg-emerald-800 transition"
                  >
                    Gravar Depoimento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
