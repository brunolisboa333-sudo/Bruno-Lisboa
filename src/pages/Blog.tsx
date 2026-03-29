import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Calendar, 
  BookOpen, 
  ArrowLeft,
  Search,
  Sparkles
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import { useState } from 'react';

export default function Blog() {
  const { settings, posts } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');

  const publishedPosts = posts.filter(p => 
    p.status === 'published' && 
    new Date(p.publishedAt || '') <= new Date()
  );

  const filteredPosts = publishedPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              Ψ
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">{settings.clinicName || 'Clínica de Psicologia'}</span>
          </Link>
          
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar ao Início
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight font-display">
              Blog & Insights
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Explorando as profundezas da mente humana através da Neuropsicanálise e Psicanálise Clínica.
            </p>
          </motion.div>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar artigos, temas ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredPosts.map((post, index) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col"
                >
                  <Link to={`/blog/${post.id}`} className="aspect-[16/10] overflow-hidden block">
                    <img 
                      src={post.imageUrl} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <div className="p-8 space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full w-fit">
                      <Sparkles size={10} className="text-emerald-500" />
                      Tema: {post.excerpt.split('.')[0].slice(0, 40)}...
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 font-display">
                      <Link to={`/blog/${post.id}`}>{post.title}</Link>
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed flex-1">
                      {post.excerpt}
                    </p>
                    <Link 
                      to={`/blog/${post.id}`}
                      className="pt-6 flex items-center gap-2 text-emerald-600 font-bold text-sm group/btn mt-auto"
                    >
                      Ler artigo completo
                      <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="text-center py-40 space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <BookOpen size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Nenhum artigo encontrado</h3>
                <p className="text-slate-500">Tente buscar por outros termos ou temas.</p>
              </div>
              <button 
                onClick={() => setSearchTerm('')}
                className="text-emerald-600 font-bold hover:underline"
              >
                Limpar busca
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              Ψ
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">{settings.clinicName}</span>
          </div>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Compartilhando conhecimento para uma vida emocional mais equilibrada e consciente.
          </p>
          <div className="flex justify-center gap-8">
            <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors">Instagram</a>
            <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors">LinkedIn</a>
          </div>
          <p className="text-slate-400 text-xs pt-8 border-t border-slate-200">
            © 2026 {settings.clinicName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
