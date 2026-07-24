import React from 'react';
import { Award, CheckCircle2, Eye, Download, Sparkles } from 'lucide-react';
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
  theme = 'light'
}) => {
  if (!is7Edu100 && !isTotvs100 && !isFinancas100) return null;

  return (
    <div className="w-full space-y-4 mb-6">
      {/* Banner 1: Conclusão do 7Edu */}
      {is7Edu100 && cert7Edu && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-amber-600/90 via-amber-500/90 to-yellow-600/90 p-4 sm:p-5 text-white shadow-xl shadow-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4 border border-amber-400/40"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Award size={28} className="text-yellow-100" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded text-amber-100">
                Treinamento 7Edu Concluído
              </span>
              <p className="font-bold text-sm sm:text-base mt-1">
                Parabéns! Você concluiu todas as aulas do Sistema 7Edu. Seu certificado está disponível.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
            <button
              onClick={() => onViewCert(cert7Edu)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Eye size={15} />
              Visualizar certificado
            </button>
            <button
              onClick={() => onDownloadCert(cert7Edu)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-black/30 hover:bg-black/40 text-white border border-white/30 active:scale-95 rounded-xl text-xs font-bold transition-all"
            >
              <Download size={15} />
              Baixar PDF
            </button>
          </div>
        </motion.div>
      )}

      {/* Banner 2: Conclusão do TOTVS */}
      {isTotvs100 && certTotvs && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-blue-700/90 via-blue-600/90 to-indigo-700/90 p-4 sm:p-5 text-white shadow-xl shadow-blue-600/20 flex flex-col md:flex-row items-center justify-between gap-4 border border-blue-400/40"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Award size={28} className="text-blue-100" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded text-blue-100">
                Treinamento TOTVS Concluído
              </span>
              <p className="font-bold text-sm sm:text-base mt-1">
                Parabéns! Você concluiu todas as aulas do Sistema TOTVS. Seu certificado está disponível.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
            <button
              onClick={() => onViewCert(certTotvs)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Eye size={15} />
              Visualizar certificado
            </button>
            <button
              onClick={() => onDownloadCert(certTotvs)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-black/30 hover:bg-black/40 text-white border border-white/30 active:scale-95 rounded-xl text-xs font-bold transition-all"
            >
              <Download size={15} />
              Baixar PDF
            </button>
          </div>
        </motion.div>
      )}

      {/* Banner 3: Conclusão Geral de Finanças (7Edu + TOTVS) */}
      {isFinancas100 && certFinancas && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800 p-5 sm:p-6 text-white shadow-2xl shadow-emerald-600/30 flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-emerald-400/50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles size={160} />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Award size={34} className="text-emerald-100 animate-bounce" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-emerald-950/60 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                <Sparkles size={12} className="text-amber-300" /> Formação em Finanças Concluída
              </span>
              <p className="font-extrabold text-base sm:text-lg mt-1 text-emerald-50">
                Parabéns! Você concluiu todos os treinamentos da área de Finanças. Seu certificado final está disponível.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end relative z-10">
            <button
              onClick={() => onViewCert(certFinancas)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 bg-white text-emerald-950 hover:bg-emerald-50 active:scale-95 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-lg shadow-black/20"
            >
              <Eye size={16} />
              Visualizar certificado
            </button>
            <button
              onClick={() => onDownloadCert(certFinancas)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 bg-emerald-950/80 hover:bg-emerald-950 text-white border border-emerald-400/40 active:scale-95 rounded-xl text-xs sm:text-sm font-extrabold transition-all"
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
