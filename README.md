# Servicio de Correos Electrónicos - Express API

Este proyecto implementa un servicio de correos electrónicos usando Express.js y SendGrid que detecta cuando se crea una cotización (Draft Order) en Shopify y envía correos automáticos tanto al cliente como al asesor asociado.

## Características

- ✅ **Express.js API** - Servidor REST robusto
- ✅ **TypeScript** - Tipado estático completo
- ✅ **Integración con Shopify API** - Webhooks para Draft Orders
- ✅ **Envío de correos con SendGrid** - API REST de SendGrid
- ✅ **Detección automática de asesores** - A través de metafields de Shopify
- ✅ **Plantillas de correo HTML** - Diseños profesionales y responsivos
- ✅ **GitHub Actions** - CI/CD automatizado
- ✅ **Docker** - Containerización completa
- ✅ **Health Checks** - Monitoreo de salud del servicio

## Estructura del Proyecto

```
email-api-service/
├── src/
│   ├── index.ts              # Servidor Express principal
│   ├── routes/
│   │   ├── shopifyWebhook.ts # Router del webhook de Shopify
│   │   └── health.ts         # Router de health check
│   ├── services/
│   │   ├── emailService.ts   # Servicio de correos con SendGrid
│   │   └── shopifyService.ts # Servicio de integración con Shopify
│   ├── types/
│   │   └── shopify.ts        # Tipos de TypeScript para Shopify
│   └── utils/
│       └── validation.ts     # Utilidades de validación
├── .github/workflows/
│   └── deploy.yml            # GitHub Actions workflow
├── Dockerfile                # Configuración de Docker
├── docker-compose.yml        # Docker Compose para desarrollo
├── package.json
├── tsconfig.json
└── README.md
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd email-api-service
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `env.example` a `.env` y configura las variables:

```bash
cp env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de Shopify
SHOPIFY_SHOP_DOMAIN=api-gnp
SHOPIFY_ACCESS_TOKEN=tu_access_token_de_shopify

# Configuración de SendGrid
SENDGRID_API_KEY=tu_api_key_de_sendgrid
FROM_EMAIL=noreply@gnp.com
FROM_NAME=GNP
```

## Desarrollo Local

### Opción 1: Desarrollo directo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# O compilar y ejecutar
npm run build
npm start
```

### Opción 2: Con Docker

```bash
# Construir y ejecutar con Docker Compose
docker-compose up --build

# O solo construir la imagen
docker build -t email-api-service .
docker run -p 3000:3000 email-api-service
```

## Endpoints

### Health Check
```
GET /health
```

### Webhook de Shopify
```
POST /api/webhook/shopify
```

### Información del servicio
```
GET /
```

## Configuración de Shopify

### 1. Crear una App Privada en Shopify

1. Ve a tu panel de administración de Shopify
2. Navega a Apps > Desarrollar apps
3. Crea una nueva app privada
4. Configura los permisos necesarios:
   - `read_customers`
   - `read_draft_orders`
   - `read_orders`

### 2. Configurar Webhooks

1. En tu app de Shopify, ve a la sección Webhooks
2. Crea un nuevo webhook para `draft_orders/create`
3. URL del webhook: `https://tu-dominio.com/api/webhook/shopify`
4. Formato: JSON

### 3. Configurar Metafields

Para que el sistema funcione correctamente, necesitas configurar metafields en los clientes:

1. Ve a Configuración > Metafields
2. Crea un metafield para Customer con:
   - Namespace: `custom`
   - Key: `ejecutivo_de_cuenta`
   - Type: `json`
   - Description: `Información del ejecutivo de cuenta asociado`

El valor del metafield debe tener esta estructura:
```json
{
  "ejecutivo_de_cuenta": {
    "correo": "asesor@tuempresa.com",
    "nombre": "Nombre del Asesor"
  }
}
```

## Configuración de SendGrid

### 1. Crear cuenta en SendGrid

1. Regístrate en [SendGrid](https://sendgrid.com)
2. Verifica tu dominio de correo
3. Crea una API Key con permisos de "Mail Send"

### 2. Configurar remitente

Asegúrate de que el correo configurado en `FROM_EMAIL` esté verificado en SendGrid.

## Despliegue

### Variables de Entorno Requeridas

Antes de desplegar, asegúrate de configurar las siguientes variables de entorno:

```env
# Configuración del servidor
NODE_ENV=production
PORT=3000

# Shopify Configuration
SHOPIFY_SHOP_DOMAIN=api-gnp
SHOPIFY_ACCESS_TOKEN=shpat_your_shopify_access_token_here

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@em949.generandoideas.com
FROM_NAME=GNP

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret_here
```

### Con GitHub Actions

1. **Configurar Secrets en GitHub:**
   Ve a tu repositorio > Settings > Secrets and variables > Actions y agrega:
   - `SHOPIFY_SHOP_DOMAIN`
   - `SHOPIFY_ACCESS_TOKEN`
   - `SENDGRID_API_KEY`
   - `FROM_EMAIL`
   - `FROM_NAME`
   - `WEBHOOK_SECRET`

2. **El workflow se ejecutará automáticamente** en cada push a `main`

### Con Docker

```bash
# Construir imagen
docker build -t email-api-service .

# Ejecutar contenedor
docker run -d \
  --name email-api-service \
  --restart unless-stopped \
  -p 3000:3000 \
  -e SHOPIFY_SHOP_DOMAIN=api-gnp \
  -e SHOPIFY_ACCESS_TOKEN=your_token \
  -e SENDGRID_API_KEY=your_key \
  -e FROM_EMAIL=noreply@em949.generandoideas.com \
  -e FROM_NAME=GNP \
  email-api-service
```

### Con Docker Compose

```bash
# Copiar variables de entorno
cp env.example .env
# Editar .env con tus valores

# Ejecutar
docker-compose up -d
```

### Con Script de Despliegue

```bash
# Hacer ejecutable el script
chmod +x scripts/deploy.sh

# Configurar variables de entorno
export SHOPIFY_SHOP_DOMAIN=api-gnp
export SHOPIFY_ACCESS_TOKEN=your_token
export SENDGRID_API_KEY=your_key
export FROM_EMAIL=noreply@em949.generandoideas.com
export FROM_NAME=GNP
export WEBHOOK_SECRET=your_secret

# Ejecutar despliegue
./scripts/deploy.sh
```
  -e SHOPIFY_ACCESS_TOKEN=tu_token \
  -e SENDGRID_API_KEY=tu_api_key \
  -e FROM_EMAIL=noreply@gnp.com \
  -e FROM_NAME=GNP \
  email-api-service
```

## Pruebas

### Probar localmente

```bash
# Health check
curl http://localhost:3000/health

# Probar webhook
curl -X POST http://localhost:3000/api/webhook/shopify \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123456,
    "name": "#D1001",
    "email": "cliente@ejemplo.com",
    "total_price": "1000.00",
    "currency": "MXN",
    "created_at": "2024-01-15T10:30:00Z",
    "customer": {
      "id": 789,
      "email": "cliente@ejemplo.com",
      "first_name": "Juan",
      "last_name": "Pérez"
    },
    "line_items": [
      {
        "id": 1,
        "title": "Producto Ejemplo",
        "quantity": 2,
        "price": "500.00"
      }
    ]
  }'
```

## Monitoreo

### Logs

Los logs incluyen emojis para facilitar el seguimiento:
- 📥 Webhook recibido
- ✅ Procesamiento exitoso
- ❌ Errores
- 📧 Envío de correos
- 👤 Información de clientes
- 👨‍💼 Información de asesores

### Health Check

El endpoint `/health` proporciona:
- Estado del servicio
- Tiempo de actividad
- Versión
- Entorno

## Troubleshooting

### Error: "No se encontró metafield de ejecutivo de cuenta"
- Verifica que el cliente tenga configurado el metafield `custom.ejecutivo_de_cuenta`
- Asegúrate de que el valor del metafield sea JSON válido

### Error: "Error conectando con Shopify"
- Verifica que `SHOPIFY_SHOP_DOMAIN` y `SHOPIFY_ACCESS_TOKEN` estén correctos
- Asegúrate de que la app tenga los permisos necesarios

### Error: "Error enviando correo"
- Verifica que `SENDGRID_API_KEY` sea válida
- Asegúrate de que el correo remitente esté verificado en SendGrid

## Personalización

### Modificar plantillas de correo

Edita los métodos en `src/services/emailService.ts`:
- `generateCustomerEmailHTML()` - Plantilla HTML para cliente
- `generateAdvisorEmailHTML()` - Plantilla HTML para asesor

### Agregar nuevos endpoints

Crea nuevos routers en `src/routes/` y agrégalos al servidor principal.

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 