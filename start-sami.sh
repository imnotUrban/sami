#!/bin/bash

# SAMI - Script de inicio con Docker
# ===================================

echo "🚀 Iniciando SAMI - Service Architecture Management Interface"
echo "============================================================="

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose no está instalado"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env desde docker.env..."
    cp docker.env .env
fi

echo "📦 Construyendo e iniciando servicios..."
docker-compose up --build -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 10

echo "🔍 Verificando el estado de los servicios..."
docker-compose ps

echo ""
echo "✅ SAMI está ejecutándose!"
echo "========================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8080"
echo "🗄️ Base de datos: localhost:5432"
echo ""
echo "👤 Usuario Administrador:"
echo "   📧 Email: admin@sami.local"
echo "   🔑 Contraseña: admin123"
echo ""
echo "📋 Comandos útiles:"
echo "   • Ver logs: docker-compose logs -f"
echo "   • Detener: docker-compose down"
echo "   • Reiniciar: docker-compose restart"
echo ""
echo "📚 Para más información, consulta README_DOCKER.md" 