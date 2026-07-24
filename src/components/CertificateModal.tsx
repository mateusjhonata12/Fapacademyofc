import React, { useRef, useState } from 'react';
import { Certificate } from '../types';
import { CertificateDocument } from './CertificateDocument';
import { X, Download, Eye, Loader2, CheckCircle2, Award, FileText } from 'lucide-react';
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

  if (!isOpen || !certificate) return null;

  const handleDownloadPdf = async () => {
    const element = offscreenPrintRef.current || documentRef.current;
    if (!element) return;
    setIsGeneratingPdf(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution capture
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Remove/replace unsupported modern color functions (oklch/oklab) in cloned styles
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

      // A4 Landscape size: 297mm x 210mm
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

      const cleanUserName = (userName || certificate.nomeUsuario || 'Colaborador')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanType = certificate.tipoCertificado;
      const filename = `Certificado_${cleanType}_${cleanUserName}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error("Erro ao gerar PDF do certificado:", error);
      alert("Erro ao gerar o arquivo PDF. Ativando o modo de impressão do navegador...");
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
        {/* Offscreen element rendered at exact 1:1 scale (1050x742) for crisp, unscaled PDF export */}
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
          {/* Header do Modal */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 py-4 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Award size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Certificado de Conclusão - {certificate.treinamento}
                </h3>
                <p className="text-xs text-slate-400">
                  Emitido para <span className="font-semibold text-slate-200">{userName || certificate.nomeUsuario}</span> em {certificate.dataConclusao}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Gerando PDF...
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
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Área de Visualização do Certificado em Escala Responsiva */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center">
            {/* Wrapper escalado para caber na tela mantendo proporções exatas de A4 Landscape */}
            <div className="w-full flex justify-center overflow-x-auto py-2">
              <div className="transform scale-[0.38] sm:scale-[0.55] md:scale-[0.7] lg:scale-[0.82] origin-top transition-transform duration-300 shadow-2xl rounded-lg">
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
              <span>Autenticidade verificada no sistema FAP Academy</span>
            </div>
            <p className="font-mono text-[11px] text-slate-500">
              ID: {certificate.id}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
