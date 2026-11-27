# Fase 104 — Comparador profundo de snapshots TRIS

## Objetivo
Leer el contenido JSON conservado por Fase102 y comparar dos o más ejecuciones, separando diferencias observables en datos fuente, parámetros, identificadores de método, resultados y auditoría.

## Flujo
1. Generar los informes de fases 94–99 y 101.
2. Ejecutar `npm run research:structural-experiment-ledger` para guardar cada captura.
3. Importar `reports/structural-motif-experiment-ledger/latest.json` en el dashboard.
4. Abrir Fase104, seleccionar dos o más capturas y cargar la carpeta `reports/structural-motif-experiment-ledger/records/` usando el selector de directorio.
5. El navegador empareja los archivos con las rutas `snapshotPath` registradas y compara las fases 94,95,96,97,98,99 y 101.

## Clasificación de diferencias
- Datos fuente: filas del informe 94 y procedencia declarada en la auditoría 99; también archivos de entrada declarados en manifiesto 101.
- Parámetros: objetos `settings` y contexto `environment`.
- Método: identificadores `method`.
- Resultados: métricas/grupos por familia y posición de fases 95–98 y hashes de salida de Fase101.
- Auditoría: resumen y controles de Fase99.

## Integridad y límites
- Solo se comparan snapshots JSON presentes y parseables. Markdown no interviene en las diferencias de contenido.
- Un snapshot ausente o ilegible deja la comparación incompleta; no se imputa.
- Fase101 distingue hashes de entradas, parámetros y salidas cuando estos fueron registrados. La comparación no puede descubrir dependencias externas no declaradas ni atribuir causalidad.
- Cambios en los resultados pueden reflejar cambios de datos, configuración, método, entorno o código. Deben interpretarse junto con las categorías mostradas.
- Las métricas son retrospectivas, comparten historial y no constituyen evidencia independiente, predicción de números ganadores ni recomendación de apuesta.
- Los archivos se leen localmente en el navegador; no se suben a un servicio externo.

## Pruebas
Cinco pruebas unitarias escritas: snapshots idénticos, cambios de datos, parámetros/resultados, snapshots faltantes y cambios de método. No se afirma que se hayan ejecutado.
