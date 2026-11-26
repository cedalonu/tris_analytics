# Panel Intuición artificial

El componente `src/IntuitionDashboard.tsx` se abre desde el botón **Intuición artificial** del panel TRIS. Recibe el historial ya cargado en memoria por la aplicación y no realiza llamadas de red ni descargas.

## Vistas

- **Resumen:** estado del historial, último concurso, ventanas disponibles y actividad reciente.
- **Memoria de señales:** permite importar un ledger JSON local en modo solo lectura. Acepta un arreglo de señales o un objeto con `signals[]` o `records[]`. Valida IDs, fechas, fases y conteos; presenta evidencias y recalcula el estado mediante `assessSignal()`. No escribe ni persiste cambios.
- **Hipótesis:** permite importar un `ResearchPlan` JSON 1.0 producido por el orquestador. Valida la estructura, los IDs únicos, las familias, los registros iniciales sin evidencia y la coincidencia de las configuraciones congeladas. Muestra el presupuesto, la distribución por familia, la prioridad heurística, los parámetros y la huella congelada. La prioridad organiza trabajo de investigación; no es una puntuación predictiva.
- **Navegación entre módulos:** desde el encabezado se puede pasar directamente al Centro de investigación o regresar al panel principal, sin perder la navegación de la aplicación.
- **Concordancia:** calcula conteos marginales de dígitos por posición sobre las últimas 20 y 50 filas del historial cargado. Presenta top 3 por posición, coincidencias entre rankings y comparación de top 1 entre ventanas.

## Límites metodológicos

Las frecuencias y coincidencias son descriptivas. No son probabilidades futuras, no prueban dependencia, no generan por sí solas una ventaja y no deben presentarse como pronósticos. La interfaz importa artefactos locales en memoria; no crea evidencia, no ejecuta evaluaciones y no modifica el ledger ni el plan congelado. La integración de informes de evaluación por fases queda deliberadamente aplazada a la siguiente etapa. Descubrimiento, validación, holdout y prospectiva deben permanecer separados y cronológicamente ordenados.

## Uso

1. Importar manualmente `Tris.csv` desde el panel principal.
2. Abrir **Intuición artificial**.
3. En **Memoria de señales**, importar el JSON del ledger si está disponible.
4. En **Hipótesis**, importar el JSON del plan congelado si está disponible.
5. Consultar las vistas; los módulos Investigación e Intuición artificial permiten navegación directa entre sí. los datos importados se mantienen únicamente en memoria mientras la pantalla está abierta.

El módulo es local y exploratorio. No descarga datos, no modifica artefactos de investigación y no afirma capacidad predictiva.
