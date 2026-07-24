import React from 'react';
import { Award, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface CertificatesSummaryProps {
  totalUnlocked: number;
  totalCertificates?: number;
  pctJornada: number;
  theme?: 'light' | 'dark';
}

export const CertificatesSummary: React.FC<CertificatesSummaryProps> = ({
  totalUnlocked,
  totalCertificates = 3,
  pctJornada,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`p-5 rounded-[20px] border flex flex-col justify-between gap-3.5 transition-all ${
      isDark 
        ? 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-lg backdrop-blur-md' 
        : 'bg-white border-slate-200 text-slate-900 shadow-xs'
    } shrink-0 w-full md:w-auto min-w-[290px]`}>
      <div className="flex items-center gap-3.5">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
          isDark 
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/25' 
            : 'bg-amber-50 text-amber-600 border-amber-200'
        }`}>
          <Award size={26} className="stroke-[2.2]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              CERTIFICADOS LIBERADOS
            </p>
            {totalUnlocked === totalCertificates && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                isDark 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                <Sparkles size={10} /> 100%
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-2 mt-1">
            <p className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400 flex items-baseline gap-1.5">
              <span>{totalUnlocked}</span>
              <span className="text-xs font-sans font-bold text-slate-500 dark:text-slate-400">/ {totalCertificates} liberados</span>
            </p>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
              {pctJornada}%
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Progresso Geral da Jornada */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700/60">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pctJornada}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full shadow-xs"
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <span>Progresso da Jornada</span>
          <span className="font-bold">
            {totalUnlocked === totalCertificates ? 'Jornada Concluída!' : `${pctJornada}% concluído`}
          </span>
        </div>
      </div>
    </div>
  );
};
