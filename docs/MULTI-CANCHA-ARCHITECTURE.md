# 🏢 Arquitectura Multi-Cancha - Sistema Escalable para Propietarios

## 📋 Resumen Ejecutivo

El sistema ha sido refactorizado para soportar **múltiples canchas por propietario**, cambiando de una arquitectura 1:1 a una arquitectura 1:N escalable que permite el crecimiento empresarial de los propietarios de canchas.

## 🔄 Cambios Arquitectónicos

### Antes (1:1)

```
Usuario (propietario) → cancha_id → Cancha (única)
```

### Después (1:N)

```
Usuario (propietario) ← propietario_id ← Cancha[] (múltiples)
```

## 🗄️ Cambios en Modelos de Datos

### Usuario Model

```typescript
// ❌ ELIMINADO
cancha_id?: string; // Campo removido

// ✅ MANTIENE
rol: "propietario_cancha" // Rol sin cambios
```

### Cancha Model

```typescript
// ✅ MANTIENE (clave de la relación)
propietario_id: ObjectId; // Referencia al propietario
```

### Reserva Model

```typescript
// ✅ NUEVO CAMPO
duracion_horas: {
  type: Number,
  required: true,
  min: 0.5,    // Mínimo 30 minutos
  max: 24      // Máximo 24 horas
}
```

## 🔧 APIs Actualizadas

### `/api/propietario/dashboard`

#### Funcionalidad Consolidada

```http
GET /api/propietario/dashboard
```

**Respuesta**: Estadísticas de todas las canchas del propietario

#### Funcionalidad Específica por Cancha

```http
GET /api/propietario/dashboard?cancha_id=xxx
```

**Respuesta**: Estadísticas de la cancha específica

#### Estructura de Respuesta

```typescript
interface PropietarioDashboard {
  canchas: CanchaInfo[]; // Todas las canchas
  cancha_seleccionada?: CanchaInfo; // Cancha específica (si aplica)
  estadisticas_consolidadas: {
    // Stats de todas las canchas
    total_canchas: number;
    reservas_hoy: number;
    reservas_semana: number;
    reservas_mes: number;
    ingresos_hoy: number;
    ingresos_semana: number;
    ingresos_mes: number;
    ocupacion_promedio: number;
  };
  estadisticas_cancha?: {
    // Stats de cancha específica
    reservas_hoy: number;
    reservas_semana: number;
    reservas_mes: number;
    ingresos_hoy: number;
    ingresos_semana: number;
    ingresos_mes: number;
    ocupacion_promedio: number;
  };
  reservas_recientes: ReservaReciente[]; // Con campo cancha_nombre
}
```

### `/api/reservas/estadisticas`

- **Actualizada** para trabajar con múltiples canchas por propietario
- Filtra automáticamente por todas las canchas del propietario autenticado

## 🎨 Componentes UI Nuevos

### Select Component (`src/components/ui/select.tsx`)

```typescript
// Basado en Radix UI primitives
import * as SelectPrimitive from "@radix-ui/react-select";

// Componentes exportados:
-Select - SelectTrigger - SelectValue - SelectContent - SelectItem;
```

### Dashboard Multi-Cancha (`src/app/mi-cancha/page.tsx`)

#### Selector de Cancha

```typescript
<Select value={canchaSeleccionada} onValueChange={handleCanchaChange}>
  <SelectItem value="todas">📊 Vista Consolidada</SelectItem>
  {canchas.map((cancha) => (
    <SelectItem key={cancha._id} value={cancha._id}>
      🏟️ {cancha.nombre}
    </SelectItem>
  ))}
</Select>
```

#### Estados de Vista

1. **Vista Consolidada** (`canchaSeleccionada === ""`)

   - Muestra estadísticas de todas las canchas
   - Total de canchas, ingresos combinados, ocupación general

2. **Vista Específica** (`canchaSeleccionada !== ""`)
   - Muestra estadísticas de la cancha seleccionada
   - Métricas individuales de rendimiento

## 🔐 Seguridad y Aislamiento

### Validación de Propietario

```typescript
// En todas las APIs de propietario
const canchasDelPropietario = await Cancha.find({
  propietario_id: user._id,
});

// Solo opera con canchas del propietario autenticado
const canchaIds = canchasDelPropietario.map((c) => c._id);
```

### Consultas Seguras

```typescript
// Todas las consultas filtran por canchas del propietario
const reservas = await Reserva.find({
  cancha_id: { $in: canchaIds }, // Solo canchas del propietario
});
```

## 📊 Beneficios de la Nueva Arquitectura

### Para Propietarios

- ✅ **Escalabilidad**: Pueden agregar más canchas sin limitaciones
- ✅ **Vista consolidada**: Estadísticas de todo su negocio
- ✅ **Análisis granular**: Estadísticas por cancha individual
- ✅ **Crecimiento empresarial**: Soporte para expansión del negocio

### Para Administradores

- ✅ **Flexibilidad**: Pueden asignar múltiples canchas a un propietario
- ✅ **Gestión simplificada**: Un propietario maneja múltiples ubicaciones
- ✅ **Escalabilidad del sistema**: Soporte para grandes operadores

### Para el Sistema

- ✅ **Rendimiento**: Consultas optimizadas con agregaciones
- ✅ **Mantenibilidad**: Código más limpio y modular
- ✅ **Extensibilidad**: Fácil agregar nuevas funcionalidades

## 🔄 Migración de Datos

### Script de Migración (Conceptual)

```javascript
// Para migrar datos existentes (si los hubiera)
db.usuarios.find({ rol: "propietario_cancha" }).forEach((user) => {
  if (user.cancha_id) {
    // Actualizar la cancha para referenciar al propietario
    db.canchas.updateOne(
      { _id: user.cancha_id },
      { $set: { propietario_id: user._id } }
    );

    // Remover cancha_id del usuario
    db.usuarios.updateOne({ _id: user._id }, { $unset: { cancha_id: "" } });
  }
});
```

## 🧪 Testing y Validación

### Casos de Prueba

1. **Propietario con una cancha**

   - ✅ Dashboard funciona igual que antes
   - ✅ Estadísticas consolidadas = estadísticas de la única cancha

2. **Propietario con múltiples canchas**

   - ✅ Selector muestra todas las canchas
   - ✅ Vista consolidada suma todas las estadísticas
   - ✅ Vista específica muestra datos de cancha individual

3. **Seguridad**
   - ✅ Propietario A no puede ver datos de Propietario B
   - ✅ APIs validan ownership antes de mostrar datos

### Métricas de Rendimiento

- **Consultas optimizadas** con agregaciones MongoDB
- **Caching** de datos de canchas del propietario
- **Lazy loading** de estadísticas específicas

## 🚀 Próximos Pasos

### Funcionalidades Futuras

- [ ] **Comparación entre canchas** del mismo propietario
- [ ] **Reportes avanzados** por período y cancha
- [ ] **Alertas automáticas** por bajo rendimiento
- [ ] **Dashboard de analytics** con gráficos interactivos

### Optimizaciones Técnicas

- [ ] **Caching Redis** para estadísticas frecuentes
- [ ] **Agregaciones MongoDB** más complejas
- [ ] **WebSockets** para actualizaciones en tiempo real
- [ ] **Background jobs** para cálculos pesados

## 📈 Impacto en el Negocio

### Casos de Uso Reales

1. **Cadena de canchas**: Un propietario con 5 ubicaciones diferentes
2. **Complejo deportivo**: Múltiples canchas en la misma ubicación
3. **Franquicia**: Propietario que expande su negocio gradualmente

### ROI para Propietarios

- **Gestión centralizada** de múltiples ubicaciones
- **Análisis comparativo** entre canchas
- **Optimización de recursos** basada en datos
- **Escalabilidad sin fricción** técnica

---

## 🏆 Conclusión

La nueva arquitectura multi-cancha transforma el sistema de una solución básica a una **plataforma empresarial escalable**, permitiendo que los propietarios hagan crecer sus negocios sin limitaciones técnicas, mientras mantiene la seguridad y el aislamiento de datos entre diferentes propietarios.
