# Sistema de Geolocalización y Búsqueda Avanzada

## 📍 Resumen del Sistema

Se ha implementado un sistema completo de geolocalización y búsqueda avanzada para la aplicación de reserva de canchas, integrando múltiples tecnologías y APIs para ofrecer una experiencia de usuario superior.

## 🛠️ Componentes Principales Implementados

### 1. Hook de Geolocalización (`useGeolocation`)

**Archivo:** `src/hooks/useGeolocation.ts`

**Funcionalidades:**

- Detección automática de soporte del navegador para geolocalización
- Gestión de permisos del usuario (prompt, granted, denied)
- Obtención de coordenadas GPS con precisión
- Geocodificación reversa usando API Nominatim
- Manejo de errores robusto
- Estados de carga y seguimiento de intentos

**Características:**

- ✅ Detección automática de soporte GPS
- ✅ Manejo de permisos granular
- ✅ Precisión de ubicación reportada
- ✅ Geocodificación automática
- ✅ Reintentos automáticos
- ✅ Estados de error claros

### 2. Sistema de Geocodificación

**Archivo:** `src/lib/geolocation.ts`

**Capacidades:**

- Geocodificación de direcciones usando OpenStreetMap Nominatim
- Geocodificación reversa (coordenadas → dirección)
- Validación de coordenadas dentro de Paraguay
- Detección inteligente de tipos de ubicación
- Filtrado geográfico de resultados

**Tipos de ubicación soportados:**

- 🏠 Direcciones completas
- 📍 Coordenadas GPS
- 🏟️ Nombres de lugares conocidos
- 🌍 Referencias geográficas

### 3. Componente de Filtros de Búsqueda

**Archivo:** `src/components/search/SearchFilters.tsx`

**Características principales:**

- 🔍 Búsqueda por ubicación textual
- 📍 Obtención automática de ubicación actual
- 🎛️ Filtros avanzados expandibles
- 📊 Indicadores visuales de filtros activos
- 🧹 Limpieza de filtros con un clic
- ⚡ Búsqueda en tiempo real

**Filtros disponibles:**

- **Ubicación**: Búsqueda textual + GPS
- **Radio**: 1, 5, 10, 25, 50 km
- **Tipo de cancha**: Fútbol, Futsal, Básquet, Tenis, Pádel, Vóleibol
- **Precio**: Rango mínimo/máximo en Guaraníes
- **Capacidad**: Número mínimo de jugadores
- **Horarios**: Disponibilidad en rangos específicos
- **Fecha**: Disponibilidad en fecha específica
- **Ordenamiento**: Por distancia, precio, calificación, nombre

### 4. API de Búsqueda de Canchas

**Endpoint:** `POST /api/canchas/buscar`

**Funcionalidades:**

- 🔍 Búsqueda textual en nombre y descripción
- 📍 Filtrado por proximidad geográfica
- 💰 Filtrado por rango de precios
- 🏟️ Filtrado por tipo de cancha
- 👥 Filtrado por capacidad
- ⏰ Filtrado por disponibilidad horaria
- 📅 Filtrado por disponibilidad en fecha
- 📊 Múltiples opciones de ordenamiento

**Lógica de distancia:**

- Cálculo usando fórmula de Haversine
- Soporte para radio variable (1-50 km)
- Ordenamiento por proximidad
- Validación de coordenadas en Paraguay

### 5. Validación de Ubicaciones

**Endpoint:** `POST /api/admin/ubicaciones/validar`

**Capacidades:**

- 🎯 Detección automática de tipo de ubicación
- 🌍 Geocodificación de direcciones
- ✅ Validación de coordenadas GPS
- 🇵🇾 Verificación de límites de Paraguay
- 💡 Sugerencias para ubicaciones incompletas

**Tipos detectados:**

- `coordinates`: Coordenadas GPS válidas
- `address`: Direcciones geocodificables
- `place`: Nombres de lugares conocidos
- `invalid`: Ubicaciones no procesables

## 🌟 Características del UX

### Estados de Geolocalización

- **No soportado**: Mensaje informativo claro
- **Permisos denegados**: Instrucciones para habilitar
- **Cargando**: Indicador visual con spinner
- **Éxito**: Confirmación con precisión reportada
- **Error**: Mensajes específicos y botón de reintento

### Interfaz de Búsqueda

- **Búsqueda principal**: Campo de ubicación + botón GPS
- **Filtros avanzados**: Panel expandible con badge de cantidad
- **Validación en tiempo real**: Feedback inmediato
- **Limpieza rápida**: Botón para resetear todos los filtros
- **Estados de carga**: Spinners en botones durante búsqueda

### Accesibilidad

- ♿ Tooltips explicativos
- 🎯 Estados deshabilitados con contexto
- 📱 Diseño responsive
- ⌨️ Navegación por teclado (Enter para buscar)
- 🔊 Mensajes descriptivos de estado

## 📊 Algoritmos Implementados

### Cálculo de Distancia (Haversine)

```typescript
const R = 6371; // Radio de la Tierra en km
const dLat = ((lat2 - lat1) * Math.PI) / 180;
const dLon = ((lon2 - lon1) * Math.PI) / 180;
const a =
  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
return R * c;
```

### Detección de Tipo de Ubicación

```typescript
// Coordenadas: patron -XX.XXXX, -XX.XXXX
const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;

// Si no es coordenada, geocodificar con Nominatim
// Validar si está en Paraguay: lat: -27.5 to -19.5, lng: -62.5 to -54.0
```

## 🔧 Configuración y Dependencias

### APIs Externas

- **OpenStreetMap Nominatim**: Geocodificación gratuita
- **Navigator.geolocation**: API nativa del navegador

### Validaciones Implementadas

- Coordenadas dentro de Paraguay
- Formatos de hora válidos (HH:MM)
- Fechas futuras para disponibilidad
- Rangos de precio coherentes
- Capacidades realistas (1-50 jugadores)

## 🚀 Próximas Mejoras Sugeridas

### Nivel 1 (Inmediato)

- [ ] Cache de geocodificación para reducir llamadas API
- [ ] Autocompletado de ubicaciones frecuentes
- [ ] Historial de búsquedas del usuario

### Nivel 2 (Corto plazo)

- [ ] Integración con mapas interactivos (Leaflet/MapBox)
- [ ] Búsqueda por voz usando Web Speech API
- [ ] Filtros favoritos guardados

### Nivel 3 (Mediano plazo)

- [ ] Búsqueda predictiva con machine learning
- [ ] Notificaciones push para canchas cercanas
- [ ] Integración con transporte público

## 📈 Métricas de Rendimiento

### Optimizaciones Implementadas

- ✅ Debounce en búsquedas automáticas
- ✅ Cache de permisos de geolocalización
- ✅ Lazy loading de filtros avanzados
- ✅ Validación client-side antes de API calls
- ✅ Estados de carga granulares

### Tiempos Esperados

- **Geolocalización**: 2-5 segundos
- **Geocodificación**: 500-1500ms
- **Búsqueda de canchas**: 200-800ms
- **Carga inicial**: < 2 segundos

## 🔒 Consideraciones de Seguridad

### Validación de Entrada

- ✅ Sanitización de parámetros de búsqueda
- ✅ Validación de rangos numéricos
- ✅ Escape de caracteres especiales
- ✅ Rate limiting implícito por debounce

### Privacidad

- ✅ Geolocalización solo bajo consentimiento
- ✅ No almacenamiento persistente de ubicación
- ✅ Cifrado HTTPS para todas las APIs
- ✅ Logs mínimos de ubicación

## 📝 Notas de Implementación

### Decisiones de Diseño

1. **OpenStreetMap vs Google Maps**: Elegido OSM por ser gratuito y sin límites estrictos
2. **Client vs Server geocoding**: Geocodificación en cliente para mejor UX
3. **Estado global vs local**: Hook local para mejor encapsulación
4. **Filtros expandibles**: UX progresiva para no abrumar al usuario

### Compatibilidad

- ✅ Navegadores modernos (Chrome 50+, Firefox 55+, Safari 11+)
- ✅ Dispositivos móviles iOS/Android
- ✅ Modo offline (búsqueda por texto sin geolocalización)
- ✅ Acceso sin permisos GPS (búsqueda manual)

---

**Última actualización**: Enero 2024  
**Versión**: 1.0.0  
**Autor**: Cursor Agent + Nahuel Aguero
