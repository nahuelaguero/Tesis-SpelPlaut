#!/bin/bash

# Levantar servidor en background
echo "🚀 Levantando servidor..."
cd /Users/nahuelaguero/Documents/universidad/reserva-cancha-app
bun run dev > /tmp/spelplaut-dev.log 2>&1 &
SERVER_PID=$!

# Esperar a que esté listo
echo "⏳ Esperando a que el servidor esté listo..."
sleep 10

# Verificar que el servidor respondió
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ El servidor no respondió en localhost:3000"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

echo "✅ Servidor listo en localhost:3000"
echo ""

# Correr tests
echo "📊 CORRIENDO STRESS TESTS..."
echo "=============================="
echo ""

cd /Users/nahuelaguero/Documents/universidad/reserva-cancha-app

echo "1️⃣ SMOKE TEST (5 VU, 1 min)..."
k6 run --env BASE_URL=http://localhost:3000 scripts/stress-tests/scenarios/smoke-test.js

echo ""
echo "2️⃣ LOAD TEST (22 VU, 5 min)..."
k6 run --env BASE_URL=http://localhost:3000 scripts/stress-tests/scenarios/load-test.js

echo ""
echo "3️⃣ STRESS TEST (110 VU, 12 min)..."
k6 run --env BASE_URL=http://localhost:3000 scripts/stress-tests/scenarios/stress-test.js

echo ""
echo "4️⃣ SPIKE TEST (220 VU, 3.25 min)..."
k6 run --env BASE_URL=http://localhost:3000 scripts/stress-tests/scenarios/spike-test.js

echo ""
echo "=============================="
echo "✅ TESTS COMPLETADOS"

# Matar servidor
kill $SERVER_PID 2>/dev/null
echo "🛑 Servidor detenido"
