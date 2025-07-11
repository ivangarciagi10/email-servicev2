#!/bin/bash

echo "🚀 Configurando el servicio de correos electrónicos..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instala Node.js 18 o superior."
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor, instala npm."
    exit 1
fi

# Verificar si Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "📦 Instalando Firebase CLI..."
    npm install -g firebase-tools
fi

echo "📦 Instalando dependencias..."
npm install

echo "🔧 Configurando variables de entorno..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Archivo .env creado. Por favor, edita las variables de entorno."
else
    echo "⚠️  El archivo .env ya existe."
fi

echo "🏗️  Compilando el proyecto..."
npm run build

echo "✅ Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita el archivo .env con tus credenciales"
echo "2. Configura tu proyecto de Firebase: firebase use <tu-proyecto>"
echo "3. Configura los webhooks en Shopify"
echo "4. Despliega la función: firebase deploy --only functions"
echo ""
echo "📚 Para más información, consulta el README.md" 