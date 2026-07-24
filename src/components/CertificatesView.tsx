import React from 'react';
import { Award, CheckCircle2, Lock, Eye, Download, GraduationCap, ArrowRight, ShieldCheck, RotateCcw } from 'lucide-react';
import { Certificate, Course } from '../types';
import { motion } from 'motion/react';

interface CertificatesViewProps {
  userName: string;
  courses: Course[];
  completedCourses: string[];
  cert7Edu: Certificate | null;
  certTotvs: Certificate | null;
  certFinancas: Certificate | null;
  onViewCert: (cert: Certificate) => void;
  onDownloadCert: (cert: Certificate) => void;
  onNavigateToSystem: (system: '7Edu' | 'TOTVS' | 'Todos') => void;
  onResetProgress?: () => void;
  theme?: 'light' | 'dark';
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  userName,
  courses,
  completedCourses,
  cert7Edu,
  certTotvs,
  certFinancas,
  onViewCert,
  onDownloadCert,
  onNavigateToSystem,
  onResetProgress,
  theme = 'light'
}) => {
  // Calculando progressos reais por categoria
  const courses7Edu = courses.filter(c => c.system === '7Edu');
  const coursesTotvs = courses.filter(c => c.system === 'TOTVS');

  const completed7EduCount = courses7Edu.filter(c => completedCourses.includes(c.id)).length;
  const completedTotvsCount = coursesTotvs.filter(c => completedCourses.includes(c.id)).length;

  const pct7Edu = courses7Edu.length > 0 ? Math.round((completed7EduCount / courses7Edu.length) * 100) : 0;
  const pctTotvs = coursesTotvs.length > 0 ? Math.round((completedTotvsCount / coursesTotvs.length) * 100) : 0;

  const is7Edu100 = courses7Edu.length > 0 && completed7EduCount === courses7Edu.length;
  const isTotvs100 = coursesTotvs.length > 0 && completedTotvsCount === coursesTotvs.length;
  const isFinancas100 = is7Edu100 && isTotvs100;

  const totalUnlocked = (is7Edu100 ? 1 : 0) + (isTotvs100 ? 1 : 0) + (isFinancas100 ? 1 : 0);

  const cardBgClass = theme === 'dark' 
    ? 'bg-slate-900 border-slate-800 text-slate-100' 
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-8"
    >
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#3B82F6]/10 text-[#3B82F6]">
              Área de Certificação
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Faculdade Adventista do Paraná
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Seus Certificados FAP Academy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Conclua os treinamentos dos sistemas financeiros para emitir seus certificados institucionais.
          </p>
        </div>

        {/* Resumo de Progresso e Botão Reset */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`p-4 rounded-2xl border flex items-center gap-4 ${cardBgClass}`}>
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Award size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Certificados Liberados</p>
              <p className="text-xl font-black text-amber-500 mt-0.5">
                {totalUnlocked} <span className="text-xs font-semibold text-slate-400">de 3 certificados</span>
              </p>
            </div>
          </div>

          {onResetProgress && (
            <button
              onClick={onResetProgress}
              className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all flex items-center gap-2.5 text-xs font-bold active:scale-95 shadow-sm"
              title="Limpar todos os certificados e empenho de aulas para realizar novos testes"
            >
              <RotateCcw size={20} className="shrink-0" />
              <div className="text-left">
                <p className="uppercase text-[10px] font-black tracking-wider text-rose-500">Modo Teste</p>
                <p className="text-xs font-extrabold">Resetar Empenho & Certificados</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Certificados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: CERTIFICADO 7EDU */}
        <div className={`rounded-2xl border flex flex-col justify-between overflow-hidden transition-all hover:shadow-md ${cardBgClass}`}>
          <div className="p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase bg-amber-500/15 text-amber-600 border border-amber-500/30">
                Sistema 7Edu
              </span>
              {is7Edu100 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                  <CheckCircle2 size={13} /> DISPONÍVEL
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-500/15 text-slate-500 border border-slate-500/30">
                  <Lock size={13} /> BLOQUEADO
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold mb-2 text-[#0F172A] dark:text-white">
              Certificado do Sistema 7Edu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Certificação de conclusão de todos os procedimentos operacionais do Sistema 7Edu na FAP Academy.
            </p>

            {/* Barra de Progresso do 7Edu */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Progresso do 7Edu</span>
                <span className={pct7Edu === 100 ? "text-emerald-500 font-extrabold" : "text-amber-500"}>
                  {pct7Edu}% ({completed7EduCount}/{courses7Edu.length} aulas)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${pct7Edu}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ações do Card 1 */}
          <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            {is7Edu100 && cert7Edu ? (
              <div className="flex flex-col gap-2 pt-4">
                <button
                  onClick={() => onViewCert(cert7Edu)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/20"
                >
                  <Eye size={15} />
                  Visualizar certificado
                </button>
                <button
                  onClick={() => onDownloadCert(cert7Edu)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  <Download size={15} />
                  Baixar PDF
                </button>
              </div>
            ) : (
              <div className="pt-4">
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mb-3 flex items-start gap-1">
                  <span>💡</span>
                  <span>Conclua 100% das aulas do treinamento 7Edu para liberar este certificado.</span>
                </p>
                <button
                  onClick={() => onNavigateToSystem('7Edu')}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Ir para Aulas do 7Edu
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: CERTIFICADO TOTVS */}
        <div className={`rounded-2xl border flex flex-col justify-between overflow-hidden transition-all hover:shadow-md ${cardBgClass}`}>
          <div className="p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase bg-blue-500/15 text-blue-600 border border-blue-500/30">
                Sistema TOTVS
              </span>
              {isTotvs100 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                  <CheckCircle2 size={13} /> DISPONÍVEL
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-500/15 text-slate-500 border border-slate-500/30">
                  <Lock size={13} /> BLOQUEADO
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold mb-2 text-[#0F172A] dark:text-white">
              Certificado do Sistema TOTVS
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Certificação de conclusão de todos os procedimentos operacionais do Sistema TOTVS na FAP Academy.
            </p>

            {/* Barra de Progresso do TOTVS */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Progresso do TOTVS</span>
                <span className={pctTotvs === 100 ? "text-emerald-500 font-extrabold" : "text-blue-500"}>
                  {pctTotvs}% ({completedTotvsCount}/{coursesTotvs.length} aulas)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${pctTotvs}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ações do Card 2 */}
          <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            {isTotvs100 && certTotvs ? (
              <div className="flex flex-col gap-2 pt-4">
                <button
                  onClick={() => onViewCert(certTotvs)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                >
                  <Eye size={15} />
                  Visualizar certificado
                </button>
                <button
                  onClick={() => onDownloadCert(certTotvs)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  <Download size={15} />
                  Baixar PDF
                </button>
              </div>
            ) : (
              <div className="pt-4">
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mb-3 flex items-start gap-1">
                  <span>💡</span>
                  <span>Conclua 100% das aulas do treinamento TOTVS para liberar este certificado.</span>
                </p>
                <button
                  onClick={() => onNavigateToSystem('TOTVS')}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Ir para Aulas do TOTVS
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: CERTIFICADO DE FINANÇAS (GERAL) */}
        <div className={`rounded-2xl border-2 flex flex-col justify-between overflow-hidden transition-all hover:shadow-md ${
          isFinancas100 ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/10 to-transparent' : 'border-slate-200 dark:border-slate-800'
        } ${cardBgClass}`}>
          <div className="p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                Formação Completa
              </span>
              {isFinancas100 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                  <CheckCircle2 size={13} /> DISPONÍVEL
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-500/15 text-slate-500 border border-slate-500/30">
                  <Lock size={13} /> BLOQUEADO
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold mb-2 text-[#0F172A] dark:text-white flex items-center gap-2">
              Certificado de Finanças
              <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Certificação final da área de Finanças da Faculdade Adventista do Paraná, obtida após concluir os treinamentos 7Edu e TOTVS.
            </p>

            {/* Requisitos do Certificado de Finanças */}
            <div className="space-y-2 mb-4 text-xs">
              <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Pré-requisitos Obrigatórios:</p>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                <span className="flex items-center gap-1.5 font-medium">
                  {is7Edu100 ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Lock size={14} className="text-slate-400" />}
                  Sistema 7Edu (100%)
                </span>
                <span className={`font-bold ${is7Edu100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {pct7Edu}%
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                <span className="flex items-center gap-1.5 font-medium">
                  {isTotvs100 ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Lock size={14} className="text-slate-400" />}
                  Sistema TOTVS (100%)
                </span>
                <span className={`font-bold ${isTotvs100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {pctTotvs}%
                </span>
              </div>
            </div>
          </div>

          {/* Ações do Card 3 */}
          <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            {isFinancas100 && certFinancas ? (
              <div className="flex flex-col gap-2 pt-4">
                <button
                  onClick={() => onViewCert(certFinancas)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  <Eye size={15} />
                  Visualizar certificado
                </button>
                <button
                  onClick={() => onDownloadCert(certFinancas)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  <Download size={15} />
                  Baixar PDF
                </button>
              </div>
            ) : (
              <div className="pt-4">
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mb-3 flex items-start gap-1">
                  <span>🔒</span>
                  <span>
                    {!is7Edu100 && !isTotvs100 
                      ? "Conclua 100% das aulas de 7Edu e TOTVS para liberar este certificado final."
                      : !is7Edu100 
                      ? `Progresso 7Edu em ${pct7Edu}%. Conclua os 100% do treinamento 7Edu para liberar o certificado final de Finanças.`
                      : `Progresso TOTVS em ${pctTotvs}%. Conclua os 100% do treinamento TOTVS para liberar o certificado final de Finanças.`
                    }
                  </span>
                </p>
                <button
                  onClick={() => onNavigateToSystem(!is7Edu100 ? '7Edu' : 'TOTVS')}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  {!is7Edu100 ? "Continuar 7Edu" : "Continuar TOTVS"}
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
