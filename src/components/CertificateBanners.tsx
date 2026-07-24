import React from 'react';
import { Award, Eye, Download, Sparkles, ArrowRight, Trophy } from 'lucide-react';
import { Certificate } from '../types';
import { motion } from 'motion/react';

interface CertificateBannersProps {
  is7Edu100: boolean;
  isTotvs100: boolean;
  isFinancas100: boolean;
  cert7Edu: Certificate | null;
  certTotvs: Certificate | null;
  certFinancas: Certificate | null;
  onViewCert: (cert: Certificate) => void;
  onDownloadCert: (cert: Certificate) => void;
  onNavigateToSystem?: (system: '7Edu' | 'TOTVS' | 'Todos') => void;
  theme?: 'light' | 'dark';
}

export const CertificateBanners: React.FC<CertificateBannersProps> = ({
  is7Edu100,
  isTotvs100,
  isFinancas100,
  cert7Edu,
  certTotvs,
  certFinancas,
  onViewCert,
  onDownloadCert,
  onNavigateToSystem,
  theme = 'light'
}) => {
  const hasAnyUnlocked = is7Edu100 || isTotvs100 || isFinancas100;
  const isDark = theme === 'dark';

  if (!hasAnyUnlocked) {
    return (
      <div className={`w-full rounded-[20px] p-5 sm:p-6 border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all shadow-xs ${
        isDark 
          ? 'bg-slate-900/80 border-slate-800 text-slate-300' 
          : 'bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 border-blue-200/80 text-slate-800'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
            isDark
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/20'
              : 'bg-blue-600 text-white border-blue-500'
          }`}>
            <Sparkles size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Sua jornada de certificação está em andamento
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
              Conclua 100% dos treinamentos dos Sistemas 7Edu ou TOTVS para emitir seus certificados institucionais.
            </p>
          </div>
        </div>
        {onNavigateToSystem && (
          <button
            onClick={() => onNavigateToSystem('7Edu')}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <span>Iniciar Treinamento 7Edu</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 mb-2">
      {/* Banner 1: Conclusão Geral de Finanças */}
      {isFinancas100 && certFinancas && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[22px] p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border relative overflow-hidden group ${
            isDark 
              ? 'bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 border-emerald-500/40 shadow-emerald-950/20' 
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-emerald-500/30 shadow-emerald-600/15'
          }`}
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transition-transform duration-700 group-hover:scale-110">
            <Trophy size={200} />
          </div>

          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
            <div className="h-16 w-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Trophy size={34} className="text-amber-300" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-black/25 text-emerald-200 px-3 py-1 rounded-full border border-white/20 mb-1.5">
                <Sparkles size={12} className="text-amber-300" /> FORMAÇÃO COMPLETA EM FINANÇAS
              </span>
              <h2 className="font-black text-lg sm:text-xl text-white leading-snug tracking-tight">
                Parabéns! Você concluiu todos os treinamentos da área de Finanças na FAP Academy.
              </h2>
              <p className="text-xs text-emerald-100/90 mt-1 font-medium">
                Seu certificado final de Formação em Sistemas Financeiros está disponível para visualização e download.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 relative z-10">
            <button
              onClick={() => onViewCert(certFinancas)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-white text-slate-950 hover:bg-emerald-50 active:scale-[0.98] rounded-xl text-xs font-black transition-all shadow-lg cursor-pointer"
            >
              <Eye size={16} />
              Visualizar certificado
            </button>
            <button
              onClick={() => onDownloadCert(certFinancas)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-emerald-900/90 hover:bg-emerald-900 text-white border border-white/25 active:scale-[0.98] rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              <Download size={16} />
              Baixar PDF
            </button>
          </div>
        </motion.div>
      )}

      {/* Banner 2: Conclusão do 7Edu */}
      {is7Edu100 && cert7Edu && !isFinancas100 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[22px] p-6 sm:p-7 text-slate-950 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 border-amber-300/60 shadow-amber-500/20' 
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 border-amber-300 shadow-amber-500/15'
          }`}
        >
          <div className="flex items-center gap-4.5 w-full md:w-auto relative z-10">
            <div className="h-16 w-16 rounded-2xl bg-slate-950/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-slate-950/10">
              <Award size={36} className="text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-slate-950/20 px-3 py-1 rounded-full text-slate-950 border border-slate-950/20 mb-1.5">
                TREINAMENTO CONCLUÍDO
              </span>
              <h2 className="font-black text-lg sm:text-xl text-slate-950 leading-snug tracking-tight">
                Parabéns! Você concluiu todas as aulas do Sistema 7Edu.
              </h2>
              <p className="text-xs text-slate-900/90 font-bold mt-1">
                Seu certificado está disponível para visualização e download.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 relative z-10">
            <button
              onClick={() => onViewCert(cert7Edu)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-slate-950 text-white hover:bg-slate-900 active:scale-[0.98] rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <Eye size={16} />
              Visualizar certificado
            </button>
            <button
              onClick={() => onDownloadCert(cert7Edu)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-white/90 hover:bg-white text-slate-950 border border-slate-950/20 active:scale-[0.98] rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              <Download size={16} />
              Baixar PDF
            </button>
          </div>
        </motion.div>
      )}

      {/* Banner 3: Conclusão do TOTVS */}
      {isTotvs100 && certTotvs && !isFinancas100 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[22px] p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 border-blue-400/40 shadow-blue-600/20' 
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 border-blue-400/30 shadow-blue-600/15'
          }`}
        >
          <div className="flex items-center gap-4.5 w-full md:w-auto relative z-10">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
              <Award size={36} className="text-blue-100 stroke-[2.2]" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-black/20 px-3 py-1 rounded-full text-blue-100 border border-white/20 mb-1.5">
                TREINAMENTO CONCLUÍDO
              </span>
              <h2 className="font-black text-lg sm:text-xl text-white leading-snug tracking-tight">
                Parabéns! Você concluiu todas as aulas do Sistema TOTVS.
              </h2>
              <p className="text-xs text-blue-100/90 font-medium mt-1">
                Seu certificado está disponível para visualização e download.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 relative z-10">
            <button
              onClick={() => onViewCert(certTotvs)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 active:scale-[0.98] rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <Eye size={16} />
              Visualizar certificado
            </button>
            <button
              onClick={() => onDownloadCert(certTotvs)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-blue-900/90 hover:bg-blue-950 text-white border border-white/25 active:scale-[0.98] rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              <Download size={16} />
              Baixar PDF
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
