import React from 'react';
import { CheckCircle2, Lock, Eye, Download, ArrowRight, Clock, Trophy, GraduationCap, Building2, Award, Sparkles } from 'lucide-react';
import { Certificate } from '../types';
import { motion } from 'motion/react';

export type CertificateStatusType = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'bloqueado';

interface CertificateCardProps {
  systemTag: string;
  systemTagColor?: 'amber' | 'blue' | 'emerald';
  title: string;
  description: string;
  status: CertificateStatusType;
  progressPercent: number;
  completedLessons?: number;
  totalLessons?: number;
  certificate: Certificate | null;
  onViewCert?: (cert: Certificate) => void;
  onDownloadCert?: (cert: Certificate) => void;
  onNavigateToSystem?: () => void;
  prerequisites?: Array<{
    name: string;
    isCompleted: boolean;
    percent: number;
  }>;
  theme?: 'light' | 'dark';
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  systemTag,
  systemTagColor = 'blue',
  title,
  description,
  status,
  progressPercent,
  completedLessons,
  totalLessons,
  certificate,
  onViewCert,
  onDownloadCert,
  onNavigateToSystem,
  prerequisites,
  theme = 'light'
}) => {
  const isConcluido = status === 'concluido';
  const isEmAndamento = status === 'em_andamento';
  const isNaoIniciado = status === 'nao_iniciado';
  const isBloqueado = status === 'bloqueado';

  const isDark = theme === 'dark';

  // Ícone característico do sistema
  const renderSystemIcon = () => {
    if (prerequisites) {
      return <Trophy size={24} className={isConcluido ? "text-amber-500" : (isDark ? "text-slate-400" : "text-amber-600")} />;
    }
    if (systemTagColor === 'amber') {
      return <GraduationCap size={24} className={isConcluido ? "text-amber-500" : "text-indigo-600 dark:text-indigo-400"} />;
    }
    return <Building2 size={24} className={isConcluido ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"} />;
  };

  // Border & Glow styling
  const borderStyle = isConcluido
    ? isDark 
      ? 'border-emerald-500/40 hover:border-emerald-500/70' 
      : 'border-emerald-200/90 hover:border-emerald-400'
    : isEmAndamento
    ? isDark 
      ? 'border-blue-500/40 hover:border-blue-500/70' 
      : 'border-blue-200/90 hover:border-blue-400'
    : isDark 
      ? 'border-slate-800 hover:border-slate-700' 
      : 'border-slate-200/90 hover:border-slate-300';

  const cardBgClass = isDark 
    ? 'bg-slate-900/90 text-slate-100 shadow-lg' 
    : 'bg-white text-slate-900 shadow-2xs hover:shadow-md';

  const footerBgClass = isDark
    ? 'bg-slate-950/70 border-slate-800 text-slate-100'
    : 'bg-slate-50/80 border-slate-200/80 text-slate-900';

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`rounded-[20px] border flex flex-col justify-between overflow-hidden transition-all duration-300 ${borderStyle} ${cardBgClass} h-full relative group`}
    >
      {/* Detalhe de iluminação sutil no topo do card ao passar o mouse */}
      <div className={`absolute top-0 left-0 right-0 h-1 transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
        isConcluido 
          ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600' 
          : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500'
      }`} />

      {/* Main Content */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
        <div>
          {/* Top Row: System Tag + Status Badge */}
          <div className="flex items-center justify-between gap-2 mb-5">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
              systemTagColor === 'amber'
                ? isDark ? 'bg-amber-950/70 text-amber-300 border-amber-800/80' : 'bg-amber-50 text-amber-900 border-amber-200'
                : systemTagColor === 'emerald'
                ? isDark ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : isDark ? 'bg-blue-950/70 text-blue-300 border-blue-800/80' : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}>
              {systemTag}
            </span>

            {/* Status Badge */}
            {isConcluido && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                isDark 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <CheckCircle2 size={13} className="stroke-[2.5]" /> Concluído
              </span>
            )}
            {isEmAndamento && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                isDark 
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <Clock size={13} className="stroke-[2.5]" /> Em andamento
              </span>
            )}
            {isNaoIniciado && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isDark 
                  ? 'bg-slate-800 text-slate-400 border-slate-700' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <Clock size={13} className="stroke-[2]" /> Não iniciado
              </span>
            )}
            {isBloqueado && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isDark 
                  ? 'bg-slate-800/80 text-slate-400 border-slate-700' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <Lock size={12} className="stroke-[2]" /> Bloqueado
              </span>
            )}
          </div>

          {/* Header Visual Block (Icon + Title) */}
          <div className="flex items-start gap-3.5 mb-3">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
              isConcluido
                ? isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                : isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-150'
            }`}>
              {renderSystemIcon()}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1 font-medium">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Central Section: Progress bar OR Prerequisites checklist */}
        {prerequisites ? (
          <div className="space-y-3 my-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                PRÉ-REQUISITOS OBRIGATÓRIOS
              </span>
              <span className="text-[11px] font-mono font-black text-slate-700 dark:text-slate-300">
                {prerequisites.filter(p => p.isCompleted).length}/{prerequisites.length} concluídos
              </span>
            </div>
            <div className="space-y-2">
              {prerequisites.map((req, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    req.isCompleted
                      ? isDark 
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100' 
                        : 'bg-emerald-50/90 border-emerald-200 text-slate-900'
                      : isDark 
                        ? 'bg-slate-800/40 border-slate-800 text-slate-400' 
                        : 'bg-slate-50 border-slate-200/80 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2.5 text-xs font-black">
                    {req.isCompleted ? (
                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={13} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                        <Lock size={11} className="stroke-[2.5]" />
                      </div>
                    )}
                    <span>{req.name}</span>
                  </span>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md ${
                    req.isCompleted 
                      ? isDark ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-100 text-emerald-900'
                      : isDark ? 'bg-slate-700/80 text-slate-400' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {req.isCompleted ? '100% Concluído' : `Pendente (${req.percent}%)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 mt-4 mb-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {isConcluido ? 'Progresso do Treinamento' : 'Aulas concluídas'}
              </span>
              <span className={`font-mono font-black text-sm ${
                isConcluido ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
              }`}>
                {progressPercent}%
                {totalLessons !== undefined && completedLessons !== undefined && (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">
                    ({completedLessons}/{totalLessons})
                  </span>
                )}
              </span>
            </div>
            
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700/80">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full transition-all ${
                  isConcluido 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className={`p-5 sm:p-6 border-t flex flex-col justify-end ${footerBgClass} transition-colors`}>
        {isConcluido && certificate ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
              <Sparkles size={14} className="text-amber-500 shrink-0" />
              <span>Certificado institucional liberado e autêntico</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => onViewCert && onViewCert(certificate)}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Eye size={15} />
                Visualizar
              </button>
              <button
                onClick={() => onDownloadCert && onDownloadCert(certificate)}
                className={`w-full flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isDark 
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700' 
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                }`}
              >
                <Download size={15} />
                Baixar PDF
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[11px] font-medium leading-relaxed mb-3.5 flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="shrink-0 text-xs">💡</span>
              <span>
                {prerequisites 
                  ? "Conclua os treinamentos 7Edu e TOTVS para liberar o certificado final."
                  : `Conclua todas as aulas do treinamento ${systemTag} para liberar este certificado.`
                }
              </span>
            </p>
            <button
              onClick={onNavigateToSystem}
              className={`w-full flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 active:scale-[0.98] rounded-xl text-xs font-black transition-all shadow-md cursor-pointer ${
                isDark 
                  ? 'bg-white hover:bg-slate-100 text-slate-950' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
              }`}
            >
              {isEmAndamento 
                ? `Continuar treinamento ${systemTag}`
                : `Ir para o treinamento ${systemTag}`
              }
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
