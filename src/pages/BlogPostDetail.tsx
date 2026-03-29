import { motion } from 'motion/react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Calendar, 
  ArrowLeft,
  Share2,
  Clock,
  Sparkles,
  User
} from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function BlogPostDetail() {
  const { id } = useParams<{ id: string }>();
  const { settings, posts } = useStorage();

  const post = posts.find(p => p.id === id);

  if (!post) {
    return <Navigate to="/blog" />;
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copiado para a área de transferência!');
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
            to="/blog" 
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar ao Blog
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20">
        <div className="aspect-[21/9] w-full bg-slate-100 relative overflow-hidden">
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
          <div className="absolute bottom-12 left-0 right-0 px-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full uppercase tracking-widest">
                  {post.category}
                </span>
                <span className="px-4 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Sparkles size={12} />
                  Tema: {post.excerpt.split('.')[0].slice(0, 50)}...
                </span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight tracking-tight font-display">
                {post.title}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-4 gap-12">
          {/* Sidebar Info */}
          <aside className="lg:col-span-1 space-y-8">
            <div className="p-6 bg-slate-50 rounded-3xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                  {post.authorName?.charAt(0) || 'B'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{post.authorName}</p>
                  <p className="text-xs text-slate-500">Autor do Artigo</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <Calendar size={18} />
                  {new Date(post.publishedAt || '').toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <Clock size={18} />
                  10 min de leitura
                </div>
              </div>

              <button 
                onClick={handleShare}
                className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <Share2 size={18} />
                Compartilhar
              </button>
            </div>

            <div className="p-6 border border-slate-100 rounded-3xl space-y-4">
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-widest">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-12">
            <div className="markdown-body max-w-none">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>

            <div className="pt-12 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <User size={20} />
                </div>
                <p className="text-sm font-medium text-slate-500">Escrito por {post.authorName}</p>
              </div>
              <Link 
                to="/blog"
                className="text-emerald-600 font-bold text-sm flex items-center gap-2 hover:underline"
              >
                Ver mais artigos
                <ChevronRight size={18} />
              </Link>
            </div>
          </main>
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
          <p className="text-slate-400 text-xs pt-8 border-t border-slate-200">
            © 2026 {settings.clinicName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
