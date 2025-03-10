import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from 'fs';
import path from 'path';
import worker from './worker';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Em produção, servir os arquivos estáticos do frontend
if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.join(process.cwd(), 'client', 'dist');
  app.use(express.static(clientDistPath));
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  log("Starting server initialization...");

  // Verificar se a pasta de uploads existe, se não criar
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created successfully');
  }

  // Iniciar o worker de keep-alive
  worker.start();

  const server = await registerRoutes(app);
  log("Routes registered successfully");

  app.use((err: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("Server error:", err);
  });

  // Em produção, todas as rotas não encontradas retornam o index.html
  if (process.env.NODE_ENV === "production") {
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(process.cwd(), 'client', 'dist', 'index.html'));
      }
    });
  }

  const PORT = process.env.PORT || 3000;

  try {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is running on port ${PORT}`);

      if (process.env.NODE_ENV !== "production") {
        console.log("Setting up Vite middleware...");
        setupVite(app, server).then(() => {
          console.log("Vite middleware setup complete");
        });
      } else {
        console.log("Running in production mode");
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();