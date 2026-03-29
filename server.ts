import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    resend = new Resend(key);
  }
  return resend;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/send-invitation", async (req, res) => {
    const { email, displayName, role } = req.body;

    if (!email || !displayName) {
      return res.status(400).json({ error: "Email and display name are required" });
    }

    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set. Skipping email sending.");
        return res.json({ success: true, message: "Email simulation successful (API key not set)" });
      }

      const resendClient = getResend();
      const { data, error } = await resendClient.emails.send({
        from: "Clinica <onboarding@resend.dev>",
        to: [email],
        subject: "Bem-vindo à Clínica - Seu acesso foi preparado!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #059669;">Olá, ${displayName}!</h2>
            <p>Você foi convidado para fazer parte da equipe da Clínica como <strong>${role === 'admin' ? 'Administrador' : 'Membro'}</strong>.</p>
            <p>Seu acesso já foi pré-configurado com suas permissões e dados pessoais.</p>
            <p>Para começar, basta se cadastrar em nosso aplicativo usando o e-mail: <strong>${email}</strong>.</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.APP_URL || 'https://ais-dev-rvkxfjhrauvlghdvtah2pf-576581692521.us-east1.run.app'}" 
                 style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Acessar Aplicativo
              </a>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Se você não esperava este convite, por favor desconsidere este e-mail.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (err: any) {
      console.error("Server error sending email:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
