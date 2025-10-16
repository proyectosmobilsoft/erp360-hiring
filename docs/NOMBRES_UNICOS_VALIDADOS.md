# Validación de Nombres Únicos en Base de Datos

**Fecha:** 15 de Octubre, 2025  
**Autor:** Sistema ERP360

## Resumen Ejecutivo

Se realizó una validación completa de nombres duplicados en las tablas de **Componentes de Menú**, **Líneas** y **Sublíneas**, y se renombraron todos los duplicados para garantizar unicidad.

---

## ✅ Resultados Finales

| Tabla | Total Registros | Nombres Únicos | Duplicados |
|-------|----------------|----------------|------------|
| **Componentes de Menú** | 20 | 20 | 0 |
| **Líneas** | 53 | 53 | 0 |
| **Sublíneas** | 123 | 123 | 0 |

---

## 📋 Cambios Realizados

### 1. Componentes de Menú (prod_componentes_menus)

**Duplicados encontrados:** 6 nombres repetidos

#### Antes:
- CEREAL (3 repeticiones)
- PROTEICO (3 repeticiones)
- BEBIDA (2 repeticiones)
- HORTALIZAS Y VERDURAS (2 repeticiones)
- SOPA (2 repeticiones)
- TUBERCULO RAIZ O PLATANO (2 repeticiones)

#### Después:
- **CEREAL - DESAYUNO** (ID: 6)
- **CEREAL - ALMUERZO** (ID: 13)
- **CEREAL - CENA** (ID: 16)
- **PROTEICO - ALMUERZO** (ID: 2)
- **PROTEICO - CENA** (ID: 15)
- **PROTEICO - REFRIGERIO** (ID: 14)
- **BEBIDA - CENA** (ID: 19)
- **BEBIDA - REFRIGERIO** (ID: 11)
- **HORTALIZAS Y VERDURAS - ALMUERZO** (ID: 7)
- **HORTALIZAS Y VERDURAS - CENA** (ID: 17)
- **SOPA - ALMUERZO** (ID: 5)
- **SOPA - CENA** (ID: 20)
- **TUBERCULO RAIZ O PLATANO - ALMUERZO** (ID: 8)
- **TUBERCULO RAIZ O PLATANO - CENA** (ID: 18)

---

### 2. Líneas (inv_lineas)

**Duplicados encontrados:** 7 nombres repetidos

#### Cambios:
| Nombre Original | Nuevo Nombre | ID | Código |
|-----------------|--------------|-----|--------|
| ACOMPAÑAMIENTO | ACOMPAÑAMIENTO - COD-48 | 58 | 48 |
| ACOMPAÑAMIENTO | ACOMPAÑAMIENTO - COD-58 | 68 | 58 |
| AREPAS | AREPAS - COD-12 | 12 | 12 |
| AREPAS | AREPAS - COD-31 | 43 | 31 |
| BEBIDA | BEBIDA - COD-59 | 69 | 59 |
| BEBIDA | BEBIDA - COD-60 | 70 | 60 |
| CARNES | CARNES - COD-17 | 17 | 17 |
| CARNES | CARNES - COD-40 | 50 | 40 |
| HARINA / CEREAL | HARINA / CEREAL - COD-51 | 61 | 51 |
| HARINA / CEREAL | HARINA / CEREAL - COD-57 | 67 | 57 |
| PAN Y CEREALES | PAN Y CEREALES - COD-13 | 13 | 13 |
| PAN Y CEREALES | PAN Y CEREALES - COD-15 | 15 | 15 |
| PLATO PRINCIPAL | PLATO PRINCIPAL - COD-45 | 55 | 45 |
| PLATO PRINCIPAL | PLATO PRINCIPAL - COD-56 | 66 | 56 |

---

### 3. Sublíneas (inv_sublineas)

**Duplicados encontrados:** 11 nombres repetidos

#### Cambios:
| Nombre Original | Nuevo Nombre | ID | Línea Padre |
|-----------------|--------------|-----|-------------|
| ADEREZOS | ADEREZOS - ITEM-1 | 2 | CONDIMENTOS,SALSAS Y ADEREZOS |
| ADEREZOS | ADEREZOS - ITEM-2 | 69 | CONDIMENTOS,SALSAS Y ADEREZOS |
| Agua | Agua - BEBIDA FRÍA | 32 | BEBIDA FRÍA |
| Agua | Agua - BEBIDA | 43 | BEBIDA |
| Arroz | Arroz - COD-51 | 23 | HARINA / CEREAL |
| Arroz | Arroz - COD-57 | 38 | HARINA / CEREAL |
| CONDIMENTO | CONDIMENTO - ITEM-1 | 3 | CONDIMENTOS,SALSAS Y ADEREZOS |
| CONDIMENTO | CONDIMENTO - ITEM-2 | 70 | CONDIMENTOS,SALSAS Y ADEREZOS |
| Ensaladas | Ensaladas - SOPA/ENTRADA | 17 | SOPA / ENTRADA |
| Ensaladas | Ensaladas - ACOMPAÑAMIENTO/SALSA | 29 | ACOMPAÑAMIENTO / SALSA |
| GRANOS | GRANOS - ITEM-1 | 77 | GRANOS Y CEREALES |
| GRANOS | GRANOS - ITEM-2 | 153 | GRANOS Y CEREALES |
| Huevo | Huevo - PROTEÍNA | 21 | PROTEÍNA |
| Huevo | Huevo - PROTEICO | 51 | PROTEICO |
| Pasta | Pasta - COD-51 | 24 | HARINA / CEREAL |
| Pasta | Pasta - COD-57 | 39 | HARINA / CEREAL |
| Picada | Picada - FRUTA | 12 | FRUTA |
| Picada | Picada - POSTRE/FRUTA | 34 | POSTRE / FRUTA |
| POSTRES | POSTRES - PAN Y CEREALES | 152 | PAN Y CEREALES |
| POSTRES | POSTRES - POSTRES | 160 | POSTRES |
| Proteico | Proteico - PLATO PRINCIPAL COD-45 | 7 | PLATO PRINCIPAL |
| Proteico | Proteico - PLATO PRINCIPAL COD-56 | 36 | PLATO PRINCIPAL |

---

## 🎯 Estrategia de Nomenclatura

### Componentes de Menú
- **Formato:** `NOMBRE - TIPO_SERVICIO`
- **Ejemplo:** `CEREAL - DESAYUNO`
- **Objetivo:** Diferenciar componentes por el tipo de servicio al que pertenecen

### Líneas
- **Formato:** `NOMBRE - COD-XX`
- **Ejemplo:** `CARNES - COD-17`
- **Objetivo:** Usar el código único de cada línea como diferenciador

### Sublíneas
- **Formato:** `NOMBRE - LÍNEA_PADRE` o `NOMBRE - ITEM-N`
- **Ejemplo:** `Agua - BEBIDA FRÍA` o `ADEREZOS - ITEM-1`
- **Objetivo:** Diferenciar por línea padre o por número de ítem cuando pertenecen a la misma línea

---

## 🔍 Validación Final

Se ejecutó una consulta de verificación que confirma:

```sql
-- Resultado: 0 duplicados en todas las tablas
✅ Componentes de Menú: 0 duplicados
✅ Líneas: 0 duplicados
✅ Sublíneas: 0 duplicados
```

---

## 📊 Impacto en el Sistema

### Beneficios:
1. **Eliminación de ambigüedad** en la selección de componentes
2. **Mejora en la trazabilidad** de ingredientes y recetas
3. **Facilita el mantenimiento** de la base de datos
4. **Previene errores** en asignación de menús

### Áreas Afectadas:
- ✅ Calendario de Minutas de Contrato
- ✅ Gestión de Productos
- ✅ Asignación de Recetas
- ✅ Reportes de Inventario

---

## 🔧 Consultas Útiles

### Verificar unicidad en el futuro:
```sql
-- Verificar duplicados en componentes
SELECT nombre, COUNT(*) as cantidad
FROM prod_componentes_menus
GROUP BY nombre
HAVING COUNT(*) > 1;

-- Verificar duplicados en líneas
SELECT nombre, COUNT(*) as cantidad
FROM inv_lineas
GROUP BY nombre
HAVING COUNT(*) > 1;

-- Verificar duplicados en sublíneas
SELECT nombre, COUNT(*) as cantidad
FROM inv_sublineas
GROUP BY nombre
HAVING COUNT(*) > 1;
```

---

## ✅ Conclusión

Todos los nombres en las tablas de **Componentes de Menú**, **Líneas** y **Sublíneas** son ahora únicos y diferenciables. El sistema ahora puede identificar correctamente cada elemento sin ambigüedad.

