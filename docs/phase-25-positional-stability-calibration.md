# Fase 25 — calibración sintética de estabilidad posicional

## Objetivo
Medir la respuesta de las clasificaciones stable-dominant y variable-dominance ante procesos generadores conocidos, antes de interpretar perfiles reales.

## Escenarios
1. Uniforme estacionario e independiente.
2. Concentración estacionaria fija en el dígito 7.
3. Cambio abrupto de concentración del dígito 2 al 8.
4. Desplazamiento gradual de probabilidad del dígito 2 al 8.
5. Pulso temporal de concentración en 8 y retorno a 2.

Las etiquetas son metadatos exógenos sintéticos constantes. No son salidas del clasificador; así se aísla la auditoría de estabilidad.

## Métricas y ejecución
Conteos por posición, tasas por réplica e intervalos Wilson descriptivos para criterios agregados de al menos cuatro de cinco posiciones estables o variables.

Comando: npm run research:positional-stability-calibration

Variables: TRIS_POSITIONAL_STABILITY_REPS (200), TRIS_POSITIONAL_STABILITY_DRAWS (151), TRIS_POSITIONAL_STABILITY_SEED (20261128), TRIS_REGIME_POSITION_BLOCK_SIZE (25), TRIS_REGIME_POSITION_BLOCK_MIN_SUPPORT (10).

Reportes locales: reports/positional-stability-calibration/latest.json y latest.md.

## Límites
La consistencia se compara con el dominante agregado de todo el régimen; no es evaluación fuera de muestra. Bloques y posiciones dentro de una réplica pueden depender. Un pulso breve contenido en un bloque puede pasar inadvertido. Los intervalos se calculan sobre réplicas, no sobre posiciones como si fueran independientes.

No se usa CSV real, API, polling ni descarga. No se optimizan umbrales ni se afirma predictibilidad o sesgo físico.
