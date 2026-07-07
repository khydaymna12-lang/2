import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {GoogleGenAI} from '@google/genai';

const geminiProxyPlugin = () => ({
  name: 'gemini-proxy',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url === '/api/ai-evaluation' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
          try {
            const { essay, speakingAudioUrl } = JSON.parse(body);
            
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not configured in the developer secrets.' }));
              return;
            }

            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: {
                headers: { 'User-Agent': 'aistudio-build' }
              }
            });

            const prompt = `You are an expert Cambridge ESOL examiner grading an English Placement Test submission.
Evaluate the candidate's Essay response.
Writing Essay Answer: "${essay || ''}"

Also evaluate their Speaking response (the candidate submitted a speaking task audio: "${speakingAudioUrl || ''}").

Your output MUST be a strict JSON object matching this schema exactly:
{
  "writing": {
    "taskAchievement": { "score": number, "maxScore": 9, "feedback": "string" },
    "coherence": { "score": number, "maxScore": 9, "feedback": "string" },
    "vocabulary": { "score": number, "maxScore": 9, "feedback": "string" },
    "grammar": { "score": number, "maxScore": 9, "feedback": "string" },
    "feedback": "string summary of essay quality",
    "modelAnswer": "string (exemplary 150-word model essay addressing the prompt)",
    "cefrLevel": "string (A1, A2, B1, B2, C1, C2)"
  },
  "speaking": {
    "pronunciation": { "score": number, "maxScore": 9, "feedback": "string" },
    "fluency": { "score": number, "maxScore": 9, "feedback": "string" },
    "vocabulary": { "score": number, "maxScore": 9, "feedback": "string" },
    "grammar": { "score": number, "maxScore": 9, "feedback": "string" },
    "transcript": "string (reconstructed or simulated transcript representing speaking topic)",
    "feedback": "string summary of speaking skills",
    "cefrLevel": "string (A1, A2, B1, B2, C1, C2)"
  },
  "overallCEFR": "string (A1, A2, B1, B2, C1, C2)"
}

Give helpful, encouraging, and highly specific grammatical feedback. Make sure to return only valid raw JSON.`;

            const response = await ai.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
              }
            });

            const jsonText = response.text || '{}';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(jsonText);
          } catch (err: any) {
            console.error("Gemini API error:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message || 'Internal grading error' }));
          }
        });
      } else {
        next();
      }
    });
  }
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), geminiProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
