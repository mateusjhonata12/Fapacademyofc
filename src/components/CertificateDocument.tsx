import React from 'react';
import { Certificate } from '../types';
import { GraduationCap, ShieldCheck, Award } from 'lucide-react';

interface CertificateDocumentProps {
  certificate: Certificate;
  userName?: string;
}

export const CertificateDocument = React.forwardRef<HTMLDivElement, CertificateDocumentProps>(
  ({ certificate, userName }, ref) => {
    const displayName = userName || certificate.nomeUsuario || 'COLABORADOR FAP ACADEMY';
    const isFinancas = certificate.tipoCertificado === 'Financas';
    const is7Edu = certificate.tipoCertificado === '7Edu';
    const isTotvs = certificate.tipoCertificado === 'TOTVS';

    return (
      <div 
        ref={ref}
        id="certificate-print-area"
        style={{ 
          width: '1050px', 
          height: '742px',
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          borderColor: '#0F172A',
          borderWidth: '14px',
          borderStyle: 'solid',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        className="relative overflow-hidden shadow-2xl flex flex-col justify-between p-10 select-none"
      >
        {/* Moldura Interna Ornamental Dourada e Azul */}
        <div className="absolute inset-2 border-2 pointer-events-none" style={{ borderColor: 'rgba(217, 119, 6, 0.6)' }} />
        <div className="absolute inset-4 border pointer-events-none" style={{ borderColor: '#CBD5E1' }} />

        {/* Marca d'água de fundo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <GraduationCap size={450} style={{ color: '#0F172A' }} />
        </div>

        {/* Detalhes de Cantos Institucionais (Cantoneiras Elegantes) */}
        <div className="absolute top-5 left-5 w-8 h-8 border-t-2 border-l-2" style={{ borderColor: '#D97706' }} />
        <div className="absolute top-5 right-5 w-8 h-8 border-t-2 border-r-2" style={{ borderColor: '#D97706' }} />
        <div className="absolute bottom-5 left-5 w-8 h-8 border-b-2 border-l-2" style={{ borderColor: '#D97706' }} />
        <div className="absolute bottom-5 right-5 w-8 h-8 border-b-2 border-r-2" style={{ borderColor: '#D97706' }} />

        {/* --- Cabeçalho do Certificado --- */}
        <div className="relative z-10 flex items-center justify-between border-b pb-5" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center shadow-md shrink-0" style={{ backgroundColor: '#0F172A', color: '#FBBF24' }}>
              <GraduationCap size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase" style={{ color: '#0F172A', letterSpacing: '0.5px' }}>
                FACULDADE ADVENTISTA DO PARANÁ
              </h2>
              <p className="text-xs font-bold uppercase mt-0.5" style={{ color: '#D97706', letterSpacing: '0.5px' }}>
                Plataforma de Treinamento Corporativo • FAP Academy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full border shrink-0" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
            <Award size={20} style={{ color: '#D97706' }} />
            <span className="text-xs font-extrabold uppercase" style={{ color: '#334155', letterSpacing: '0.5px' }}>
              Certificação Institucional
            </span>
          </div>
        </div>

        {/* --- Corpo Central do Certificado --- */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-3 px-8">
          {/* Título Principal */}
          <h1 className="text-3xl font-black uppercase mb-2" style={{ color: '#0F172A', letterSpacing: '2px' }}>
            CERTIFICADO DE CONCLUSÃO
          </h1>
          <div className="w-32 h-1 rounded-full mb-6" style={{ background: 'linear-gradient(to right, #F59E0B, #3B82F6, #F59E0B)' }} />

          {/* Texto de Introdução */}
          <p className="text-sm font-semibold uppercase mb-3" style={{ color: '#475569', letterSpacing: '1px' }}>
            Certificamos que
          </p>

          {/* Nome do Colaborador em Destaque */}
          <div className="w-full max-w-3xl border-b-2 pb-3 mb-6 min-h-[52px] flex items-center justify-center" style={{ borderColor: '#1E293B' }}>
            <h2 className="text-3xl font-serif font-black uppercase" style={{ color: '#0F172A', letterSpacing: '1px', lineHeight: '1.3' }}>
              {displayName}
            </h2>
          </div>

          {/* Texto Específico do Certificado conforme Especificação */}
          <div className="max-w-3xl text-sm leading-relaxed font-normal" style={{ color: '#334155', letterSpacing: '0px' }}>
            {is7Edu && (
              <p style={{ lineHeight: '1.8' }}>
                concluiu com êxito o treinamento do{' '}
                <span className="font-extrabold uppercase text-base px-2.5 py-1 rounded border inline-block mx-1 align-baseline" style={{ color: '#0F172A', backgroundColor: '#FEF3C7', borderColor: '#FCD34D', letterSpacing: '0.5px' }}>
                  SISTEMA 7EDU
                </span>
                , desenvolvido pela Faculdade Adventista do Paraná, por meio da plataforma FAP Academy, demonstrando dedicação e comprometimento com seu desenvolvimento profissional.
              </p>
            )}

            {isTotvs && (
              <p style={{ lineHeight: '1.8' }}>
                concluiu com êxito o treinamento do{' '}
                <span className="font-extrabold uppercase text-base px-2.5 py-1 rounded border inline-block mx-1 align-baseline" style={{ color: '#0F172A', backgroundColor: '#DBEAFE', borderColor: '#93C5FD', letterSpacing: '0.5px' }}>
                  SISTEMA TOTVS
                </span>
                , desenvolvido pela Faculdade Adventista do Paraná, por meio da plataforma FAP Academy, demonstrando dedicação e comprometimento com seu desenvolvimento profissional.
              </p>
            )}

            {isFinancas && (
              <p style={{ lineHeight: '1.8' }}>
                concluiu com êxito os treinamentos dos sistemas{' '}
                <span className="font-extrabold uppercase" style={{ color: '#0F172A', letterSpacing: '0.5px' }}>
                  7EDU E TOTVS
                </span>
                , completando a formação em{' '}
                <span className="font-extrabold uppercase text-base px-2.5 py-1 rounded border inline-block mx-1 align-baseline" style={{ color: '#1E3A8A', backgroundColor: '#D1FAE5', borderColor: '#6EE7B7', letterSpacing: '0.5px' }}>
                  FINANÇAS
                </span>
                , desenvolvida pela Faculdade Adventista do Paraná, por meio da plataforma FAP Academy, demonstrando dedicação e comprometimento com seu desenvolvimento profissional.
              </p>
            )}
          </div>
        </div>

        {/* --- Rodapé com Data, Instituição e Assinaturas --- */}
        <div className="relative z-10 pt-4 border-t grid grid-cols-3 items-end gap-6 text-center" style={{ borderColor: '#E2E8F0' }}>
          {/* Coluna 1: Data de Emissão */}
          <div className="text-left pl-2">
            <p className="text-[11px] font-bold uppercase" style={{ color: '#64748B', letterSpacing: '0.5px' }}>Emitido em:</p>
            <p className="text-sm font-extrabold mt-0.5" style={{ color: '#0F172A', letterSpacing: '0.5px' }}>
              {certificate.dataConclusao}
            </p>
            <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: '#94A3B8' }}>
              <ShieldCheck size={12} className="shrink-0" style={{ color: '#059669' }} />
              Documento Oficial FAP Academy
            </p>
          </div>

          {/* Coluna 2: Assinatura Institucional 1 */}
          <div className="flex flex-col items-center">
            <div className="w-52 border-b-2 mb-2 flex items-center justify-center pb-1 h-9" style={{ borderColor: '#1E293B' }}>
              {/* Assinatura estilizada/vetorial limpa */}
              <span className="font-serif italic text-lg select-none" style={{ color: '#1E293B' }}>
                Coordenação FAP Academy
              </span>
            </div>
            <p className="text-xs font-bold uppercase" style={{ color: '#0F172A', letterSpacing: '0.5px' }}>
              Coordenação de Treinamento
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>FACULDADE ADVENTISTA DO PARANÁ</p>
          </div>

          {/* Coluna 3: Assinatura Institucional 2 */}
          <div className="flex flex-col items-center pr-2">
            <div className="w-52 border-b-2 mb-2 flex items-center justify-center pb-1 h-9" style={{ borderColor: '#1E293B' }}>
              <span className="font-serif italic text-lg select-none" style={{ color: '#1E293B' }}>
                Direção Acadêmica
              </span>
            </div>
            <p className="text-xs font-bold uppercase" style={{ color: '#0F172A', letterSpacing: '0.5px' }}>
              FACULDADE ADVENTISTA DO PARANÁ
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>Direção e Gestão Financeira</p>
          </div>
        </div>
      </div>
    );
  }
);

CertificateDocument.displayName = 'CertificateDocument';

