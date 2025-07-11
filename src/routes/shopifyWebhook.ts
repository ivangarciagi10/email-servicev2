import { Router, Request, Response } from 'express';
import { EmailService } from '../services/emailService';
import { ShopifyService } from '../services/shopifyService';
import { DraftOrder } from '../types/shopify';
import { validateDraftOrder } from '../utils/validation';

const router = Router();
const emailService = new EmailService();
const shopifyService = new ShopifyService();

// Set para rastrear draft orders procesados (en memoria)
const processedDraftOrders = new Set<string>();

// Map para rastrear intentos de procesamiento con timestamps
const processingAttempts = new Map<string, { attempts: number; lastAttempt: number }>();

// Función para limpiar el Set cada hora (prevenir memory leaks)
setInterval(() => {
  processedDraftOrders.clear();
  processingAttempts.clear();
  console.log('🧹 Limpieza de cache de draft orders procesados');
}, 60 * 60 * 1000); // Cada hora

// Función para validar headers de Shopify
function validateShopifyHeaders(req: Request): boolean {
  const shopifyHeaders = [
    'x-shopify-shop-domain',
    'x-shopify-hmac-sha256',
    'x-shopify-topic',
    'x-shopify-webhook-id'
  ];
  
  const missingHeaders = shopifyHeaders.filter(header => !req.headers[header]);
  
  if (missingHeaders.length > 0) {
    console.log('⚠️ Headers de Shopify faltantes:', missingHeaders);
    return false;
  }
  
  return true;
}

// POST /api/webhook/shopify
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📥 Webhook recibido de Shopify');
    
    // Validar headers de Shopify
    if (!validateShopifyHeaders(req)) {
      console.error('❌ Headers de Shopify inválidos o faltantes');
      return res.status(400).json({
        error: 'Headers de Shopify inválidos',
        message: 'El webhook no contiene los headers requeridos de Shopify'
      });
    }

    // Log de headers importantes para debugging
    console.log('🔍 Headers de Shopify:');
    console.log('  - Shop Domain:', req.headers['x-shopify-shop-domain']);
    console.log('  - Topic:', req.headers['x-shopify-topic']);
    console.log('  - Webhook ID:', req.headers['x-shopify-webhook-id']);
    console.log('  - User Agent:', req.headers['user-agent']);
    
    // Verificar que es un draft order válido
    const draftOrder = req.body as DraftOrder;
    
    if (!validateDraftOrder(draftOrder)) {
      console.error('❌ Datos de draft order inválidos');
      return res.status(400).json({
        error: 'Datos de draft order inválidos',
        message: 'El payload no contiene la estructura esperada'
      });
    }

    const draftOrderId = draftOrder.id.toString();
    const webhookId = req.headers['x-shopify-webhook-id'] as string;
    
    // Verificar si ya fue procesado exitosamente
    if (processedDraftOrders.has(draftOrderId)) {
      console.log(`⚠️ Draft order ${draftOrderId} ya fue procesado exitosamente, ignorando...`);
      console.log(`📋 Webhook ID: ${webhookId}`);
      return res.status(200).json({
        success: true,
        message: 'Draft order ya procesado anteriormente',
        draftOrderId: draftOrder.id,
        webhookId: webhookId
      });
    }

    // Verificar intentos de procesamiento
    const attemptInfo = processingAttempts.get(draftOrderId);
    const currentTime = Date.now();
    const maxAttempts = 3;
    const retryWindow = 5 * 60 * 1000; // 5 minutos

    if (attemptInfo) {
      if (attemptInfo.attempts >= maxAttempts) {
        console.log(`❌ Draft order ${draftOrderId} excedió el máximo de intentos (${maxAttempts})`);
        console.log(`📋 Webhook ID: ${webhookId}`);
        return res.status(429).json({
          error: 'Demasiados intentos',
          message: 'Se excedió el límite de intentos para este draft order',
          draftOrderId: draftOrder.id,
          webhookId: webhookId
        });
      }

      if (currentTime - attemptInfo.lastAttempt < retryWindow) {
        console.log(`⏳ Draft order ${draftOrderId} en ventana de reintento, permitiendo...`);
        console.log(`📋 Webhook ID: ${webhookId}, Intento: ${attemptInfo.attempts + 1}`);
      }
    }

    console.log(`✅ Draft order válido recibido: ${draftOrder.id}`);
    console.log(`📋 Webhook ID: ${webhookId}`);

    // Actualizar intentos de procesamiento
    const newAttempts = (attemptInfo?.attempts || 0) + 1;
    processingAttempts.set(draftOrderId, {
      attempts: newAttempts,
      lastAttempt: currentTime
    });

    console.log(`📝 Draft order ${draftOrderId} - Intento ${newAttempts} de ${maxAttempts}`);

    // Procesar el draft order
    await processDraftOrder(draftOrder);

    // Marcar como procesado exitosamente SOLO si no hubo errores
    processedDraftOrders.add(draftOrderId);
    console.log(`✅ Draft order ${draftOrderId} marcado como procesado exitosamente`);

    console.log('✅ Webhook procesado exitosamente');
    return res.status(200).json({
      success: true,
      message: 'Webhook procesado correctamente',
      draftOrderId: draftOrder.id,
      webhookId: webhookId,
      attempts: newAttempts
    });

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error procesando el webhook'
    });
  }
});

// Función para procesar el draft order
async function processDraftOrder(draftOrder: DraftOrder) {
  try {
    console.log('🔄 Procesando draft order...');

    // Obtener el cliente de Shopify usando el email del draft order
    const customerEmail = draftOrder.email;
    let customer = draftOrder.customer;

    if (!customer && customerEmail) {
      // Si no viene el cliente en el payload, buscarlo por email
      console.log(`🔍 Buscando cliente por email: ${customerEmail}`);
      // Aquí necesitarías implementar un método para buscar por email
      // Por ahora usamos datos del payload
      customer = {
        id: 0,
        email: customerEmail,
        first_name: 'Cliente',
        last_name: 'Shopify',
        verified_email: true,
        created_at: draftOrder.created_at,
        updated_at: draftOrder.updated_at,
        tags: '',
        total_spent: '0.00',
        orders_count: 0,
        state: 'enabled',
        addresses: [],
        accepts_marketing: false,
        accepts_marketing_updated_at: draftOrder.created_at,
        tax_exempt: false,
        currency: draftOrder.currency,
        admin_graphql_api_id: ''
      };
    }

    if (!customer) {
      console.error('❌ No se pudo obtener información del cliente');
      throw new Error('Cliente no encontrado');
    }

    console.log(`👤 Cliente encontrado: ${customer.first_name} ${customer.last_name}`);
    console.log(`📧 Email del cliente: ${customer.email}`);

    // Obtener el asesor del cliente desde los metafields
    console.log(`🔍 Buscando asesor para cliente ID: ${customer.id}`);
    const advisor = await shopifyService.getCustomerAdvisor(customer.id);

    if (!advisor) {
      console.error('❌ No se encontró asesor para este cliente');
      throw new Error('Asesor no encontrado');
    }

    console.log(`👨‍💼 Asesor encontrado: ${advisor.first_name} ${advisor.last_name}`);
    console.log(`📧 Email del asesor: ${advisor.email}`);

    // Enviar correo al cliente
    console.log('📧 Enviando correo al cliente...');
    await emailService.sendCustomerConfirmationEmail(
      customer.email,
      draftOrder,
      customer
    );

    // Enviar correo al asesor
    console.log('📧 Enviando correo al asesor...');
    await emailService.sendAdvisorNotificationEmail(
      advisor.email,
      draftOrder,
      customer,
      advisor
    );

    console.log('✅ Correos enviados exitosamente');
  } catch (error) {
    console.error('❌ Error procesando draft order:', error);
    throw error;
  }
}

export { router as shopifyWebhookRouter }; 