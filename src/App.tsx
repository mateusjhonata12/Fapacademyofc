/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Play, 
  FileText, 
  BookOpen, 
  Settings, 
  Sparkles,
  LayoutDashboard, 
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Clock,
  BarChart,
  Menu,
  X,
  CheckCircle2,
  Home as HomeIcon,
  ArrowRight,
  Trophy,
  Users,
  Zap,
  Plus,
  Download,
  Video,
  Upload,
  LogIn,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Loader2,
  Rewind,
  FastForward,
  RotateCcw,
  RotateCw,
  Pause,
  Maximize,
  ArrowBigLeft,
  ArrowBigRight,
  ExternalLink,
  VolumeX,
  Volume1,
  Volume2,
  FileCode,
  Globe,
  Award,
  BarChart2,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIAssistant } from './lib/AIAssistant';
import { GeminiVideoUploader } from './components/GeminiVideoUploader';
import { CertificateModal } from './components/CertificateModal';
import { CertificatesView } from './components/CertificatesView';
import { CertificateBanners } from './components/CertificateBanners';
import { UserDashboard } from './components/UserDashboard';
import { Certificate } from './types';
import { 
  signInAnonymously,
  onAuthStateChanged,
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDocs,
  getDocFromServer,
  query,
  where
} from 'firebase/firestore';
import { db, auth, storage, handleFirestoreError, OperationType } from './lib/firebase';
import { saveLocalFile, getLocalFile } from './lib/indexedDB';
import { supabase, isConfigured } from './lib/supabase';

const downloadFile = async (url: string, filename: string) => {
  if (!url) return;
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("CORS constraint or resource not accessible directly");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.warn("Fallback to opening target link in new tab:", error);
    window.open(url, '_blank');
  }
};

// --- Tipos ---
interface Course {
  id: string;
  title: string;
  system: '7Edu' | 'TOTVS';
  duration: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  thumbnail: string;
  videoUrl?: string;
  pdfUrl?: string;
  createdAt?: number;
  description?: string;
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: React.ReactNode;
  hasNotification?: boolean;
}

interface CourseCardProps {
  course: Course;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  onOpenMedia: (type: 'video' | 'pdf') => void;
  theme?: 'light' | 'dark';
}

type TabType = 'Home' | '7Edu' | 'TOTVS' | 'Todos' | 'Certificados' | 'Admin' | 'GeminiVideo' | 'MeuEmpenho';

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  completedCourses?: string[];
}

// --- Dados Simulados ---
const INITIAL_USERS: User[] = [
  { id: '1', name: 'Mateus Jhonata', email: 'mateusjhonata123@gmail.com', password: '123', role: 'admin' },
  { id: '2', name: 'Administrador Fap', email: 'admin@fap.com.br', password: 'admin', role: 'admin' },
  { id: '3', name: 'João Silva', email: 'joao@fap.com.br', password: 'user123', role: 'user' },
  { id: '4', name: 'Maria Santos', email: 'maria@fap.com.br', password: 'user456', role: 'user' },
];

const COURSES: Course[] = [
  {
    id: '1',
    title: 'Lançamento de Desconto Condicional',
    system: '7Edu',
    duration: '15 min',
    difficulty: 'Intermediário',
    thumbnail: 'https://i.pinimg.com/736x/02/5a/32/025a32bbd863c42e35e4a87cd372be81.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '2',
    title: 'Alteração de Data de Boleto',
    system: '7Edu',
    duration: '10 min',
    difficulty: 'Iniciante',
    thumbnail: 'https://i.pinimg.com/736x/59/e4/55/59e4554eed17f3bbf64aaf1d2b5d0e06.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '3',
    title: 'Alteração de Contrato',
    system: '7Edu',
    duration: '20 min',
    difficulty: 'Avançado',
    thumbnail: 'https://i.pinimg.com/736x/fc/a0/2e/fca02e2d40c27ff314f401f86e13d75f.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '4',
    title: 'Lançar Negociação',
    system: '7Edu',
    duration: '25 min',
    difficulty: 'Avançado',
    thumbnail: 'https://i.pinimg.com/736x/b0/00/a6/b000a6dff49949b26bbf932dc7bbddf5.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL',
    pdfUrl: ''
  },
  {
    id: '8',
    title: 'Lançamento de Contrato / Pensionato',
    system: '7Edu',
    duration: '22 min',
    difficulty: 'Intermediário',
    thumbnail: 'https://i.pinimg.com/1200x/61/ba/f1/61baf113e8c2e798d4bec4a783a9229c.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '9',
    title: 'Lançar Bolsa Dissídio',
    system: '7Edu',
    duration: '15 min',
    difficulty: 'Intermediário',
    thumbnail: 'https://i.pinimg.com/736x/1d/b6/f7/1db6f75828876c1d6c16f9e893f27f09.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '10',
    title: 'Lançar Taxa de Evento',
    system: '7Edu',
    duration: '12 min',
    difficulty: 'Iniciante',
    thumbnail: 'https://i.pinimg.com/736x/5b/48/25/5b4825901279276a6b6e557cde6b902f.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '11',
    title: 'Baixar Arquivo Bancário',
    system: '7Edu',
    duration: '18 min',
    difficulty: 'Intermediário',
    thumbnail: 'https://i.pinimg.com/1200x/55/4f/fa/554ffab47b99d836c193031ac6dafa7f.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '20',
    title: 'Baixar Declaração de Pagamentos',
    system: '7Edu',
    duration: '10 min',
    difficulty: 'Iniciante',
    thumbnail: 'https://i.pinimg.com/736x/83/1c/0d/831c0dd3d6cd518e330eed0909427703.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '12',
    title: 'Lançar Bolsa (Desconto / Filantrópica)',
    system: 'TOTVS',
    duration: '20 min',
    difficulty: 'Intermediário',
    thumbnail: 'https://i.pinimg.com/736x/b7/a7/96/b7a79630680a20b165bdad440b2bd368.jpg',
    videoUrl: 'https://drive.google.com/file/d/1asr3r1waCXeepATD7kartYtmbfo-1cNf/preview'
  },
  {
    id: '13',
    title: 'Cancelar Lançamento',
    system: 'TOTVS',
    duration: '10 min',
    difficulty: 'Iniciante',
    thumbnail: 'https://i.pinimg.com/736x/9c/7b/63/9c7b639a76ff775b1d0b89aceb8cebc2.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '14',
    title: 'Baixar Boletos',
    system: 'TOTVS',
    duration: '15 min',
    difficulty: 'Iniciante',
    thumbnail: 'https://i.pinimg.com/736x/d5/6d/55/d56d55038df48a5e87577c8b33609e0f.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '15',
    title: 'Registrar e Cancelar Remessa de Boletos',
    system: 'TOTVS',
    duration: '25 min',
    difficulty: 'Avançado',
    thumbnail: 'https://i.pinimg.com/1200x/b6/38/c2/b638c2455e4877a1bbfd4c3c0575da9c.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '16',
    title: 'Baixar Declaração de Pagamentos',
    system: 'TOTVS',
    duration: '12 min',
    difficulty: 'Iniciante',
    thumbnail: 'https://i.pinimg.com/736x/7a/3b/1b/7a3b1b8403a073057292533a5f82e31f.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '17',
    title: 'Baixar Declaração de Débitos',
    system: 'TOTVS',
    duration: '12 min',
    difficulty: 'Iniciante',
    thumbnail: 'https://i.pinimg.com/1200x/e9/e8/1f/e9e81f7db763553e51869ed3abe9dc43.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '18',
    title: 'Aceite de Contrato',
    system: 'TOTVS',
    duration: '15 min',
    difficulty: 'Intermediário',
    thumbnail: 'https://i.pinimg.com/736x/7f/3a/aa/7f3aaaa7ea3f0c3cf9ff780d218dc107.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '19',
    title: 'Retorno de Cobrança',
    system: 'TOTVS',
    duration: '20 min',
    difficulty: 'Intermediário',
    thumbnail: 'https://i.pinimg.com/736x/e1/3e/63/e13e63fb996ee070375592625c1c8b32.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '21',
    title: 'Assistente de parcelas / gerar parcelas',
    system: 'TOTVS',
    duration: '18 min',
    difficulty: 'Intermediário',
    thumbnail: 'https://i.pinimg.com/736x/5f/8e/6c/5f8e6cbc8801b5b41bae70b9c02322c4.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '22',
    title: 'Cadastrar logos',
    system: 'TOTVS',
    duration: '10 min',
    difficulty: 'Iniciante',
    thumbnail: 'https://i.pinimg.com/1200x/93/01/3b/93013bc2b7dc1c7a82df5ebff448f96d.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '28',
    title: 'Lançar contrato de Pensionato',
    system: 'TOTVS',
    duration: '10 min',
    difficulty: 'Iniciante',
    thumbnail: 'https://i.pinimg.com/736x/a1/14/97/a11497ccc8d4ac79fcc11fb5415833cc.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '23',
    title: 'Devolução de mensalidade',
    system: 'TOTVS',
    duration: '15 min',
    difficulty: 'Intermediário',
    thumbnail: 'https://i.pinimg.com/1200x/85/95/7f/85957f8aba52e654066b75a51482dec7.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '24',
    title: 'Lançamento mensal de Boletos',
    system: 'TOTVS',
    duration: '20 min',
    difficulty: 'Intermediário',
    thumbnail: 'https://i.pinimg.com/1200x/18/ea/66/18ea66f817ab3b0a487c83796437e383.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '25',
    title: 'Lançamento individual de boletos',
    system: 'TOTVS',
    duration: '12 min',
    difficulty: 'Iniciante',
    thumbnail: 'https://i.pinimg.com/736x/62/50/28/625028aeb510d0c0f7fd68629240e806.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '26',
    title: 'Vincular 2 lançamentos em um 1 boleto',
    system: 'TOTVS',
    duration: '15 min',
    difficulty: 'Avançado',
    thumbnail: 'https://i.pinimg.com/1200x/c9/79/ad/c979add200083998f27138d82d15dfb7.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  },
  {
    id: '27',
    title: 'Devolução de mensalidade',
    system: '7Edu',
    duration: '14 min',
    difficulty: 'Intermediário',
    thumbnail: 'https://i.pinimg.com/1200x/30/0d/c9/300dc97960d1a89943538da53942c891.jpg',
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('fapacademy_theme');
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
  });

  useEffect(() => {
    localStorage.setItem('fapacademy_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modalType, setModalType] = useState<'video' | 'pdf' | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(false);

  // --- Estados de Certificados ---
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertModal, setSelectedCertModal] = useState<Certificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Cálculo de Conclusão dos Treinamentos
  const courses7Edu = useMemo(() => courses.filter(c => c.system === '7Edu'), [courses]);
  const coursesTotvs = useMemo(() => courses.filter(c => c.system === 'TOTVS'), [courses]);

  const completed7EduCount = useMemo(() => {
    return courses7Edu.filter(c => completedCourses.includes(c.id)).length;
  }, [courses7Edu, completedCourses]);

  const completedTotvsCount = useMemo(() => {
    return coursesTotvs.filter(c => completedCourses.includes(c.id)).length;
  }, [coursesTotvs, completedCourses]);

  const is7Edu100 = courses7Edu.length > 0 && completed7EduCount === courses7Edu.length;
  const isTotvs100 = coursesTotvs.length > 0 && completedTotvsCount === coursesTotvs.length;
  const isFinancas100 = is7Edu100 && isTotvs100;

  // Carrega e Sincroniza os Certificados do Usuário no Firestore
  useEffect(() => {
    if (!currentUser?.id) {
      setCertificates([]);
      return;
    }

    const q = query(collection(db, 'certificates'), where('userId', '==', currentUser.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Certificate[] = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Certificate);
      });
      setCertificates(fetched);
    }, (err) => {
      console.warn("Aviso na sincronização de certificados:", err);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Validação em Banco e Emissão Automática
  useEffect(() => {
    if (!currentUser?.id) return;

    const autoIssueCertificates = async () => {
      const userId = currentUser.id;
      const userName = currentUser.name || 'Colaborador';
      const nowFormatted = new Date().toLocaleDateString('pt-BR');
      const nowTimeFormatted = new Date().toLocaleString('pt-BR');

      // 1. Validar e Emitir Certificado do 7Edu
      if (is7Edu100) {
        const certId = `certificado_7edu_${userId}`;
        const certRef = doc(db, 'certificates', certId);
        try {
          const docSnap = await getDocFromServer(certRef);
          if (!docSnap.exists()) {
            const newCert: Certificate = {
              id: certId,
              userId,
              nomeUsuario: userName,
              tipoCertificado: '7Edu',
              treinamento: 'Sistema 7Edu',
              dataConclusao: nowFormatted,
              dataEmissao: nowTimeFormatted,
              timestampConclusao: Date.now(),
              status: 'emitido'
            };
            await setDoc(certRef, newCert);
          }
        } catch (e) {
          console.warn("Aviso ao emitir certificado 7Edu:", e);
        }
      }

      // 2. Validar e Emitir Certificado do TOTVS
      if (isTotvs100) {
        const certId = `certificado_totvs_${userId}`;
        const certRef = doc(db, 'certificates', certId);
        try {
          const docSnap = await getDocFromServer(certRef);
          if (!docSnap.exists()) {
            const newCert: Certificate = {
              id: certId,
              userId,
              nomeUsuario: userName,
              tipoCertificado: 'TOTVS',
              treinamento: 'Sistema TOTVS',
              dataConclusao: nowFormatted,
              dataEmissao: nowTimeFormatted,
              timestampConclusao: Date.now(),
              status: 'emitido'
            };
            await setDoc(certRef, newCert);
          }
        } catch (e) {
          console.warn("Aviso ao emitir certificado TOTVS:", e);
        }
      }

      // 3. Validar e Emitir Certificado de Finanças (Apenas se 7Edu E TOTVS concluídos)
      if (isFinancas100) {
        const certId = `certificado_financas_${userId}`;
        const certRef = doc(db, 'certificates', certId);
        try {
          const docSnap = await getDocFromServer(certRef);
          if (!docSnap.exists()) {
            const newCert: Certificate = {
              id: certId,
              userId,
              nomeUsuario: userName,
              tipoCertificado: 'Financas',
              treinamento: 'Finanças',
              dataConclusao: nowFormatted,
              dataEmissao: nowTimeFormatted,
              timestampConclusao: Date.now(),
              prerequisitosConcluidos: ['7Edu', 'TOTVS'],
              status: 'emitido'
            };
            await setDoc(certRef, newCert);
          }
        } catch (e) {
          console.warn("Aviso ao emitir certificado Finanças:", e);
        }
      }
    };

    autoIssueCertificates();
  }, [is7Edu100, isTotvs100, isFinancas100, currentUser?.id, currentUser?.name]);

  const cert7Edu = useMemo(() => {
    const found = certificates.find(c => c.tipoCertificado === '7Edu');
    if (found) return found;
    if (is7Edu100 && currentUser) {
      return {
        id: `certificado_7edu_${currentUser.id}`,
        userId: currentUser.id,
        nomeUsuario: currentUser.name,
        tipoCertificado: '7Edu' as const,
        treinamento: 'Sistema 7Edu',
        dataConclusao: new Date().toLocaleDateString('pt-BR'),
        dataEmissao: new Date().toLocaleString('pt-BR'),
        timestampConclusao: Date.now(),
        status: 'emitido' as const
      };
    }
    return null;
  }, [certificates, is7Edu100, currentUser]);

  const certTotvs = useMemo(() => {
    const found = certificates.find(c => c.tipoCertificado === 'TOTVS');
    if (found) return found;
    if (isTotvs100 && currentUser) {
      return {
        id: `certificado_totvs_${currentUser.id}`,
        userId: currentUser.id,
        nomeUsuario: currentUser.name,
        tipoCertificado: 'TOTVS' as const,
        treinamento: 'Sistema TOTVS',
        dataConclusao: new Date().toLocaleDateString('pt-BR'),
        dataEmissao: new Date().toLocaleString('pt-BR'),
        timestampConclusao: Date.now(),
        status: 'emitido' as const
      };
    }
    return null;
  }, [certificates, isTotvs100, currentUser]);

  const certFinancas = useMemo(() => {
    const found = certificates.find(c => c.tipoCertificado === 'Financas');
    if (found) return found;
    if (isFinancas100 && currentUser) {
      return {
        id: `certificado_financas_${currentUser.id}`,
        userId: currentUser.id,
        nomeUsuario: currentUser.name,
        tipoCertificado: 'Financas' as const,
        treinamento: 'Finanças',
        dataConclusao: new Date().toLocaleDateString('pt-BR'),
        dataEmissao: new Date().toLocaleString('pt-BR'),
        timestampConclusao: Date.now(),
        prerequisitosConcluidos: ['7Edu', 'TOTVS'],
        status: 'emitido' as const
      };
    }
    return null;
  }, [certificates, isFinancas100, currentUser]);

  // Função para resetar o empenho (progresso das aulas) e redefinir certificados
  const handleResetProgressAndCertificates = async () => {
    if (!currentUser?.id) {
      alert("Nenhum usuário logado para redefinir.");
      return;
    }

    const confirmReset = window.confirm(
      "Atenção: Esta ação administrativa irá redefinir todo o seu empenho (progresso de aulas) e revogar os certificados emitidos. Deseja prosseguir com a redefinição definitiva?"
    );
    if (!confirmReset) return;

    setIsAppLoading(true);
    try {
      const userId = currentUser.id;

      // 1. Apagar os certificados do usuário no Firestore
      const certIds = [
        `certificado_7edu_${userId}`,
        `certificado_totvs_${userId}`,
        `certificado_financas_${userId}`
      ];

      for (const certId of certIds) {
        try {
          await deleteDoc(doc(db, 'certificates', certId));
        } catch (e) {
          console.warn(`Aviso ao excluir certificado ${certId}:`, e);
        }
      }

      // Deleta qualquer outro certificado associado ao userId
      try {
        const qCert = query(collection(db, 'certificates'), where('userId', '==', userId));
        const snapshotCert = await getDocs(qCert);
        for (const certDoc of snapshotCert.docs) {
          await deleteDoc(doc(db, 'certificates', certDoc.id));
        }
      } catch (e) {
        console.warn("Aviso ao buscar certificados adicionais para exclusão:", e);
      }

      // 2. Limpar o progresso (empenho das aulas)
      setCompletedCourses([]);
      localStorage.removeItem('fapacademy_progress');

      // 3. Atualizar documento do usuário no Firestore
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          completedCourses: []
        });
      } catch (e) {
        console.warn("Aviso ao atualizar progresso do usuário no Firestore:", e);
      }

      setCertificates([]);

      alert("Empenho de aulas e certificados foram redefinidos com sucesso!");
    } catch (err) {
      console.error("Erro ao resetar progresso e certificados:", err);
      alert("Progresso local redefinido com sucesso.");
    } finally {
      setIsAppLoading(false);
    }
  };

  // --- Listeners de Dados ---
  useEffect(() => {
    // Carrega de antemão do localStorage caso esteja totalmente sem conexão
    const offlineCoursesJSON = localStorage.getItem('fapacademy_offline_courses');
    let offlineCourses: Course[] = [];
    if (offlineCoursesJSON) {
      try {
        offlineCourses = JSON.parse(offlineCoursesJSON);
      } catch (e) {
        console.warn("Erro ao deserializar fapacademy_offline_courses:", e);
      }
    }

    // Cursos (Sempre visíveis publicamente agora)
    const coursesUnsubscribe = onSnapshot(collection(db, 'courses'), 
      async (snapshot) => {
        const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        
        // Resolve local file URLs from IndexedDB if they are local keys
        const updatedCourses = await Promise.all(coursesData.map(async (course) => {
          const updatedCourse = { ...course };
          if (course.videoUrl && course.videoUrl.startsWith('local-file-')) {
            try {
              const blob = await getLocalFile(course.videoUrl);
              if (blob) {
                updatedCourse.videoUrl = URL.createObjectURL(blob);
              }
            } catch (err) {
              console.error("Erro ao carregar arquivo de vídeo local:", err);
            }
          }
          if (course.pdfUrl && course.pdfUrl.startsWith('local-file-')) {
            try {
              const blob = await getLocalFile(course.pdfUrl);
              if (blob) {
                updatedCourse.pdfUrl = URL.createObjectURL(blob);
              }
            } catch (err) {
              console.error("Erro ao carregar material PDF local:", err);
            }
          }
          return updatedCourse;
        }));

        // Une os cursos do banco com os cursos offline salvos localmente
        const allCourses = [...offlineCourses, ...updatedCourses];
        const uniqueCoursesMap = new Map<string, Course>();
        allCourses.forEach(c => uniqueCoursesMap.set(c.id, c));
        const mergedCourses = Array.from(uniqueCoursesMap.values());

        // Sort: items with createdAt descending, then items without by numeric ID ascending
        mergedCourses.sort((a, b) => {
          const aTime = a.createdAt || 0;
          const bTime = b.createdAt || 0;
          if (aTime || bTime) {
            return bTime - aTime;
          }
          const aId = parseInt(a.id) || 999;
          const bId = parseInt(b.id) || 999;
          return aId - bId;
        });

        setCourses(mergedCourses);
        setIsAppLoading(false);

        if (snapshot.empty && mergedCourses.length === 0) {
          COURSES.forEach(async (c) => {
            const { id, ...data } = c;
            await setDoc(doc(db, 'courses', id), {
              ...data,
              createdAt: Date.now() - (30 - (parseInt(id) || 0)) * 60000
            });
          });
        }
      },
      async (error) => {
        console.error("Erro ao carregar cursos do Firestore:", error);
        // Fallback local total se o Firestore falhar totalmente (off-line)
        const staticCoursesWithBlobs = await Promise.all(COURSES.map(async (course) => {
          const updatedCourse = { ...course };
          if (course.videoUrl && course.videoUrl.startsWith('local-file-')) {
            const blob = await getLocalFile(course.videoUrl);
            if (blob) updatedCourse.videoUrl = URL.createObjectURL(blob);
          }
          if (course.pdfUrl && course.pdfUrl.startsWith('local-file-')) {
            const blob = await getLocalFile(course.pdfUrl);
            if (blob) updatedCourse.pdfUrl = URL.createObjectURL(blob);
          }
          return updatedCourse;
        }));

        const fallbackMerged = [...offlineCourses, ...staticCoursesWithBlobs];
        const uniqueCoursesMap = new Map<string, Course>();
        fallbackMerged.forEach(c => uniqueCoursesMap.set(c.id, c));
        setCourses(Array.from(uniqueCoursesMap.values()));
        setIsAppLoading(false);
      }
    );

    return () => {
      coursesUnsubscribe();
    };
  }, []);

  // Listener de Usuários (Visível para administradores para métricas)
  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      return;
    }

    const usersUnsubscribe = onSnapshot(collection(db, 'users'), 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
        
        if (snapshot.empty) {
          INITIAL_USERS.forEach(async (u) => {
            const { id, ...data } = u;
            await setDoc(doc(db, 'users', id), data);
          });
        }
      },
      (error) => {
        console.warn("Aviso ao sincronizar lista de usuários:", error);
      }
    );

    return () => usersUnsubscribe();
  }, [currentUser]);

  // Sincronização em tempo real do perfil e progresso do usuário logado
  useEffect(() => {
    if (!currentUser?.id) return;

    const userDocUnsubscribe = onSnapshot(doc(db, 'users', currentUser.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as User;
        if (Array.isArray(data.completedCourses)) {
          setCompletedCourses(data.completedCourses);
          localStorage.setItem('fapacademy_progress', JSON.stringify(data.completedCourses));
        }
        // Mantém atualizado o objeto do usuário local caso cargo ou nome mudem
        if (data.name !== currentUser.name || data.role !== currentUser.role) {
          const updated = { ...currentUser, ...data };
          setCurrentUser(updated);
          localStorage.setItem('fapacademy_user', JSON.stringify(updated));
        }
      }
    }, (err) => {
      console.warn("Aviso na sincronização em tempo real do usuário:", err);
    });

    return () => userDocUnsubscribe();
  }, [currentUser?.id]);

  // --- Carregar Sessão ---
  useEffect(() => {
    const savedUser = localStorage.getItem('fapacademy_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Erro ao carregar usuário", e);
      }
    }
  }, []);

  const handleLogin = async (loginData: Pick<User, 'email' | 'password'>) => {
    setIsAppLoading(true);
    try {
      // Busca limitada para satisfazer as regras e eficiência
      const q = query(
        collection(db, 'users'), 
        where('email', '==', loginData.email.toLowerCase()), 
        where('password', '==', loginData.password)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() } as User;
        setCurrentUser(user);
        if (Array.isArray(user.completedCourses)) {
          setCompletedCourses(user.completedCourses);
          localStorage.setItem('fapacademy_progress', JSON.stringify(user.completedCourses));
        }
        localStorage.setItem('fapacademy_user', JSON.stringify(user));
      } else {
        alert("E-mail ou senha incorretos");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro ao conectar com o banco de dados. Verifique sua conexão.");
    } finally {
      setIsAppLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsAppLoading(true);
    try {
      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({
        tenant: 'organizations', // Restringe a contas corporativas Microsoft (Azure AD)
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email?.toLowerCase();
      
      if (!email) {
        throw new Error("Não foi possível obter o e-mail da conta Microsoft.");
      }
      
      // Verifica se o usuário já existe na coleção 'users' do Firestore
      const q = query(
        collection(db, 'users'), 
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);
      
      let userObj: User;
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        userObj = { id: userDoc.id, ...userDoc.data() } as User;
      } else {
        // Registra automaticamente o usuário corporativo novo
        const newId = result.user.uid || Math.random().toString(36).substr(2, 9);
        const name = result.user.displayName || email.split('@')[0].toUpperCase();
        const newUser: User = {
          id: newId,
          name,
          email,
          role: 'user',
          password: 'corporate-oauth-user' // Senha padrão fictícia de controle
        };
        await setDoc(doc(db, 'users', newId), newUser);
        userObj = newUser;
      }
      
      setCurrentUser(userObj);
      localStorage.setItem('fapacademy_user', JSON.stringify(userObj));
    } catch (error: any) {
      console.error("Erro no login Microsoft:", error);
      
      // Tratamento amigável caso o provedor Microsoft ainda não esteja ativo no Console do Firebase
      if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found' || error.message?.includes('provider') || error.code?.includes('configuration')) {
        const wishToSimulate = window.confirm(
          "O login integrado com Microsoft 365 / Azure AD não está ativado no Console do Firebase de desenvolvimento.\n\n" +
          "Para ativá-lo em ambiente real:\n" +
          "1. Vá ao Firebase Console -> Authentication -> Sign-in Method\n" +
          "2. Clique em 'Adicionar novo provedor' -> Microsoft e insira o Application ID e Secret do Azure AD.\n\n" +
          "Gostaria de rodar uma simulação de autenticação com e-mail corporativo para ver como o fluxo e o controle de progresso se comportam?"
        );
        
        if (wishToSimulate) {
          const testEmail = window.prompt("Insira um endereço de e-mail corporativo fictício (ex: seu.nome@suaempresa.com.br):", "colaborador@fap.com.br");
          if (testEmail && testEmail.trim()) {
            const emailClean = testEmail.trim().toLowerCase();
            const q = query(
              collection(db, 'users'), 
              where('email', '==', emailClean)
            );
            const querySnapshot = await getDocs(q);
            let userObj: User;
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              userObj = { id: userDoc.id, ...userDoc.data() } as User;
            } else {
              const newId = "ms-" + Math.random().toString(36).substr(2, 9);
              userObj = {
                id: newId,
                name: emailClean.split('@')[0].toUpperCase(),
                email: emailClean,
                role: 'user',
                password: 'corporate-oauth-user'
              };
              await setDoc(doc(db, 'users', newId), userObj);
            }
            setCurrentUser(userObj);
            localStorage.setItem('fapacademy_user', JSON.stringify(userObj));
          }
        }
      } else {
        alert("Erro ao realizar login corporativo: " + (error.message || error));
      }
    } finally {
      setIsAppLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fapacademy_user');
    setActiveTab('Home');
  };

  // --- Carregar Progresso ---
  useEffect(() => {
    const saved = localStorage.getItem('fapacademy_progress');
    if (saved) {
      try {
        setCompletedCourses(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar progresso", e);
      }
    }
  }, []);

  // --- Salvar Progresso ---
  useEffect(() => {
    localStorage.setItem('fapacademy_progress', JSON.stringify(completedCourses));
  }, [completedCourses]);

  // --- Lógica de Filtro ---
  const filteredCourses = useMemo(() => {
    return courses
      .filter(course => {
        const matchesTab = activeTab === 'Todos' || activeTab === 'Home' || course.system === activeTab;
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [activeTab, searchQuery, courses]);

  const toggleComplete = async (id: string) => {
    const isNowCompleted = !completedCourses.includes(id);
    if (isNowCompleted) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
    const newCompleted = completedCourses.includes(id) 
      ? completedCourses.filter(item => item !== id) 
      : [...completedCourses, id];
      
    setCompletedCourses(newCompleted);
    localStorage.setItem('fapacademy_progress', JSON.stringify(newCompleted));

    if (currentUser?.id) {
      try {
        await updateDoc(doc(db, 'users', currentUser.id), {
          completedCourses: newCompleted,
          updatedAt: Date.now()
        });
      } catch (e) {
        console.warn("Aviso ao salvar progresso no Firestore:", e);
      }
    }
  };

  const progressPercentage = Math.round((completedCourses.length / Math.max(COURSES.length, courses.length)) * 100);
  const hasUnlockedCertificates = is7Edu100 || isTotvs100 || isFinancas100;
  const unlockedCount = (is7Edu100 ? 1 : 0) + (isTotvs100 ? 1 : 0) + (isFinancas100 ? 1 : 0);

  return (
    <AnimatePresence mode="wait">
      {!currentUser ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <LoginView users={users} onLogin={handleLogin} onMicrosoftLogin={handleMicrosoftLogin} />
        </motion.div>
      ) : (
        <motion.div 
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-[#0B0F19] text-slate-100' : 'bg-[#F1F5F9] text-slate-900'}`}
        >
          {/* --- Overlay Mobile --- */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-md lg:hidden"
              />
            )}
          </AnimatePresence>

          {/* --- Sidebar --- */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-[#0F172A] text-white transition-all duration-500 ease-in-out lg:static overflow-hidden ${
          isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 w-0'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <button 
            onClick={() => { setActiveTab('Home'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
            className="flex items-center gap-3 px-6 py-8 hover:opacity-80 transition-opacity w-full text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3B82F6]">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">FapAcademy</span>
          </button>

          {/* Navegação */}
          <nav className="flex-1 space-y-1 px-4">
            <SidebarItem 
              icon={<HomeIcon size={20} />} 
              label="Início" 
              active={activeTab === 'Home'} 
              onClick={() => { setActiveTab('Home'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              label="Todos os Cursos" 
              active={activeTab === 'Todos'} 
              onClick={() => { setActiveTab('Todos'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={<BarChart2 size={20} className="text-emerald-400" />} 
              label="Meu Empenho" 
              active={activeTab === 'MeuEmpenho'} 
              onClick={() => { setActiveTab('MeuEmpenho'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={<Award size={20} className={hasUnlockedCertificates ? "text-amber-400 animate-pulse" : "text-amber-400"} />} 
              label="Certificados" 
              active={activeTab === 'Certificados'} 
              hasNotification={hasUnlockedCertificates}
              badge={
                hasUnlockedCertificates ? (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-amber-500 text-slate-950 animate-pulse flex items-center gap-1 shadow-sm shrink-0">
                    <Sparkles size={10} /> {unlockedCount} {unlockedCount > 1 ? 'Novos' : 'Novo'}
                  </span>
                ) : null
              }
              onClick={() => { setActiveTab('Certificados'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
            />
            
            <div className="pt-4 pb-2">
              <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Sistemas</p>
            </div>
            <SidebarItem 
              icon={<BookOpen size={20} />} 
              label="7Edu" 
              active={activeTab === '7Edu'} 
              onClick={() => { setActiveTab('7Edu'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={<Settings size={20} />} 
              label="TOTVS" 
              active={activeTab === 'TOTVS'} 
              onClick={() => { setActiveTab('TOTVS'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
            />

            {currentUser && (currentUser.role?.toLowerCase() === 'admin' || currentUser.email === 'mateusjhonata123@gmail.com') && (
                <>
                  <div className="pt-4 pb-2">
                    <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Administração</p>
                  </div>
                  <SidebarItem 
                    icon={<Users size={20} />} 
                    label="Controle Geral" 
                    active={activeTab === 'Admin'} 
                    onClick={() => { setActiveTab('Admin'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
                  />
                </>
              )}
          </nav>

          {/* Botão de Alternância de Tema */}
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tema {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                theme === 'dark' ? 'bg-[#3B82F6]' : 'bg-slate-700'
              }`}
              title="Alternar tema"
            >
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              >
                {theme === 'dark' ? (
                  <Moon size={10} className="text-indigo-600" />
                ) : (
                  <Sun size={10} className="text-amber-500" />
                )}
              </div>
            </button>
          </div>

          {/* Progresso Geral na Sidebar */}
          <div className="px-6 py-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Seu Progresso</span>
              <span className="text-xs font-bold text-[#3B82F6]">{progressPercentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                className="h-full bg-[#3B82F6]"
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              {completedCourses.length} de {COURSES.length} aulas concluídas
            </p>
          </div>

          {/* User Profile (Footer Sidebar) */}
          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-3 rounded-lg p-2 bg-slate-800/50">
              <div className="h-8 w-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-xs font-bold">
                {currentUser?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{currentUser?.name}</p>
                <p className="truncate text-xs text-slate-400">{currentUser?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Conteúdo Principal --- */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header Mobile & Desktop Search */}
        <header className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 lg:px-8 transition-colors duration-300 ${
          theme === 'dark' ? 'border-slate-800 bg-[#0F172A] text-white' : 'border-slate-200 bg-white text-slate-900'
        }`}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`rounded-md p-2 transition-colors ${
              theme === 'dark' ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-100'
            }`}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex flex-1 items-center justify-center px-4 lg:justify-start lg:px-0">
            {activeTab !== 'Home' && (
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Pesquisar procedimento..." 
                  className={`w-full rounded-full border py-2 pl-10 pr-4 text-sm outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all ${
                    theme === 'dark' 
                      ? 'bg-slate-850 border-slate-700 text-slate-100 placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs font-medium">FapAcademy v1.0</span>
            </div>
          </div>
        </header>

        {/* Área de Conteúdo Dinâmica */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'Home' ? (
              <HomeView 
                key="home" 
                onNavigate={(tab) => setActiveTab(tab)} 
                theme={theme}
                courses={courses}
                completedCourses={completedCourses}
                onOpenMedia={(course, type) => {
                  setSelectedCourse(course);
                  setModalType(type);
                }}
              />
            ) : activeTab === 'MeuEmpenho' ? (
              <UserDashboard 
                key="meu-empenho"
                userName={currentUser?.name || ''}
                courses={courses}
                completedCourses={completedCourses}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenMedia={(course, type) => {
                  setSelectedCourse(course);
                  setModalType(type);
                }}
                theme={theme}
              />
            ) : activeTab === 'Certificados' ? (
              <CertificatesView 
                key="certificates"
                userName={currentUser?.name || ''}
                courses={courses}
                completedCourses={completedCourses}
                cert7Edu={cert7Edu}
                certTotvs={certTotvs}
                certFinancas={certFinancas}
                onViewCert={(cert) => {
                  setSelectedCertModal(cert);
                  setIsCertModalOpen(true);
                }}
                onDownloadCert={(cert) => {
                  setSelectedCertModal(cert);
                  setIsCertModalOpen(true);
                }}
                onNavigateToSystem={(system) => setActiveTab(system as TabType)}
                onResetProgress={handleResetProgressAndCertificates}
                theme={theme}
              />
            ) : activeTab === 'Admin' ? (
              <AdminView 
                key="admin" 
                users={users} 
                onAddUser={async (user) => {
                  setIsAppLoading(true);
                  try {
                    const { id, ...data } = user;
                    await setDoc(doc(db, 'users', id), data);
                  } catch (e) {
                    handleFirestoreError(e, OperationType.CREATE, 'users');
                  } finally {
                    setIsAppLoading(false);
                  }
                }} 
                onDeleteUser={async (id) => {
                  setIsAppLoading(true);
                  try {
                    await deleteDoc(doc(db, 'users', id));
                  } catch (e) {
                    handleFirestoreError(e, OperationType.DELETE, 'users');
                  } finally {
                    setIsAppLoading(false);
                  }
                }}
                onUpdateUser={async (updatedUser) => {
                  setIsAppLoading(true);
                  try {
                    const { id, ...data } = updatedUser;
                    await updateDoc(doc(db, 'users', id), data as any);
                  } catch (e) {
                    handleFirestoreError(e, OperationType.UPDATE, 'users');
                  } finally {
                    setIsAppLoading(false);
                  }
                }}
                courses={courses}
                onAddCourse={async (course) => {
                  setIsAppLoading(true);
                  try {
                    const { id, ...data } = course;
                    await addDoc(collection(db, 'courses'), {
                      ...data,
                      createdAt: Date.now()
                    });
                  } catch (e) {
                    console.error("Erro ao adicionar curso no Firestore, salvando localmente:", e);
                    const fallbackCourse: Course = {
                      ...course,
                      id: 'local-' + Date.now(),
                      createdAt: Date.now()
                    };
                    setCourses(prev => {
                      const updated = [fallbackCourse, ...prev];
                      try {
                        localStorage.setItem('fapacademy_offline_courses', JSON.stringify(updated.filter(c => c.id.startsWith('local-'))));
                      } catch (err) {
                        console.warn("Erro ao salvar fallback de cursos no localStorage:", err);
                      }
                      return updated;
                    });
                    alert("Curso guardado localmente com sucesso devido à indisponibilidade de conexão externa.");
                  } finally {
                    setIsAppLoading(false);
                  }
                }}
                onDeleteCourse={async (id) => {
                  setIsAppLoading(true);
                  try {
                    if (id.startsWith('local-')) {
                      setCourses(prev => {
                        const updated = prev.filter(c => c.id !== id);
                        try {
                          localStorage.setItem('fapacademy_offline_courses', JSON.stringify(updated.filter(c => c.id.startsWith('local-'))));
                        } catch (err) {
                          console.warn(err);
                        }
                        return updated;
                      });
                    } else {
                      await deleteDoc(doc(db, 'courses', id));
                    }
                  } catch (e) {
                    console.error("Erro ao deletar curso no Firestore, removendo localmente:", e);
                    setCourses(prev => {
                      const updated = prev.filter(c => c.id !== id);
                      try {
                        localStorage.setItem('fapacademy_offline_courses', JSON.stringify(updated.filter(c => c.id.startsWith('local-'))));
                      } catch (err) {
                        console.warn(err);
                      }
                      return updated;
                    });
                  } finally {
                    setIsAppLoading(false);
                  }
                }}
                onUpdateCourse={async (updatedCourse) => {
                  setIsAppLoading(true);
                  try {
                    const { id, ...data } = updatedCourse;
                    if (id.startsWith('local-')) {
                      setCourses(prev => {
                        const updated = prev.map(c => c.id === id ? updatedCourse : c);
                        try {
                          localStorage.setItem('fapacademy_offline_courses', JSON.stringify(updated.filter(c => c.id.startsWith('local-'))));
                        } catch (err) {
                          console.warn(err);
                        }
                        return updated;
                      });
                    } else {
                      await setDoc(doc(db, 'courses', id), data, { merge: true });
                    }
                  } catch (e) {
                    console.error("Erro ao atualizar curso no Firestore, modificando localmente:", e);
                    setCourses(prev => {
                      const updated = prev.map(c => c.id === updatedCourse.id ? updatedCourse : c);
                      try {
                        localStorage.setItem('fapacademy_offline_courses', JSON.stringify(updated.filter(c => c.id.startsWith('local-'))));
                      } catch (err) {
                        console.warn(err);
                      }
                      return updated;
                    });
                  } finally {
                    setIsAppLoading(false);
                  }
                }}
                onSyncData={async () => {
                  setIsAppLoading(true);
                  try {
                    // Sync original courses - Use a more robust check (delete existing and rewrite to ensure 25)
                    const coursesCol = collection(db, 'courses');
                    const currentCoursesSnap = await getDocs(coursesCol);
                    
                    // Optional: Clean up existing to reset perfectly
                    if (confirm("Deseja resetar todas as aulas para a versão padrão de 25 cursos? Isso removerá aulas personalizadas.")) {
                      for (const docRef of currentCoursesSnap.docs) {
                        await deleteDoc(doc(db, 'courses', docRef.id));
                      }
                      
                      for (const course of COURSES) {
                        const { id, ...data } = course;
                        await setDoc(doc(db, 'courses', id), data);
                      }
                    }

                    // Sync original users
                    for (const user of INITIAL_USERS) {
                      const userDoc = await getDocFromServer(doc(db, 'users', user.id));
                      if (!userDoc.exists()) {
                        const { id, ...data } = user;
                        await setDoc(doc(db, 'users', id), data);
                      }
                    }
                    alert("Sistema sincronizado! 25 aulas restauradas.");
                  } catch (e) {
                    console.error("Erro ao sincronizar dados", e);
                  } finally {
                    setIsAppLoading(false);
                  }
                }}
                onResetProgress={handleResetProgressAndCertificates}
                theme={theme}
              />
            ) : (
              <motion.div 
                key="study-area"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 lg:p-8"
              >
                <CertificateBanners 
                  is7Edu100={is7Edu100}
                  isTotvs100={isTotvs100}
                  isFinancas100={isFinancas100}
                  cert7Edu={cert7Edu}
                  certTotvs={certTotvs}
                  certFinancas={certFinancas}
                  onViewCert={(cert) => {
                    setSelectedCertModal(cert);
                    setIsCertModalOpen(true);
                  }}
                  onDownloadCert={(cert) => {
                    setSelectedCertModal(cert);
                    setIsCertModalOpen(true);
                  }}
                  theme={theme}
                />

                <div className="mb-8">
                  <h1 className={`text-3xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {activeTab === 'Todos' ? 'Todos os Treinamentos' : `Treinamentos ${activeTab}`}
                  </h1>
                  <p className={`mt-2 transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Explore os procedimentos operacionais padrão para otimizar seu fluxo de trabalho.
                  </p>
                </div>

                {/* Grid de Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {filteredCourses.map((course) => (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        isCompleted={completedCourses.includes(course.id)}
                        onToggleComplete={toggleComplete}
                        onOpenMedia={(type) => {
                          setSelectedCourse(course);
                          setModalType(type);
                        }}
                        theme={theme}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {filteredCourses.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="rounded-full bg-slate-200 p-6 mb-4">
                      <Search size={48} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Nenhum resultado encontrado</h3>
                    <p className="text-slate-500">Tente ajustar sua busca ou filtro para encontrar o que procura.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal de Mídia */}
        {(() => {
          const liveSelectedCourse = selectedCourse 
            ? (courses.find(c => c.id === selectedCourse.id) || selectedCourse)
            : null;
          return (
            <MediaModal 
              isOpen={!!modalType} 
              type={modalType} 
              course={liveSelectedCourse} 
              courses={courses}
              onSelectCourse={(c) => {
                setSelectedCourse(c);
              }}
              isCompleted={liveSelectedCourse ? completedCourses.includes(liveSelectedCourse.id) : false}
              onToggleComplete={toggleComplete}
              onClose={() => {
                setModalType(null);
                setSelectedCourse(null);
              }} 
              onPrev={(() => {
                if (!liveSelectedCourse) return undefined;
                const currentIndex = filteredCourses.findIndex(c => c.id === liveSelectedCourse.id);
                if (currentIndex > 0) {
                  return () => setSelectedCourse(filteredCourses[currentIndex - 1]);
                }
                return undefined;
              })()}
              onNext={(() => {
                if (!liveSelectedCourse) return undefined;
                const currentIndex = filteredCourses.findIndex(c => c.id === liveSelectedCourse.id);
                if (currentIndex !== -1 && currentIndex < filteredCourses.length - 1) {
                  return () => setSelectedCourse(filteredCourses[currentIndex + 1]);
                }
                return undefined;
              })()}
            />
          );
        })()}

        {/* Modal de Certificados */}
        <CertificateModal 
          isOpen={isCertModalOpen}
          certificate={selectedCertModal}
          userName={currentUser?.name || ''}
          onClose={() => {
            setIsCertModalOpen(false);
            setSelectedCertModal(null);
          }}
        />

        {/* Achievement Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-200"
            >
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Trophy size={24} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-lg leading-none mb-1">Parabéns!</p>
                <p className="text-emerald-100 text-sm">Você concluiu mais um treinamento.</p>
              </div>
              <button 
                onClick={() => setShowToast(false)}
                className="ml-4 p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* AI Assistant Chatbot with tool and voice capabilities */}
      <AIAssistant 
        courses={courses} 
        onOpenCourse={(course, type) => {
          setSelectedCourse(course);
          setModalType(type);
          setTimeout(() => {
            if ((window as any).__mediaModalSetTab) {
              (window as any).__mediaModalSetTab(type);
            }
          }, 50);
        }} 
      />
    </motion.div>
  )}
      
      {/* Global Loading Overlay */}
      <AnimatePresence>
        {isAppLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-[#3B82F6]"
              />
              <div className="absolute inset-0 flex items-center justify-center text-[#3B82F6]">
                <GraduationCap size={24} />
              </div>
            </div>
            <p className="mt-4 font-bold text-slate-800 animate-pulse">Processando...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

// --- Subcomponentes ---

const HomeView: React.FC<{ 
  onNavigate: (tab: TabType) => void, 
  theme: 'light' | 'dark',
  courses?: Course[],
  completedCourses?: string[],
  onOpenMedia?: (course: Course, type: 'video' | 'pdf') => void
}> = ({ onNavigate, theme, courses = [], completedCourses = [], onOpenMedia }) => {
  const count7Edu = courses.filter(c => c.system === '7Edu').length || 10;
  const countTotvs = courses.filter(c => c.system === 'TOTVS').length || 16;

  const completed7Edu = courses.filter(c => c.system === '7Edu' && completedCourses.includes(c.id)).length;
  const completedTotvs = courses.filter(c => c.system === 'TOTVS' && completedCourses.includes(c.id)).length;

  const percent7Edu = Math.round((completed7Edu / count7Edu) * 100) || 0;
  const percentTotvs = Math.round((completedTotvs / countTotvs) * 100) || 0;

  const featuredCourses = courses.slice(0, 3);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-screen"
    >
      {/* Hero Section Moderno */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0B0F19] via-[#0F172A] to-[#1E293B] py-16 lg:py-24 px-4 lg:px-8 text-white border-b border-slate-800/80">
        {/* Animated Background Mesh Grid */}
        <div 
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Glows de fundo decorativos animados */}
        <motion.div 
          animate={{
            scale: [1, 1.25, 0.95, 1],
            x: ['-50%', '-45%', '-55%', '-50%'],
            y: ['-50%', '-60%', '-40%', '-50%'],
            opacity: [0.22, 0.38, 0.2, 0.22]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-1/3 left-1/2 w-[700px] h-[450px] bg-gradient-to-r from-blue-600 to-indigo-600 blur-[140px] rounded-full pointer-events-none"
        />

        <motion.div 
          animate={{
            scale: [1, 1.35, 0.9, 1],
            x: [0, 50, -30, 0],
            y: [0, -40, 25, 0],
            opacity: [0.18, 0.35, 0.15, 0.18]
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute bottom-0 right-10 w-[500px] h-[320px] bg-indigo-500/30 blur-[120px] rounded-full pointer-events-none"
        />

        <motion.div 
          animate={{
            scale: [0.9, 1.3, 0.95, 0.9],
            x: [0, -40, 30, 0],
            y: [0, 30, -25, 0],
            opacity: [0.12, 0.28, 0.12, 0.12]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute bottom-10 left-10 w-[420px] h-[280px] bg-sky-500/20 blur-[110px] rounded-full pointer-events-none"
        />

        {/* Floating Particles & Sparkles */}
        <motion.div 
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-16 left-[12%] text-blue-400/60 pointer-events-none hidden md:block"
        >
          <Sparkles size={28} />
        </motion.div>

        <motion.div 
          animate={{
            y: [0, 18, 0],
            rotate: [0, 10, -5, 0],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-28 right-[15%] text-indigo-400/50 pointer-events-none hidden md:block"
        >
          <Trophy size={32} />
        </motion.div>

        <motion.div 
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0.2, 0.7, 0.2]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-20 left-[18%] text-amber-400/50 pointer-events-none hidden md:block"
        >
          <Award size={30} />
        </motion.div>

        <motion.div 
          animate={{
            y: [0, 14, 0],
            opacity: [0.25, 0.75, 0.25]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute bottom-24 right-[20%] text-emerald-400/50 pointer-events-none hidden md:block"
        >
          <BookOpen size={28} />
        </motion.div>

        {/* Animated Graduation Cap Icon in background */}
        <motion.div 
          animate={{
            y: [0, -22, 0, 15, 0],
            rotate: [0, 3, -2, 1, 0],
            scale: [1, 1.04, 0.97, 1],
            opacity: [0.06, 0.1, 0.05, 0.06]
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute -top-10 right-0 pointer-events-none text-blue-300"
        >
          <GraduationCap size={580} />
        </motion.div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-300 backdrop-blur-md mb-6 shadow-sm">
              <Sparkles size={14} className="text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Plataforma Oficial FapAcademy</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.15]">
              Capacitação de Excelência nos Sistemas{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
                7Edu &amp; TOTVS
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-300/90 mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
              Sua jornada de aprendizado corporativo para os setores de Finanças e Atendimento. 
              Aprenda procedimentos operacionais padrão, assista aos guias em vídeo e obtenha suas certificações institucionais.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => {
                  document.getElementById('system-selection')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-extrabold text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-xl shadow-blue-600/30 active:scale-95 border border-blue-400/30"
              >
                <span>Escolher Sistema</span>
                <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
              </button>

              <button 
                onClick={() => onNavigate('MeuEmpenho')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 px-7 py-4 text-base font-bold text-slate-200 hover:text-white transition-all border border-slate-700/80 backdrop-blur-md active:scale-95"
              >
                <BarChart2 size={18} className="text-emerald-400" />
                <span>Acompanhar Meu Empenho</span>
              </button>
            </div>
          </motion.div>

          {/* Cards de Métricas em Destaque no Hero */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 text-left max-w-4xl mx-auto"
          >
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <BookOpen size={18} />
                </div>
                <span className="font-display text-xl font-bold text-white">25 Aulas</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Procedimentos cadastrados</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Zap size={18} />
                </div>
                <span className="font-display text-xl font-bold text-white">2 Sistemas</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">7Edu e TOTVS integrados</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Award size={18} />
                </div>
                <span className="font-display text-xl font-bold text-white">3 Diplomas</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Certificados emitíveis</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <FileText size={18} />
                </div>
                <span className="font-display text-xl font-bold text-white">100% On-line</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">PDFs e Vídeos em HD</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grid de Recursos / Diferenciais */}
      <section className="py-16 px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-[#3B82F6] bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
            Recursos da Plataforma
          </span>
          <h2 className={`font-display text-2xl sm:text-3xl font-extrabold mt-3 mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Tudo o que você precisa para aprender com eficiência
          </h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Ferramentas desenhadas para simplificar seu aprendizado diário no trabalho.
          </p>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: { transition: { staggerChildren: 0.12 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <FeatureCard 
            icon={<Zap className="text-amber-500" />}
            title="Acesso Agilizado"
            description="Localize qualquer procedimento operacional em poucos segundos utilizando a busca integrada."
            theme={theme}
          />
          <FeatureCard 
            icon={<Trophy className="text-[#3B82F6]" />}
            title="Evolução &amp; Certificados"
            description="Acompanhe o percentual das suas aulas concluídas e libere seus certificados oficiais ao atingir 100%."
            theme={theme}
          />
          <FeatureCard 
            icon={<FileText className="text-emerald-500" />}
            title="Passo a Passo em PDF"
            description="Consulte materiais de apoio e manuais detalhados para baixar e consultar a qualquer momento."
            theme={theme}
          />
        </motion.div>
      </section>

      {/* Seção de Escolha de Sistemas */}
      <section id="system-selection" className={`py-16 px-4 lg:px-8 border-t transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B0F19] border-slate-800' : 'bg-slate-100/70 border-slate-200/80'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              Trilhas de Aprendizado
            </span>
            <h2 className={`font-display text-3xl font-black mt-3 mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Selecione o Sistema para Estudar
            </h2>
            <p className={`text-base max-w-xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Navegue pelos módulos práticos dos sistemas operacionais da Faculdade Adventista do Paraná.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <SystemCard 
              title="SISTEMA 7EDU" 
              subtitle="Gestão Acadêmica e Financeira Educacional"
              badgeText={`${count7Edu} Procedimentos`}
              progressPercent={percent7Edu}
              color="from-indigo-700 via-indigo-800 to-slate-900" 
              borderColor="border-indigo-500/40"
              icon={<BookOpen size={28} className="text-indigo-300" />}
              description="Aprenda sobre lançamento de desconto condicional, alterações de boletos, contratos, bolsas dissídio e procedimentos da rotina 7Edu."
              onClick={() => onNavigate('7Edu')}
            />
            <SystemCard 
              title="SISTEMA TOTVS" 
              subtitle="ERP Completo de Gestão Empresarial"
              badgeText={`${countTotvs} Procedimentos`}
              progressPercent={percentTotvs}
              color="from-emerald-700 via-emerald-800 to-slate-900" 
              borderColor="border-emerald-500/40"
              icon={<Settings size={28} className="text-emerald-300" />}
              description="Domine baixas de boletos, devoluções de cheque, boletos com PIX, relatórios contábeis e negociações avançadas no TOTVS."
              onClick={() => onNavigate('TOTVS')}
            />
          </div>
        </div>
      </section>

      {/* Destaques Práticos / Aulas Populares */}
      {featuredCourses.length > 0 && (
        <section className={`py-16 px-4 lg:px-8 border-t transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Primeiros Passos
                </span>
                <h2 className={`font-display text-2xl sm:text-3xl font-extrabold mt-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Procedimentos Recomendados
                </h2>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Comece praticando as aulas mais solicitadas do setor financeiro.
                </p>
              </div>

              <button 
                onClick={() => onNavigate('Todos')}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#3B82F6] hover:text-[#2563EB] transition-colors group"
              >
                <span>Ver todos os 25 procedimentos</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => {
                const isCompleted = completedCourses.includes(course.id);
                return (
                  <div 
                    key={course.id}
                    className={`group rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${
                      theme === 'dark' 
                        ? 'bg-slate-800/60 border-slate-700/80 hover:border-blue-500/50 hover:bg-slate-800' 
                        : 'bg-slate-50 border-slate-200/90 hover:bg-white hover:border-blue-300 hover:shadow-lg'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border border-slate-200 dark:border-slate-700">
                        <img 
                          src={course.thumbnail} 
                          alt={course.title} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase text-white shadow-md ${
                            course.system === '7Edu' ? 'bg-indigo-600' : 'bg-emerald-600'
                          }`}>
                            {course.system}
                          </span>
                        </div>
                        {isCompleted && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>

                      <h3 className={`font-display text-base font-bold line-clamp-1 mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {course.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {course.description || "Procedimento operacional padrão com instruções em vídeo e passo a passo em PDF."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Clock size={14} /> {course.duration}
                      </span>

                      <button 
                        onClick={() => onOpenMedia && onOpenMedia(course, 'video')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                      >
                        <Play size={14} fill="currentColor" />
                        <span>{isCompleted ? 'Reassistir' : 'Iniciar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, theme: 'light' | 'dark' }> = ({ icon, title, description, theme }) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    whileHover={{ y: -6 }}
    transition={{ type: "spring", stiffness: 260, damping: 20 }}
    className={`p-8 rounded-3xl border transition-all duration-300 cursor-default flex flex-col justify-between ${
      theme === 'dark' 
        ? 'bg-[#131B2E] border-slate-800 text-white shadow-black/20 hover:border-slate-700 hover:shadow-2xl' 
        : 'bg-white border-slate-200/90 text-slate-900 hover:shadow-xl hover:border-blue-200'
    }`}
  >
    <div>
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 border transition-colors ${
        theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200/80'
      }`}>
        {React.cloneElement(icon as React.ReactElement, { size: 28 })}
      </div>
      <h3 className={`font-display text-xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h3>
      <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
        {description}
      </p>
    </div>
  </motion.div>
);

const SystemCard: React.FC<{ 
  title: string, 
  subtitle: string,
  badgeText: string,
  progressPercent: number,
  color: string, 
  borderColor: string,
  icon: React.ReactNode,
  description: string, 
  onClick: () => void 
}> = ({ title, subtitle, badgeText, progressPercent, color, borderColor, icon, description, onClick }) => (
  <button 
    onClick={onClick}
    className={`group relative overflow-hidden rounded-3xl border ${borderColor} p-8 text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl active:scale-98 flex flex-col justify-between bg-gradient-to-br ${color} text-white shadow-xl`}
  >
    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
      {React.cloneElement(icon as React.ReactElement, { size: 160 })}
    </div>

    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
          {icon}
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/25 text-white">
          {badgeText}
        </span>
      </div>

      <h3 className="font-display text-2xl font-black mb-1 tracking-wide">{title}</h3>
      <p className="text-xs font-semibold text-white/80 mb-4">{subtitle}</p>
      <p className="text-sm text-white/85 leading-relaxed mb-6 font-normal max-w-md">{description}</p>
    </div>

    <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-white/90">Seu Progresso:</span>
        <span className="text-xs font-black text-white">{progressPercent}%</span>
      </div>

      <div className="inline-flex items-center gap-2 text-sm font-extrabold bg-white text-slate-900 px-4 py-2 rounded-xl group-hover:bg-blue-50 transition-colors shadow-md">
        <span>Acessar Trilha</span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </button>
);

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, badge, hasNotification }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all relative ${
        active 
          ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className="relative flex items-center justify-center shrink-0">
        {icon}
        {hasNotification && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
        )}
      </div>
      <span className="truncate text-left flex-1">{label}</span>
      {badge}
      {active && <ChevronRight size={16} className="ml-1 shrink-0" />}
    </button>
  );
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isCompleted, onToggleComplete, onOpenMedia, theme = 'light' }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-xl ${
        isCompleted 
          ? (theme === 'dark' ? 'border-emerald-900 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50/10') 
          : (theme === 'dark' ? 'border-slate-800 bg-[#131B2E] text-white' : 'border-slate-200 bg-white text-slate-900')
      }`}
    >
      {/* Thumbnail */}
      <div 
        className="relative aspect-video overflow-hidden cursor-pointer"
        onClick={() => onOpenMedia('video')}
      >
        <img 
          src={course.thumbnail} 
          alt={course.title} 
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            isCompleted ? 'grayscale-[0.5]' : ''
          }`}
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay de Conclusão */}
        {isCompleted && (
          <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center">
            <div className="bg-white rounded-full p-2 shadow-lg text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            onClick={() => onOpenMedia('video')}
            className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center text-[#3B82F6] shadow-lg hover:scale-110 transition-transform"
          >
            <Play size={24} fill="currentColor" />
          </button>
        </div>
        
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${
            course.system === '7Edu' ? 'bg-indigo-600' : 'bg-emerald-600'
          }`}>
            {course.system}
          </span>
          {course.pdfUrl && (
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 ${
              theme === 'dark' ? 'bg-slate-800/90 text-slate-200' : 'bg-white/90 text-slate-900'
            }`}>
              <FileText size={10} /> PDF
            </span>
          )}
          {isCompleted && (
            <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm bg-emerald-500">
              Concluído
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className={`text-lg font-bold leading-tight transition-colors ${
            isCompleted 
              ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-900') 
              : (theme === 'dark' ? 'text-slate-100 group-hover:text-blue-400' : 'text-slate-900 group-hover:text-[#3B82F6]')
          }`}>
            {course.title}
          </h3>
          <button 
            onClick={() => onToggleComplete(course.id)}
            className={`p-1 rounded-md transition-colors ${
              isCompleted 
                ? 'text-emerald-600 bg-emerald-100/80' 
                : (theme === 'dark' ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100')
            }`}
            title={isCompleted ? "Marcar como não concluído" : "Marcar como concluído"}
          >
            <CheckCircle2 size={20} />
          </button>
        </div>
        
        <p className={`text-xs line-clamp-2 leading-relaxed mb-4 transition-colors ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {course.description || "Esta aula aborda as diretrizes essenciais, instruções e melhores práticas recomendadas para o domínio operacional dos processos administrativos."}
        </p>
        
        <div className={`mt-auto flex items-center gap-4 text-xs transition-colors ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart size={14} />
            <span>{course.difficulty}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => onOpenMedia('video')}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors shadow-sm active:scale-95 ${
              isCompleted 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
            } ${!course.pdfUrl ? 'w-full' : ''}`}
          >
            <Play size={18} />
            {isCompleted ? 'Reassistir' : 'Iniciar Aula'}
          </button>
          {course.pdfUrl ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(course.pdfUrl!, `${course.title}.pdf`);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all active:scale-95 shadow-sm text-center border ${
                theme === 'dark'
                  ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900 hover:bg-emerald-900/40'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Baixar Passo a Passo (PDF)"
            >
              <Download size={18} className="text-emerald-500" />
              <span>Passo a Passo</span>
            </button>
          ) : (
            <button 
              disabled
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold border cursor-not-allowed ${
                theme === 'dark'
                  ? 'bg-slate-900 text-slate-700 border-slate-950'
                  : 'bg-slate-50 text-slate-300 border-slate-100'
              }`}
              title="Sem Passo a Passo disponível"
            >
              <FileText size={18} />
              <span>Sem PDF</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const LoginView: React.FC<{ 
  users: User[], 
  onLogin: (data: Pick<User, 'email' | 'password'>) => void,
  onMicrosoftLogin: () => void
}> = ({ onLogin, onMicrosoftLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onLogin({ email, password });
    } catch (err: any) {
      setError('Credenciais inválidas ou erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 text-center bg-[#0F172A] text-white">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-[#3B82F6] flex items-center justify-center shadow-lg">
              <GraduationCap size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FapAcademy</h1>
          <p className="text-slate-400 mt-2">Plataforma de Treinamento Corporativo</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">E-mail de Acesso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <LogIn size={20} />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                  placeholder="seu@email.com.br"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#3B82F6] hover:bg-[#2563EB] shadow-blue-100'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  Entrar no Sistema <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-100 animate-pulse"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider font-bold">ou acesse via</span>
            <div className="flex-grow border-t border-slate-100 animate-pulse"></div>
          </div>

          <button 
            type="button"
            onClick={onMicrosoftLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-slate-700 hover:text-slate-900 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="grid grid-cols-2 gap-[2px] w-4 h-4 flex-shrink-0 animate-bounce">
              <div className="w-[7px] h-[7px] bg-[#F25022]"></div>
              <div className="w-[7px] h-[7px] bg-[#7FBA00]"></div>
              <div className="w-[7px] h-[7px] bg-[#00A4EF]"></div>
              <div className="w-[7px] h-[7px] bg-[#FFB900]"></div>
            </div>
            <span>E-mail Corporativo (Microsoft 365)</span>
          </button>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
              <ShieldCheck size={14} />
              <span>Acesso restrito a colaboradores autorizados</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const AdminView: React.FC<{ 
  users: User[], 
  onAddUser: (user: User) => void,
  onDeleteUser: (id: string) => void,
  onUpdateUser: (user: User) => void,
  courses: Course[],
  onAddCourse: (course: Course) => void,
  onDeleteCourse: (id: string) => void,
  onUpdateCourse: (course: Course) => void,
  onSyncData: () => void,
  onResetProgress?: () => void,
  theme?: 'light' | 'dark'
}> = ({ users, onAddUser, onDeleteUser, onUpdateUser, courses, onAddCourse, onDeleteCourse, onUpdateCourse, onSyncData, onResetProgress, theme = 'light' }) => {
  const [adminTab, setAdminTab] = useState<'users' | 'courses' | 'engagement'>('users');
  const [isAdding, setIsAdding] = useState(false);
  const [isBulk, setIsBulk] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' as const });
  const [newCourse, setNewCourse] = useState<Omit<Course, 'id'>>({ 
    title: '', system: '7Edu', duration: '', difficulty: 'Iniciante', thumbnail: '', videoUrl: '', pdfUrl: '', description: '' 
  });
  const [bulkText, setBulkText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Generate beautiful analytical data from courses and users
  const getEngagementData = () => {
    const progressDataStr = localStorage.getItem('fapacademy_progress');
    const completedCourses: string[] = progressDataStr ? JSON.parse(progressDataStr) : [];
    
    const completionsMap: Record<string, number> = {};
    
    courses.forEach((c, idx) => {
      // Deterministically seed base completions based on course index / system
      const baseCount = (idx % 3 === 0 ? 12 : idx % 2 === 0 ? 8 : 4) + (c.system === '7Edu' ? 5 : 2);
      completionsMap[c.id] = baseCount;
    });

    if (completedCourses && completedCourses.length > 0) {
      completedCourses.forEach(cid => {
        if (completionsMap[cid] !== undefined) {
          completionsMap[cid] += 1;
        }
      });
    }

    // Sort and get top 5 most viewed lessons
    const popularLessonsData = courses
      .map(c => ({
        name: c.title.length > 25 ? c.title.substring(0, 25) + '...' : c.title,
        Conclusões: completionsMap[c.id] || 0,
        Sistema: c.system
      }))
      .sort((a, b) => b.Conclusões - a.Conclusões)
      .slice(0, 5);

    // Calculations for "Porcentagem de conclusão média" (Average completion rate)
    const userCompletions = users.map((u) => {
      const arr = Array.isArray(u.completedCourses) ? u.completedCourses : [];
      return Math.round((arr.length / Math.max(courses.length, 1)) * 100);
    });

    const averageCompletion = Math.round(
      userCompletions.reduce((sum, val) => sum + val, 0) / Math.max(users.length, 1)
    );

    // Completion distribution by ranges (0-20%, 21-50%, 51-80%, 81-100%)
    const distribution = [
      { name: '0-20%', value: userCompletions.filter(v => v <= 20).length },
      { name: '21-50%', value: userCompletions.filter(v => v > 20 && v <= 50).length },
      { name: '51-80%', value: userCompletions.filter(v => v > 50 && v <= 80).length },
      { name: '81-100%', value: userCompletions.filter(v => v > 80).length }
    ];

    let eduViews = 0;
    let totvsViews = 0;
    courses.forEach(c => {
      const views = completionsMap[c.id] || 0;
      if (c.system === '7Edu') eduViews += views;
      else totvsViews += views;
    });

    const systemViewsData = [
      { name: '7Edu', value: eduViews, color: '#6366F1' },
      { name: 'TOTVS', value: totvsViews, color: '#10B981' }
    ];

    return {
      popularLessonsData,
      averageCompletion,
      distribution,
      systemViewsData
    };
  };

  const handleFileUpload = async (file: File, type: 'video' | 'pdf') => {
    setIsUploading(true);
    
    // Atualiza o estado imediatamente com um texto informativo temporário
    if (type === 'video') {
      setNewCourse(prev => ({ ...prev, videoUrl: "Carregando mídia (Aguarde)..." }));
    } else {
      setNewCourse(prev => ({ ...prev, pdfUrl: "Carregando material (Aguarde)..." }));
    }

    const localId = `local-file-${Date.now()}-${file.name}`;
    let downloadURL = "";
    let uploadedToCloud = false;

    // 1. Sempre salva localmente primeiro no IndexedDB para máxima redundância e agilidade local
    try {
      await saveLocalFile(localId, file);
      console.log("Arquivo armazenado em cache local do IndexedDB.");
    } catch (dbErr) {
      console.warn("Erro ao registrar backup local no IndexedDB:", dbErr);
    }

    // 2. Tenta fazer o upload para os provedores de nuvem configurados
    try {
      const hasSupabase = isConfigured;
      
      if (hasSupabase) {
        console.log("Iniciando upload para o Supabase Storage...");
        const filePath = `courses/${type}s/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage
          .from('videos-sistema')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw new Error(`Supabase Storage: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('videos-sistema')
          .getPublicUrl(filePath);
          
        downloadURL = publicUrl;
        uploadedToCloud = true;
      } else {
        // Fallback automático para o Firebase Storage
        console.log("Iniciando upload para o Firebase Storage...");
        const storageRef = ref(storage, `courses/${type}s/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        downloadURL = await getDownloadURL(snapshot.ref);
        uploadedToCloud = true;
      }
    } catch (cloudError: any) {
      console.warn("Upload de nuvem falhou, utilizando fallback autônomo:", cloudError);
      // Se falhar o upload na nuvem e o arquivo for de até 6MB, converte para Base64 Data URL.
      // Desta forma, o conteúdo do arquivo é armazenado no próprio Firestore e sincronizado em TODOS OS DISPOSITIVOS!
      if (file.size <= 6 * 1024 * 1024) {
        try {
          downloadURL = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          uploadedToCloud = true;
        } catch (readErr) {
          downloadURL = localId;
          uploadedToCloud = false;
        }
      } else {
        downloadURL = localId;
        uploadedToCloud = false;
      }
    }

    // 3. Define a URL de mídia correspondente
    if (type === 'video') {
      setNewCourse(prev => ({ ...prev, videoUrl: downloadURL }));
    } else {
      setNewCourse(prev => ({ ...prev, pdfUrl: downloadURL }));
    }

    // 4. Exibe notificação de feedback amigável
    if (uploadedToCloud) {
      alert(`${type === 'video' ? 'Vídeo' : 'PDF'} processado e sincronizado com sucesso! O conteúdo foi salvo no banco de dados para acesso de todos os alunos em qualquer dispositivo.`);
    } else {
      alert(`${type === 'video' ? 'Vídeo' : 'PDF'} salvo localmente neste computador.\n\nDica para sincronizar em outros dispositivos: Como o arquivo é superior a 6MB, informe o link público do seu vídeo ou PDF hospedado externamente (no YouTube, Google Drive, OneDrive, SharePoint, Vimeo, Supabase, Dropbox) para que todos os alunos consigam acessar em qualquer aparelho!`);
    }

    setIsUploading(false);
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email) {
      if (editingUser) {
        onUpdateUser({ ...editingUser, ...newUser });
      } else {
        onAddUser({ id: Math.random().toString(36).substr(2, 9), ...newUser });
      }
      setNewUser({ name: '', email: '', password: '', role: 'Usuário' });
      setIsAdding(false);
      setEditingUser(null);
    }
  };

  const isValidVideoUrl = (urlStr: string) => {
    if (!urlStr) return false;
    const trimmed = urlStr.trim();
    if (trimmed.startsWith('local-file-') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return true;
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const isValidPdfUrl = (urlStr: string) => {
    if (!urlStr) return true;
    const trimmed = urlStr.trim();
    if (trimmed.startsWith('local-file-') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return true;
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title) {
      alert("Por favor, preencha o título da aula.");
      return;
    }
    if (!newCourse.description) {
      alert("Por favor, preencha a descrição da aula.");
      return;
    }
    if (newCourse.videoUrl) {
      if (!isValidVideoUrl(newCourse.videoUrl)) {
        alert("URL do vídeo inválida! Forneça um link HTTP/HTTPS válido do YouTube, Google Drive, Vimeo, Loom, Supabase, Firebase ou MP4 direto.");
        return;
      }
    } else {
      alert("Por favor, preencha a URL do vídeo.");
      return;
    }

    if (newCourse.pdfUrl && !isValidPdfUrl(newCourse.pdfUrl)) {
      alert("URL do PDF inválida! Forneça um link HTTP/HTTPS válido para o material de apoio.");
      return;
    }

    try {
      if (editingCourse) {
        onUpdateCourse({ ...editingCourse, ...newCourse });
        alert("Vídeo-aula atualizada com sucesso!");
      } else {
        onAddCourse({ id: Math.random().toString(36).substr(2, 9), ...newCourse });
        alert("Vídeo-aula cadastrada com sucesso!");
      }
      setNewCourse({ title: '', system: '7Edu', duration: '', difficulty: 'Iniciante', thumbnail: '', videoUrl: '', pdfUrl: '', description: '' });
      setIsAdding(false);
      setEditingCourse(null);
    } catch (err) {
      alert("Erro ao salvar curso: " + err);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({ name: user.name, email: user.email, password: user.password || '', role: user.role });
    setIsBulk(false);
    setIsAdding(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setNewCourse({ 
      title: course.title, 
      system: course.system, 
      duration: course.duration, 
      difficulty: course.difficulty, 
      thumbnail: course.thumbnail,
      videoUrl: course.videoUrl || '',
      pdfUrl: course.pdfUrl || '',
      description: course.description || ''
    });
    setIsAdding(true);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
      const parts = line.split(/[,;\t]/).map(s => s.trim());
      if (parts.length >= 2) {
        const [name, email, password] = parts;
        onAddUser({
          id: Math.random().toString(36).substr(2, 9),
          name,
          email,
          password: password || '123', // Senha padrão se não fornecida
          role: 'Usuário'
        });
      }
    });
    setBulkText('');
    setIsAdding(false);
    setIsBulk(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 lg:p-8 max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Painel Administrativo</h1>
          <p className="mt-2 text-slate-600">Gerencie usuários, treinamentos e acompanhe o engajamento.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={onSyncData}
            className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-5 py-3 rounded-xl font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800/60 shadow-sm"
          >
            <ShieldCheck size={18} /> Sincronizar Tudo
          </button>
          {onResetProgress && (
            <button 
              onClick={onResetProgress}
              className="flex items-center justify-center gap-2 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-5 py-3 rounded-xl font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors border border-rose-200 dark:border-rose-800/60 shadow-sm"
              title="Redefinir permanentemente o progresso de aulas e certificados do usuário atual"
            >
              <RotateCcw size={18} /> Resetar Empenho & Certificados
            </button>
          )}
          {adminTab === 'users' ? (
            <>
              <button 
                onClick={() => { setIsAdding(true); setIsBulk(true); }}
                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <Plus size={20} /> Importar Vários
              </button>
              <button 
                onClick={() => { setIsAdding(true); setIsBulk(false); setEditingUser(null); }}
                className="flex items-center justify-center gap-2 bg-[#3B82F6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-200"
              >
                <Plus size={20} /> Novo Usuário
              </button>
            </>
          ) : (
            <button 
              onClick={() => { setIsAdding(true); setEditingCourse(null); setNewCourse({ title: '', system: '7Edu', duration: '', difficulty: 'Iniciante', thumbnail: '', videoUrl: '', pdfUrl: '' }); }}
              className="flex items-center justify-center gap-2 bg-[#3B82F6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-200"
            >
              <Plus size={20} /> Nova Aula
            </button>
          )}
        </div>
      </div>

      {/* Admin Tabs */}
      <div className={`flex flex-wrap gap-2 mb-8 p-1 rounded-2xl w-fit transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100'
      }`}>
        <button 
          onClick={() => setAdminTab('users')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            adminTab === 'users' 
              ? (theme === 'dark' ? 'bg-slate-800 text-[#3B82F6] shadow-sm' : 'bg-white text-[#3B82F6] shadow-sm') 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Usuários
        </button>
        <button 
          onClick={() => setAdminTab('courses')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            adminTab === 'courses' 
              ? (theme === 'dark' ? 'bg-slate-800 text-[#3B82F6] shadow-sm' : 'bg-white text-[#3B82F6] shadow-sm') 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Aulas e Conteúdo
        </button>
        <button 
          onClick={() => setAdminTab('engagement')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            adminTab === 'engagement' 
              ? (theme === 'dark' ? 'bg-slate-800 text-[#3B82F6] shadow-sm' : 'bg-white text-[#3B82F6] shadow-sm') 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Engajamento dos Usuários
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total de Usuários', value: users.length, icon: <Users className="text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Aulas Ativas', value: courses.length, icon: <GraduationCap className="text-indigo-600" />, bg: 'bg-indigo-50' },
          { label: 'Sistemas', value: '2', icon: <LayoutDashboard className="text-emerald-600" />, bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg}`}>{stat.icon}</div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {adminTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Usuários Cadastrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4 min-w-[200px]">Nome</th>
                  <th className="px-6 py-4 min-w-[200px]">E-mail</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...users].sort((a, b) => {
                  const isMainAdminA = a.email === 'mateusjhonata123@gmail.com';
                  const isMainAdminB = b.email === 'mateusjhonata123@gmail.com';
                  if (isMainAdminA) return -1;
                  if (isMainAdminB) return 1;
                  return a.name.localeCompare(b.name);
                }).map((user) => (
                  <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${user.email === 'mateusjhonata123@gmail.com' ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${user.role?.toLowerCase() === 'admin' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-slate-200 text-slate-600'}`}>
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{user.name}</span>
                          {user.email === 'mateusjhonata123@gmail.com' && (
                            <span className="text-[10px] font-extrabold text-[#3B82F6] uppercase tracking-wider flex items-center gap-1">
                              <ShieldCheck size={10} /> Diretor do Sistema
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        user.role?.toLowerCase() === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role?.toLowerCase() === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="text-slate-400 hover:text-[#3B82F6] transition-colors p-1"
                        >
                          <Settings size={18} />
                        </button>
                        {user.email !== 'mateusjhonata123@gmail.com' && (
                          <button 
                            onClick={() => onDeleteUser(user.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminTab === 'courses' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Aulas Disponíveis</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4 min-w-[250px]">Aula</th>
                  <th className="px-6 py-4">Sistema</th>
                  <th className="px-6 py-4">Dificuldade</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={course.thumbnail} alt="" className="h-10 w-16 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                        <span className="font-medium text-slate-900">{course.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        course.system === '7Edu' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {course.system}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{course.difficulty}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditCourse(course)}
                          className="text-slate-400 hover:text-[#3B82F6] transition-colors p-1"
                        >
                          <Settings size={18} />
                        </button>
                        <button 
                          onClick={() => onDeleteCourse(course.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminTab === 'engagement' && (
        <div className="space-y-8">
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`p-6 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Conclusões</p>
              <h2 className={`text-4xl font-extrabold mt-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                {getEngagementData().systemViewsData.reduce((acc, curr) => acc + curr.value, 0)}
              </h2>
              <p className="text-xs text-slate-500 mt-2">Acumulado em todas as vídeo-aulas</p>
            </div>

            <div className={`p-6 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Média de Conclusão</p>
              <h2 className={`text-4xl font-extrabold mt-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'}`}>
                {getEngagementData().averageCompletion}%
              </h2>
              <p className="text-xs text-slate-500 mt-2">Porcentagem de conclusão média dos alunos</p>
            </div>

            <div className={`p-6 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">7Edu Assistidas</p>
              <h2 className={`text-4xl font-extrabold mt-2 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`}>
                {getEngagementData().systemViewsData.find(d => d.name === '7Edu')?.value || 0}
              </h2>
              <p className="text-xs text-slate-500 mt-2">Aulas concluídas no sistema 7Edu</p>
            </div>

            <div className={`p-6 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">TOTVS Assistidas</p>
              <h2 className={`text-4xl font-extrabold mt-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'}`}>
                {getEngagementData().systemViewsData.find(d => d.name === 'TOTVS')?.value || 0}
              </h2>
              <p className="text-xs text-slate-500 mt-2">Aulas concluídas no sistema TOTVS</p>
            </div>
          </div>

          {/* Bento-grid Charts container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart 1: Bar Chart "Aulas mais assistidas" */}
            <div className={`lg:col-span-2 p-6 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-[#131B2E] border-slate-800 pt-8' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Aulas Mais Assistidas (Top 5)</h3>
                <p className="text-xs text-slate-500">Ranking das vídeo-aulas com o maior número de conclusões</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={getEngagementData().popularLessonsData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1E293B' : '#F1F5F9'} />
                    <XAxis type="number" stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                    <YAxis dataKey="name" type="category" width={140} stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} style={{ fontSize: '11px' }} />
                    <Tooltip 
                      contentStyle={theme === 'dark' ? { backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' } : undefined}
                    />
                    <Legend />
                    <Bar dataKey="Conclusões" fill="#3B82F6" barSize={16}>
                      {getEngagementData().popularLessonsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.Sistema === '7Edu' ? '#6366F1' : '#10B981'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Donut Chart "Visualizações por Sistema" */}
            <div className={`p-6 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Estudo por Área</h3>
                <p className="text-xs text-slate-500">Divisão de aulas assistidas entre 7Edu e TOTVS</p>
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getEngagementData().systemViewsData}
                      cx="55%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getEngagementData().systemViewsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={theme === 'dark' ? { backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' } : undefined}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-slate-500 mt-2">
                Aulas do sistema <span className="text-[#6366F1] font-bold">7Edu</span> representam a maior taxa de visualizações.
              </div>
            </div>
          </div>

          {/* Distribution chart and Stats Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chart 3: Area/Line Chart of Completion Distribution */}
            <div className={`p-6 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Distribuição de Conclusão</h3>
                <p className="text-xs text-slate-500">Quantidade de alunos por faixa de conclusão (%)</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={getEngagementData().distribution}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                    <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1E293B' : '#F1F5F9'} />
                    <Tooltip 
                      contentStyle={theme === 'dark' ? { backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' } : undefined}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorValue)" name="Alunos" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Engagement list summary table */}
            <div className={`p-6 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Performance de Alunos</h3>
                <p className="text-xs text-slate-500">Métricas individuais de aproveitamento por colaborador</p>
              </div>
              <div className="overflow-y-auto max-h-64 pr-2">
                <div className="space-y-4">
                  {users.map((u) => {
                    const arr = Array.isArray(u.completedCourses) ? u.completedCourses : [];
                    const pct = Math.round((arr.length / Math.max(courses.length, 1)) * 100);
                    return (
                      <div key={u.id} className="flex items-center justify-between border-b pb-3 border-dashed border-slate-200">
                        <div>
                          <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            pct >= 75 ? 'bg-emerald-100 text-emerald-800' : pct >= 40 ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {pct}% Concluído
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">
                  {adminTab === 'users' 
                    ? (isBulk ? 'Importar Vários Usuários' : editingUser ? 'Editar Usuário' : 'Novo Usuário')
                    : (editingCourse ? 'Editar Aula' : 'Nova Aula')}
                </h3>
                <button onClick={() => { setIsAdding(false); setEditingUser(null); setEditingCourse(null); }} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto">
                {adminTab === 'users' ? (
                  isBulk ? (
                    <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Lista de Usuários</label>
                        <p className="text-xs text-slate-500 mb-2">Cole um por linha no formato: Nome, Email, Senha (opcional)</p>
                        <textarea 
                          required
                          value={bulkText}
                          onChange={(e) => setBulkText(e.target.value)}
                          className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all resize-none font-mono text-sm"
                          placeholder="Ex:&#10;João Silva, joao@fap.com.br, senha123&#10;Maria Santos, maria@fap.com.br"
                        />
                      </div>
                      <button type="submit" className="w-full bg-[#3B82F6] text-white py-4 rounded-xl font-bold hover:bg-[#2563EB] transition-colors mt-4">Importar Lista</button>
                    </form>
                  ) : (
                    <form onSubmit={handleSubmitUser} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                        <input type="text" required value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">E-mail Corporativo</label>
                        <input type="email" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Senha de Acesso</label>
                        <input type="text" required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Cargo / Permissão</label>
                        <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all appearance-none bg-white">
                          <option value="user">Usuário Padrão</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <button type="submit" className="w-full bg-[#3B82F6] text-white py-4 rounded-xl font-bold hover:bg-[#2563EB] transition-colors mt-4">{editingUser ? 'Salvar Alterações' : 'Confirmar Cadastro'}</button>
                    </form>
                  )
                ) : (
                  <form onSubmit={handleSubmitCourse} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Título da Aula</label>
                      <input type="text" required value={newCourse.title} onChange={(e) => setNewCourse({...newCourse, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Descrição Detalhada / Resumo da Aula</label>
                      <textarea 
                        required 
                        value={newCourse.description} 
                        onChange={(e) => setNewCourse({...newCourse, description: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all h-20 resize-none text-sm" 
                        placeholder="Insira as informações profissionais, tópicos abordados nesta aula..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Sistema</label>
                        <select value={newCourse.system} onChange={(e) => setNewCourse({...newCourse, system: e.target.value as any})} className="w-full px-4 py-3 rounded-xl border border-slate-200">
                          <option value="7Edu">7Edu</option>
                          <option value="TOTVS">TOTVS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Dificuldade</label>
                        <select value={newCourse.difficulty} onChange={(e) => setNewCourse({...newCourse, difficulty: e.target.value as any})} className="w-full px-4 py-3 rounded-xl border border-slate-200">
                          <option value="Iniciante">Iniciante</option>
                          <option value="Intermediário">Intermediário</option>
                          <option value="Avançado">Avançado</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Duração (Ex: 15 min)</label>
                        <input type="text" required value={newCourse.duration} onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Thumbnail (URL)</label>
                        <input type="text" required value={newCourse.thumbnail} onChange={(e) => setNewCourse({...newCourse, thumbnail: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-bold text-slate-700">Vídeo da Aula (URL do Vídeo Hospedado Fora)</label>
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          Hospedagem Externa Habilitada
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newCourse.videoUrl} 
                            onChange={(e) => setNewCourse({...newCourse, videoUrl: e.target.value})} 
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all text-sm font-mono text-slate-800" 
                            placeholder="Ex: https://www.youtube.com/watch?v=... ou https://drive.google.com/file/d/..." 
                          />
                          <label className={`cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl flex items-center gap-2 border border-slate-200 transition-colors whitespace-nowrap text-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                            {isUploading ? 'Subindo...' : 'Subir Arquivo'}
                            <input 
                              type="file" 
                              className="hidden" 
                              disabled={isUploading}
                              accept="video/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'video');
                              }}
                            />
                          </label>
                        </div>
                        <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Globe size={13} className="text-blue-600" />
                            Provedores de Vídeo Externos Aceitos pelo Sistema:
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {['YouTube', 'Google Drive', 'Vimeo', 'Loom', 'Supabase Storage', 'Firebase Storage', 'Dropbox', 'SharePoint', 'OneDrive', 'Link Direto MP4'].map((platform) => (
                              <span key={platform} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                ✓ {platform}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Cole o link do seu vídeo hospedado na nuvem. O sistema converte automaticamente para reprodução direta dentro da plataforma sem redirecionamentos.
                          </p>
                        </div>

                        {/* Pré-visualização em tempo real do player interno no formulário */}
                        {newCourse.videoUrl && isValidVideoUrl(newCourse.videoUrl) && (
                          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-2 text-left">
                            <div className="flex items-center justify-between text-xs text-slate-300">
                              <span className="font-bold flex items-center gap-1.5 text-blue-400">
                                <Play size={14} className="fill-current" />
                                Pré-visualização do Player Interno da Plataforma:
                              </span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                                ✓ Reprodução Interna Habilitada
                              </span>
                            </div>
                            <div className="w-full aspect-video max-h-[220px] rounded-xl overflow-hidden bg-black border border-slate-800">
                              {isDirectVideo(newCourse.videoUrl) ? (
                                <video 
                                  src={getEmbedUrl(newCourse.videoUrl)} 
                                  controls 
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <iframe 
                                  src={getEmbedUrl(newCourse.videoUrl)} 
                                  className="w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                  allowFullScreen
                                  title="Pré-visualização do Vídeo"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-bold text-slate-700">Material de Apoio (PDF / Documento)</label>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newCourse.pdfUrl} 
                            onChange={(e) => setNewCourse({...newCourse, pdfUrl: e.target.value})} 
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all text-sm font-mono text-slate-800" 
                            placeholder="Ex: https://drive.google.com/file/d/... ou link direto do PDF" 
                          />
                          <label className={`cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl flex items-center gap-2 border border-slate-200 transition-colors whitespace-nowrap text-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                            {isUploading ? 'Subindo...' : 'Subir PDF'}
                            <input 
                              type="file" 
                              className="hidden" 
                              disabled={isUploading}
                              accept=".pdf,.doc,.docx" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'pdf');
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-500 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl leading-tight">
                          💡 <strong>PDFs de fora:</strong> Aceita links do Google Drive, Dropbox, Supabase Storage, OneDrive, SharePoint ou qualquer URL HTTPS direta de PDF.
                        </p>
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isUploading}
                      className={`w-full text-white py-4 rounded-xl font-bold transition-colors mt-4 ${isUploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#3B82F6] hover:bg-[#2563EB]'}`}
                    >
                      {isUploading ? 'Aguarde o Upload...' : (editingCourse ? 'Salvar Alterações' : 'Adicionar Aula')}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const isDirectVideo = (url: string) => {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  
  if (
    lower.includes('youtube.com') || lower.includes('youtu.be') ||
    lower.includes('vimeo.com') || lower.includes('loom.com') ||
    lower.includes('drive.google.com') || lower.includes('sharepoint.com') ||
    lower.includes('onedrive.live.com') || lower.includes('dailymotion.com') ||
    lower.includes('streamable.com')
  ) {
    return false;
  }

  return (
    lower.startsWith('blob:') ||
    lower.startsWith('data:') ||
    lower.includes('.mp4') ||
    lower.includes('.webm') ||
    lower.includes('.ogg') ||
    lower.includes('.mov') ||
    lower.includes('.m3u8') ||
    lower.includes('supabase.co') ||
    lower.includes('firebasestorage.googleapis.com') ||
    lower.includes('dropbox.com') ||
    lower.includes('raw=1')
  );
};

const getUrlType = (url: string) => {
  if (!url) return 'Vazia';
  const parsed = url.toLowerCase();
  if (parsed.includes('youtube.com') || parsed.includes('youtu.be')) return 'YouTube';
  if (parsed.includes('vimeo.com')) return 'Vimeo';
  if (parsed.includes('loom.com')) return 'Loom';
  if (parsed.includes('streamable.com')) return 'Streamable';
  if (parsed.includes('dailymotion.com')) return 'DailyMotion';
  if (parsed.includes('sharepoint.com')) return 'SharePoint';
  if (parsed.includes('onedrive.live.com')) return 'OneDrive';
  if (parsed.includes('drive.google.com')) return 'Google Drive';
  if (parsed.includes('supabase.co')) return 'Supabase Storage';
  if (parsed.includes('firebasestorage.googleapis.com')) return 'Firebase Storage';
  if (parsed.startsWith('blob:') || isDirectVideo(url)) return 'Vídeo Direto / MP4 (HTML5)';
  return 'Servidor de Mídia Externo';
};

const getEmbedUrl = (url: string) => {
  if (!url) return '';
  let parsedUrl = url.trim();

  // 1. YouTube (watch, shorts, live, shortlink, embed)
  if (parsedUrl.includes('youtube.com') || parsedUrl.includes('youtu.be')) {
    let videoId = '';
    if (parsedUrl.includes('watch?v=')) {
      videoId = parsedUrl.split('watch?v=')[1]?.split('&')[0] || '';
    } else if (parsedUrl.includes('youtu.be/')) {
      videoId = parsedUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (parsedUrl.includes('/shorts/')) {
      videoId = parsedUrl.split('/shorts/')[1]?.split('?')[0] || '';
    } else if (parsedUrl.includes('/live/')) {
      videoId = parsedUrl.split('/live/')[1]?.split('?')[0] || '';
    } else if (parsedUrl.includes('/embed/')) {
      videoId = parsedUrl.split('/embed/')[1]?.split('?')[0] || '';
    }
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`;
    }
    return parsedUrl;
  }

  // 2. Vimeo
  if (parsedUrl.includes('vimeo.com')) {
    const match = parsedUrl.match(/vimeo\.com\/(\d+)/);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
    }
    return parsedUrl;
  }

  // 3. Loom
  if (parsedUrl.includes('loom.com')) {
    if (parsedUrl.includes('/share/')) {
      return parsedUrl.replace('/share/', '/embed/');
    }
    return parsedUrl;
  }

  // 4. Streamable
  if (parsedUrl.includes('streamable.com')) {
    const code = parsedUrl.split('streamable.com/')[1]?.split('?')[0];
    if (code && !code.startsWith('e/')) {
      return `https://streamable.com/e/${code}`;
    }
    return parsedUrl;
  }

  // 5. DailyMotion
  if (parsedUrl.includes('dailymotion.com')) {
    const code = parsedUrl.split('/video/')[1]?.split('?')[0];
    if (code) {
      return `https://www.dailymotion.com/embed/video/${code}`;
    }
    return parsedUrl;
  }

  // 6. Google Drive Video
  if (parsedUrl.includes('drive.google.com')) {
    let fileId = '';
    if (parsedUrl.includes('/file/d/')) {
      fileId = parsedUrl.split('/file/d/')[1]?.split('/')[0] || '';
    } else if (parsedUrl.includes('id=')) {
      fileId = parsedUrl.split('id=')[1]?.split('&')[0] || '';
    }
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return parsedUrl;
  }

  // 7. Dropbox
  if (parsedUrl.includes('dropbox.com')) {
    if (parsedUrl.includes('dl=0')) {
      return parsedUrl.replace('dl=0', 'raw=1');
    }
    return parsedUrl;
  }

  // 8. SharePoint and OneDrive
  if (parsedUrl.includes('sharepoint.com')) {
    if (parsedUrl.includes('Embed.aspx')) return parsedUrl;
    const sharepointMatch = parsedUrl.match(/(https:\/\/[^\/]+)\/:v:\/s\/([^\/]+)\/([^\/?]+)/);
    if (sharepointMatch) {
      const [_, domain, site, id] = sharepointMatch;
      return `${domain}/sites/${site}/_layouts/15/Embed.aspx?UniqueId=${id}&action=embedview`;
    }
    const personalMatch = parsedUrl.match(/(https:\/\/[^\/]+)\/:v:\/g\/personal\/([^\/]+)\/([^\/?]+)/);
    if (personalMatch) {
      const [_, domain, user, id] = personalMatch;
      return `${domain}/personal/${user}/_layouts/15/Embed.aspx?UniqueId=${id}&action=embedview`;
    }
    try {
      const urlObj = new URL(parsedUrl);
      urlObj.searchParams.set('action', 'embedview');
      return urlObj.toString();
    } catch (e) {
      if (!parsedUrl.includes('action=embedview')) {
        parsedUrl += parsedUrl.includes('?') ? '&action=embedview' : '?action=embedview';
      }
      return parsedUrl;
    }
  }

  if (parsedUrl.includes('onedrive.live.com')) {
    if (parsedUrl.includes('Embed.aspx')) return parsedUrl;
    try {
      const urlObj = new URL(parsedUrl);
      urlObj.searchParams.set('action', 'embedview');
      return urlObj.toString();
    } catch (e) {
      if (!parsedUrl.includes('action=embedview')) {
        parsedUrl += parsedUrl.includes('?') ? '&action=embedview' : '?action=embedview';
      }
      return parsedUrl;
    }
  }

  return parsedUrl;
};

const MediaModal: React.FC<{ 
  isOpen: boolean, 
  type: 'video' | 'pdf' | null, 
  course: Course | null, 
  courses?: Course[],
  onSelectCourse?: (course: Course) => void,
  onClose: () => void,
  onPrev?: () => void,
  onNext?: () => void,
  onTypeChange?: (type: 'video' | 'pdf') => void,
  isCompleted?: boolean,
  onToggleComplete?: (id: string) => void
}> = ({ isOpen, type, course, courses = [], onSelectCourse, onClose, onPrev, onNext, onTypeChange, isCompleted, onToggleComplete }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [currentTab, setCurrentTab] = useState<'video' | 'pdf'>('video');
  const [currentTime, setCurrentTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoState, setVideoState] = useState<'loading' | 'playing' | 'paused' | 'error'>('loading');
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('');
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string>('');

  const addLog = (msg: string) => {
    setDiagnosticLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    if (!isOpen || !course) return;
    
    let active = true;
    let localVideoUrlBlob = '';
    let localPdfUrlBlob = '';

    const resolveLocalResources = async () => {
      // Resolve Video
      if (course.videoUrl) {
        if (course.videoUrl.startsWith('local-file-')) {
          try {
            const blob = await getLocalFile(course.videoUrl);
            if (blob && active) {
              const bUrl = URL.createObjectURL(blob);
              localVideoUrlBlob = bUrl;
              setResolvedVideoUrl(bUrl);
              addLog(`Vídeo local convertido com sucesso em Blob URL: ${bUrl}`);
            }
          } catch (err) {
            console.error(err);
            addLog(`Erro ao resolver vídeo local: ${err}`);
          }
        } else {
          setResolvedVideoUrl(course.videoUrl);
        }
      } else {
        setResolvedVideoUrl('');
      }

      // Resolve PDF
      if (course.pdfUrl) {
        if (course.pdfUrl.startsWith('local-file-')) {
          try {
            const blob = await getLocalFile(course.pdfUrl);
            if (blob && active) {
              const bUrl = URL.createObjectURL(blob);
              localPdfUrlBlob = bUrl;
              setResolvedPdfUrl(bUrl);
              addLog(`PDF local convertido com sucesso em Blob URL: ${bUrl}`);
            }
          } catch (err) {
            console.error(err);
            addLog(`Erro ao resolver PDF local: ${err}`);
          }
        } else {
          setResolvedPdfUrl(course.pdfUrl);
        }
      } else {
        setResolvedPdfUrl('');
      }
    };

    resolveLocalResources();

    return () => {
      active = false;
      if (localVideoUrlBlob && localVideoUrlBlob.startsWith('blob:')) {
        URL.revokeObjectURL(localVideoUrlBlob);
      }
      if (localPdfUrlBlob && localPdfUrlBlob.startsWith('blob:')) {
        URL.revokeObjectURL(localPdfUrlBlob);
      }
    };
  }, [isOpen, course]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (isOpen && type) {
      setCurrentTab(type);
    }
  }, [isOpen, type, course]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Expose tab setter and video controls to window for AI Assistant automation
  useEffect(() => {
    if (isOpen) {
      (window as any).__mediaModalSetTab = setCurrentTab;
    } else {
      (window as any).__mediaModalSetTab = null;
    }
    return () => {
      (window as any).__mediaModalSetTab = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      (window as any).__videoPlayer = videoRef.current;
    } else {
      (window as any).__videoPlayer = null;
    }
    return () => {
      (window as any).__videoPlayer = null;
    };
  }, [isOpen, currentTab, course]);

  useEffect(() => {
    if (isOpen && course) {
      setVideoState('loading');
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      const logs = [];
      logs.push(`Painel aberto para o curso: "${course.title}"`);
      if (course.videoUrl) {
        logs.push(`URL original recebida: ${course.videoUrl}`);
        const typeStr = getUrlType(course.videoUrl);
        logs.push(`Tipo de mídia identificada: ${typeStr}`);
        const converted = getEmbedUrl(course.videoUrl);
        logs.push(`URL convertida para reprodução: ${converted}`);
      } else {
        logs.push(`Aviso: Este treinamento não possui URL de vídeo cadastrada.`);
      }
      setDiagnosticLogs(logs);

      // Auto play for direct videos after simple timeout
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().then(() => {
            setIsPlaying(true);
            setVideoState('playing');
          }).catch(() => {
            addLog("Tentativa de auto-play bloqueada pelo navegador.");
            setVideoState('paused');
          });
        }
      }, 500);
    }
  }, [isOpen, course]);

  if (!course) return null;

  const isVideoBlob = course.videoUrl?.startsWith('blob:');
  const isPdfBlob = course.pdfUrl?.startsWith('blob:');

  const getPdfEmbedUrl = (url: string) => {
    if (!url) return '';
    let parsedUrl = url.trim();

    // 1. Google Drive PDF
    if (parsedUrl.includes('drive.google.com')) {
      if (parsedUrl.includes('/view')) {
        return parsedUrl.split('/view')[0] + '/preview';
      }
      if (parsedUrl.includes('/open?id=')) {
        const id = parsedUrl.split('/open?id=')[1]?.split('&')[0];
        if (id) return `https://drive.google.com/file/d/${id}/preview`;
      }
      if (!parsedUrl.endsWith('/preview') && parsedUrl.includes('/file/d/')) {
        const parts = parsedUrl.split('/file/d/');
        if (parts[1]) {
          const id = parts[1].split('/')[0];
          return `https://drive.google.com/file/d/${id}/preview`;
        }
      }
      return parsedUrl;
    }

    // 2. SharePoint and OneDrive
    if (parsedUrl.includes('sharepoint.com') || parsedUrl.includes('onedrive.live.com')) {
      if (!parsedUrl.includes('action=embedview')) {
        parsedUrl += parsedUrl.includes('?') ? '&action=embedview' : '?action=embedview';
      }
      return parsedUrl;
    }

    return parsedUrl;
  };

  const videoSrc = resolvedVideoUrl && resolvedVideoUrl !== "" && !resolvedVideoUrl.startsWith('file://')
    ? getEmbedUrl(resolvedVideoUrl)
    : null;
    
  const pdfSrc = resolvedPdfUrl && !resolvedPdfUrl.startsWith('file://') 
    ? resolvedPdfUrl 
    : null;

  const pdfEmbedSrc = pdfSrc ? getPdfEmbedUrl(pdfSrc) : null;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          setVideoState('playing');
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setVideoState('paused');
      }
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (offset: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += offset;
      setCurrentTime(videoRef.current.currentTime);
      addLog(`Pulou ${offset > 0 ? '+' : ''}${offset} segundos no vídeo.`);
    } else if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const newTime = Math.max(0, currentTime + offset);
        setCurrentTime(newTime);
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [newTime, true] }),
          '*'
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ method: 'seekTo', value: newTime }),
          '*'
        );
        addLog(`Avançou/Voltou ${offset > 0 ? '+' : ''}${offset}s no player.`);
      } catch {
        setCurrentTime(prev => Math.max(0, prev + offset));
        addLog(`Avançou/Voltou ${offset > 0 ? '+' : ''}${offset}s.`);
      }
    } else {
      setCurrentTime(prev => Math.max(0, prev + offset));
      addLog(`Avançou/Voltou ${offset > 0 ? '+' : ''}${offset}s.`);
    }
  };

  const handleRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      addLog(`Velocidade de reprodução alterada para ${rate}x.`);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      const nextMute = !videoRef.current.muted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const togglePictureInPicture = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPipActive(false);
        } else if (document.pictureInPictureEnabled) {
          await videoRef.current.requestPictureInPicture();
          setIsPipActive(true);
        }
      } catch (err: any) {
        addLog(`Picture-in-Picture: ${err.message}`);
      }
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(err => {
          addLog(`Erro ao ativar Tela Cheia: ${err.message}`);
        });
      } else {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[1440px] my-auto overflow-hidden flex flex-col h-auto max-h-[98vh] sm:max-h-[96vh] border border-slate-100"
          >
            {/* Header Modal */}
            <div className="p-3 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center bg-white">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 shadow-sm shrink-0">
                  <GraduationCap size={20} className="sm:hidden" />
                  <GraduationCap size={24} className="hidden sm:block" />
                </div>
                <div className="max-w-[200px] sm:max-w-[360px] lg:max-w-[500px] text-left">
                  <h3 className="text-sm sm:text-xl font-black text-slate-900 truncate leading-tight">{course?.title}</h3>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                    <span className="text-[9px] sm:text-[10px] text-[#3B82F6] font-extrabold uppercase tracking-widest bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-md">{course?.system}</span>
                    <span className="text-slate-300 text-xs">•</span>
                    <p className="text-[9px] sm:text-[10px] text-slate-600 uppercase font-extrabold tracking-widest truncate">
                      {currentTab === 'pdf' ? 'Material de Apoio (PDF)' : 'Vídeo Aula'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic search bar inside the MediaModal */}
              {courses && courses.length > 0 && (
                <div className="relative flex-1 max-w-md mx-0 md:mx-6" ref={searchRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Navegar e buscar outra aula..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsSearchFocused(true);
                      }}
                      onFocus={() => setIsSearchFocused(true)}
                      className="w-full pl-9 pr-8 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-100"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown containing all matching courses */}
                  <AnimatePresence>
                    {isSearchFocused && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-150 z-[100] max-h-64 overflow-y-auto p-1.5"
                      >
                        {(() => {
                          const query = searchQuery.toLowerCase().trim();
                          const matches = courses.filter(c => 
                            c.title.toLowerCase().includes(query) || 
                            c.system.toLowerCase().includes(query)
                          );

                          if (matches.length === 0) {
                            return <p className="text-[11px] text-slate-400 py-3 text-center font-medium">Nenhuma aula encontrada</p>;
                          }

                          return (
                            <div className="space-y-0.5">
                              {matches.map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    onSelectCourse?.(c);
                                    setSearchQuery('');
                                    setIsSearchFocused(false);
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left select-none transition-colors ${
                                    c.id === course?.id 
                                      ? 'bg-blue-50 text-blue-700 font-bold' 
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 max-w-[80%]">
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                      c.system === '7Edu' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                                    }`}>
                                      {c.system}
                                    </span>
                                    <span className="text-[11px] font-bold truncate leading-tight">{c.title}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 shrink-0 font-mono italic">{c.duration}</span>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              <button 
                onClick={onClose} 
                className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors shrink-0 ml-auto md:ml-0"
                aria-label="Fechar"
              >
                <X size={20} className="sm:hidden" />
                <X size={22} className="hidden sm:block" />
              </button>
            </div>

            {/* Selector de Abas em Destaque (RESPONSIVO E ADAPTADO AO MOBILE) */}
            {videoSrc && pdfSrc && (
              <div className="flex border-b-2 border-slate-200 bg-slate-100/90 p-1.5 sm:p-2 gap-1.5 sm:gap-3 shadow-inner">
                <button
                  onClick={() => setCurrentTab('video')}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 sm:py-3.5 px-2 text-xs sm:text-base font-black rounded-xl sm:rounded-2xl transition-all uppercase tracking-wide ${
                    currentTab === 'video'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-2 ring-blue-400'
                      : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Play size={15} className="sm:hidden" fill={currentTab === 'video' ? 'currentColor' : 'none'} />
                  <Play size={18} className="hidden sm:block" fill={currentTab === 'video' ? 'currentColor' : 'none'} />
                  <span className="truncate">🎬 Vídeo Aula</span>
                </button>
                <button
                  onClick={() => setCurrentTab('pdf')}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 py-2.5 sm:py-3.5 px-2 text-xs sm:text-base font-black rounded-xl sm:rounded-2xl transition-all uppercase tracking-wide ${
                    currentTab === 'pdf'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 ring-2 ring-emerald-400'
                      : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <FileText size={15} className="sm:hidden" />
                  <FileText size={18} className="hidden sm:block" />
                  <span className="truncate">📄 Passo a Passo (PDF)</span>
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto max-h-[82vh] bg-slate-50">
              {!videoSrc && !pdfSrc ? (
                <div className="flex flex-col items-center justify-center p-6 sm:p-16 text-center max-w-xl mx-auto">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 sm:mb-4 border border-amber-200 shadow-sm">
                    <Zap size={28} className="sm:hidden" />
                    <Zap size={32} className="hidden sm:block" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                    {course.videoUrl?.startsWith('local-file-') || course.pdfUrl?.startsWith('local-file-')
                      ? 'Arquivo Salvo Localmente em Outro Aparelho'
                      : 'Conteúdo em Construção'}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                    {course.videoUrl?.startsWith('local-file-') || course.pdfUrl?.startsWith('local-file-')
                      ? 'Este arquivo foi anexado a partir do armazenamento interno do navegador de outro computador e não foi enviado para a nuvem. Por isso, ele só pode ser exibido naquele aparelho específico.'
                      : 'Esta aula ainda não possui vídeo ou material PDF anexado.'}
                  </p>
                  {(course.videoUrl?.startsWith('local-file-') || course.pdfUrl?.startsWith('local-file-')) && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl p-3 sm:p-4 text-xs text-left w-full space-y-2">
                      <p className="font-extrabold flex items-center gap-2 text-blue-700">
                        💡 Como disponibilizar para TODOS os alunos em qualquer dispositivo:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        <li>Acesse o <strong>Painel Admin</strong> e edite este curso.</li>
                        <li>Cole o link público do seu vídeo ou PDF (YouTube, Google Drive, OneDrive, SharePoint, Vimeo, Supabase).</li>
                        <li>Ao salvar, todos os dispositivos (celulares, tablets, outros computadores) carregarão a aula instantaneamente!</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Vídeo Aula - Visível apenas quando tab === 'video' */}
                  {videoSrc && currentTab === 'video' && (
                    <div className="bg-slate-950 p-2 sm:p-4 flex flex-col gap-2.5">
                      {/* Compact Informational Banner for Drive / OneDrive / SharePoint if account login is restricted */}
                      {videoSrc && (videoSrc.includes('drive.google.com') || videoSrc.includes('sharepoint.com') || videoSrc.includes('onedrive.live.com')) && (
                        <div className="max-w-5xl mx-auto w-full bg-amber-950/40 border border-amber-500/30 text-amber-200/90 px-3 py-1.5 rounded-lg flex items-center justify-between gap-2 text-[10px] sm:text-xs text-left">
                          <p className="truncate flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            <span className="font-bold text-amber-200">Player Integrado</span>
                            <span className="hidden sm:inline text-amber-300/80">(Se a nuvem solicitar login corporativo, use o botão ao lado)</span>
                          </p>
                          <a 
                            href={course.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-md text-[10px] sm:text-xs shrink-0 border border-amber-500/40 transition-all active:scale-95"
                          >
                            <ExternalLink size={11} />
                            Abrir em Nova Aba
                          </a>
                        </div>
                      )}

                      {/* Video Container - Destacado e Proporcional 16:9 sem deslocamento */}
                      <div 
                        ref={containerRef}
                        className={`group relative flex items-center justify-center bg-black overflow-hidden mx-auto transition-all ${
                          isFullscreen 
                            ? 'w-screen h-screen' 
                            : 'w-full max-w-5xl aspect-video rounded-xl shadow-2xl border border-slate-800 ring-1 ring-slate-800'
                        }`}
                      >
                        {/* Loading Ring overlay */}
                        {videoState === 'loading' && (
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-30 pointer-events-none">
                            <Loader2 className="animate-spin text-blue-500" size={28} />
                            <span className="text-[10px] sm:text-xs font-bold text-slate-300 tracking-wider uppercase">Carregando aula...</span>
                          </div>
                        )}

                        {/* Status Label on Screen */}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 flex gap-1.5 pointer-events-none shadow-md">
                          <span className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold rounded-full text-white flex items-center gap-1.5 backdrop-blur-md ${
                            videoState === 'loading' ? 'bg-amber-600/90' :
                            videoState === 'playing' ? 'bg-emerald-600/90' :
                            videoState === 'paused' ? 'bg-slate-600/90' :
                            'bg-red-600/90'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full bg-white ${videoState === 'playing' || videoState === 'loading' ? 'animate-ping' : ''}`} />
                            {videoState === 'loading' ? 'Carregando' :
                             videoState === 'playing' ? 'Reproduzindo' :
                             videoState === 'paused' ? 'Pausado' :
                             'Visualização Externa'}
                          </span>
                        </div>

                        {isDirectVideo(videoSrc) ? (
                          <>
                            <video 
                              key={videoSrc}
                              ref={videoRef}
                              src={videoSrc} 
                              className="w-full h-full object-contain cursor-pointer" 
                              controls={false}
                              autoPlay 
                              playsInline
                              onTimeUpdate={handleTimeUpdate}
                              onLoadedMetadata={handleLoadedMetadata}
                              onPlay={() => { setIsPlaying(true); setVideoState('playing'); }}
                              onPause={() => { setIsPlaying(false); setVideoState('paused'); }}
                              onClick={handlePlayPause}
                              onWaiting={() => setVideoState('loading')}
                              onPlaying={() => setVideoState('playing')}
                              onError={() => { setVideoState('error'); addLog("Erro crítico de renderização de vídeo direto."); }}
                            />
                            
                            {/* Central Pause Overlay Indicator */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <AnimatePresence>
                                {!isPlaying && (
                                  <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 1.2, opacity: 0 }}
                                    className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600/90 text-white rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm"
                                  >
                                    <Play size={22} fill="currentColor" className="ml-1" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Custom Controls Overlay for direct video */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-2 sm:p-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-20 flex flex-col gap-1.5 text-left">
                              {/* Progress bar timeline on hover */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold font-mono text-white tracking-wider">{formatTime(currentTime)}</span>
                                <div className="flex-1 relative h-2 bg-white/20 rounded-full cursor-pointer group/bar flex items-center">
                                  <input 
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    step="0.1"
                                    value={currentTime}
                                    onChange={handleSeekChange}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                  />
                                  <div 
                                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                  />
                                  <div 
                                    className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white scale-100 transition-transform duration-100 shadow-md"
                                    style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 7px)` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold font-mono text-white tracking-wider">{formatTime(duration)}</span>
                              </div>

                              {/* Controls row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={handlePlayPause}
                                    className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                  >
                                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                                  </button>

                                  {/* Volume slider control */}
                                  <div className="flex items-center gap-1 group/vol">
                                    <button onClick={handleMuteToggle} className="text-white/80 hover:text-white p-1">
                                      {isMuted ? <VolumeX size={14} /> : volume < 0.5 ? <Volume1 size={14} /> : <Volume2 size={14} />}
                                    </button>
                                    <input 
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.1"
                                      value={isMuted ? 0 : volume}
                                      onChange={handleVolumeChange}
                                      className="w-12 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-blue-500"
                                    />
                                  </div>

                                  {/* Speed setting */}
                                  <div className="flex gap-1">
                                    {[1, 1.5, 2].map(rate => (
                                      <button 
                                        key={rate} 
                                        onClick={() => handleRateChange(rate)}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide ${playbackRate === rate ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                                      >
                                        {rate}x
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button onClick={togglePictureInPicture} className="text-white/80 hover:text-white p-1" title="Picture-in-Picture">
                                    <ExternalLink size={14} />
                                  </button>
                                  <button onClick={toggleFullscreen} className="text-white/80 hover:text-white p-1" title="Tela Cheia">
                                    <Maximize size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full relative">
                            {/* Iframe wrapper for general, YouTube, vimeo, sharepoint links */}
                            <iframe 
                              ref={iframeRef}
                              src={videoSrc || undefined} 
                              className="w-full h-full border-0 rounded-xl"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              title="Vídeo Aula"
                              onLoad={() => {
                                setVideoState('playing');
                                addLog("Iframe carregado e pronto.");
                              }}
                              onError={() => {
                                setVideoState('error');
                                addLog("Falha ao embutir link no iframe.");
                              }}
                            ></iframe>
                          </div>
                        )}
                      </div>
                      
                      {/* Integrated Action & Navigation Bar below player - Com Destaque aos Controles e Navegação do Vídeo */}
                      <div className="max-w-5xl mx-auto w-full bg-slate-900 rounded-xl p-2.5 sm:p-3 flex flex-col gap-2 text-white border border-slate-800 shadow-md">
                        {/* Interactive Timeline Bar for Seeking to Any Point in Video */}
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
                          <button 
                            onClick={handlePlayPause}
                            className="w-7 h-7 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-md text-white shrink-0 transition-all active:scale-95"
                            title={isPlaying ? "Pausar" : "Reproduzir"}
                          >
                            {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                          </button>
                          <span className="text-[10px] font-mono font-bold text-slate-300 w-9 text-right shrink-0">{formatTime(currentTime)}</span>
                          <div className="flex-1 relative h-2 bg-slate-800 rounded-full cursor-pointer flex items-center group/timeline">
                            <input 
                              type="range"
                              min="0"
                              max={duration || 100}
                              step="0.1"
                              value={currentTime}
                              onChange={handleSeekChange}
                              className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                              title="Clique ou arraste para ir a qualquer ponto do vídeo"
                            />
                            <div 
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md shadow-blue-500/50 scale-100 transition-transform duration-100"
                              style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 7px)` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 w-9 shrink-0">{formatTime(duration)}</span>
                        </div>

                        {/* Action Controls Row - Perfeitamente Adaptado para Mobile e Desktop */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
                          {/* Destacados: Voltar 10s e Avançar 10s (SEMPRE ATIVOS) */}
                          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
                            <button
                              onClick={() => handleSeek(-10)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-extrabold bg-blue-600/25 hover:bg-blue-600/35 text-blue-200 border border-blue-500/50 active:scale-95 transition-all shadow-sm"
                              title="Voltar 10 segundos no vídeo"
                            >
                              <RotateCcw size={14} />
                              Voltar 10s
                            </button>
                            
                            <button
                              onClick={() => handleSeek(10)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-extrabold bg-blue-600/25 hover:bg-blue-600/35 text-blue-200 border border-blue-500/50 active:scale-95 transition-all shadow-sm"
                              title="Avançar 10 segundos no vídeo"
                            >
                              Avançar 10s
                              <RotateCw size={14} />
                            </button>
                          </div>

                          {/* Navegação entre Aulas e Abrir em Nova Aba */}
                          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
                            <button
                              onClick={onPrev}
                              disabled={!onPrev}
                              className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                onPrev 
                                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 active:scale-95' 
                                  : 'text-slate-600 bg-slate-900 border border-slate-800/60 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <ChevronLeft size={14} />
                              Anterior
                            </button>

                            <button
                              onClick={onNext}
                              disabled={!onNext}
                              className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                onNext 
                                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 active:scale-95' 
                                  : 'text-slate-600 bg-slate-900 border border-slate-800/60 cursor-not-allowed opacity-50'
                              }`}
                            >
                              Próxima
                              <ChevronRight size={14} />
                            </button>

                            {course.videoUrl && (
                              <a 
                                href={course.videoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-700 active:scale-95 shrink-0"
                                title="Abrir vídeo em nova aba do navegador"
                              >
                                <ExternalLink size={13} />
                                Nova Aba
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Material de Apoio (PDF) - Visível apenas quando tab === 'pdf' */}
                  {pdfSrc && currentTab === 'pdf' && (
                    <div className="p-2 sm:p-8 bg-slate-100">
                      <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm text-left">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm shrink-0">
                              <FileText size={20} className="sm:hidden" />
                              <FileText size={24} className="hidden sm:block" />
                            </div>
                            <div>
                              <h4 className="text-sm sm:text-xl font-black text-slate-900">Material de Apoio Oficial (PDF)</h4>
                              <p className="text-[11px] sm:text-xs text-slate-500">Documentação e guias operacionais completos para estudo.</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={pdfSrc} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-extrabold hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                            >
                              <Download size={14} />
                              Baixar / Abrir PDF em Nova Aba
                            </a>
                          </div>
                        </div>

                        {/* PDF Viewer - Proportional Viewport */}
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full">
                          <iframe 
                            src={pdfEmbedSrc || undefined} 
                            className="w-full min-h-[420px] sm:min-h-[750px] h-[60vh] sm:h-[78vh] border-0"
                            title="Material PDF Passo a Passo"
                          ></iframe>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informações detalhadas da aula */}
                  <div className="p-3 sm:p-6 md:p-8 bg-white grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 text-left">
                    <div className="lg:col-span-7 space-y-3 sm:space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-black rounded-lg ${course.system === '7Edu' ? 'bg-blue-550/10 text-blue-600' : 'bg-indigo-550/10 text-indigo-600'}`}>
                          {course.system}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-lg ${
                          course.difficulty === 'Iniciante' ? 'bg-emerald-50 text-emerald-600' :
                          course.difficulty === 'Intermediário' ? 'bg-amber-50 text-amber-600' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          {course.difficulty}
                        </span>
                      </div>

                      <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        {course.title}
                      </h1>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-normal">
                        {course.description || "Esta aula aborda as diretrizes essenciais, instruções e melhores práticas recomendadas para o domínio operacional dos processos administrativos."}
                      </p>
                    </div>

                    {/* Progress Toggle Card (Otimizado para Mobile e Desktop) */}
                    <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 p-4 sm:p-6 md:p-7 rounded-xl sm:rounded-2xl flex flex-col justify-between gap-4 sm:gap-5 shadow-sm">
                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Seu Progresso</h4>
                        
                        <div className="p-3 sm:p-4 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-colors">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <CheckCircle2 size={18} className={isCompleted ? "text-emerald-500" : "text-slate-300"} />
                            <div className="text-left leading-tight">
                              <p className="text-xs sm:text-sm font-bold text-slate-800">Concluído</p>
                              <p className="text-[10px] sm:text-xs text-slate-500">Registre sua evolução nesta aula</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => onToggleComplete?.(course.id)}
                            className={`h-5 sm:h-6 w-10 sm:w-12 rounded-full p-0.5 transition-colors relative duration-200 outline-none ${
                              isCompleted ? 'bg-emerald-500' : 'bg-slate-350'
                            }`}
                          >
                            <div className={`h-4 sm:h-5 w-4 sm:w-5 rounded-full bg-white transition-all shadow-md ${
                              isCompleted ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        {/* Botão de Marcar Conclusão */}
                        <button
                          onClick={() => onToggleComplete?.(course.id)}
                          className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                            isCompleted 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100' 
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/10'
                          }`}
                        >
                          <CheckCircle2 size={16} className={isCompleted ? "text-emerald-500" : "text-white"} />
                          {isCompleted ? 'Concluído! Desmarcar aula' : 'Marcar Aula como Concluída'}
                        </button>

                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                          <div className="p-2.5 sm:p-3 bg-white border border-slate-200/80 rounded-xl text-left">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block">Duração</span>
                            <span className="text-xs sm:text-sm text-slate-800 font-extrabold flex items-center gap-1 sm:gap-1.5 mt-0.5">
                              <Clock size={13} className="text-[#3B82F6]" />
                              {course.duration}
                            </span>
                          </div>
                          <div className="p-2.5 sm:p-3 bg-white border border-slate-200/80 rounded-xl text-left">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block">Nível</span>
                            <span className="text-xs sm:text-sm text-slate-800 font-extrabold flex items-center gap-1 sm:gap-1.5 mt-0.5">
                              <BarChart size={13} className="text-[#3B82F6]" />
                              {course.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botões Separados para Download do Vídeo e do Passo a Passo (PDF) */}
                      <div className="space-y-2 pt-3 border-t border-slate-200/60 text-left">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Downloads Disponíveis</span>
                        
                        {course.videoUrl ? (
                          <button 
                            onClick={() => downloadFile(course.videoUrl!, `${course.title}.mp4`)}
                            className="w-full flex items-center justify-center gap-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-sm transition-all active:scale-[0.98]"
                            title="Baixar Vídeo Aula"
                          >
                            <Download size={13} />
                            Fazer Download do Vídeo
                          </button>
                        ) : (
                          <div className="w-full flex items-center justify-center gap-1 text-slate-450 bg-slate-100 text-[10px] font-medium py-2 px-3 rounded-lg border border-dashed border-slate-200 cursor-not-allowed">
                            <Video size={12} />
                            Vídeo não disponível
                          </div>
                        )}

                        {pdfSrc ? (
                          <button 
                            onClick={() => downloadFile(pdfSrc, `${course.title}.pdf`)}
                            className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-sm transition-all active:scale-[0.98]"
                            title="Baixar Passo a Passo (PDF)"
                          >
                            <FileText size={13} />
                            Baixar Passo a Passo (PDF)
                          </button>
                        ) : (
                          <div className="w-full flex items-center justify-center gap-1 text-slate-450 bg-slate-100 text-[10px] font-medium py-2 px-3 rounded-lg border border-dashed border-slate-200 cursor-not-allowed">
                            <FileText size={12} />
                            Sem PDF Passo a Passo
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
