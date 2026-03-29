import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  BookOpen, 
  Users,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { useState } from 'react';

export default function LandingPage() {
  const { settings, user, userProfile, posts, isAdmin } = useStorage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Data não disponível';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        {/* Top Info Bar */}
        <div className="bg-slate-900 text-slate-300 py-1.5 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] sm:text-xs font-medium uppercase tracking-wider">
            <div className="flex items-center gap-4 sm:gap-6">
              {settings.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Phone size={12} className="text-emerald-500" />
                  <span className="hidden xs:inline">{settings.whatsapp}</span>
                  <span className="xs:hidden">WhatsApp</span>
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Mail size={12} className="text-emerald-500" />
                  <span className="hidden sm:inline">{settings.email}</span>
                  <span className="sm:hidden">E-mail</span>
                </a>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-slate-500">Neuropsicanálise & Psicanálise Clínica</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              Ψ
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">{settings.clinicName || 'Clínica de Psicologia'}</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#sobre" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Sobre</a>
            <a href="#especialidades" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Especialidades</a>
            <Link to="/blog" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Blog</Link>
            <a href="#contato" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Contato</a>
            
            {isAdmin ? (
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                <LayoutDashboard size={18} />
                Painel de Controle
              </Link>
            ) : !user ? (
              <Link 
                to="/login" 
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-50 transition-all"
              >
                <ShieldCheck size={18} />
                Acesso Restrito
              </Link>
            ) : null}
          </div>

          {/* Mobile Menu Button & Quick Access */}
          <div className="flex items-center gap-2 md:hidden">
            {isAdmin ? (
              <Link 
                to="/dashboard" 
                className="p-2 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-200"
                title="Painel de Controle"
              >
                <LayoutDashboard size={20} />
              </Link>
            ) : !user ? (
              <Link 
                to="/login" 
                className="p-2 border border-slate-200 text-slate-600 rounded-lg"
                title="Acesso Restrito"
              >
                <ShieldCheck size={20} />
              </Link>
            ) : null}
            
            <button 
              className="p-2 text-slate-600 hover:text-emerald-600 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b border-slate-100 p-6 space-y-4"
          >
            <a 
              href="#sobre" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-base font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Sobre
            </a>
            <a 
              href="#especialidades" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-base font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Especialidades
            </a>
            <Link 
              to="/blog" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-base font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Blog
            </Link>
            <a 
              href="#contato" 
              onClick={() => setIsMenuOpen(false)}
              className="block text-base font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Contato
            </a>
            
            <div className="pt-4 border-t border-slate-100">
              {isAdmin ? (
                <Link 
                  to="/dashboard" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all"
                >
                  <LayoutDashboard size={18} />
                  Painel de Controle
                </Link>
              ) : !user ? (
                <Link 
                  to="/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  <ShieldCheck size={18} />
                  Acesso Restrito
                </Link>
              ) : null}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <Award size={14} />
              Neuropsicanálise & Psicanálise Clínica
            </div>
            <h1 className="text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              {settings.professionalName || 'Bruno Lisboa'}
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
              Oferecendo um espaço seguro e acolhedor para o seu desenvolvimento pessoal e bem-estar emocional. Especialista em Neuropsicanálise e Psicanálise Clínica.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a 
                href="#contato"
                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center gap-2 group"
              >
                Agendar Consulta
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#sobre" className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                Conheça meu trabalho
              </a>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl">
              <img 
                src="https://picsum.photos/seed/psychology/800/1000" 
                alt="Bruno Lisboa" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hidden md:block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Atendimento Online</p>
                  <p className="text-xs text-slate-500 text-nowrap">Disponível para todo o Brasil</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Anos de Experiência', value: '10+' },
              { label: 'Pacientes Atendidos', value: '500+' },
              { label: 'Sessões Realizadas', value: '5k+' },
              { label: 'Especialidades', value: '8' },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <p className="text-4xl font-bold text-emerald-600">{stat.value}</p>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="sobre" className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">Sobre Bruno Lisboa</h2>
            <div className="w-20 h-1.5 bg-emerald-600 mx-auto rounded-full" />
          </div>
          <p className="text-xl text-slate-600 leading-relaxed italic font-serif">
            "{settings.bio || 'Acredito que a psicoterapia é uma jornada de autodescoberta. Meu papel é caminhar ao seu lado, oferecendo as ferramentas necessárias para que você possa enfrentar seus desafios e viver uma vida mais plena e autêntica.'}"
          </p>
          <div className="grid md:grid-cols-2 gap-8 text-left pt-8">
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Formação Acadêmica</h3>
              <p className="text-slate-600 leading-relaxed">
                Especialista em Neuropsicanálise e Psicanálise Clínica, com foco na integração entre os processos neurais e a subjetividade humana.
              </p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Abordagem Clínica</h3>
              <p className="text-slate-600 leading-relaxed">
                Atendimento humanizado que une a profundidade da psicanálise clássica com os avanços contemporâneos da neurociência.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section id="especialidades" className="py-32 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">Especialidades</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Tratamentos focados na compreensão profunda da mente e do cérebro.</p>
            <div className="w-20 h-1.5 bg-emerald-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Neuropsicanálise', desc: 'Integração de conceitos neurocientíficos com a teoria psicanalítica para entender o funcionamento mental.' },
              { title: 'Psicanálise Clínica', desc: 'Exploração do inconsciente para tratar conflitos emocionais, traumas e padrões repetitivos.' },
              { title: 'Ansiedade e Depressão', desc: 'Abordagem profunda para compreender as raízes do sofrimento emocional contemporâneo.' },
              { title: 'Conflitos Existenciais', desc: 'Auxílio na busca por sentido e na superação de crises de identidade ou transições de vida.' },
              { title: 'Relacionamentos', desc: 'Trabalho sobre os vínculos afetivos e as dinâmicas interpessoais que geram sofrimento.' },
              { title: 'Autoconhecimento', desc: 'Um processo de descoberta das próprias motivações e desejos para uma vida mais autêntica.' },
            ].map((spec, i) => (
              <div key={i} className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4">
                <h3 className="text-xl font-bold text-slate-900">{spec.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{spec.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-32 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-slate-900">Blog & Insights</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Acompanhe artigos sobre saúde mental, psicanálise e bem-estar emocional.</p>
            <div className="w-20 h-1.5 bg-emerald-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts
              .filter(p => p.status === 'published' && new Date(p.publishedAt || '') <= new Date())
              .slice(0, 3)
              .map((post) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <Link to={`/blog/${post.id}`} className="aspect-[16/10] overflow-hidden block">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    <Link to={`/blog/${post.id}`}>{post.title}</Link>
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <Link to={`/blog/${post.id}`} className="pt-4 flex items-center gap-2 text-emerald-600 font-bold text-sm group/btn">
                    Ler artigo completo
                    <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

          {posts.filter(p => p.status === 'published' && new Date(p.publishedAt || '') <= new Date()).length > 3 && (
            <div className="text-center pt-12">
              <Link 
                to="/blog"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
              >
                Ver todos os artigos
                <ChevronRight size={20} />
              </Link>
            </div>
          )}

          {posts.filter(p => p.status === 'published' && new Date(p.publishedAt || '') <= new Date()).length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
              <p>Novos artigos em breve. Fique atento!</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section id="contato" className="py-32 bg-slate-900 text-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-5xl font-bold">Vamos conversar?</h2>
                <p className="text-slate-400 text-xl">Estou à disposição para tirar suas dúvidas e agendar sua primeira sessão.</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 uppercase font-bold tracking-widest">Telefone / WhatsApp</p>
                    <p className="text-xl font-medium">{settings.whatsapp || '31 999215840'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 uppercase font-bold tracking-widest">E-mail</p>
                    <p className="text-xl font-medium">{settings.email || 'brunolisboa333@gmail.com'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 uppercase font-bold tracking-widest">Localização</p>
                    <p className="text-xl font-medium">Atendimentos Online e Presencial</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl border border-white/10 space-y-8">
              <h3 className="text-2xl font-bold">Envie uma mensagem</h3>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                  <input type="text" className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">E-mail</label>
                  <input type="email" className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Mensagem</label>
                  <textarea rows={4} className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-colors resize-none" placeholder="Como posso te ajudar?" />
                </div>
                <button className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20">
                  Enviar Mensagem
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-8">
          <p className="text-slate-500 text-sm">
            © 2026 {settings.clinicName || 'Clínica Bruno Lisboa'}. Todos os direitos reservados.
          </p>
          <div className="flex gap-8">
            <Link to="/login" className="text-slate-400 hover:text-emerald-600 transition-colors">Acesso Administrativo</Link>
            <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors">Instagram</a>
            <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors">LinkedIn</a>
            <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors">Facebook</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
