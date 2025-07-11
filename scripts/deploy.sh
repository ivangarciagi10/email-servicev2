#!/bin/bash

# Script de despliegue para Email API Service
set -e

echo "🚀 Iniciando despliegue de Email API Service..."

# Verificar que las variables de entorno estén configuradas
required_vars=(
  "SHOPIFY_SHOP_DOMAIN"
  "SHOPIFY_ACCESS_TOKEN"
  "SENDGRID_API_KEY"
  "FROM_EMAIL"
  "FROM_NAME"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: Variable de entorno $var no está configurada"
    exit 1
  fi
done

echo "✅ Variables de entorno verificadas"

# Construir la imagen Docker
echo "🔨 Construyendo imagen Docker..."
docker build -t email-api-service .

# Detener el contenedor existente si está corriendo
echo "🛑 Deteniendo contenedor existente..."
docker stop email-api-service || true
docker rm email-api-service || true

# Ejecutar el nuevo contenedor
echo "🚀 Iniciando nuevo contenedor..."
docker run -d \
  --name email-api-service \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e SHOPIFY_SHOP_DOMAIN="$SHOPIFY_SHOP_DOMAIN" \
  -e SHOPIFY_ACCESS_TOKEN="$SHOPIFY_ACCESS_TOKEN" \
  -e SENDGRID_API_KEY="$SENDGRID_API_KEY" \
  -e FROM_EMAIL="$FROM_EMAIL" \
  -e FROM_NAME="$FROM_NAME" \
  -e WEBHOOK_SECRET="$WEBHOOK_SECRET" \
  email-api-service

echo "✅ Despliegue completado exitosamente!"
echo "📊 Estado del contenedor:"
docker ps | grep email-api-service

echo "🔗 El servicio está disponible en: http://localhost:3000"
echo "🏥 Health check: http://localhost:3000/health"
echo "📧 Webhook: http://localhost:3000/api/webhook/shopify" 