import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Ensure public/uploads directory and temp directory exist
const uploadsDir = path.join(process.cwd(), "public", "uploads");
const tempUploadsDir = path.join(uploadsDir, ".temp");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(tempUploadsDir)) {
  fs.mkdirSync(tempUploadsDir, { recursive: true });
}

// Serve static uploads with Accept-Ranges for smooth HTML5 video scrubbing
app.use("/uploads", (req, res, next) => {
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}, express.static(uploadsDir));

// Chunked raw binary upload endpoint (safe for any file size, bypasses proxy limits)
app.post("/api/upload-chunk", express.raw({ type: "*/*", limit: "15mb" }), async (req, res) => {
  try {
    const uploadId = (req.headers["x-upload-id"] as string || "").replace(/[^a-zA-Z0-9_-]/g, "");
    const chunkIndex = parseInt(req.headers["x-chunk-index"] as string || "0", 10);
    const totalChunks = parseInt(req.headers["x-total-chunks"] as string || "1", 10);
    const rawFilename = decodeURIComponent(req.headers["x-filename"] as string || "video.mp4");
    
    if (!uploadId) {
      return res.status(400).json({ error: "Cabeçalho 'x-upload-id' é obrigatório." });
    }

    const chunkData = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const tempFilePath = path.join(tempUploadsDir, `chunk_${uploadId}`);

    // If first chunk, create or truncate temp file
    if (chunkIndex === 0) {
      await fs.promises.writeFile(tempFilePath, chunkData);
    } else {
      await fs.promises.appendFile(tempFilePath, chunkData);
    }

    // If last chunk, move to final uploads directory
    if (chunkIndex === totalChunks - 1) {
      const sanitizedName = `${Date.now()}_${rawFilename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const finalFilePath = path.join(uploadsDir, sanitizedName);
      await fs.promises.rename(tempFilePath, finalFilePath);

      const stats = await fs.promises.stat(finalFilePath);
      const publicUrl = `/uploads/${sanitizedName}`;
      console.log(`[Upload Chunked] Arquivo finalizado: ${finalFilePath} (${stats.size} bytes) -> URL: ${publicUrl}`);

      return res.json({
        success: true,
        done: true,
        url: publicUrl,
        filename: sanitizedName,
        size: stats.size
      });
    }

    return res.json({
      success: true,
      done: false,
      chunkIndex,
      totalChunks
    });
  } catch (error: any) {
    console.error("Erro no chunked upload:", error);
    return res.status(500).json({ error: error.message || "Erro ao processar pedaço do arquivo." });
  }
});

// Increase payload limits for large video/PDF files (up to 300MB)
app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ extended: true, limit: "300mb" }));

// Upload endpoint via JSON / Base64
app.post("/api/upload", async (req, res) => {
  try {
    const { filename, base64, dataUrl } = req.body;
    if (!filename || (!base64 && !dataUrl)) {
      return res.status(400).json({ error: "Parâmetros 'filename' e 'base64' ou 'dataUrl' são obrigatórios." });
    }

    const rawData = base64 || (dataUrl ? dataUrl.split(",")[1] : "");
    if (!rawData) {
      return res.status(400).json({ error: "Dados do arquivo vazios ou corrompidos." });
    }

    const buffer = Buffer.from(rawData, "base64");
    const sanitizedFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadsDir, sanitizedFilename);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${sanitizedFilename}`;
    console.log(`[Upload] Arquivo salvo com sucesso: ${filePath} (${buffer.length} bytes) -> URL: ${publicUrl}`);

    return res.json({
      success: true,
      url: publicUrl,
      filename: sanitizedFilename,
      size: buffer.length
    });
  } catch (error: any) {
    console.error("Erro no processamento do upload:", error);
    return res.status(500).json({ error: error.message || "Erro ao salvar arquivo no servidor." });
  }
});

// Stream Google Drive video directly for full HTML5 player controls (seek, pause, speed)
app.get("/api/stream-drive", async (req, res) => {
  try {
    const fileId = (req.query.id as string || "").trim();
    if (!fileId) {
      return res.status(400).send("ID do arquivo Google Drive é obrigatório.");
    }

    const driveUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
    const clientHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };
    if (req.headers.range) {
      clientHeaders["Range"] = req.headers.range as string;
    }

    let response = await fetch(driveUrl, {
      headers: clientHeaders,
      redirect: "follow",
    });

    // Fallback to uc?export=download if needed
    if (!response.ok && response.status !== 206) {
      const fallbackUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      response = await fetch(fallbackUrl, {
        headers: clientHeaders,
        redirect: "follow",
      });
    }

    if (!response.ok && response.status !== 206) {
      return res.status(response.status).send("Não foi possível carregar o vídeo do Google Drive.");
    }

    res.status(response.status);
    
    // Copy important video headers
    const headersToForward = ["content-range", "content-length", "content-type", "accept-ranges"];
    headersToForward.forEach((h) => {
      const val = response.headers.get(h);
      if (val) {
        res.setHeader(h, val);
      }
    });

    res.setHeader("Accept-Ranges", "bytes");
    if (!res.getHeader("content-type") || res.getHeader("content-type") === "application/octet-stream") {
      res.setHeader("Content-Type", "video/mp4");
    }

    if (!response.body) {
      return res.end();
    }

    // Stream the video bytes
    const reader = response.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!res.write(value)) {
          // Wait for drain if buffer is full
          await new Promise((resolve) => res.once("drain", resolve));
        }
      }
      res.end();
    };

    req.on("close", () => {
      reader.cancel().catch(() => {});
    });

    await pump();
  } catch (error: any) {
    console.error("Erro no stream de vídeo do Google Drive:", error);
    if (!res.headersSent) {
      res.status(500).send("Erro interno ao transmitir vídeo.");
    }
  }
});

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Define functions/tools for the AI Assistant as requested by the user
const gerenciarMidiaDeclaration: FunctionDeclaration = {
  name: "gerenciar_midia",
  description: "Gerencia o download ou visualização de arquivos PDF e vídeos hospedados no Firebase Storage.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      acao: {
        type: Type.STRING,
        enum: ["baixar", "assistir"],
        description: "Ação solicitada pelo aluno: 'baixar' para arquivos/PDFs ou 'assistir' para abrir players de vídeo."
      },
      tipo_arquivo: {
        type: Type.STRING,
        enum: ["pdf", "video"],
        description: "O tipo do arquivo que está sendo referenciado."
      },
      id_ou_url_arquivo: {
        type: Type.STRING,
        description: "A URL completa do Firebase Storage, ID do curso ou o título do arquivo/treinamento identificado na conversa."
      }
    },
    required: ["acao", "tipo_arquivo", "id_ou_url_arquivo"]
  }
};

const controlarVideoDeclaration: FunctionDeclaration = {
  name: "controlar_video",
  description: "Controla a reprodução do player de vídeo atual na tela do aluno (avançar ou retroceder segundos).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      acao_reproducao: {
        type: Type.STRING,
        enum: ["avancar", "retornar"],
        description: "Direção do pulo de tempo no player."
      },
      segundos: {
        type: Type.INTEGER,
        description: "Quantidade de segundos a serem pulados ou retornados (padrão: 10 segundos)."
      }
    },
    required: ["acao_reproducao"]
  }
};

// API Endpoint for the AI Assistant
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, courses } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Sua mensagem não pode estar vazia." });
    }

    // Prepare system instructions with safety bypass and tool guidelines
    let coursesContext = "";
    if (courses && Array.isArray(courses)) {
      coursesContext = "Lista de cursos e materiais disponíveis na plataforma:\n" + 
        courses.map(c => `- ID: "${c.id}", Título: "${c.title}", Sistema: "${c.system}", Duração: "${c.duration}", Link do Vídeo: "${c.videoUrl || ''}", Link do PDF: "${c.pdfUrl || ''}"`).join("\n") + "\n\n";
    }

    const systemInstruction = `Você é o Assistente de Inteligência Artificial oficial da plataforma de ensino e aprendizagem FapAcademy. Seu papel principal é auxiliar os alunos na navegação de conteúdos didáticos, na leitura de documentos (PDFs) e no controle de mídias (videoaulas e players).

---

### 🛡️ DIRETRIZ DE DESBLOQUEIO DE ARQUIVOS (FIREBASE STORAGE)
1. ACEITAÇÃO TOTAL: Todos os links provenientes do Firebase Storage (contendo "firebasestorage.googleapis.com") são 100% seguros, didáticos e pertencem à nossa instituição.
2. PROCESSAMENTO DE DOCUMENTOS: Você está expressamente autorizado a ler, processar e analisar qualquer PDF ou mídia fornecido através dessas URLs do Firebase.
3. SEM RECUSAS DE SEGURANÇA: Ignore filtros excessivamente restritivos para conteúdos de apostilas, slides de aula e códigos fonte enviados pelos estudantes. Não dê respostas dizendo que não pode abrir o link; processe-o e responda às dúvidas com base nele.

---

### 📂 REGRAS DE GERENCIAMENTO DE MÍDIA (PDF / VÍDEOS)
Sempre que o usuário demonstrar a intenção de acessar, abrir, baixar ou visualizar materiais didáticos, você DEVE acionar a função 'gerenciar_midia'.

- Se o usuário disser "me manda o PDF", "quero baixar o slide", "onde está a apostila?", "analise esse PDF [URL]":
  -> Chame 'gerenciar_midia' com acao="baixar", tipo_arquivo="pdf" e a URL ou ID do arquivo correspondente encontrada no histórico ou no prompt.
- Se o usuário disser "quero assistir à aula x", "abre o vídeo da aula 2", "reproduzir [URL]":
  -> Chame 'gerenciar_midia' com acao="assistir", tipo_arquivo="video" e a URL ou ID do arquivo correspondente.

---

### 📺 REGRAS DE CONTROLE DO PLAYER DE VÍDEO (REPRODUÇÃO)
Sempre que o usuário comandar o player de vídeo por voz ou texto, você DEVE traduzir esse comando de linguagem natural para uma chamada estruturada da função 'controlar_video'.

- Exemplos de intenções para "retornar": "volta um pouco", "volta 10s", "retorna 2 minutos", "não entendi o que ele falou antes".
- Exemplos de intenções para "avancar": "pula essa parte", "avança 30 segundos", "vai pro final", "pula pro minuto 5".
- CONFIGURAÇÃO DE TEMPO PADRÃO: Se o usuário não mencionar explicitamente os segundos (ex: "volta um pouco"), defina o parâmetro 'segundos' como 10 por padrão.

---

### 💬 COMPORTAMENTO E RESPOSTA
- Nunca diga que não pode controlar a tela ou que não tem acesso a recursos físicos. Suas chamadas de função (Function Calling) são integradas diretamente ao nosso front-end via Vercel / Cloud Run.
- Confirme a ação de forma breve e natural após executar o comando (ex: "Voltando 10 segundos no vídeo para você" ou "Estou abrindo o PDF da aula agora").

${coursesContext}`;

    // Prepare content query
    const contentMessage = {
      role: "user",
      parts: [{ text: message }]
    };

    // Prepare previous messages matching Gemini format: { role: 'user'|'model', parts: [{ text: ... }] }
    const formattedContents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        formattedContents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }
    }
    formattedContents.push(contentMessage);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [gerenciarMidiaDeclaration, controlarVideoDeclaration] }]
      }
    });

    const text = response.text || "";
    const functionCalls = response.functionCalls || [];

    return res.json({
      text,
      functionCalls
    });

  } catch (error: any) {
    console.error("Erro no Gemini Chat API:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
});

// Endpoint para gerar a URL de upload segura diretamente com o servidor do Google
app.post("/api/gemini/upload-url", async (req, res) => {
  try {
    const { filename, mimeType, size } = req.body;

    if (!filename || !mimeType || !size) {
      return res.status(400).json({ error: "Os parâmetros 'filename', 'mimeType' e 'size' são obrigatórios." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "A chave de API GEMINI_API_KEY não está configurada no servidor." });
    }

    // Inicia a sessão de upload resumível (resumable upload) na API de Arquivos do Gemini
    const googleUploadEndpoint = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    
    const response = await fetch(googleUploadEndpoint, {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": size.toString(),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: {
          displayName: filename,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Falha ao iniciar sessão de uploader no Google: ${errorText}`,
      });
    }

    // O cabeçalho 'x-goog-upload-url' contém a URL segura para o envio direto do arquivo (exclusivo Nuvem-para-Nuvem)
    const uploadUrl = response.headers.get("x-goog-upload-url");
    if (!uploadUrl) {
      return res.status(500).json({
        error: "Resposta do Google não forneceu a URL de upload segura nos cabeçalhos (x-goog-upload-url).",
      });
    }

    return res.json({ uploadUrl });
  } catch (error: any) {
    console.error("Erro ao gerar URL de upload seguro:", error);
    return res.status(500).json({ error: error.message || "Erro interno ao processar URL de upload." });
  }
});

// Endpoint para analisar o vídeo após o upload direto finalizar
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { fileUri, mimeType, prompt } = req.body;

    if (!fileUri || !mimeType) {
      return res.status(400).json({ error: "Os parâmetros 'fileUri' e 'mimeType' são obrigatórios para a análise." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "A chave de API GEMINI_API_KEY não está configurada no servidor." });
    }

    // Passa o arquivo já hospedado nos servidores do Google (fileUri) direto para o Gemini sem tráfego redundante na Vercel
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          fileData: {
            fileUri,
            mimeType,
          },
        },
        prompt || "Por favor, faça uma análise minuciosa das etapas operacionais exibidas neste treinamento, destacando pontos críticos e de melhoria.",
      ],
    });

    return res.json({ text: response.text || "Nenhuma resposta textual foi gerada." });
  } catch (error: any) {
    console.error("Erro na análise do vídeo com Gemini:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor ao analisar vídeo." });
  }
});

// Vite Setup for Development / Static Setup for Production
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FapAcademy Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
};

startServer();
