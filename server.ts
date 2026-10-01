import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// Server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Multi-turn Gemini Chat API route for Risk Officer & Trading Advisor
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Nenhuma mensagem fornecida' });
    }

    // Model selection: gemini-3.5-flash for general multi-turn tasks
    const model = 'gemini-3.5-flash';

    // Format messages for @google/genai SDK
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }],
    }));

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction:
          systemInstruction ||
          `Você é o "QuantAI Risk Copilot", Engenheiro Quantitativo Sênior e Chief Risk Officer (CRO) de uma mesa proprietária de trading algorítmico operando MetaTrader 5 (B3: WIN, WDO) e Binance Futures (BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT, XRPUSDT).
Seu objetivo é orientar o trader sobre:
- Gestão de Risco Quantitativo (Drawdown Máximo, VaR - Value at Risk, Volatilidade ATR);
- Dimensionamento de Posições (Critério de Kelly fracionário, margem e alavancagem);
- Monitoramento de Exposição Total da Carteira (limites de perda diária, travas de segurança);
- Otimização de parâmetros de IA (limiar de confiança, Stop Loss e Take Profit);
- Interpretação de métricas de performance (Sharpe Ratio, Profit Factor, Expectativa Matemática).
Responda de forma profissional, direta, analítica e em Português do Brasil com dados práticos e matematicamente fundamentados.`,
        temperature: 0.6,
      },
    });

    const reply = response.text || 'Sem resposta do modelo.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('[Gemini API Server Error]:', error);
    return res.status(500).json({
      error: error?.message || 'Falha ao processar mensagem com a API Gemini',
    });
  }
});

// Outgoing Webhook Test Dispatch Proxy (for Discord, Slack, TradingView, n8n, etc.)
app.post('/api/webhook/test', async (req, res) => {
  try {
    const { url, payload, secretToken } = req.body;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({
        success: false,
        error: 'URL do webhook inválida. Deve iniciar com http:// ou https://',
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'QuantAI-MT5-Bot/2.4',
    };

    if (secretToken && typeof secretToken === 'string' && secretToken.trim().length > 0) {
      headers['X-Webhook-Secret'] = secretToken.trim();
      headers['Authorization'] = `Bearer ${secretToken.trim()}`;
    }

    const startTime = Date.now();
    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload || { event: 'TEST_TRIGGER', message: 'QuantAI Webhook Test' }),
    });

    const elapsedMs = Date.now() - startTime;
    const responseText = await fetchResponse.text().catch(() => '');

    return res.json({
      success: fetchResponse.ok,
      statusCode: fetchResponse.status,
      statusText: fetchResponse.statusText,
      elapsedMs,
      responsePreview: responseText.slice(0, 300) || `HTTP ${fetchResponse.status} ${fetchResponse.statusText}`,
    });
  } catch (err: any) {
    console.error('[Webhook Dispatch Error]:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Falha ao conectar com o endpoint de destino do webhook',
    });
  }
});

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(port, '0.0.0.0', () => {
    console.log(`QuantAI full-stack server running on http://localhost:${port}`);
  });
}

startServer();
