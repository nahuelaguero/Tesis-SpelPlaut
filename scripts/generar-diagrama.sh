#!/bin/bash

# ============================================
# Script para generar diagrama de clases UML
# ============================================

echo "🎨 Generando Diagrama de Clases UML..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si PlantUML está instalado
if ! command -v plantuml &> /dev/null; then
    echo -e "${YELLOW}⚠️  PlantUML no está instalado${NC}"
    echo ""
    echo "Instalando PlantUML..."
    
    # Detectar el sistema operativo
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "Sistema: macOS"
        if command -v brew &> /dev/null; then
            brew install plantuml
        else
            echo "❌ Homebrew no encontrado. Por favor instala Homebrew primero:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Sistema: Linux"
        sudo apt-get update
        sudo apt-get install -y plantuml
    else
        echo "❌ Sistema operativo no soportado para instalación automática"
        echo "   Por favor instala PlantUML manualmente desde: https://plantuml.com"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ PlantUML está instalado${NC}"
echo ""

# Directorio de trabajo
DOCS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../docs" && pwd)"
OUTPUT_DIR="${DOCS_DIR}/images"

# Crear directorio de salida si no existe
mkdir -p "${OUTPUT_DIR}"

# Archivo de entrada
PLANTUML_FILE="${DOCS_DIR}/DIAGRAMA-CLASES-UML.puml"

if [ ! -f "$PLANTUML_FILE" ]; then
    echo "❌ No se encontró el archivo: $PLANTUML_FILE"
    exit 1
fi

echo -e "${BLUE}📁 Directorio de entrada:${NC} $DOCS_DIR"
echo -e "${BLUE}📁 Directorio de salida:${NC} $OUTPUT_DIR"
echo ""

# Generar PNG (alta resolución para impresión)
echo -e "${YELLOW}🖼️  Generando PNG (alta resolución)...${NC}"
plantuml -tpng -DPLANTUML_LIMIT_SIZE=16384 "$PLANTUML_FILE" -o "$OUTPUT_DIR"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PNG generado exitosamente${NC}"
else
    echo -e "❌ Error al generar PNG"
fi

echo ""

# Generar SVG (vectorial para documentos digitales)
echo -e "${YELLOW}🎨 Generando SVG (vectorial)...${NC}"
plantuml -tsvg "$PLANTUML_FILE" -o "$OUTPUT_DIR"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SVG generado exitosamente${NC}"
else
    echo -e "❌ Error al generar SVG"
fi

echo ""

# Generar PDF (ideal para tesis)
echo -e "${YELLOW}📄 Generando PDF...${NC}"
plantuml -tpdf "$PLANTUML_FILE" -o "$OUTPUT_DIR"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PDF generado exitosamente${NC}"
else
    echo -e "❌ Error al generar PDF"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Generación completada!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Archivos generados en: ${OUTPUT_DIR}/"
echo ""

# Listar archivos generados
if [ -d "$OUTPUT_DIR" ]; then
    echo "📦 Archivos disponibles:"
    ls -lh "$OUTPUT_DIR"/ | grep -E '\.(png|svg|pdf)$' | awk '{print "   " $9 " (" $5 ")"}'
    echo ""
fi

echo "💡 Recomendaciones de uso:"
echo ""
echo "   📄 Para tesis impresa:    Usa el archivo PDF"
echo "   🌐 Para tesis digital:    Usa el archivo SVG"
echo "   📊 Para presentaciones:   Usa el archivo PNG"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

