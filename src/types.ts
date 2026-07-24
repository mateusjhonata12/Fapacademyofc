export type SystemType = '7Edu' | 'TOTVS';

export interface Course {
  id: string;
  title: string;
  system: SystemType;
  duration: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  thumbnail: string;
  videoUrl?: string;
  pdfUrl?: string;
  createdAt?: number;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  completedCourses?: string[];
}

export type CertificateType = '7Edu' | 'TOTVS' | 'Financas';

export interface Certificate {
  id: string; // e.g. 'certificado_7edu_USERID'
  userId: string;
  nomeUsuario: string;
  tipoCertificado: CertificateType;
  treinamento: string; // 'Sistema 7Edu' | 'Sistema TOTVS' | 'Finanças'
  dataConclusao: string; // 'DD/MM/YYYY'
  dataEmissao: string; // 'DD/MM/YYYY HH:mm'
  timestampConclusao: number;
  prerequisitosConcluidos?: string[]; // ['7Edu', 'TOTVS']
  status: 'emitido' | 'ativo';
}
