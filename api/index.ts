import express from 'express';
import { registerRoutes } from '../server/routes';

const app = express();
app.use(express.json());

// Registrar rotas
registerRoutes(app);

// Exportar o handler para o Vercel
export default app;
