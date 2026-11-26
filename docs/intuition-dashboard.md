# Panel Intuición artificial

El componente `src/IntuitionDashboard.tsx` se abre desde el botón **Intuición artificial** del panel TRIS. Recibe el historial ya cargado en memoria por la aplicación y no realiza llamadas de red ni descargas.

## Vistas

- **Resumen:** estado del historial, último concurso, ventanas disponibles y actividad reciente.
- **Memoria de señales:** permite importar un ledger JSON local en modo solo lectura. Acepta un arreglo de señales o un objeto con `signals[]` o `records[]`. Valida IDs, fechas, fases y conteos; presenta evidencias y recalcula el estado mediante `assessSignal()`. No escribe ni persiste cambios.
- **Hipótesis:** permite importar un `ResearchPlan` JSON 1.0 producido por el orquestador. Valida la estructura, los IDs únicos, las familias, los registros iniciales sin evidencia y la coincidencia de las configuraciones congeladas. Muestra el presupuesto, la distribución por familia, la prioridad heurística, los parámetros y la huella congelada. La prioridad organiza trabajo de investigación; no es una puntuación predictiva.
- **Resultados de evaluación:** dentro de Hipótesis se puede importar un arreglo `HypothesisPhaseResult[]` o un objeto `{ results: [...] }` producido con el contrato `src/research/intuition-orchestrator.ts`. Valida que cada `hypothesisId` pertenezca al plan, que no se duplique la fase, que las muestras estén pareadas, que tasas y conteos coincidan, y que las métricas/periodos tengan estructura válida. Presenta N, tasas, intervalos, diferencia pareada, McNemar, ajuste por multiplicidad, periodos y decisión, por separado para descubrimiento, validación, holdout y prospectiva. La importación es local y de solo lectura.
- **Concordancia:** calcula conteos marginales de dígitos por posición sobre las últimas 20 y 50 filas del historial cargado. Presenta top 3 por posición, coincidencias entre rankings y comparación de top 1 entre ventanas.

## Límites metodológicos

Las frecuencias y coincidencias son descriptivas. No son probabilidades futuras, no prueban dependencia, no generan por sí solas una ventaja y no deben presentarse como pronósticos. La interfaz importa artefactos locales en memoria; no crea evidencia, no ejecuta evaluaciones y no modifica el ledger ni el plan congelado. El contrato `HypothesisPhaseResult` identifica el candidato por ID, pero no incorpora la huella `frozenConfig`: por ello la pantalla verifica la pertenencia al plan, pero no puede demostrar que un informe se haya calculado con esa configuración exacta. Esa limitación queda visible en la ficha de resultados. Descubrimiento, validación, holdout y prospectiva deben permanecer separados y cronológicamente ordenados.

## Uso

1. Importar manualmente `Tris.csv` desde el panel principal.
2. Abrir **Intuición artificial**.
3. En **Memoria de señales**, importar el JSON del ledger si está disponible.
4. En **Hipótesis**, importar el JSON del plan congelado si está disponible.
5. Importar el informe de evaluación por fases, si existe, después de cargar el plan.
6. Consultar las vistas; los datos importados se mantienen únicamente en memoria mientras la pantalla está abierta.

El módulo es local y exploratorio. No descarga datos, no modifica artefactos de investigación y no afirma capacidad predictiva.
