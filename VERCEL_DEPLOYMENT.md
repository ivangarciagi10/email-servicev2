# Despliegue en Vercel

## Pasos para desplegar en Vercel:

### 1. Instalar Vercel CLI (opcional)
```bash
npm i -g vercel
```

### 2. Conectar con GitHub
1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Haz clic en "New Project"
4. Importa tu repositorio `email-servicev2`

### 3. Configurar Variables de Entorno
En el dashboard de Vercel, ve a:
- Tu proyecto > Settings > Environment Variables

Agrega estas variables:
```
SHOPIFY_SHOP_DOMAIN=api-gnp
SHOPIFY_ACCESS_TOKEN=tu_token_de_shopify
SENDGRID_API_KEY=tu_api_key_de_sendgrid
FROM_EMAIL=noreply@em949.generandoideas.com
FROM_NAME=GNP
```

### 4. Desplegar
Vercel detectará automáticamente que es un proyecto Node.js y lo desplegará.

### 5. Obtener la URL
Después del despliegue, Vercel te dará una URL como:
```
https://email-servicev2-xxxxx.vercel.app
```

### 6. Configurar Webhook en Shopify
1. Ve a tu panel de Shopify
2. Apps > Desarrollar apps
3. En tu app, ve a Webhooks
4. Crea un nuevo webhook:
   - **Evento**: `draft_orders/create`
   - **URL**: `https://tu-app.vercel.app/api/webhook/shopify`
   - **Formato**: JSON

## Endpoints disponibles:
- `GET /` - Información del servicio
- `GET /health` - Health check
- `POST /api/webhook/shopify` - Webhook de Shopify

## Monitoreo:
- Ve a tu proyecto en Vercel > Functions para ver los logs
- Cada función tiene su propia página de logs 