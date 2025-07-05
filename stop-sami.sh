#!/bin/bash

# SAMI - Script de parada con Docker
# ===================================

echo "🛑 Deteniendo SAMI - Service Architecture Management Interface"
echo "=============================================================="

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose no está instalado"
    exit 1
fi

echo "📦 Deteniendo servicios..."
docker-compose down

echo "🔍 Verificando que los servicios se hayan detenido..."
docker-compose ps

echo ""
echo "✅ SAMI se ha detenido correctamente!"
echo "===================================="
echo ""
echo "📋 Comandos útiles:"
echo "   • Iniciar nuevamente: ./start-sami.sh"
echo "   • Detener y eliminar volúmenes: docker-compose down -v"
echo "   • Ver logs: docker-compose logs"
echo ""
echo "📚 Para más información, consulta README_DOCKER.md" 