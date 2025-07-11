import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { shopifyWebhookRouter } from './routes/shopifyWebhook';
import { healthRouter } from './routes/health';

// Cargar variables de entorno desde el archivo .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Debug: Verificar que las variables se cargaron
console.log('🔧 Variables de entorno cargadas:');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Configurada' : 'No configurada');
console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'No configurado');
console.log('PORT:', process.env.PORT || '3000 (default)');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/webhook/shopify', shopifyWebhookRouter);
app.use('/health', healthRouter);

// Ruta raíz
app.get('/', (_req, res) => {
  res.json({
    message: 'Servicio de Correos Electrónicos - GNP',
    version: '1.0.0',
    endpoints: {
      webhook: '/api/webhook/shopify',
      health: '/health'
    }
  });
});

// Manejo de errores global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`📧 Servicio de correos electrónicos listo`);
  console.log(`🔗 Webhook disponible en: http://localhost:${PORT}/api/webhook/shopify`);
  console.log(`🏥 Health check en: http://localhost:${PORT}/health`);
});

export default app; 