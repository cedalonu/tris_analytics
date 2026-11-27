# Fase 101 — Reproducibilidad de la cadena TRIS

## Objetivo
Comparar una ejecución de las fases 94–99 con una línea base explícita, para distinguir salidas reproducibles de cambios de entrada, método, parámetros, entorno o diferencias de salida bajo el mismo contexto.

## Requisitos
Generar en orden las fases 94–99 y conservar sus archivos `latest.json` y `latest.md`. Los informes deben declarar sus archivos fuente mediante `sourceReport` o `sourceReports`. La herramienta calcula SHA-256 sobre los bytes exactos de cada archivo de entrada y salida.

## Uso
Capturar una línea base una sola vez, después de revisar que las seis fases estén completas:

```bash
npm run research:structural-reproducibility -- --capture-baseline
```

Comparar una ejecución posterior:

```bash
npm run research:structural-reproducibility
```

La línea base se guarda en `reports/structural-motif-reproducibility/baseline.json`. El resultado se guarda en `reports/structural-motif-reproducibility/latest.json` y `latest.md`. Para sustituir deliberadamente la referencia se requiere `--capture-baseline --replace-baseline`; no se reemplaza automáticamente.

## Interpretación
- **reproducible**: entradas, método, parámetros, entorno y hashes de salida coinciden.
- **non-reproducible**: con el mismo contexto registrado cambió al menos una huella de salida.
- **context-changed**: cambió una entrada, método, parámetro o entorno.
- **incomplete**: falta alguna fase o archivo necesario.
- **baseline-required**: todavía no existe una línea base válida.

## Límites
La igualdad de hashes confirma identidad byte a byte de los artefactos registrados, no validez científica ni capacidad predictiva. Cambios de formato o saltos de línea alteran las huellas. La herramienta no registra automáticamente el sistema operativo completo, versiones de dependencias ni estado de servicios externos; el entorno registrado es limitado. La cadena reutiliza datos históricos relacionados y no constituye evidencia independiente.
