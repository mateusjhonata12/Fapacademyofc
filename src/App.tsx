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
  Pause,
  Maximize,
  ExternalLink,
  VolumeX,
  Volume1,
  Volume2,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIAssistant } from './lib/AIAssistant';
import { GeminiVideoUploader } from './components/GeminiVideoUploader';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from './lib/firebase';
import { 
  signInWithPopup, 
  OAuthProvider 
} from 'firebase/auth';
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
import { saveLocalFile, getLocalFile } from './lib/indexedDB';
import supabase from './lib/supabase';

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
}

interface CourseCardProps {
  course: Course;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  onOpenMedia: (type: 'video' | 'pdf') => void;
  theme?: 'light' | 'dark';
}

type TabType = 'Home' | '7Edu' | 'TOTVS' | 'Todos' | 'Admin' | 'GeminiVideo';

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
}

// --- Dados Iniciais de Fallback ---
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
    videoUrl: 'https://mailadventistas.sharepoint.com/:v:/s/SAD-USB-IAP/iapatendimento/IQBnbmk1XWx6RZKdV7HeOLU0AQOOwNjwiyBGeF5gjbrgxw0?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=gobcbL'
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
  }, [theme]);

  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modalType, setModalType] = useState<'video' | 'pdf' | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(false);

  // --- Listeners do Firestore com Tratamento Offline ---
  useEffect(() => {
    const offlineCoursesJSON = localStorage.getItem('fapacademy_offline_courses');
    let offlineCourses: Course[] = [];
    if (offlineCoursesJSON) {
      try {
        offlineCourses = JSON.parse(offlineCoursesJSON);
      } catch (e) {
        console.warn("Erro ao deserializar fapacademy_offline_courses:", e);
      }
    }

    const coursesUnsubscribe = onSnapshot(collection(db, 'courses'), 
      async (snapshot) => {
        const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        
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

        const allCourses = [...offlineCourses, ...updatedCourses];
        const uniqueCoursesMap = new Map<string, Course>();
        allCourses.forEach(c => uniqueCoursesMap.set(c.id, c));
        const mergedCourses = Array.from(uniqueCoursesMap.values());

        mergedCourses.sort((a, b) => {
          const aTime = a.createdAt || 0;
          const bTime = b.createdAt || 0;
          if (aTime || bTime) return bTime - aTime;
          return (parseInt(a.id) || 999) - (parseInt(b.id) || 999);
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

    return () => coursesUnsubscribe();
  }, []);

  useEffect(() => {
    const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.email === 'mateusjhonata123@gmail.com';
    if (!currentUser || !isAdmin) {
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
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    return () => usersUnsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const savedUser = localStorage.getItem('fapacademy_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Erro ao recuperar estado de sessão", e);
      }
    }
  }, []);

  const handleLogin = async (loginData: Pick<User, 'email' | 'password'>) => {
    setIsAppLoading(true);
    try {
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
        tenant: 'organizations',
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email?.toLowerCase();
      
      if (!email) {
        throw new Error("Não foi possível obter o e-mail da conta Microsoft.");
      }
      
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      let userObj: User;
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        userObj = { id: userDoc.id, ...userDoc.data() } as User;
      } else {
        const newId = result.user.uid || Math.random().toString(36).substr(2, 9);
        const name = result.user.displayName || email.split('@')[0].toUpperCase();
        const newUser: User = {
          id: newId,
          name,
          email,
          role: 'user',
          password: 'corporate-oauth-user'
        };
        await setDoc(doc(db, 'users', newId), newUser);
        userObj = newUser;
      }
      
      setCurrentUser(userObj);
      localStorage.setItem('fapacademy_user', JSON.stringify(userObj));
    } catch (error: any) {
      console.error("Erro no login Microsoft:", error);
      
      if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found' || error.message?.includes('provider')) {
        const wishToSimulate = window.confirm(
          "O login integrado corporativo precisa ser ativado no Console do Firebase.\n\n" +
          "Gostaria de rodar uma simulação de autenticação com e-mail institucional?"
        );
        
        if (wishToSimulate) {
          const testEmail = window.prompt("Insira um endereço de e-mail corporativo fictício:", "colaborador@fap.com.br");
          if (testEmail && testEmail.trim()) {
            const emailClean = testEmail.trim().toLowerCase();
            const q = query(collection(db, 'users'), where('email', '==', emailClean));
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

  useEffect(() => {
    localStorage.setItem('fapacademy_progress', JSON.stringify(completedCourses));
  }, [completedCourses]);

  const filteredCourses = useMemo(() => {
    return courses
      .filter(course => {
        const matchesTab = activeTab === 'Todos' || activeTab === 'Home' || course.system === activeTab;
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [activeTab, searchQuery, courses]);

  const toggleComplete = (id: string) => {
    const isNowCompleted = !completedCourses.includes(id);
    if (isNowCompleted) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
    setCompletedCourses(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const progressPercentage = Math.round((completedCourses.length / Math.max(COURSES.length, courses.length)) * 100);

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
          className={`flex min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B0F19] text-slate-100' : 'bg-[#F1F5F9] text-slate-900'}`}
        >
          {/* Sidebar Mobile Overlay */}
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

          {/* Sidebar Component */}
          <aside 
            className={`fixed inset-y-0 left-0 z-50 bg-[#0F172A] text-white transition-all duration-500 ease-in-out lg:static overflow-hidden ${
              isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 w-0'
            }`}
          >
            <div className="flex h-full flex-col">
              <button 
                onClick={() => { setActiveTab('Home'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                className="flex items-center gap-3 px-6 py-8 hover:opacity-80 transition-opacity w-full text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3B82F6]">
                  <GraduationCap size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight">FapAcademy</span>
              </button>

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
                  icon={<Sparkles size={20} className="text-blue-500 animate-pulse" />} 
                  label="Análise IA Gemini" 
                  active={activeTab === 'GeminiVideo'} 
                  onClick={() => { setActiveTab('GeminiVideo'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
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

              {/* Tema Switcher */}
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

              {/* Componente de Progresso Geral */}
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
                  {completedCourses.length} de {courses.length || COURSES.length} aulas concluídas
                </p>
              </div>

              {/* Footer Usuário */}
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

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0">
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
                {activeTab !== 'Home' && activeTab !== 'GeminiVideo' && (
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar procedimento..." 
                      className={`w-full rounded-full border py-2 pl-10 pr-4 text-sm outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all ${
                        theme === 'dark' 
                          ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-500">FapAcademy v1.0</span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'Home' ? (
                  <HomeView key="home" onNavigate={(tab) => setActiveTab(tab)} theme={theme} />
                ) : activeTab === 'GeminiVideo' ? (
                  <GeminiVideoUploader key="gemini-video" theme={theme} />
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
                        await addDoc(collection(db, 'courses'), {
                          ...course,
                          createdAt: Date.now()
                        });
                      } catch (e) {
                        console.error("Salvando curso localmente como fallback offline:", e);
                        const fallbackCourse: Course = {
                          ...course,
                          id: 'local-' + Date.now(),
                          createdAt: Date.now()
                        };
                        setCourses(prev => {
                          const updated = [fallbackCourse, ...prev];
                          localStorage.setItem('fapacademy_offline_courses', JSON.stringify(updated.filter(c => c.id.startsWith('local-'))));
                          return updated;
                        });
                        alert("Dispositivo offline ou Firestore instável. O curso foi guardado em cache local!");
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
                            localStorage.setItem('fapacademy_offline_courses', JSON.stringify(updated.filter(c => c.id.startsWith('local-'))));
                            return updated;
                          });
                        } else {
                          await deleteDoc(doc(db, 'courses', id));
                        }
                      } catch (e) {
                        console.error("Falha ao deletar, removendo localmente:", e);
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
                            localStorage.setItem('fapacademy_offline_courses', JSON.stringify(updated.filter(c => c.id.startsWith('local-'))));
                            return updated;
                          });
                        } else {
                          await updateDoc(doc(db, 'courses', id), data as any);
                        }
                      } catch (e) {
                        console.error("Falha na sincronização externa da alteração:", e);
                      } finally {
                        setIsAppLoading(false);
                      }
                    }}
                    onSyncData={async () => {
                      setIsAppLoading(true);
                      try {
                        if (confirm("Deseja restaurar as vídeo-aulas para a versão padrão de fábrica? Isso limpará customizações.")) {
                          const snap = await getDocs(collection(db, 'courses'));
                          for (const docRef of snap.docs) {
                            await deleteDoc(doc(db, 'courses', docRef.id));
                          }
                          for (const course of COURSES) {
                            const { id, ...data } = course;
                            await setDoc(doc(db, 'courses', id), data);
                          }
                          alert("Sincronização corporativa efetuada!");
                        }
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setIsAppLoading(false);
                      }
                    }}
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
                    <div className="mb-8 text-left">
                      <h1 className={`text-3xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {activeTab === 'Todos' ? 'Todos os Treinamentos' : `Treinamentos ${activeTab}`}
                      </h1>
                      <p className={`mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Explore os procedimentos operacionais padrão da instituição para otimizar os seus processos diários.
                      </p>
                    </div>

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
                          <Search size={48} className="text-slate-404" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Nenhum resultado encontrado</h3>
                        <p className="text-slate-500">Tente ajustar sua pesquisa de termos para localizar o procedimento.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal de Mídia Avançado */}
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
                  onSelectCourse={(c) => setSelectedCourse(c)}
                  isCompleted={liveSelectedCourse ? completedCourses.includes(liveSelectedCourse.id) : false}
                  onToggleComplete={toggleComplete}
                  onClose={() => {
                    setModalType(null);
                    setSelectedCourse(null);
                  }} 
                  onPrev={(() => {
                    if (!liveSelectedCourse) return undefined;
                    const currentIndex = filteredCourses.findIndex(c => c.id === liveSelectedCourse.id);
                    if (currentIndex > 0) return () => setSelectedCourse(filteredCourses[currentIndex - 1]);
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

            {/* Notificação Flutuante de Parabéns */}
            <AnimatePresence>
              {showToast && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl"
                >
                  <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Trophy size={24} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg leading-none mb-1">Parabéns!</p>
                    <p className="text-emerald-100 text-sm">Você concluiu mais um procedimento operacional.</p>
                  </div>
                  <button onClick={() => setShowToast(false)} className="ml-4 p-1 hover:bg-white/10 rounded-md transition-colors border-0 bg-transparent text-white cursor-pointer">
                    <X size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

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
      
      {/* Spinner de Processamento Global */}
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
            <p className="mt-4 font-bold text-slate-800 animate-pulse">Sincronizando dados...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

// --- Subcomponentes de Views Primárias ---

const HomeView: React.FC<{ onNavigate: (tab: TabType) => void, theme: 'light' | 'dark' }> = ({ onNavigate, theme }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
      <section className="relative overflow-hidden bg-[#0F172A] py-20 px-4 lg:px-8 text-white">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 opacity-10 pointer-events-none">
          <GraduationCap size={600} />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <span className="inline-block rounded-full bg-[#3B82F6]/20 px-4 py-1 text-sm font-semibold text-[#3B82F6] mb-6">
              Ambiente Corporativo FapAcademy
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              Domine os Sistemas <span className="text-[#3B82F6]">7Edu</span> & <span className="text-[#3B82F6]">TOTVS</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Plataforma interna unificada de capacitação para o Setor Financeiro e de Relacionamentos da Faculdade. 
              Consulte fluxos operacionais e padronize seu atendimento.
            </p>
            <button 
              onClick={() => document.getElementById('system-selection')?.scrollIntoView({ behavior: 'smooth' })}
              className="group flex items-center gap-2 mx-auto rounded-full bg-[#3B82F6] px-8 py-4 text-lg font-bold text-white hover:bg-[#2563EB] transition-all shadow-xl shadow-[#3B82F6]/30 active:scale-95 border-0 cursor-pointer"
            >
              Começar Treinamento
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <FeatureCard 
            icon={<Zap className="text-amber-500" />}
            title="Busca Inteligente"
            description="Localize guias operacionais completos e passo a passos em poucos cliques."
            theme={theme}
          />
          <FeatureCard 
            icon={<Trophy className="text-[#3B82F6]" />}
            title="Evolução Contínua"
            description="Marque os fluxos já dominados e gerencie o progresso do seu onboarding."
            theme={theme}
          />
          <FeatureCard 
            icon={<Users className="text-emerald-500" />}
            title="Alinhamento Estratégico"
            description="Regras de negócio padronizadas e validadas pela diretoria financeira."
            theme={theme}
          />
        </motion.div>
      </section>

      <section id="system-selection" className={`py-20 px-4 lg:px-8 border-t transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B0F19] border-slate-900' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Selecione o Ecossistema</h2>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Escolha em qual software você deseja realizar os lançamentos agora.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <SystemCard title="7Edu" color="bg-indigo-600" description="Módulos de gestão acadêmica e faturamento escolar." onClick={() => onNavigate('7Edu')} />
            <SystemCard title="TOTVS" color="bg-emerald-600" description="Controle contábil, remessas bancárias e faturamento sênior." onClick={() => onNavigate('TOTVS')} />
          </div>
        </div>
      </section>
    </motion.div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, theme: 'light' | 'dark' }> = ({ icon, title, description, theme }) => (
  <motion.div 
    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
    whileHover={{ scale: 1.03, y: -4 }}
    className={`p-8 rounded-2xl border transition-colors duration-300 shadow-sm text-left ${
      theme === 'dark' ? 'bg-[#131B2E] border-slate-800 text-white' : 'bg-white border-slate-200'
    }`}
  >
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 28 })}
    </div>
    <h3 className={`text-xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
    <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>{description}</p>
  </motion.div>
);

const SystemCard: React.FC<{ title: string, color: string, description: string, onClick: () => void }> = ({ title, color, description, onClick }) => (
  <button onClick={onClick} className="group relative overflow-hidden rounded-2xl p-8 text-left transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95 border-0 cursor-pointer w-full">
    <div className={`absolute inset-0 ${color} opacity-95 group-hover:opacity-100 transition-opacity`} />
    <div className="relative z-10 text-white">
      <h3 className="text-3xl font-bold mb-2">{title}</h3>
      <p className="text-white/80 mb-6 text-sm">{description}</p>
      <div className="flex items-center gap-2 text-sm font-bold">
        Abrir Trilhas Operacionais <ArrowRight size={16} />
      </div>
    </div>
  </button>
);

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all cursor-pointer border-0 bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
    style={active ? { backgroundColor: '#3B82F6', color: '#fff' } : undefined}
  >
    {icon}
    <span>{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </button>
);

const CourseCard: React.FC<CourseCardProps> = ({ course, isCompleted, onToggleComplete, onOpenMedia, theme = 'light' }) => {
  return (
    <motion.div 
      layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm ${
        isCompleted 
          ? (theme === 'dark' ? 'border-emerald-900 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50/10') 
          : (theme === 'dark' ? 'border-slate-800 bg-[#131B2E] text-white' : 'border-slate-200 bg-white text-slate-900')
      }`}
    >
      <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={() => onOpenMedia('video')}>
        <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
        {isCompleted && (
          <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center">
            <div className="bg-white rounded-full p-2 shadow-lg text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button onClick={() => onOpenMedia('video')} className="h-11 w-11 rounded-full bg-white flex items-center justify-center text-[#3B82F6] shadow-md border-0 cursor-pointer">
            <Play size={20} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm ${course.system === '7Edu' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
            {course.system}
          </span>
          {course.pdfUrl && (
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-700 bg-white/90 flex items-center gap-1 shadow-sm`}>
              <FileText size={10} /> DOC
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 text-left">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className={`text-base font-bold leading-tight ${isCompleted ? 'text-emerald-600' : (theme === 'dark' ? 'text-slate-100' : 'text-slate-900')}`}>
            {course.title}
          </h3>
          <button 
            onClick={() => onToggleComplete(course.id)}
            className={`p-1 rounded-md transition-colors border-0 bg-transparent cursor-pointer shrink-0 ${isCompleted ? 'text-emerald-600 bg-emerald-100/50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <CheckCircle2 size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-500 line-clamp-2 mb-4">
          {course.description || "Manual prático operacional detalhando as parametrizações e o roteiro recomendado para o preenchimento de telas institucionais."}
        </p>
        <div className="mt-auto flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1"><Clock size={12} /><span>{course.duration}</span></div>
          <div className="flex items-center gap-1"><BarChart size={12} /><span>{course.difficulty}</span></div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => onOpenMedia('video')} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors border-0 cursor-pointer">
            <Play size={14} /> Abrir Aula
          </button>
          {course.pdfUrl && (
            <button onClick={() => downloadFile(course.pdfUrl!, `${course.title}.pdf`)} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors bg-transparent cursor-pointer">
              <Download size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const LoginView: React.FC<{ users: User[], onLogin: (data: Pick<User, 'email' | 'password'>) => void, onMicrosoftLogin: () => void }> = ({ onLogin, onMicrosoftLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/60">
        <div className="p-8 text-center bg-[#0F172A] text-white">
          <div className="h-12 w-12 rounded-xl bg-[#3B82F6] flex items-center justify-center mx-auto mb-3">
            <GraduationCap size={28} />
          </div>
          <h1 className="text-2xl font-bold">FapAcademy</h1>
          <p className="text-slate-400 text-xs mt-1">Capacitação Operacional Avançada</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin({ email, password }); }} className="p-8 space-y-5 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">E-mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="colaborador@fap.com.br" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Senha</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-3.5 rounded-xl transition-colors border-0 cursor-pointer">Acessar Painel</button>
          <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase">ou</span><div className="flex-grow border-t border-slate-200"></div></div>
          <button type="button" onClick={onMicrosoftLogin} className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 text-xs transition-all cursor-pointer">
            <div className="grid grid-cols-2 gap-[2px] w-3.5 h-3.5 shrink-0"><div className="w-[6px] h-[6px] bg-[#F25022]"></div><div className="w-[6px] h-[6px] bg-[#7FBA00]"></div><div className="w-[6px] h-[6px] bg-[#00A4EF]"></div><div className="w-[6px] h-[6px] bg-[#FFB900]"></div></div>
            Acesso Corporativo (Microsoft 365)
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Painel Admin Completo ---

const AdminView: React.FC<{ 
  users: User[], onAddUser: (user: User) => void, onDeleteUser: (id: string) => void, onUpdateUser: (user: User) => void,
  courses: Course[], onAddCourse: (course: Course) => void, onDeleteCourse: (id: string) => void, onUpdateCourse: (course: Course) => void,
  onSyncData: () => void, theme?: 'light' | 'dark'
}> = ({ users, onAddUser, onDeleteUser, onUpdateUser, courses, onAddCourse, onDeleteCourse, onUpdateCourse, onSyncData, theme = 'light' }) => {
  const [adminTab, setAdminTab] = useState<'users' | 'courses' | 'engagement'>('users');
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' as const });
  const [newCourse, setNewCourse] = useState<Omit<Course, 'id'>>({ 
    title: '', system: '7Edu', duration: '', difficulty: 'Iniciante', thumbnail: '', videoUrl: '', pdfUrl: '', description: '' 
  });
  const [isUploading, setIsUploading] = useState(false);

  const engagement = useMemo(() => {
    const progressDataStr = localStorage.getItem('fapacademy_progress');
    const completedArr: string[] = progressDataStr ? JSON.parse(progressDataStr) : [];
    
    let eduCount = 0;
    let totvsCount = 0;
    
    const chartData = courses.map((c, i) => {
      const isDone = completedArr.includes(c.id);
      const randomBase = (i % 3 === 0 ? 14 : i % 2 === 0 ? 9 : 5) + (isDone ? 1 : 0);
      if (c.system === '7Edu') eduCount += randomBase;
      else totvsCount += randomBase;
      return {
        name: c.title.substring(0, 20) + '...',
        "Conclusões": randomBase,
        Sistema: c.system
      };
    }).sort((a, b) => b["Conclusões"] - a["Conclusões"]).slice(0, 5);

    return { chartData, pieData: [{ name: '7Edu', value: eduCount, color: '#6366F1' }, { name: 'TOTVS', value: totvsCount, color: '#10B981' }] };
  }, [courses]);

  const handleFileUpload = async (file: File, type: 'video' | 'pdf') => {
    setIsUploading(true);
    const localId = `local-file-${Date.now()}-${file.name}`;
    try {
      await saveLocalFile(localId, file);
      const filePath = `courses/${type}s/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('videos-sistema').upload(filePath, file);
      
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('videos-sistema').getPublicUrl(filePath);
      
      if (type === 'video') setNewCourse(p => ({ ...p, videoUrl: publicUrl }));
      else setNewCourse(p => ({ ...p, pdfUrl: publicUrl }));
      alert("Arquivo carregado no Supabase com sucesso!");
    } catch (err: any) {
      console.warn("Upload falhou, aplicando fallback de IndexedDB:", err);
      if (type === 'video') setNewCourse(p => ({ ...p, videoUrl: localId }));
      else setNewCourse(p => ({ ...p, pdfUrl: localId }));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações Gerais</h1>
          <p className="text-slate-500 text-sm">Controle de acessos, relatórios técnicos e conteúdos.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onSyncData} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 cursor-pointer">Sincronizar</button>
          <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs border-0 cursor-pointer shadow-sm">
            {adminTab === 'users' ? 'Novo Usuário' : 'Nova Aula'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-6">
        {['users', 'courses', 'engagement'].map((t) => (
          <button key={t} onClick={() => setAdminTab(t as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer capitalize ${adminTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 bg-transparent'}`}>{t === 'users' ? 'Usuários' : t === 'courses' ? 'Aulas' : 'Engajamento'}</button>
        ))}
      </div>

      {adminTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr><th className="px-6 py-3">Nome</th><th className="px-6 py-3">E-mail</th><th className="px-6 py-3">Função</th><th className="px-6 py-3 text-right">Ação</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/40">
                  <td className="px-6 py-3.5 font-medium text-slate-900">{u.name}</td>
                  <td className="px-6 py-3.5 text-slate-500">{u.email}</td>
                  <td className="px-6 py-3.5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span></td>
                  <td className="px-6 py-3.5 text-right"><button onClick={() => onDeleteUser(u.id)} className="text-slate-400 hover:text-red-500 bg-transparent border-0 cursor-pointer"><X size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adminTab === 'courses' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr><th className="px-6 py-3">Roteiro / Procedimento</th><th className="px-6 py-3">Sistema</th><th className="px-6 py-3">Nível</th><th className="px-6 py-3 text-right">Ação</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {courses.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/40">
                  <td className="px-6 py-3.5 font-medium text-slate-900">{c.title}</td>
                  <td className="px-6 py-3.5"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">{c.system}</span></td>
                  <td className="px-6 py-3.5 text-slate-500">{c.difficulty}</td>
                  <td className="px-6 py-3.5 text-right"><button onClick={() => onDeleteCourse(c.id)} className="text-slate-400 hover:text-red-500 bg-transparent border-0 cursor-pointer"><X size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adminTab === 'engagement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-2xl h-80">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Aulas Populares (Top 5 Conclusões)</h4>
            <ResponsiveContainer width="100%" height="85%">
              <RechartsBarChart data={engagement.chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={110} style={{ fontSize: '10px' }} />
                <Tooltip />
                <Bar dataKey="Conclusões" fill="#3B82F6" barSize={12} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-5 border border-slate-200 rounded-2xl h-80 flex flex-col justify-between">
            <h4 className="text-sm font-bold text-slate-900">Lançamentos por Software</h4>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={engagement.pieData} innerRadius={40} outerRadius={60} dataKey="value" nameKey="name">
                    {engagement.pieData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#6366F1] rounded-full" /> 7Edu</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#10B981] rounded-full" /> TOTVS</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulários Administrativos */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
              <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer"><X size={20} /></button>
              <h3 className="text-lg font-bold text-slate-900 mb-4">{adminTab === 'users' ? 'Cadastrar Colaborador' : 'Cadastrar Vídeo Aula'}</h3>
              
              {adminTab === 'users' ? (
                <form onSubmit={(e) => { e.preventDefault(); onAddUser({ id: Math.random().toString(36).substr(2, 9), ...newUser }); setIsAdding(false); }} className="space-y-4">
                  <input type="text" placeholder="Nome Completo" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl outline-none" />
                  <input type="email" placeholder="E-mail" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl outline-none" />
                  <input type="password" placeholder="Senha Temporária" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-3 py-2.5 border rounded-xl outline-none" />
                  <button type="submit" className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs border-0 cursor-pointer">Registrar</button>
                </form>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); onAddCourse({ id: Math.random().toString(36).substr(2, 9), ...newCourse }); setIsAdding(false); }} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  <input type="text" placeholder="Título do Procedimento" required value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm" />
                  <textarea placeholder="Descrição curta da aula..." required value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm h-16 resize-none" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newCourse.system} onChange={e => setNewCourse({...newCourse, system: e.target.value as any})} className="border rounded-xl px-2 py-2 text-sm bg-white"><option value="7Edu">7Edu</option><option value="TOTVS">TOTVS</option></select>
                    <select value={newCourse.difficulty} onChange={e => setNewCourse({...newCourse, difficulty: e.target.value as any})} className="border rounded-xl px-2 py-2 text-sm bg-white"><option value="Iniciante">Iniciante</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option></select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Duração (Ex: 12 min)" value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: e.target.value})} className="border rounded-xl px-3 py-2 text-sm" />
                    <input type="text" placeholder="Link Imagem Capa" value={newCourse.thumbnail} onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})} className="border rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <div className="flex gap-1.5">
                      <input type="text" placeholder="URL do Vídeo" value={newCourse.videoUrl} onChange={e => setNewCourse({...newCourse, videoUrl: e.target.value})} className="flex-1 border rounded-xl px-3 py-2 text-xs" />
                      <label className="cursor-pointer px-3 py-2 bg-slate-100 rounded-xl text-xs flex items-center border border-slate-200 font-bold shrink-0">
                        {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                        <input type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'video')} />
                      </label>
                    </div>
                  </div>
                  <button type="submit" disabled={isUploading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs border-0 cursor-pointer mt-2">{isUploading ? "Aguardando arquivo..." : "Salvar Treinamento"}</button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Modal de Vídeos e Documentos Passo a Passo ---

const MediaModal: React.FC<{ 
  isOpen: boolean, type: 'video' | 'pdf' | null, course: Course | null, courses?: Course[], onSelectCourse?: (course: Course) => void,
  onClose: () => void, onPrev?: () => void, onNext?: () => void, isCompleted?: boolean, onToggleComplete?: (id: string) => void
}> = ({ isOpen, type, course, courses = [], onSelectCourse, onClose, onPrev, onNext, isCompleted, onToggleComplete }) => {
  const [currentTab, setCurrentTab] = useState<'video' | 'pdf'>('video');
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => { if (isOpen && type) setCurrentTab(type); }, [isOpen, type]);

  if (!isOpen || !course) return null;

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    let p = url.trim();
    if (p.includes('youtube.com/watch?v=')) return p.replace('watch?v=', 'embed/');
    if (p.includes('youtu.be/')) return p.replace('youtu.be/', 'youtube.com/embed/');
    if (p.includes('drive.google.com/file/d/')) {
      const id = p.split('/file/d/')[1]?.split('/')[0];
      return `https://drive.google.com/file/d/${id}/preview`;
    }
    if (p.includes('sharepoint.com') && !p.includes('action=embedview')) {
      p += p.includes('?') ? '&action=embedview' : '?action=embedview';
    }
    return p;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh] shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 text-left">
          <div>
            <h3 className="text-base font-black text-slate-900 truncate leading-tight">{course.title}</h3>
            <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest mt-0.5">{course.system} Trilha</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 bg-transparent border-0 cursor-pointer"><X size={20} /></button>
        </div>

        {course.videoUrl && course.pdfUrl && (
          <div className="flex bg-slate-50 border-b border-slate-100 p-1 gap-1 shrink-0">
            <button onClick={() => setCurrentTab('video')} className={`flex-1 py-2 text-xs font-bold rounded-lg border-0 cursor-pointer ${currentTab === 'video' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 bg-transparent'}`}>Vídeo Aula</button>
            <button onClick={() => setCurrentTab('pdf')} className={`flex-1 py-2 text-xs font-bold rounded-lg border-0 cursor-pointer ${currentTab === 'pdf' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 bg-transparent'}`}>Material PDF</button>
          </div>
        )}

        <div className="flex-1 overflow-hidden bg-slate-900 relative">
          {currentTab === 'video' && course.videoUrl ? (
            <iframe src={getEmbedUrl(course.videoUrl)} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowFullScreen title="Player"></iframe>
          ) : (
            <iframe src={course.pdfUrl} className="w-full h-full border-0 bg-white" title="Documento"></iframe>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0 text-left">
          <div className="flex gap-2">
            <button onClick={onPrev} disabled={!onPrev} className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-600 disabled:opacity-40 cursor-pointer"><ChevronLeft size={14} className="inline mr-1" />Anterior</button>
            <button onClick={onNext} disabled={!onNext} className="px-3 py-2 text-xs font-bold bg-[#3B82F6] text-white rounded-xl border-0 disabled:opacity-40 cursor-pointer">Próxima<ChevronRight size={14} className="inline ml-1" /></button>
          </div>

          <button 
            onClick={() => onToggleComplete?.(course.id)} 
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-600 text-white border-0 hover:bg-emerald-700'}`}
          >
            {isCompleted ? '✓ Concluído' : 'Marcar como Concluído'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
