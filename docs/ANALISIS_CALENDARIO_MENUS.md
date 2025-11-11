# 📊 Análisis del Calendario de Menús Detallado

## 🔄 Flujo de Construcción del Calendario

### 1. **Inicialización de la Página** (`MinutasContratoPage.tsx`)

#### 1.1. Carga de Contratos
```typescript
// Consulta: Obtener todos los contratos
ContratosService.getContratos()
```
**Consulta SQL:**
```sql
SELECT 
  id, no_contrato, objetivo, fecha_inicial, fecha_final, 
  fecha_arranque, no_ppl, no_servicios, valor_racion, 
  valor_contrato, estado_proceso,
  con_terceros:id_tercero(documento, nombre_tercero),
  gen_sucursales:id_sucursal(nombre)
FROM prod_contratos
ORDER BY id DESC
```

#### 1.2. Carga de Zonas por Contrato
```typescript
// Cuando se selecciona un contrato
cargarZonasPorContrato(contratoId)
```
**Consulta SQL:**
```sql
SELECT 
  id_zona,
  prod_zonas_contrato (
    id, nombre, codigo
  )
FROM prod_zonas_by_contrato
WHERE id_contrato = {contratoId}
```

---

### 2. **Selección de Zona** (`handleZonaClick`)

Cuando el usuario selecciona una zona, se ejecuta el siguiente flujo:

#### 2.1. Obtener Unidades de Servicio de la Zona
```typescript
MinutasService.getProductosConDetallePorZona(zonaId, contratoId, tipoMenu)
```

**Paso 1: Consulta de Unidades de la Zona**
```sql
SELECT id_unidad_servicio
FROM prod_zonas_detalle_contratos
WHERE id_zona = {zonaId}
```

**Paso 2: Para cada unidad, ejecutar función RPC**
```typescript
// Se ejecuta para cada unidad de servicio encontrada
MinutasService.getProductosConDetallePorUnidad(unidadId, contratoId, tipoMenu)
```

---

### 3. **Función RPC Principal** (`get_productos_detalle_zona`)

Esta es la consulta principal que obtiene todos los datos del calendario:

**Función PostgreSQL:**
```sql
CREATE OR REPLACE FUNCTION get_productos_detalle_zona(
  p_id_unidad_servicio INTEGER,
  p_id_contrato INTEGER,
  p_tipo_menu TEXT DEFAULT 'ESTANDAR'
)
RETURNS JSON
```

**Consulta SQL Interna (simplificada):**
```sql
WITH productos_ordenados AS (
  SELECT 
    p.id, p.no_ciclo, p.codigo, p.id_categoria, p.id_medida,
    p.id_sublineas, p.id_tipo_producto, p.id_clase_servicio,
    ts.nombre AS nombre_servicio, p.nombre, s.id_linea,
    p.ultimo_costo, ts.orden
  FROM inv_productos p
  INNER JOIN inv_sublineas s ON s.id = p.id_sublineas
  JOIN inv_producto_by_unidades pbu ON pbu.id_producto = p.id
  JOIN inv_productos_unidad_servicio us ON us.id_producto_by_unidad = pbu.id
  JOIN inv_clase_servicios ts ON ts.id = p.id_clase_servicio
  WHERE us.id_unidad_servicio = p_id_unidad_servicio
    AND us.id_contrato = p_id_contrato
    AND p.tipo_menu = p_tipo_menu
)
SELECT json_agg(
  json_build_object(
    'id_contrato', p_id_contrato,
    'num_menu', po.no_ciclo,
    'id', po.id,
    'codigo', po.codigo,
    'id_categoria', po.id_categoria,
    'id_medida', po.id_medida,
    'id_sublineas', po.id_sublineas,
    'id_tipo_producto', po.id_tipo_producto,
    'id_clase_servicio', po.id_clase_servicio,
    'nombre_servicio', po.nombre_servicio,
    'nombre', po.nombre,
    'id_linea', po.id_linea,
    'ultimo_costo', po.ultimo_costo,
    'orden', po.orden,
    'detalle', (
      -- Subconsulta para componentes de menú
      SELECT json_agg(
        json_build_object(
          'id_componente', pcm.id,
          'componente', pcm.nombre,
          'detalle', (
            -- Subconsulta para ingredientes/detalles
            SELECT json_agg(
              json_build_object(
                'id_detalle', dp.id,
                'id_clase_servicio', COALESCE(p2.id_clase_servicio, 0),
                'id_producto', dp.id_producto,
                'nombre', p2.nombre,
                'id_medida', dp.id_medida,
                'medida', im.abreviatura,
                'cantidad', dp.cantidad,
                'estado', dp.estado,
                'id_sublinea', p2.id_sublineas,
                'sublinea', s2.nombre,
                'costo', COALESCE(dp.costo, 0.00),
                'total', dp.cantidad * COALESCE(dp.costo, 0.00),
                'id_menu_contrato', po.id,
                'id_maestro_producto', dp.id_maestro_producto
              )
            )
            FROM inv_detalle_productos dp
            INNER JOIN inv_productos p2 ON p2.id = dp.id_producto
            JOIN inv_medidas im ON im.id = dp.id_medida
            JOIN inv_sublineas s2 ON s2.id = p2.id_sublineas
            WHERE pcm.id = s2.id_componente_menu 
              AND dp.id_maestro_producto = po.id
              AND dp.id_maestro_producto != COALESCE(dp.id_producto, 0)
          )
        )
      )
      FROM prod_componentes_menus pcm
    )
  )
  ORDER BY po.orden, po.nombre
)
FROM productos_ordenados po
```

**Tablas involucradas:**
- `inv_productos` - Productos/Recetas
- `inv_sublineas` - Sublíneas de productos
- `inv_producto_by_unidades` - Relación producto-unidad
- `inv_productos_unidad_servicio` - Asignación de productos a unidades
- `inv_clase_servicios` - Clases de servicio (DESAYUNO, ALMUERZO, CENA, REFRIGERIO)
- `prod_componentes_menus` - Componentes de menú (PROTEICO, FRUTA, etc.)
- `inv_detalle_productos` - Ingredientes/detalles de cada receta
- `inv_medidas` - Unidades de medida

---

### 4. **Transformación de Datos** (`transformarDatosParaCalendario`)

Los datos de la función RPC se transforman al formato del calendario:

**Estructura de entrada:**
```json
[
  {
    "id_contrato": 1,
    "num_menu": 1,
    "id": 20,
    "nombre_servicio": "DESAYUNO",
    "id_clase_servicio": 1,
    "detalle": [
      {
        "id_componente": 1,
        "componente": "PROTEICO",
        "detalle": [
          {
            "id_detalle": 1,
            "nombre": "Huevo",
            "cantidad": 2,
            "medida": "UN",
            ...
          }
        ]
      }
    ]
  }
]
```

**Estructura de salida (detallemenus):**
```typescript
[
  {
    id_clase_servicio: 1,
    nombre: "DESAYUNO",
    id_componente: 1,
    componente: "PROTEICO",
    detalle: [
      minutaMenu1,  // null si no hay menú para ese día
      minutaMenu2,
      null,
      minutaMenu4,
      ...
    ] // Array de tamaño noCiclos
  }
]
```

**Lógica de transformación:**
1. Recorre cada receta del array de productos
2. Extrae `num_menu` (índice del menú: 1, 2, 3...)
3. Para cada componente en `detalle`:
   - Toma el primer ingrediente (`ingredientes[0]`)
   - Busca si ya existe una fila para esa clase de servicio + componente
   - Si existe, coloca el ingrediente en la posición `num_menu - 1`
   - Si no existe, crea una nueva fila con un array de tamaño `noCiclos`

---

### 5. **Carga de Datos del Calendario** (`MenuCalendarDetailed.tsx`)

#### 5.1. Consultas al Montar el Componente
```typescript
// Consulta 1: Clases de Servicio
supabase
  .from('inv_clase_servicios')
  .select('id, nombre, orden')
  .eq('estado', 1)
  .order('orden')
```

**SQL:**
```sql
SELECT id, nombre, orden
FROM inv_clase_servicios
WHERE estado = 1
ORDER BY orden
```

```typescript
// Consulta 2: Componentes de Menú
supabase
  .from('prod_componentes_menus')
  .select('id, nombre, id_clase_servicio')
  .order('id')
```

**SQL:**
```sql
SELECT id, nombre, id_clase_servicio
FROM prod_componentes_menus
ORDER BY id
```

---

### 6. **Renderizado del Calendario**

#### 6.1. Estructura de Fechas
```typescript
// Genera 7 días consecutivos desde fechaInicial
const weekDates = getWeekDates(fechaInicial);

// Calcula offset desde fecha inicial hasta fecha ejecución
const ejecucionOffset = getEjecucionOffset();
```

#### 6.2. Organización de Filas
El calendario se organiza así:
- **Filas agrupadas por:**
  1. Clase de Servicio (DESAYUNO, ALMUERZO, CENA, REFRIGERIO)
  2. Componente de Menú (PROTEICO, FRUTA, CEREAL, etc.)

- **Columnas:**
  - 2 columnas fijas (Clase de Servicio + Componente)
  - 7 columnas de fechas (una por día de la semana)

#### 6.3. Lógica de Renderizado
```typescript
// Si hay datos transformados (detallemenus), usarlos
if (usarDatosTransformados && detalleMenu) {
  const menuIndex = i - ejecucionOffset; // Índice del menú
  const minuta = detalleMenu.detalle[menuIndex];
  // Mostrar minuta.nombre si existe
}
```

---

## 📋 Resumen de Consultas

### Consultas Directas (Supabase Client):
1. ✅ `inv_clase_servicios` - Clases de servicio activas
2. ✅ `prod_componentes_menus` - Componentes de menú
3. ✅ `prod_zonas_by_contrato` - Zonas del contrato
4. ✅ `prod_zonas_detalle_contratos` - Unidades de servicio por zona

### Función RPC (Principal):
1. ✅ `get_productos_detalle_zona` - Obtiene productos con componentes e ingredientes
   - Se ejecuta **una vez por cada unidad de servicio** en la zona
   - Retorna JSON con estructura anidada completa

### Consultas Eliminadas:
- ❌ `inv_detalle_productos` - Ya no se consulta directamente (está en la función RPC)

---

## 🔍 Flujo Completo

```
1. Usuario selecciona Contrato
   ↓
2. Se cargan Zonas del Contrato
   ↓
3. Usuario selecciona Zona
   ↓
4. Se obtienen Unidades de Servicio de la Zona
   ↓
5. Para cada Unidad:
   - Se ejecuta get_productos_detalle_zona()
   - Se obtienen productos con componentes e ingredientes
   ↓
6. Se consolidan todos los productos de todas las unidades
   ↓
7. Se transforman los datos con transformarDatosParaCalendario()
   ↓
8. Se pasan al componente MenuCalendarDetailed
   ↓
9. El componente carga clases de servicio y componentes
   ↓
10. Se renderiza el calendario organizado por:
    - Clase de Servicio (filas agrupadas)
    - Componente (subfilas)
    - Días de la semana (columnas)
```

---

## 🎯 Puntos Clave

1. **Una consulta RPC por unidad**: Se ejecuta `get_productos_detalle_zona` para cada unidad de servicio
2. **Consolidación**: Todos los productos se consolidan en un solo array
3. **Transformación**: Los datos se reorganizan de productos → estructura de calendario (filas por componente)
4. **Renderizado**: El calendario muestra ingredientes organizados por clase de servicio y componente

