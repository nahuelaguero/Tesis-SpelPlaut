#!/bin/bash
# Script para ejecutar todos los escenarios de stress test de SPELPLAUT
# Prerequisitos: k6 instalado (brew install k6), app corriendo en modo produccion

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="$SCRIPT_DIR/results/$TIMESTAMP"
BASE_URL="${BASE_URL:-http://localhost:3000}"

mkdir -p "$RESULTS_DIR"

echo "=============================================="
echo "  SPELPLAUT - Suite de Pruebas de Rendimiento"
echo "=============================================="
echo "Timestamp: $TIMESTAMP"
echo "Target:    $BASE_URL"
echo "Resultados: $RESULTS_DIR"
echo ""

# Verificar que el servidor esta corriendo
echo "Verificando servidor..."
if ! curl -s "$BASE_URL/api/canchas" > /dev/null 2>&1; then
  echo "ERROR: El servidor no esta corriendo en $BASE_URL"
  echo "Ejecuta: pnpm build && pnpm start"
  exit 1
fi
echo "Servidor OK"
echo ""

# 1. Smoke Test
echo "----------------------------------------------"
echo "  1/4 - SMOKE TEST (5 VUs, 1 min)"
echo "----------------------------------------------"
k6 run \
  --env BASE_URL="$BASE_URL" \
  --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
  --out json="$RESULTS_DIR/smoke.json" \
  "$SCRIPT_DIR/scenarios/smoke-test.js" \
  2>&1 | tee "$RESULTS_DIR/smoke.log"
echo ""

# 2. Load Test
echo "----------------------------------------------"
echo "  2/4 - LOAD TEST (22 VUs, 5 min)"
echo "----------------------------------------------"
k6 run \
  --env BASE_URL="$BASE_URL" \
  --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
  --out json="$RESULTS_DIR/load.json" \
  "$SCRIPT_DIR/scenarios/load-test.js" \
  2>&1 | tee "$RESULTS_DIR/load.log"
echo ""

# 3. Stress Test
echo "----------------------------------------------"
echo "  3/4 - STRESS TEST (22->66->110 VUs, 12 min)"
echo "----------------------------------------------"
k6 run \
  --env BASE_URL="$BASE_URL" \
  --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
  --out json="$RESULTS_DIR/stress.json" \
  "$SCRIPT_DIR/scenarios/stress-test.js" \
  2>&1 | tee "$RESULTS_DIR/stress.log"
echo ""

# 4. Spike Test
echo "----------------------------------------------"
echo "  4/4 - SPIKE TEST (10->220->10 VUs, 3.5 min)"
echo "----------------------------------------------"
k6 run \
  --env BASE_URL="$BASE_URL" \
  --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
  --out json="$RESULTS_DIR/spike.json" \
  "$SCRIPT_DIR/scenarios/spike-test.js" \
  2>&1 | tee "$RESULTS_DIR/spike.log"
echo ""

echo "=============================================="
echo "  Todas las pruebas completadas!"
echo "=============================================="
echo "Resultados guardados en: $RESULTS_DIR"
echo ""
echo "Archivos generados:"
ls -la "$RESULTS_DIR/"
