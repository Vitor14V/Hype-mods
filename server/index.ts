import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

  const server = await registerRoutes(app);
  log("Routes registered successfully");

  app.use((err: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("Server error:", err);
  });

  // Try different ports starting from 5000
  const tryPort = async (port: number): Promise<void> => {
    try {
      log(`Attempting to bind on port ${port}`);
      await new Promise<void>((resolve, reject) => {
        const onError = (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            log(`Port ${port} is in use, trying next port`);
            reject(err);
          } else {
            console.error('Server error:', err);
            process.exit(1);
          }
        };

        server.once('error', onError);

        server.listen({
          port,
          host: "0.0.0.0",
          reusePort: true,
        }, () => {
          server.removeListener('error', onError);
          log(`Successfully bound to port ${port}`);
          resolve();
        });
      });

      // Only setup Vite after successful port binding
      if (app.get("env") === "development") {
        log("Setting up Vite middleware...");
        await setupVite(app, server);
        log("Vite middleware setup complete");
      } else {
        log("Setting up static file serving...");
        serveStatic(app);
        log("Static file serving setup complete");
      }

    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'EADDRINUSE') {
        if (port < 5010) { // Try up to port 5010
          await tryPort(port + 1);
        } else {
          console.error('No available ports found between 5000-5010');
          process.exit(1);
        }
      } else {
        throw err;
      }
    }
  };

  log("Starting port binding process...");
  await tryPort(5000);
})();