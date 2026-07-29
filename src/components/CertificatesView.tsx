import React from 'react';
import { Certificate, Course } from '../types';
import { CertificateBanners } from './CertificateBanners';
import { CertificatesSummary } from './CertificatesSummary';
import { CertificateCard, CertificateStatusType } from './CertificateCard';
import { motion } from 'motion/react';
import { RotateCcw, Trash2, ShieldAlert } from 'lucide-react';

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
  onResetEmpenho?: () => void;
  onEliminarCertificados?: () => void;
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
  onResetEmpenho,
  onEliminarCertificados,
  onResetProgress,
  theme = 'light'
}) => {
  // Calculando progressos reais por categoria de curso
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

  // Percentual total da jornada (aulas concluídas do total de aulas)
  const totalCourses = courses.length || 1;
  const totalCompleted = completedCourses.length;
  const pctJornada = Math.round((totalCompleted / totalCourses) * 100);

  // Estado dos cards conforme regras #6, #7, #8
  const status7Edu: CertificateStatusType = is7Edu100 ? 'concluido' : (pct7Edu > 0 ? 'em_andamento' : 'nao_iniciado');
  const statusTotvs: CertificateStatusType = isTotvs100 ? 'concluido' : (pctTotvs > 0 ? 'em_andamento' : 'nao_iniciado');
  const statusFinancas: CertificateStatusType = isFinancas100 ? 'concluido' : 'bloqueado';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8"
    >
      {/* Seção 1: Cabeçalho & Resumo de Certificados */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
              Área de Certificação
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
              Faculdade Adventista do Paraná
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Seus Certificados FAP Academy
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium max-w-2xl">
            Conclua os treinamentos dos sistemas financeiros para emitir seus certificados institucionais.
          </p>
        </div>

        {/* Resumo de Certificados (Top Right no Desktop, Full-Width no Mobile) */}
        <CertificatesSummary 
          totalUnlocked={totalUnlocked}
          totalCertificates={3}
          pctJornada={pctJornada}
          theme={theme}
        />
      </div>

      {/* Seção 2: Banner de Conquista / Progresso */}
      <CertificateBanners 
        is7Edu100={is7Edu100}
        isTotvs100={isTotvs100}
        isFinancas100={isFinancas100}
        cert7Edu={cert7Edu}
        certTotvs={certTotvs}
        certFinancas={certFinancas}
        onViewCert={onViewCert}
        onDownloadCert={onDownloadCert}
        onNavigateToSystem={onNavigateToSystem}
        theme={theme}
      />

      {/* Barra de Ações Única: Resetar Empenho e Eliminar Certificados (Validação & Testes) */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all shadow-sm ${
        theme === 'dark' 
          ? 'bg-[#131B2E] border-slate-800/90 text-slate-200' 
          : 'bg-white border-slate-200/90 text-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${theme === 'dark' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
              Controles de Redefinição &amp; Validação de Dados
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Utilize os botões em linha para zerar o empenho de aulas (engajamento) ou eliminar certificados emitidos para testes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={() => onResetEmpenho ? onResetEmpenho() : onResetProgress?.()}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Resetar empenho / dados de engajamento de aulas"
          >
            <RotateCcw size={14} />
            <span>Resetar Empenho</span>
          </button>

          <button
            onClick={() => onEliminarCertificados ? onEliminarCertificados() : onResetProgress?.()}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Eliminar e revogar certificados emitidos"
          >
            <Trash2 size={14} />
            <span>Eliminar Certificados</span>
          </button>
        </div>
      </div>

      {/* Seção 3: Padronização dos 3 Cards de Certificados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {/* CARD 1: SISTEMA 7EDU */}
        <CertificateCard 
          systemTag="SISTEMA 7EDU"
          systemTagColor="amber"
          title="Certificado do Sistema 7Edu"
          description="Certificação de conclusão de todos os procedimentos operacionais do Sistema 7Edu na FAP Academy."
          status={status7Edu}
          progressPercent={pct7Edu}
          completedLessons={completed7EduCount}
          totalLessons={courses7Edu.length}
          certificate={cert7Edu}
          onViewCert={onViewCert}
          onDownloadCert={onDownloadCert}
          onNavigateToSystem={() => onNavigateToSystem('7Edu')}
          theme={theme}
        />

        {/* CARD 2: SISTEMA TOTVS */}
        <CertificateCard 
          systemTag="SISTEMA TOTVS"
          systemTagColor="blue"
          title="Certificado do Sistema TOTVS"
          description="Certificação de conclusão de todos os procedimentos operacionais do Sistema TOTVS na FAP Academy."
          status={statusTotvs}
          progressPercent={pctTotvs}
          completedLessons={completedTotvsCount}
          totalLessons={coursesTotvs.length}
          certificate={certTotvs}
          onViewCert={onViewCert}
          onDownloadCert={onDownloadCert}
          onNavigateToSystem={() => onNavigateToSystem('TOTVS')}
          theme={theme}
        />

        {/* CARD 3: FORMAÇÃO EM SISTEMAS FINANCEIROS */}
        <CertificateCard 
          systemTag="FORMAÇÃO COMPLETA"
          systemTagColor="emerald"
          title="Formação em Sistemas Financeiros"
          description="Certificação final da área de Finanças da Faculdade Adventista do Paraná, liberada após a conclusão dos treinamentos dos sistemas 7Edu e TOTVS."
          status={statusFinancas}
          progressPercent={Math.round((pct7Edu + pctTotvs) / 2)}
          certificate={certFinancas}
          onViewCert={onViewCert}
          onDownloadCert={onDownloadCert}
          onNavigateToSystem={() => onNavigateToSystem(!is7Edu100 ? '7Edu' : 'TOTVS')}
          prerequisites={[
            { name: 'Sistema 7Edu', isCompleted: is7Edu100, percent: pct7Edu },
            { name: 'Sistema TOTVS', isCompleted: isTotvs100, percent: pctTotvs }
          ]}
          theme={theme}
        />
      </div>
    </motion.div>
  );
};
