import React, { useRef, useState, useEffect } from 'react';
import { Certificate } from '../types';
import { CertificateDocument } from './CertificateDocument';
import { X, Download, Loader2, CheckCircle2, Award, FileCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface CertificateModalProps {
  isOpen: boolean;
  certificate: Certificate | null;
  userName: string;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  certificate,
  userName,
  onClose
}) => {
  const documentRef = useRef<HTMLDivElement>(null);
  const offscreenPrintRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Teclado: Fechamento via tecla ESC conforme especificação #12 e #15
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !certificate) return null;

  const handleDownloadPdf = async () => {
    const element = offscreenPrintRef.current || documentRef.current;
    if (!element || isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    setDownloadSuccessMessage(null);

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Capture em alta resolução
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Tratar funções de cores modernas (oklch/oklab) que podem existir na árvore de estilos
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((styleTag) => {
            if (styleTag.textContent) {
              styleTag.textContent = styleTag.textContent
                .replace(/oklch\([^)]+\)/gi, 'rgb(15, 23, 42)')
                .replace(/oklab\([^)]+\)/gi, 'rgb(15, 23, 42)');
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Tamanho A4 Landscape: 297mm x 210mm
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

      const cleanUserName = (userName || certificate.nomeUsuario || 'Colaborador')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanType = certificate.tipoCertificado;
      const filename = `Certificado_${cleanType}_${cleanUserName}.pdf`;

      pdf.save(filename);

      // Feedback visual de sucesso conforme requisito #11
      setDownloadSuccessMessage('Certificado baixado com sucesso.');
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (error) {
      console.error("Erro ao gerar PDF do certificado:", error);
      alert("Erro ao gerar o arquivo PDF. Ativando impressão nativa do navegador...");
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-modal-title"
      >
        {/* Elemento offscreen renderizado em escala exata 1:1 (1050x742) para exportação de PDF de alta fidelidade */}
        <div 
          style={{ 
            position: 'fixed', 
            left: '-9999px', 
            top: '0px', 
            width: '1050px', 
            height: '742px', 
            zIndex: -9999,
            overflow: 'hidden' 
          }}
        >
          <CertificateDocument
            ref={offscreenPrintRef}
            certificate={certificate}
            userName={userName}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden my-auto max-h-[95vh]"
        >
          {/* Toast / Notificação de sucesso de download */}
          <AnimatePresence>
            {downloadSuccessMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-5 py-2.5 rounded-full font-black text-xs shadow-2xl flex items-center gap-2 border border-emerald-300"
              >
                <FileCheck size={18} className="stroke-[2.5]" />
                <span>{downloadSuccessMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header do Modal */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 py-4 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                <Award size={22} />
              </div>
              <div>
                <h3 id="certificate-modal-title" className="text-sm sm:text-base font-extrabold text-white leading-tight">
                  {certificate.tipoCertificado === 'Financas' ? 'Formação em Sistemas Financeiros' : `Certificado - ${certificate.treinamento}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Emitido para <span className="font-bold text-slate-200">{userName || certificate.nomeUsuario}</span> em {certificate.dataConclusao}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Baixar Certificado em PDF"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Gerando certificado...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Baixar PDF
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Fechar (Esc)"
                aria-label="Fechar visualização de certificado"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Visualização do Certificado em Escala Responsiva */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-full flex justify-center overflow-x-auto py-2">
              <div className="transform scale-[0.38] sm:scale-[0.55] md:scale-[0.7] lg:scale-[0.82] origin-top transition-transform duration-300 shadow-2xl rounded-lg border border-slate-800">
                <CertificateDocument
                  ref={documentRef}
                  certificate={certificate}
                  userName={userName}
                />
              </div>
            </div>
          </div>

          {/* Footer do Modal */}
          <div className="border-t border-slate-800 px-6 py-3 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>Autenticidade de certificação verificada no sistema FAP Academy</span>
            </div>
            <p className="font-mono text-[11px] text-slate-500">
              ID de Registro: {certificate.id}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
