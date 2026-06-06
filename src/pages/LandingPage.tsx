import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  Award, 
  MessageCircle, 
  Video, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Quote, 
  Lock,
  CalendarCheck,
  Globe2,
  Users2,
  Send,
  Plus
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { toast } from 'sonner';
import { Course, Testimonial, PublicRegistration } from '../types';

export default function LandingPage() {
  const { settings, addPublicRegistration, saveSettings } = useStorage();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  
  // Registration form states
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: 'Prefiro não dizer',
    notes: '',
  });

  // Testimonial form states
  const [testimonialForm, setTestimonialForm] = useState({
    patientName: '',
    content: '',
    rating: 5,
  });

  // Sample static courses if MongoDB/Firestore is empty yet
  const defaultCourses: Course[] = [
    {
      id: 'course-1',
      title: 'Formação Essencial em Psicanálise Clínica',
      description: 'Explore as bases teóricas de Freud, Lacan e Melanie Klein. Um curso voltado para quem deseja dominar o inconsciente, decifrar os mecanismos psíquicos e iniciar sua atuação na clínica analítica com segurança teórica e prática supervisionada.',
      price: 'R$ 397',
      linkUrl: 'https://pay.hotmart.com/placeholder1',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 'course-2',
      title: 'Neuropsicanálise: Integração Mente e Cérebro',
      description: 'Entenda os diálogos contemporâneos entre a neurobiologia moderna e a psicanálise clássica. Compreenda as bases orgânicas da ansiedade, depressão, apego e pulsões, desenvolvendo uma visão integradora do sofrimento mental.',
      price: 'R$ 497',
      linkUrl: 'https://pay.hotmart.com/placeholder2',
      imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=800&auto=format&fit=crop'
    }
  ];

  // Default patient testimonials if none exist on database yet
  const defaultTestimonials: Testimonial[] = [
    {
      id: 't-1',
      patientName: 'Adriana S.',
      content: 'Fazer terapia com o Bruno transformou a forma como eu lido com as minhas ansiedades. Ele tem uma metodologia extremamente humana e equilibrada, integrando percepções que fazem muito sentido científico e emocional.',
      rating: 5,
      date: '24/05/2026',
      approved: true
    },
    {
      id: 't-2',
      patientName: 'Marcos V.',
      content: 'Sou aluno do curso de Neuropsicanálise e também paciente clínico. A profundidade técnica combinada à facilidade didática nas aulas é fantástica. Recomendo tanto os cursos de formação quanto seus atendimentos.',
      rating: 5,
      date: '10/04/2026',
      approved: true
    },
    {
      id: 't-3',
      patientName: 'Camila R.',
      content: 'O processo analítico trouxe clareza sobre decisões importantes de vida. Sinto que as sessões online têm o mesmo acolhimento e escuta ativa de um consultório presencial. Gratidão profunda.',
      rating: 5,
      date: '18/03/2026',
      approved: true
    }
  ];

  const displayedCourses = settings.courses && settings.courses.length > 0 ? settings.courses : defaultCourses;
  const displayedTestimonials = settings.testimonials && settings.testimonials.filter(t => t.approved).length > 0 
    ? settings.testimonials.filter(t => t.approved) 
    : defaultTestimonials;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.phone || !bookingForm.email) {
      toast.error('Por favor, preencha os campos obrigatórios (Nome, WhatsApp e E-mail).');
      return;
    }

    const newRegistration: PublicRegistration = {
      id: Math.random().toString(36).substring(2, 11),
      name: bookingForm.name,
      phone: bookingForm.phone,
      email: bookingForm.email,
      birthDate: bookingForm.birthDate || 'Não informada',
      gender: bookingForm.gender,
      notes: bookingForm.notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
      userId: 'clinic_settings', // Saved directly related to settings admin
    };

    try {
      await addPublicRegistration(newRegistration);
      setIsBookingModalOpen(false);
      setBookingForm({
        name: '',
        phone: '',
        email: '',
        birthDate: '',
        gender: 'Prefiro não dizer',
        notes: '',
      });
      
      // WhatsApp notification
      const message = `Olá! Acabei de solicitar um agendamento de atendimento através do site comercial.%0D%0ANome: ${bookingForm.name}%0D%0AWhatsApp: ${bookingForm.phone}%0D%0AE-mail: ${bookingForm.email}`;
      const cleanWhatsapp = settings.whatsapp ? settings.whatsapp.replace(/\D/g, '') : '31999215840';
      
      toast.success('Agendamento solicitado com sucesso!');
      setTimeout(() => {
        window.open(`https://wa.me/55${cleanWhatsapp}?text=${message}`, '_blank');
      }, 1500);
    } catch (err) {
      toast.error('Erro ao enviar solicitação.');
    }
  };

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.patientName || !testimonialForm.content) {
      toast.error('Por favor, preencha seu nome/iniciais e o depoimento.');
      return;
    }

    const newTestimonial: Testimonial = {
      id: Math.random().toString(36).substring(2, 11),
      patientName: testimonialForm.patientName,
      content: testimonialForm.content,
      rating: testimonialForm.rating,
      date: new Date().toLocaleDateString('pt-BR'),
      approved: false // Pending admin approval
    };

    const currentTestimonials = settings.testimonials || [];
    const updatedTestimonials = [...currentTestimonials, newTestimonial];

    try {
      // We will tell the user that the testimonial has been submitted and is awaiting approval
      // In this app environment, the public can request to save, but write to settings is only allowed by Admin.
      // To bypass, we can save the testimonial as a temporary/local or we can notify the user that to preserve privacy, Bruno will add it shortly, 
      // OR let the user submit it through localStorage, OR if Bruno saves it.
      // Wait, let's store it locally and generate a nice message, OR if they copy/paste, or we can send it directly to Bruno on WhatsApp/email!
      // Sending it on WhatsApp is elegant, secure, and preserves medical privacy! Let's do that!
      const message = `Olá Bruno! Gostaria de enviar meu depoimento paciente-clínico para o site:%0D%0A%0D%0ANome: ${testimonialForm.patientName}%0D%0AEstrelas: ${'★'.repeat(testimonialForm.rating)}%0D%0ADepoimento: "${testimonialForm.content}"`;
      const cleanWhatsapp = settings.whatsapp ? settings.whatsapp.replace(/\D/g, '') : '31999215840';
      
      toast.success('Incrível! Abrindo WhatsApp para enviar seu depoimento com segurança.');
      setIsTestimonialModalOpen(false);
      setTestimonialForm({ patientName: '', content: '', rating: 5 });
      
      setTimeout(() => {
        window.open(`https://wa.me/55${cleanWhatsapp}?text=${message}`, '_blank');
      }, 1500);
    } catch (err) {
      toast.error('Ocorreu um problema ao enviar o depoimento.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      
      {/* Premium Header Nav Bar */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-md shadow-emerald-700/20">
              Ψ
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-slate-900 font-display">
                {settings.clinicName || 'Clínica Bruno Lisboa'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                {settings.specialty || 'Psicanálise Clínica & Neuropsicanálise'}
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#sobre" className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors">Sobre</a>
            <a href="#cursos" className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors">Meus Cursos</a>
            <a href="#atendimentos" className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors">Atendimentos</a>
            <a href="#depoimentos" className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors">Depoimentos</a>
            
            <button 
              onClick={() => setIsBookingModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-700 text-white rounded-full text-sm font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/10"
            >
              Agendar Consulta
            </button>

            <Link 
              to="/login" 
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200/80 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-100/50 transition-all"
            >
              <Lock size={12} />
              Acesso Admin
            </Link>
          </div>

          {/* Quick Booking Button for Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={() => setIsBookingModalOpen(true)}
              className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-full hover:bg-emerald-800 transition-colors"
            >
              Agendar
            </button>
            <Link 
              to="/login" 
              className="p-2 border border-slate-200 text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title="Admin Access"
            >
              <Lock size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Intro Section */}
      <section className="pt-36 pb-20 px-6 bg-gradient-to-b from-white via-slate-50 to-slate-50 rounded-b-[2.5rem]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Award size={14} />
              {settings.specialty || 'Psicanálise Clínica & Neuropsicanálise'}
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight font-display">
              {settings.professionalName || 'Bruno Lisboa'}
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl font-normal">
              Ofereço formações aprofundadas sobre o comportamento da mente humana e conduzo atendimentos terapêuticos online e presenciais, integrando a escuta psicanalítica com descobertas da neurociência.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <a 
                href="#cursos"
                className="px-8 py-4 bg-emerald-700 text-white rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-700/25 flex items-center gap-2 group text-sm"
              >
                Ver Cursos Online
                <BookOpen size={18} className="group-hover:translate-y-0.5 transition-transform" />
              </a>
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm"
              >
                <CalendarCheck size={18} className="text-emerald-700" />
                Agendar Consulta
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative justify-self-center lg:justify-self-end w-full max-w-md"
          >
            <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl relative border-4 border-white">
              <img 
                src={settings.heroImageUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"} 
                alt={settings.professionalName || 'Bruno Lisboa'} 
                className="w-full h-full object-cover bg-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
            </div>
            
            {/* Quick Promo Card overlay */}
            <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl border border-slate-100/80 hidden xs:flex items-center gap-4 max-w-[280px]">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 shrink-0">
                <Video size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Atendimentos Virtuais</p>
                <p className="text-[11px] text-slate-500 font-medium">Disponível em todo o mundo através de canais criptografados</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Specialty Highlights bar */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-700 shrink-0">
                <Globe2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-950 font-display text-sm">Escopo Global</h4>
                <p className="text-xs text-slate-500 font-medium">Alunos e pacientes em mais de 10 países de língua portuguesa.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-700 shrink-0">
                <Users2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-950 font-display text-sm">Metodologia Exclusiva</h4>
                <p className="text-xs text-slate-500 font-medium">Integração lógica da psicanálise com descobertas biológicas das neurociências.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-700 shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-950 font-display text-sm">Prática Comprovada</h4>
                <p className="text-xs text-slate-500 font-medium">Centenas de horas de mentoria académica e atendimento individualizado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Biography */}
      <section id="sobre" className="py-24 px-6 max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-3">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Trajetória e Propósito</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">Sobre o Profissional</h2>
          <div className="w-12 h-1 bg-emerald-700 mx-auto rounded-full" />
        </div>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-serif max-w-3xl mx-auto italic">
          "{settings.bio || 'Busco clarificar as dinâmicas inconscientes do psiquismo humano junto aos meus analisandos, ao mesmo tempo em que capacito profissionais de saúde e humanidades com conhecimentos robustos ligando neurociência e mente.'}"
        </p>
        <div className="flex justify-center gap-3 text-sm text-slate-500 pt-4">
          <span className="font-semibold text-slate-800">Bruno Lisboa</span>
          <span>•</span>
          <span>Especialista Clínico</span>
          <span>•</span>
          <span>Escritor e Mentor</span>
        </div>
      </section>

      {/* Courses Section */}
      <section id="cursos" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Ensino e Capacitação</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">Cursos & Formações Online</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm">
              Adquira competência clínica e acadêmica em módulos gravados focados na mente humana, com suporte vitalício e certificação.
            </p>
            <div className="w-12 h-1 bg-emerald-700 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {displayedCourses.map((course, idx) => (
              <motion.div 
                key={course.id || idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:scale-[1.01] transition-all group"
              >
                <div>
                  <div className="aspect-[16/9] w-full bg-slate-200 overflow-hidden relative">
                    {course.imageUrl ? (
                      <img 
                        src={course.imageUrl} 
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <BookOpen size={48} />
                      </div>
                    )}
                    <span className="absolute top-4 right-4 px-4 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-950/20">
                      Investimento: {course.price}
                    </span>
                  </div>
                  
                  <div className="p-8 space-y-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display group-hover:text-emerald-700 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>

                <div className="px-8 pb-8 pt-4">
                  <a 
                    href={course.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center block hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Inscrever-se no Curso</span>
                    <ChevronRight size={14} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Consultations Mode and Scheduling Request */}
      <section id="atendimentos" className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">
          
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Processo Terapêutico</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display leading-tight">
                Atendimentos Clínicos & Psicanálise
              </h2>
              <div className="w-12 h-1 bg-emerald-700 rounded-full" />
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed">
              As sessões são organizadas de modo a investigar os sintomas, conflitos inconscientes, traumas da infância e dinâmicas inconscientes que regem sua ansiedade ou estresse.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl text-emerald-700 flex items-center justify-center shrink-0">
                  <Video size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Sessões Online Integradas</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Realizadas por plataformas de alta segurança em vídeo, ideais para pacientes de todos os estados e residentes no exterior.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl text-emerald-700 flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Sessões Presenciais</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Disponíveis sob consulta em ambiente reservado, confortável e pautado pelo absoluto sigilo profissional.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="px-6 py-4.5 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-700/10 flex items-center gap-2"
              >
                <Plus size={16} />
                Solicitar Consulta Diagnóstica
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-100/80 space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-950 font-display">Inicie sua Jornada Analítica</h3>
              <p className="text-xs text-slate-500 font-medium">Preencha o formulário abaixo e entrarei em contato diretamente via WhatsApp ou e-mail.</p>
            </div>

            <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo *</label>
                <input 
                  type="text" 
                  required
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 Focus:bg-white focus:outline-none focus:border-emerald-700 transition-all text-sm" 
                  placeholder="Seu nome" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp com DDD *</label>
                <input 
                  type="tel" 
                  required
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:border-emerald-700 transition-all text-sm" 
                  placeholder="(00) 00000-0000" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seu Melhor E-mail *</label>
                <input 
                  type="email" 
                  required
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:border-emerald-700 transition-all text-sm" 
                  placeholder="exemplo@email.com" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data de Nascimento</label>
                <input 
                  type="text" 
                  placeholder="DD/MM/AAAA"
                  value={bookingForm.birthDate}
                  onChange={(e) => setBookingForm({...bookingForm, birthDate: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:border-emerald-700 transition-all text-sm" 
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mensagem curta / Sua Queixa Inicial</label>
                <textarea 
                  rows={3} 
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:border-emerald-700 transition-all text-sm resize-none" 
                  placeholder="Comente brevemente o que te levou a buscar terapia (opcional)..." 
                />
              </div>

              <button 
                type="submit"
                className="sm:col-span-2 py-4 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-800 transition-all shadow-md shadow-emerald-700/15 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                Solicitar Agendamento
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Partilhas e Vivências</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">Depoimentos de Pacientes & Alunos</h2>
              <p className="text-slate-500 max-w-xl text-xs">
                Escrita espontânea de quem passou pela clínica ou pelas formações, preservando o sigilo e anonimato ético do setting terapêutico.
              </p>
              <div className="w-12 h-1 bg-emerald-700 rounded-full" />
            </div>

            <button 
              onClick={() => setIsTestimonialModalOpen(true)}
              className="px-5 py-3 border border-emerald-700 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center gap-2 self-start md:self-auto shrink-0"
            >
              <MessageCircle size={16} />
              Enviar Depoimento
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedTestimonials.map((testimonial) => (
              <motion.div 
                key={testimonial.id}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-shadow relative"
              >
                <Quote size={40} className="text-slate-200 absolute top-6 right-6 pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed font-serif italic">
                    "{testimonial.content}"
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                  <span className="font-bold text-xs text-slate-900 font-display">{testimonial.patientName}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{testimonial.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Professional Footer */}
      <footer className="py-16 bg-slate-900 text-white px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl">
                Ψ
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white font-display">
                  {settings.clinicName || 'Clínica Bruno Lisboa'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {settings.specialty || 'Psicanálise Clínica & Neuropsicanálise'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-sm">
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <Mail size={16} className="text-emerald-500" />
                  {settings.email}
                </a>
              )}
              {settings.whatsapp && (
                <a href={`https://wa.me/55${settings.whatsapp.replace(/\D/g, '')}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <Phone size={16} className="text-emerald-500" />
                  {settings.whatsapp}
                </a>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-xs text-slate-500">
            <p className="text-slate-400">
              © {new Date().getFullYear()} {settings.clinicName || 'Clínica Bruno Lisboa'}. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <Link to="/login" className="text-slate-400 hover:text-emerald-400 transition-colors">Acesso Administrativo</Link>
              <span>•</span>
              <span className="text-slate-500 font-medium">Conselho Ético Auto-regulado</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Dynamic CTA Floating Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {settings.whatsapp && (
          <a
            href={`https://wa.me/55${settings.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-700 transition-colors"
            title="WhatsApp Comercial"
          >
            <MessageCircle size={28} fill="currentColor" />
          </a>
        )}
      </div>

      {/* POPUP MODAL: Booking Consultation */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="text-emerald-700" size={20} />
                  <h3 className="text-lg font-bold text-slate-900 font-display">Solicitar Agendamento</h3>
                </div>
                <button 
                  onClick={() => setIsBookingModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo *</label>
                  <input 
                    type="text" 
                    required
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-sm" 
                    placeholder="Seu nome completo" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp com DDD *</label>
                    <input 
                      type="tel" 
                      required
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-sm" 
                      placeholder="(00) 00000-0000" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail *</label>
                    <input 
                      type="email" 
                      required
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-sm" 
                      placeholder="exemplo@email.com" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data de Nascimento</label>
                    <input 
                      type="text" 
                      placeholder="DD/MM/AAAA"
                      value={bookingForm.birthDate}
                      onChange={(e) => setBookingForm({...bookingForm, birthDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-sm" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gênero</label>
                    <select 
                      value={bookingForm.gender}
                      onChange={(e) => setBookingForm({...bookingForm, gender: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-sm cursor-pointer"
                    >
                      <option value="Prefiro não dizer">Prefiro não dizer</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mensagem curta / Sua Queixa Inicial</label>
                  <textarea 
                    rows={3} 
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-sm resize-none" 
                    placeholder="Nos conte brevemente como posso ajudar..." 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase hover:bg-emerald-800 transition-colors"
                  >
                    Agendar No WhatsApp
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: Patient Testimonial submission */}
      <AnimatePresence>
        {isTestimonialModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="text-emerald-700" size={20} />
                  <h3 className="text-lg font-bold text-slate-900 font-display">Enviar Depoimento</h3>
                </div>
                <button 
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleTestimonialSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seu Nome ou Iniciais *</label>
                  <input 
                    type="text" 
                    required
                    value={testimonialForm.patientName}
                    onChange={(e) => setTestimonialForm({...testimonialForm, patientName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-sm" 
                    placeholder="Ex: Adriana S. Ou A.S. (para manter sigilo)" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sua Avaliação *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTestimonialForm({...testimonialForm, rating: star})}
                        className="text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star size={24} fill={star <= testimonialForm.rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Depoimento *</label>
                  <textarea 
                    rows={4} 
                    required
                    value={testimonialForm.content}
                    onChange={(e) => setTestimonialForm({...testimonialForm, content: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-sm resize-none" 
                    placeholder="Escreva sua experiência com a terapia ou cursos..." 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsTestimonialModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase hover:bg-emerald-800 transition-colors"
                  >
                    Compartilhar Depoimento
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
