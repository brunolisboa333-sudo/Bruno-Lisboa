import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Brain, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Send, 
  Loader2, 
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Calendar as CalendarIcon,
  Clock,
  Save,
  Edit3,
  ChevronLeft,
  ChevronRight,
  X,
  Key,
  Globe,
  BookOpen,
  Settings as SettingsIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, Type } from "@google/genai";
import { useStorage } from '../hooks/useStorage';
import { BlogPost } from '../types';
import { toast } from 'sonner';

import { cn } from '../lib/utils';

const POSTS_PER_PAGE = 6;

export default function AIBrain() {
  const { posts, savePost, deletePost, user, userProfile, settings, saveSettings } = useStorage();
  const [activeTab, setActiveTab] = useState<'generator' | 'settings'>('generator');
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState<Partial<BlogPost> | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  
  // Ensure we always have 9 slots for keys
  const [tempKeys, setTempKeys] = useState<string[]>(() => {
    const savedKeys = settings.geminiKeys || [];
    const filled = [...savedKeys];
    while (filled.length < 9) filled.push('');
    return filled.slice(0, 9);
  });

  useEffect(() => {
    const savedKeys = settings.geminiKeys || [];
    const filled = [...savedKeys];
    while (filled.length < 9) filled.push('');
    setTempKeys(filled.slice(0, 9));
  }, [settings.geminiKeys]);

  const getAIInstance = () => {
    const keys = settings.geminiKeys?.filter(k => k.trim() !== '') || [];
    // Pick a random key or fallback to env
    const selectedKey = keys.length > 0 
      ? keys[Math.floor(Math.random() * keys.length)] 
      : process.env.GEMINI_API_KEY;
    
    if (!selectedKey) {
      throw new Error('Nenhuma chave de API configurada.');
    }
    
    return new GoogleGenAI({ apiKey: selectedKey });
  };

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));

  const generateBlogContent = async () => {
    if (!topic) {
      toast.error('Por favor, insira um tema ou tópico.');
      return;
    }

    if (!user) {
      toast.error('Você precisa estar logado para gerar conteúdo.');
      return;
    }

    setIsGenerating(true);
    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Gere um post de blog profundamente humano, empático e acolhedor sobre o tema: "${topic}". 
        O conteúdo deve ser em Português do Brasil, focado em psicologia e psicanálise clínica, sob a perspectiva do profissional Bruno Lisboa.
        
        Instruções de Tom e Estilo:
        - O tom deve ser menos formal, agindo como uma conversa próxima e segura com o leitor.
        - Use uma linguagem empática que valide os sentimentos do leitor, evitando termos excessivamente técnicos sem explicação.
        - O texto deve ser longo, detalhado e transformador (mínimo 1000 palavras).
        
        Instruções de Formatação (Markdown Rico):
        - Use títulos (## **Título**) e subtítulos (### **Subtítulo**) SEMPRE em negrito para destaque máximo.
        - Separe os parágrafos com clareza (use duas quebras de linha entre eles).
        - Utilize listas com marcadores para facilitar a leitura.
        - Use negrito para destacar conceitos chave dentro do texto.
        - Inclua citações em bloco (> ) para frases reflexivas ou insights profundos.
        - Use linhas horizontais (---) para separar grandes seções.
        - Crie uma introdução que gere identificação imediata e uma conclusão que deixe um convite à reflexão ou ação.
        
        Retorne um JSON com os seguintes campos:
        - title: Um título humano, sensível e impossível de ignorar
        - excerpt: Um resumo acolhedor que resuma a essência do texto
        - content: O conteúdo completo formatado em Markdown impecável
        - category: Uma categoria relevante
        - tags: Um array de 5 tags estratégicas`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["title", "excerpt", "content", "category", "tags"],
          },
        },
      });

      const data = JSON.parse(response.text);
      
      // Generate Image Prompt
      const imagePromptResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Crie um prompt em inglês extremamente detalhado para geração de imagem artística e emocional para um post de blog intitulado: "${data.title}". 
        A imagem deve ser poética, com composição cinematográfica, usando cores suaves e texturas orgânicas. 
        O estilo deve ser "contemporary fine art photography", com foco em elementos simbólicos que representem o tema de forma sutil e profunda (ex: luz atravessando uma janela, mãos acolhedoras, elementos da natureza, espaços de calma). 
        Evite imagens literais de consultórios ou pessoas sofrendo. Busque clareza, esperança e profundidade visual.`,
      });

      const imagePrompt = imagePromptResponse.text;

      // Generate Image
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: imagePrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      let imageUrl = '';
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      const newPost: BlogPost = {
        ...data,
        id: crypto.randomUUID(),
        imageUrl,
        status: 'draft',
        authorId: user.uid,
        authorName: userProfile?.displayName || 'Bruno Lisboa',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await savePost(newPost);
      setGeneratedContent(newPost);
      setIsEditing(false);

      toast.success('Conteúdo gerado e salvo como rascunho!');
    } catch (error) {
      console.error('Erro na geração de IA:', error);
      toast.error('Falha ao gerar conteúdo. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (isScheduled = false) => {
    if (!generatedContent || !user) return;

    if (isScheduled && !scheduledDate) {
      toast.error('Por favor, selecione uma data e hora para o agendamento.');
      return;
    }

    const publishDate = isScheduled ? new Date(scheduledDate).toISOString() : new Date().toISOString();
    
    const newPost: BlogPost = {
      ...generatedContent as BlogPost,
      id: generatedContent.id || crypto.randomUUID(),
      status: 'published',
      publishedAt: publishDate,
      authorId: (generatedContent as BlogPost).authorId || user.uid,
      createdAt: (generatedContent as BlogPost).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await savePost(newPost);
    setGeneratedContent(null);
    setTopic('');
    setScheduledDate('');
    setShowScheduler(false);
    setIsEditing(false);
    toast.success(isScheduled ? 'Post agendado com sucesso!' : 'Post publicado com sucesso!');
  };

  const handleSaveDraft = async () => {
    if (!generatedContent || !user) return;

    const draftPost: BlogPost = {
      ...generatedContent as BlogPost,
      id: generatedContent.id || crypto.randomUUID(),
      status: 'draft',
      publishedAt: undefined,
      authorId: (generatedContent as BlogPost).authorId || user.uid,
      createdAt: (generatedContent as BlogPost).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await savePost(draftPost);
    setGeneratedContent(null);
    setTopic('');
    setIsEditing(false);
    toast.success('Rascunho salvo com sucesso!');
  };

  const handleUpdate = async () => {
    if (!generatedContent || !generatedContent.id) return;
    
    const updatedPost: BlogPost = {
      ...generatedContent as BlogPost,
      updatedAt: new Date().toISOString()
    };

    await savePost(updatedPost);
    setGeneratedContent(null);
    setTopic('');
    setIsEditing(false);
    toast.success('Alterações salvas com sucesso!');
  };

  const handleEdit = (post: BlogPost) => {
    setGeneratedContent(post);
    setIsEditing(true);
    setTopic(''); // Clear topic to avoid confusion
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setGeneratedContent(null);
    setIsEditing(false);
    setTopic('');
  };

  const handleSaveKeys = async () => {
    await saveSettings({ ...settings, geminiKeys: tempKeys });
    toast.success('Chaves de API salvas com sucesso!');
    setActiveTab('generator');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Brain className="text-emerald-500" />
            Cérebro de IA
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Alimente seu site com conteúdo inteligente e moderno.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start">
          <button
            onClick={() => setActiveTab('generator')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'generator' 
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <Sparkles size={18} />
            Gerador
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'settings' 
                ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <Key size={18} />
            Chaves API
          </button>
        </div>
      </div>

      {activeTab === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-2">
              {isEditing ? <Edit3 size={20} /> : <Sparkles size={20} />}
              {isEditing ? 'Editando Post' : 'Gerador de Conteúdo'}
            </div>
            
            {!isEditing ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tema ou Tópico</label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: A importância da psicanálise no mundo moderno..."
                    className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white resize-none"
                  />
                </div>

                {(!settings.geminiKeys || settings.geminiKeys.filter(k => k.trim() !== '').length === 0) && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <Key size={14} />
                      Nenhuma chave API configurada. Vá em "Chaves API" para configurar.
                    </p>
                  </div>
                )}

                <button
                  onClick={generateBlogContent}
                  disabled={isGenerating || !topic}
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-100 dark:shadow-none"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Gerar Post Completo
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Você está editando um post existente. Use o painel ao lado para fazer as alterações.
                </p>
                <button
                  onClick={handleCancelEdit}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <Plus size={20} />
                  Criar Novo Post
                </button>
              </div>
            )}
          </div>

          {/* Stats or Tips */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <Brain size={18} className="text-emerald-400" />
              Dica da IA
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Tente ser específico nos temas. Em vez de "Ansiedade", use "Como a psicanálise aborda a ansiedade em jovens adultos". Isso gera resultados mais profundos.
            </p>
          </div>
        </div>

        {/* Preview / Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {generatedContent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 overflow-hidden shadow-xl"
            >
              <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative">
                {generatedContent.imageUrl && (
                  <img 
                    src={generatedContent.imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest self-start">
                    {generatedContent.category}
                  </span>
                  <span className="px-3 py-1 bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-medium rounded-full flex items-center gap-1 self-start">
                    <Sparkles size={10} />
                    Tema: {topic || "Neuropsicanálise Clínica"}
                  </span>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título do Artigo</label>
                    <input
                      type="text"
                      value={generatedContent.title}
                      onChange={(e) => setGeneratedContent({ ...generatedContent, title: e.target.value })}
                      className="w-full text-2xl font-bold bg-transparent border-b border-transparent focus:border-emerald-500 outline-none text-slate-900 dark:text-white transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumo (Excerpt)</label>
                    <textarea
                      value={generatedContent.excerpt}
                      onChange={(e) => setGeneratedContent({ ...generatedContent, excerpt: e.target.value })}
                      rows={2}
                      className="w-full text-slate-600 dark:text-slate-300 italic border-l-4 border-emerald-500 pl-4 bg-transparent outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conteúdo (Markdown)</label>
                    <textarea
                      value={generatedContent.content}
                      onChange={(e) => setGeneratedContent({ ...generatedContent, content: e.target.value })}
                      rows={15}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-700 dark:text-slate-300 font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tags (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={generatedContent.tags?.join(', ')}
                      onChange={(e) => setGeneratedContent({ ...generatedContent, tags: e.target.value.split(',').map(t => t.trim()) })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {isEditing ? (
                      <button
                        onClick={handleUpdate}
                        className="py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
                      >
                        <Save size={20} />
                        Salvar Alterações
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(false)}
                        className="py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
                      >
                        <CheckCircle2 size={20} />
                        Publicar Agora
                      </button>
                    )}
                    <button
                      onClick={() => setShowPreview(true)}
                      className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      <Eye size={20} />
                      Pré-visualizar
                    </button>
                    {!isEditing && (
                      <button
                        onClick={handleSaveDraft}
                        className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        <Save size={20} />
                        Salvar Rascunho
                      </button>
                    )}
                    {isEditing && (
                      <button
                        onClick={handleCancelEdit}
                        className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        <X size={20} />
                        Cancelar
                      </button>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => setShowScheduler(!showScheduler)}
                        className={cn(
                          "py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border",
                          showScheduler 
                            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" 
                            : "bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        )}
                      >
                        <CalendarIcon size={20} />
                        Programar
                      </button>
                    )}
                  </div>

                  {showScheduler && !isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                        <Clock size={16} className="text-blue-500" />
                        Selecione a Data e Hora de Publicação
                      </div>
                      <div className="flex gap-4">
                        <input
                          type="datetime-local"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        />
                        <button
                          onClick={() => handlePublish(true)}
                          disabled={!scheduledDate}
                          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                          Confirmar Agendamento
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <button
                    onClick={() => setGeneratedContent(null)}
                    className="w-full py-3 text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-red-500 transition-colors"
                  >
                    Descartar rascunho
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
                <FileText size={48} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nenhum rascunho gerado</h3>
                <p className="text-slate-500 dark:text-slate-400">Use o gerador ao lado para criar um novo post para o seu blog.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
              <Key size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configurações de API Gemini</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Adicione até 9 chaves para garantir a continuidade da geração de conteúdo.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tempKeys.map((key, index) => (
              <div key={index} className="space-y-2 group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center px-1">
                  <span>Slot de Chave {index + 1}</span>
                  {key.trim() !== '' && (
                    <span className="flex items-center gap-1 text-emerald-500">
                      <CheckCircle2 size={10} />
                      Ativa
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => {
                      const newKeys = [...tempKeys];
                      newKeys[index] = e.target.value;
                      setTempKeys(newKeys);
                    }}
                    placeholder={key ? "••••••••••••••••" : "Insira sua chave API..."}
                    className={cn(
                      "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white pr-10 transition-all",
                      key.trim() !== '' 
                        ? "border-emerald-200 dark:border-emerald-900/30" 
                        : "border-slate-200 dark:border-slate-700"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                    <Key size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
            <button
              onClick={() => {
                setTempKeys(settings.geminiKeys || Array(9).fill(''));
                setActiveTab('generator');
              }}
              className="px-6 py-3 text-slate-500 hover:text-slate-700 font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveKeys}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center gap-2"
            >
              <Save size={18} />
              Salvar Configurações
            </button>
          </div>
        </motion.div>
      )}

      {/* Existing Posts List */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="text-blue-500" />
          Gerenciar Posts
        </h3>
        
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts
                .sort((a, b) => {
                  // First sort by status (drafts first)
                  if (a.status === 'draft' && b.status !== 'draft') return -1;
                  if (a.status !== 'draft' && b.status === 'draft') return 1;
                  
                  // Then sort by date (newest first)
                  const dateA = new Date(a.publishedAt || a.createdAt).getTime();
                  const dateB = new Date(b.publishedAt || b.createdAt).getTime();
                  return dateB - dateA;
                })
                .slice((validCurrentPage - 1) * POSTS_PER_PAGE, validCurrentPage * POSTS_PER_PAGE)
                .map((post) => (
                  <div key={post.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        {post.status === 'published' && (
                          <a
                            href={`/blog/${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            title="Visualizar no Site"
                          >
                            <Globe size={16} />
                          </a>
                        )}
                      </div>
                      {post.status === 'draft' && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded uppercase">
                          Rascunho
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-3">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                        {post.category}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2 font-display">{post.title}</h4>
                      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-full w-fit">
                        <Sparkles size={10} className="text-emerald-500" />
                        Tema: {post.excerpt.split('.')[0].slice(0, 30)}...
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">
                            {post.status === 'draft' ? 'Não publicado' : (new Date(post.publishedAt!) > new Date() ? 'Programado para' : 'Publicado em')}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '---'}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleEdit(post)}
                          className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 hover:underline"
                        >
                          Editar
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {posts.length > POSTS_PER_PAGE && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={validCurrentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-10 h-10 rounded-lg font-bold transition-all",
                      validCurrentPage === i + 1
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100 dark:shadow-none"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Nenhum post encontrado.</p>
            <p className="text-sm">Comece gerando um novo conteúdo acima.</p>
          </div>
        )}
      </div>
      {/* Preview Modal */}
      {showPreview && generatedContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPreview(false)}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="aspect-[21/9] w-full bg-slate-100 dark:bg-slate-800 relative">
                {generatedContent.imageUrl && (
                  <img 
                    src={generatedContent.imageUrl} 
                    alt="Hero" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 space-y-3">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest inline-block">
                      {generatedContent.category}
                    </span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-medium rounded-full flex items-center gap-1 inline-block">
                      <Sparkles size={10} />
                      Tema: {topic || "Neuropsicanálise Clínica"}
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight font-display">
                    {generatedContent.title}
                  </h2>
                </div>
              </div>

              <div className="p-8 sm:p-12 space-y-8">
                <div className="flex items-center gap-4 py-6 border-y border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                    {generatedContent.authorName?.charAt(0) || 'B'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{generatedContent.authorName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date().toLocaleDateString('pt-BR')} • 5 min de leitura
                    </p>
                  </div>
                </div>

                <div className="markdown-body max-w-none p-4">
                  <ReactMarkdown>{generatedContent.content || ''}</ReactMarkdown>
                </div>

                <div className="flex flex-wrap gap-2 pt-8">
                  {generatedContent.tags?.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
