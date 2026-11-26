# Phase 68 — Comparador de paquetes reproducibles

## Objetivo
Comparar dos exportaciones JSON de la Fase 67 (A como referencia y B como revisión) y separar diferencias en registros/datos de diferencias de configuración.

## Métricas
- Huella de cada paquete y bandera de datos distintos.
- Configuración distinta, reportada aparte.
- Candidatos agregados, retirados, modificados o sin cambios.
- Cambios en clasificación y conteo de historial/resueltos.
- Rango descriptivo calculado ordenando el último valor resuelto descendente, desempate alfabético; delta de rango (negativo = mejora en el orden).
- Cambios en campos: historial, clasificación, resueltos, rango.

## Validación y límites
Valida schema, fingerprint, arreglo de snapshots, candidateKey único, y campos básicos de snapshots. Si un paquete es inválido, no calcula diffs. Los rangos son un resumen descriptivo derivado del valor `resolved`, no ranking predictivo ni ranking oficial de prioridad. Fingerprint FNV-1a es no criptográfico. Comparación offline, no modifica archivos ni ledger.
