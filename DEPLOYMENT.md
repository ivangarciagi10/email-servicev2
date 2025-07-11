# Guía de Despliegue - Email API Service

Esta guía te ayudará a desplegar el servicio de correos electrónicos en diferentes entornos.

## 📋 Prerrequisitos

- Node.js 18+
- Docker (opcional)
- PM2 (opcional, para producción)
- Nginx (opcional, para proxy reverso)

## 🔧 Configuración de Variables de Entorno

### Variables Requeridas

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

### Cómo obtener las credenciales

#### Shopify Access Token
1. Ve a tu panel de administración de Shopify
2. Apps > Desarrollar apps
3. Crea una nueva app privada
4. Configura los permisos necesarios:
   - `read_customers`
   - `read_draft_orders`
   - `read_orders`
5. Copia el Access Token

#### SendGrid API Key
1. Regístrate en [SendGrid](https://sendgrid.com)
2. Ve a Settings > API Keys
3. Crea una nueva API Key con permisos "Mail Send"
4. Copia la API Key

## 🚀 Opciones de Despliegue

### 1. Despliegue Local con Node.js

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus valores

# Compilar y ejecutar
npm run build
npm start
```

### 2. Despliegue con Docker

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
  -e WEBHOOK_SECRET=your_secret \
  email-api-service
```

### 3. Despliegue con Docker Compose

```bash
# Copiar variables de entorno
cp env.example .env
# Editar .env con tus valores

# Ejecutar
docker-compose up -d
```

### 4. Despliegue con Script Automatizado

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

### 5. Despliegue con PM2 (Producción)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Configurar variables de entorno
export SHOPIFY_SHOP_DOMAIN=api-gnp
export SHOPIFY_ACCESS_TOKEN=your_token
export SENDGRID_API_KEY=your_key
export FROM_EMAIL=noreply@em949.generandoideas.com
export FROM_NAME=GNP
export WEBHOOK_SECRET=your_secret

# Desplegar
npm run deploy:prod

# Ver logs
npm run logs

# Reiniciar
npm run restart
```

### 6. Despliegue con GitHub Actions

1. **Configurar Secrets en GitHub:**
   Ve a tu repositorio > Settings > Secrets and variables > Actions y agrega:
   - `SHOPIFY_SHOP_DOMAIN`
   - `SHOPIFY_ACCESS_TOKEN`
   - `SENDGRID_API_KEY`
   - `FROM_EMAIL`
   - `FROM_NAME`
   - `WEBHOOK_SECRET`

2. **El workflow se ejecutará automáticamente** en cada push a `main`

## 🌐 Configuración de Nginx (Opcional)

Si usas Nginx como proxy reverso:

1. Copia el archivo `nginx.conf` a tu servidor
2. Ajusta el `server_name` y las rutas de certificados SSL
3. Reinicia Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 Verificación del Despliegue

### Health Check
```bash
curl http://localhost:3000/health
```

### Verificar logs
```bash
# Si usas Docker
docker logs email-api-service

# Si usas PM2
npm run logs

# Si usas Node.js directamente
tail -f logs/app.log
```

### Probar webhook
```bash
curl -X POST http://localhost:3000/api/webhook/shopify \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🔧 Comandos Útiles

### Docker
```bash
# Ver contenedores
docker ps

# Ver logs
docker logs email-api-service

# Reiniciar
docker restart email-api-service

# Detener y eliminar
docker stop email-api-service && docker rm email-api-service
```

### PM2
```bash
# Ver procesos
pm2 list

# Ver logs
pm2 logs email-api-service

# Reiniciar
pm2 restart email-api-service

# Detener
pm2 stop email-api-service
```

### Node.js
```bash
# Verificar puerto
netstat -tulpn | grep :3000

# Verificar variables de entorno
node -e "console.log(process.env.SHOPIFY_SHOP_DOMAIN)"
```

## 🚨 Troubleshooting

### Error: Puerto ya en uso
```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 <PID>
```

### Error: Variables de entorno no configuradas
```bash
# Verificar variables
env | grep SHOPIFY
env | grep SENDGRID
```

### Error: Docker no puede construir
```bash
# Limpiar cache
docker system prune -a

# Reconstruir sin cache
docker build --no-cache -t email-api-service .
```

### Error: PM2 no puede iniciar
```bash
# Verificar configuración
pm2 show email-api-service

# Eliminar proceso
pm2 delete email-api-service

# Reinstalar
npm run deploy:prod
```

## 📞 Soporte

Si tienes problemas con el despliegue:

1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs del servicio
3. Asegúrate de que el puerto 3000 esté disponible
4. Verifica que las credenciales de Shopify y SendGrid sean válidas 