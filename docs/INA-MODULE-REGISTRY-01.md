# INA — registro de módulos y dependencias v1

**Etapa:** P1.3 del plan maestro TRIS  
**Rama:** `research-core-v1`  
**Estado:** primer registro ejecutable creado; validación CI pendiente.

## 1. Propósito

El registro convierte la matriz de investigación en un grafo de dependencias verificable. Define qué módulo consume cada dato/salida, qué clave produce y qué archivos implementan actualmente esa familia.

## 2. Archivos

- `src/research/ina-registry.ts`: registro por módulos, validación de dependencias, detección de ciclos, orden topológico y comprobación de salidas.
- `src/research/ina-registry.test.ts`: pruebas de registro por defecto, dependencias no resueltas, productores duplicados, ciclos y correspondencia de salidas.
- `src/research/ina-contracts.ts`: cada `ResearchOutput` ahora declara `outputKey`; cada módulo declara estado y archivos de origen.

## 3. Claves de flujo

Entradas externas:
- `source.raw-csv`
- `forecast.frozen-ledger`

Salidas versionadas:
- `dataset.snapshot`
- `dataset.validated-draws`
- `ina.history`
- `ina.position-profile`
- `research.position-overview`
- `research.pool-evaluation`
- `research.positional-transitions`
- `research.memory-state`
- `research.prospective-evaluation`
- `ui.operational-dashboard`

El grafo propuesto es: fuente → validación → INA Core → motores especializados → dashboard. El ledger congelado entra como una fuente separada para el evaluador prospectivo.

## 4. Estado de módulos

El registro utiliza tres estados:
- `implemented`: contrato y servicio presentes y probados.
- `partial`: existen motores/vistas, pero todavía no consumen INA de forma uniforme o la propagación no se ha demostrado.
- `planned`: módulo futuro sin implementación suficiente.

En el registro inicial sólo INA Core se etiqueta como implementado. La fuente, dashboard, pools, transiciones, memoria y evaluación prospectiva permanecen parciales. Este estado evita presentar la arquitectura objetivo como integración terminada.

## 5. Validaciones automáticas

El constructor del registro:
- Rechaza identificadores duplicados.
- Rechaza claves de salida con más de un productor.
- Rechaza dependencias no declaradas ni externas.
- Rechaza ciclos.
- Calcula un orden topológico reproducible.
- Verifica que cada salida declare un módulo, motor, versión y outputKey compatibles con el registro.

## 6. Límite importante

El registro describe y valida el contrato del flujo, pero no ejecuta automáticamente los motores ni migra sus datos. La integración real de cada familia se realizará por etapas, actualizando su estado de `partial` a `implemented` sólo después de pruebas y evidencia de consumo del mismo INA context.
