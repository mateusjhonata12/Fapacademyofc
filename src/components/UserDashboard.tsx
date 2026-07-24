import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  GraduationCap, 
  ArrowRight, 
  Play, 
  Building2, 
  Target,
  Zap,
  BarChart2,
  Calendar,
  Flame,
  Check,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

interface UserDashboardProps {
  userName: string;
  courses: Course[];
  completedCourses: string[];
  onNavigateToTab: (tab: 'Home' | '7Edu' | 'TOTVS' | 'Todos' | 'Certificados' | 'GeminiVideo') => void;
  onOpenMedia?: (course: Course, type: 'video' | 'pdf') => void;
  theme?: 'light' | 'dark';
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  userName,
  courses,
  completedCourses,
  onNavigateToTab,
  onOpenMedia,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const [filterSystem, setFilterSystem] = useState<'Todos' | '7Edu' | 'TOTVS'>('Todos');

  // Métricas do aluno
  const totalCourses = courses.length || 1;
  const completedCount = completedCourses.length;
  const overallPercentage = Math.round((completedCount / totalCourses) * 100);

  const courses7Edu = courses.filter(c => c.system === '7Edu');
  const coursesTotvs = courses.filter(c => c.system === 'TOTVS');

  const completed7Edu = courses7Edu.filter(c => completedCourses.includes(c.id));
  const completedTotvs = coursesTotvs.filter(c => completedCourses.includes(c.id));

  const pct7Edu = courses7Edu.length > 0 ? Math.round((completed7Edu.length / courses7Edu.length) * 100) : 0;
  const pctTotvs = coursesTotvs.length > 0 ? Math.round((completedTotvs.length / coursesTotvs.length) * 100) : 0;

  const is7Edu100 = courses7Edu.length > 0 && completed7Edu.length === courses7Edu.length;
  const isTotvs100 = coursesTotvs.length > 0 && completedTotvs.length === coursesTotvs.length;
  const isFinancas100 = is7Edu100 && isTotvs100;

  const totalCertificatesUnlocked = (is7Edu100 ? 1 : 0) + (isTotvs100 ? 1 : 0) + (isFinancas100 ? 1 : 0);

  // Minutos / Horas acumuladas
  const totalMinutesStudied = courses
    .filter(c => completedCourses.includes(c.id))
    .reduce((acc, c) => {
      const mins = parseInt(c.duration) || 12;
      return acc + mins;
    }, 0);

  const hoursStudied = (totalMinutesStudied / 60).toFixed(1);

  // Distribuição por Nível de Dificuldade
  const difficultyCounts = {
    Iniciante: courses.filter(c => completedCourses.includes(c.id) && c.difficulty === 'Iniciante').length,
    Intermediario: courses.filter(c => completedCourses.includes(c.id) && c.difficulty === 'Intermediário').length,
    Avançado: courses.filter(c => completedCourses.includes(c.id) && c.difficulty === 'Avançado').length,
  };

  const difficultyChartData = [
    { name: 'Iniciante', count: difficultyCounts.Iniciante, color: '#10B981' },
    { name: 'Intermediário', count: difficultyCounts.Intermediario, color: '#3B82F6' },
    { name: 'Avançado', count: difficultyCounts.Avançado, color: '#8B5CF6' },
  ];

  const systemChartData = [
    { name: 'Sistema 7Edu', Concluídas: completed7Edu.length, Total: courses7Edu.length, color: '#4F46E5' },
    { name: 'Sistema TOTVS', Concluídas: completedTotvs.length, Total: coursesTotvs.length, color: '#059669' },
  ];

  // Aulas Pendentes vs Concluídas
  const filteredCourses = courses.filter(c => filterSystem === 'Todos' || c.system === filterSystem);
  const pendingCourses = filteredCourses.filter(c => !completedCourses.includes(c.id));
  const recentCompletedCourses = filteredCourses.filter(c => completedCourses.includes(c.id));

  // Badges / Insígnias de Conquista com Animação
  const badges = [
    {
      id: 'first_step',
      title: 'Primeiro Passo',
      subtitle: 'Concluiu a 1ª vídeo-aula na FAP Academy',
      unlocked: completedCount >= 1,
      icon: <Zap size={20} className="text-amber-500" />,
      colorClass: isDark ? 'from-amber-950/40 to-yellow-900/30 text-amber-300 border-amber-800/60' : 'from-amber-50 to-amber-100/80 text-amber-900 border-amber-200'
    },
    {
      id: 'streak_50',
      title: 'Meta de Meio Caminho',
      subtitle: 'Alcançou 50% de progresso geral',
      unlocked: overallPercentage >= 50,
      icon: <Flame size={20} className="text-orange-500" />,
      colorClass: isDark ? 'from-orange-950/40 to-amber-900/30 text-orange-300 border-orange-800/60' : 'from-orange-50 to-orange-100/80 text-orange-900 border-orange-200'
    },
    {
      id: 'master_7edu',
      title: 'Especialista 7Edu',
      subtitle: '100% das aulas 7Edu finalizadas',
      unlocked: is7Edu100,
      icon: <GraduationCap size={20} className="text-indigo-500" />,
      colorClass: isDark ? 'from-indigo-950/40 to-blue-900/30 text-indigo-300 border-indigo-800/60' : 'from-indigo-50 to-indigo-100/80 text-indigo-900 border-indigo-200'
    },
    {
      id: 'master_totvs',
      title: 'Mestre TOTVS',
      subtitle: '100% das aulas TOTVS finalizadas',
      unlocked: isTotvs100,
      icon: <Building2 size={20} className="text-emerald-500" />,
      colorClass: isDark ? 'from-emerald-950/40 to-teal-900/30 text-emerald-300 border-emerald-800/60' : 'from-emerald-50 to-emerald-100/80 text-emerald-900 border-emerald-200'
    },
    {
      id: 'financas_expert',
      title: 'Formação Financeira',
      subtitle: 'Certificação completa de Finanças FAP',
      unlocked: isFinancas100,
      icon: <Trophy size={20} className="text-amber-400" />,
      colorClass: isDark ? 'from-amber-950/50 to-amber-900/40 text-amber-200 border-amber-700/80' : 'from-amber-100 to-yellow-100/90 text-amber-950 border-amber-300'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8"
    >
      {/* Dynamic Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/90 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 shadow-2xs">
              Métricas do Aluno
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
              Faculdade Adventista do Paraná
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Acompanhamento ao Meu Empenho
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium max-w-2xl">
            Acompanhe a sua evolução em tempo real, horas estudadas, procedimentos concluídos e conquistas desbloqueadas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab('Certificados')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Award size={16} />
            Meus Certificados ({totalCertificatesUnlocked}/3)
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principais (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Overall Progress */}
        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className={`p-6 rounded-[20px] border flex flex-col justify-between transition-all ${
            isDark 
              ? 'bg-slate-900/90 border-slate-800 text-white shadow-lg' 
              : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              PROGRESSO DA JORNADA
            </span>
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-blue-950/70 text-blue-400 border border-blue-800/60' : 'bg-blue-50 text-blue-700 border border-blue-200/80'}`}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {overallPercentage}%
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">concluído</span>
            </div>
            <div className="mt-3 h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-700/60 p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${overallPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full" 
              />
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Lessons Completed */}
        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className={`p-6 rounded-[20px] border flex flex-col justify-between transition-all ${
            isDark 
              ? 'bg-slate-900/90 border-slate-800 text-white shadow-lg' 
              : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              AULAS FINALIZADAS
            </span>
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'}`}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {completedCount}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">/ {courses.length} vídeo-aulas</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-medium">
              Faltam {courses.length - completedCount} procedimentos operacionais
            </p>
          </div>
        </motion.div>

        {/* Metric 3: Time Dedicated */}
        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className={`p-6 rounded-[20px] border flex flex-col justify-between transition-all ${
            isDark 
              ? 'bg-slate-900/90 border-slate-800 text-white shadow-lg' 
              : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              HORAS DE ESTUDO
            </span>
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-indigo-950/70 text-indigo-400 border border-indigo-800/60' : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'}`}>
              <Clock size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {hoursStudied}h
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">({totalMinutesStudied} min)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-medium">
              Tempo prático registrado nos módulos
            </p>
          </div>
        </motion.div>

        {/* Metric 4: Certificates Unlocked */}
        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className={`p-6 rounded-[20px] border flex flex-col justify-between transition-all ${
            isDark 
              ? 'bg-slate-900/90 border-slate-800 text-white shadow-lg' 
              : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CERTIFICADOS CONQUISTADOS
            </span>
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-amber-950/70 text-amber-400 border border-amber-800/60' : 'bg-amber-50 text-amber-700 border border-amber-200/80'}`}>
              <Award size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {totalCertificatesUnlocked}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">/ 3 certificados</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-medium flex items-center gap-1">
              {totalCertificatesUnlocked === 3 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles size={12} /> Todos os diplomas liberados!
                </span>
              ) : (
                `Ainda faltam ${3 - totalCertificatesUnlocked} para liberar`
              )}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Seção de Gráficos e Desempenho por Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Progress Breakdown by System */}
        <div className={`lg:col-span-2 p-6 sm:p-7 rounded-[20px] border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Desempenho por Sistema Corporativo
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Procedimentos operacionais do 7Edu vs TOTVS concluídos por você.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                Comparativo FAP
              </span>
            </div>

            {/* Sub-cards de Sistemas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              {/* Card 7Edu */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50/80 border-slate-200/80'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={14} /> Sistema 7Edu
                  </span>
                  <span className="text-xs font-mono font-black text-slate-900 dark:text-slate-100">
                    {pct7Edu}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${pct7Edu}%` }} />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  <span>{completed7Edu.length} de {courses7Edu.length} procedimentos</span>
                  <button 
                    onClick={() => onNavigateToTab('7Edu')}
                    className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Praticar <ArrowRight size={11} />
                  </button>
                </div>
              </div>

              {/* Card TOTVS */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50/80 border-slate-200/80'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} /> Sistema TOTVS
                  </span>
                  <span className="text-xs font-mono font-black text-slate-900 dark:text-slate-100">
                    {pctTotvs}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${pctTotvs}%` }} />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  <span>{completedTotvs.length} de {coursesTotvs.length} procedimentos</span>
                  <button 
                    onClick={() => onNavigateToTab('TOTVS')}
                    className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Praticar <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-48 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={systemChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#CBD5E1'} />
                  <XAxis dataKey="name" stroke={isDark ? '#94A3B8' : '#475569'} style={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <YAxis stroke={isDark ? '#94A3B8' : '#475569'} style={{ fontSize: '11px' }} />
                  <Tooltip 
                    contentStyle={isDark ? { backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', color: '#fff' } : { borderRadius: '12px', border: '1px solid #CBD5E1' }}
                  />
                  <Bar dataKey="Concluídas" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={36}>
                    {systemChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 2: Difficulty Distribution */}
        <div className={`p-6 sm:p-7 rounded-[20px] border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs'
        }`}>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1">
              Complexidade Operacional
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-4">
              Aulas concluídas por nível de complexidade técnica.
            </p>

            <div className="space-y-3">
              {difficultyChartData.map((d) => {
                const totalDiffInCourses = courses.filter(c => c.difficulty === d.name).length || 1;
                const pct = Math.round((d.count / totalDiffInCourses) * 100);
                return (
                  <div key={d.name} className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50/80 border-slate-200/80'}`}>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {d.count}/{totalDiffInCourses} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-800/60 text-[11px] text-blue-950 dark:text-blue-200 font-medium leading-relaxed">
            <span className="font-extrabold block mb-0.5 text-blue-900 dark:text-blue-300">💡 Dica de Estudo FAP:</span>
            Assista às vídeo-aulas acompanhando o PDF de apoio técnico para absorver com máximo aproveitamento cada rotina do sistema.
          </div>
        </div>
      </div>

      {/* Seção 3: Insígnias & Conquistas do Aluno */}
      <div className={`p-6 sm:p-7 rounded-[20px] border ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Trophy className="text-amber-500" size={22} />
              Suas Medalhas & Conquistas
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              Insígnias conquistadas automaticamente com base na sua evolução no curso.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            {badges.filter(b => b.unlocked).length} / {badges.length} desbloqueadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {badges.map((b) => (
            <motion.div
              key={b.id}
              whileHover={b.unlocked ? { y: -3, scale: 1.02 } : {}}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                b.unlocked
                  ? isDark 
                    ? `bg-gradient-to-b ${b.colorClass} shadow-md` 
                    : `bg-gradient-to-b ${b.colorClass} shadow-2xs hover:shadow-md`
                  : isDark 
                    ? 'bg-slate-950/40 border-slate-800/80 text-slate-600 opacity-50' 
                    : 'bg-slate-50/60 border-slate-200/60 text-slate-400 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${
                    b.unlocked 
                      ? 'bg-white/80 dark:bg-slate-900/80 shadow-2xs border border-amber-200/50 dark:border-amber-700/50' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {b.icon}
                  </div>
                  {b.unlocked ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-2xs">
                      Desbloqueada
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500">
                      Pendente
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-1">
                  {b.title}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {b.subtitle}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Seção 4: Próximas Vídeo-aulas vs Histórico Concluído */}
      <div className={`p-6 sm:p-7 rounded-[20px] border ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs'
      }`}>
        {/* Header com Filtro de Sistema */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Target className="text-blue-600 dark:text-blue-400" size={20} />
              Minhas Vídeo-Aulas & Rotinas
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Filtre por sistema corporativo para focar no seu aprendizado atual.
            </p>
          </div>

          {/* Selector de Filtro */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
            {(['Todos', '7Edu', 'TOTVS'] as const).map((sys) => (
              <button
                key={sys}
                onClick={() => setFilterSystem(sys)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filterSystem === sys
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {sys}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Aulas Pendentes Recomendadas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Play size={14} className="text-blue-600 dark:text-blue-400 fill-current" />
                Próximas para Assistir ({pendingCourses.length})
              </h4>
              <button 
                onClick={() => onNavigateToTab(filterSystem === '7Edu' ? '7Edu' : filterSystem === 'TOTVS' ? 'TOTVS' : 'Todos')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ver grade completa <ArrowRight size={12} />
              </button>
            </div>

            {pendingCourses.length > 0 ? (
              <div className="space-y-3">
                {pendingCourses.slice(0, 4).map((course) => (
                  <div 
                    key={course.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isDark 
                        ? 'bg-slate-800/60 border-slate-700/80 text-slate-100 hover:border-blue-500/50' 
                        : 'bg-slate-50/90 border-slate-200/90 text-slate-900 hover:bg-white hover:border-blue-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 relative">
                        <img src={course.thumbnail} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                          course.system === '7Edu' 
                            ? isDark ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60' : 'bg-indigo-100 text-indigo-900 border-indigo-200'
                            : isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                        }`}>
                          {course.system} • {course.duration}
                        </span>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 mt-1">
                          {course.title}
                        </h5>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenMedia ? onOpenMedia(course, 'video') : onNavigateToTab('Todos')}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      <Play size={12} fill="currentColor" /> Play
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-8 text-center rounded-xl border ${
                isDark ? 'bg-slate-800/30 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              } font-medium text-xs space-y-2`}>
                <Sparkles size={24} className="mx-auto text-amber-500 mb-1" />
                <p className="font-black text-slate-900 dark:text-white text-sm">Excelente trabalho!</p>
                <p>Você já concluiu todas as aulas do filtro selecionado ({filterSystem}).</p>
              </div>
            )}
          </div>

          {/* Coluna 2: Aulas Concluídas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                Procedimentos Finalizados ({recentCompletedCourses.length})
              </h4>
            </div>

            {recentCompletedCourses.length > 0 ? (
              <div className="space-y-3">
                {recentCompletedCourses.slice(0, 4).map((course) => (
                  <div 
                    key={course.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      isDark 
                        ? 'bg-slate-800/60 border-slate-700/80 text-slate-100' 
                        : 'bg-slate-50/90 border-slate-200/90 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/60">
                        <Check size={16} className="stroke-[3]" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                          {course.title}
                        </h5>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                          {course.system} • {course.duration}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenMedia ? onOpenMedia(course, 'video') : onNavigateToTab('Todos')}
                      className="px-3 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-[11px] cursor-pointer shrink-0 transition-colors"
                    >
                      Revisar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-8 text-center rounded-xl border ${
                isDark ? 'bg-slate-800/30 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              } font-medium text-xs`}>
                Nenhum procedimento operado ainda nesta categoria. Clique em uma aula para começar!
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
