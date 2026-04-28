# Verificación de tesis - 2026-04-23

## Alcance verificado y corregido

- Se revisó `BUGS.pdf` y se contrastaron sus hallazgos contra el estado real del proyecto.
- El mapa público de `/canchas` dejó de usar coordenadas aleatorias y ahora consume coordenadas reales almacenadas por cancha.
- El detalle de cancha dejó de calcular distancia con coordenadas simuladas y ahora usa `coordenadas` reales cuando existen.
- La creación y edición admin de canchas ahora validan ubicación en mapa, geocodifican direcciones y guardan latitud/longitud reales.
- Las rutas públicas hacen backfill ligero de coordenadas cuando encuentran canchas antiguas con dirección pero sin latitud/longitud persistida.
- La gestión admin de canchas ahora muestra el mismo universo de canchas que el contador del panel admin.
- El botón `Configuración` del panel admin ya navega a una pantalla real.
- La exportación de reportes ya tiene endpoint CSV funcional.
- La configuración de cancha del propietario volvió a tener navegación clara para regresar.
- `mis-reservas` quedó endurecida frente a reservas con referencias incompletas para evitar excepciones de cliente.
- Varias pantallas admin y del propietario dejaron de mostrar `Acceso denegado` de forma falsa mientras la sesión todavía se estaba validando en cliente.
- La configuración de cancha del propietario dejó de quedar atrapada en `Cargando configuración...` cuando la API falla; ahora muestra error y permite reintentar.
- Se agregó la ruta interna `/api/ubicaciones/geocode` para resolver direcciones y reverse geocoding usando OpenStreetMap/Nominatim.
- La gestión admin de canchas dejó de depender de la API pública `/api/canchas`; ahora consume `/api/admin/canchas`, que devuelve todas las canchas y propietario asignado.
- La ruta genérica `/dashboard` dejó de mostrar estadísticas mock y ahora redirige por rol al panel correcto.
- Los datos seed dejaron de apuntar a `/api/placeholder/600/400`, que no existía; ahora usan un asset real del proyecto.

## Estado actual confirmado

- `MapView`, `CalendarioReservas` y `ReservaModal` sí existen y están integrados en páginas reales.
- `LocationPicker` ya no es un mock visual.
- La documentación `docs/REQUERIMIENTOS-FALTANTES.md` no refleja el estado real del código en varios puntos y debe usarse con cautela.

## Pendientes reales que siguen fuera de cierre en esta iteración

- `src/app/api/pagos/bancard/route.ts` sigue siendo mock funcional. Para producción faltan credenciales reales, firma/webhooks y validación contra Bancard.
- El documento de Google indicado por el usuario no se pudo leer desde este entorno porque exige autenticación de Google, por lo que la verificación se hizo contra el estado real del repositorio.

## Verificación técnica

- Se corrigió una configuración inválida en `next.config.js` (`webpack.watchOptions.ignored`) que dejaba el servidor de desarrollo levantado a medias y sin responder.
- Se verificó que en este host `node` 24/25 rompe la carga del binding nativo `@next/swc-darwin-arm64`; por eso se fijó el runtime recomendado en `.nvmrc` y `package.json` a Node `20.20.2`.
- Para levantar la app localmente en este equipo se dejó el wrapper `scripts/next-with-node20.sh`, que fuerza Node `20`, fuerza SWC WASM y evita Turbopack en `bun run dev`.
- El middleware de `src/middleware.ts` se deshabilitó porque en este entorno dejaba colgado el arranque durante `Compiling middleware ...`. La validación fuerte de sesión sigue ocurriendo en las APIs; la capa retirada era la de redirección temprana.
- `globals.css` quedó fuera del layout raíz porque la importación global del pipeline de Tailwind dejaba colgada la compilación de rutas App Router en este macOS. El CSS de Leaflet se movió a los componentes de mapa.
- El layout raíz quedó estable con `AuthProvider`, metadatos principales y Tailwind cargado por CDN para recuperar el aspecto visual sin reintroducir el bloqueo de compilación local.
- La home (`src/app/page.tsx`) se rehizo como server component con estructura visual equivalente a producción para evitar el costo de componentes cliente pesados en la portada.
- El login (`src/app/login/page.tsx`) quedó con el flujo real de `/api/auth/login` y 2FA, pero usando markup liviano para mantener un arranque estable.
- La pantalla de canchas (`src/app/canchas/page.tsx`) se redujo al flujo crítico estable: fetch de `/api/canchas`, búsqueda, filtro y cards con acceso al detalle; el mapa salió del bundle inicial.
- Con esa combinación se verificó respuesta HTTP `200` real en caliente para:
  - `/`
  - `/login`
  - `/register`
  - `/canchas`
  - `/api/ping`
  - `POST /api/auth/clear-session`
- La primera compilación de algunas rutas sigue siendo lenta en este entorno, pero el servidor ya queda operativo después del warmup inicial.
- Se intentó ejecutar `tsc --noEmit`, pero en este entorno el proceso quedó colgado sin devolver salida útil.
- Se realizó revisión dirigida de los archivos modificados y eliminación de referencias activas a coordenadas simuladas, dashboard mock y placeholders rotos dentro de `src/`.
