# Fase 26 — contraste de perfiles posicionales entre regímenes

## Objetivo
Determinar si una concentración por posición se mantiene, cambia de dígito dominante o cambia de distribución entre regímenes, y si cada perfil tiene estabilidad interna por bloques.

## Comparaciones por posición R1–R5
- Dominante y frecuencia dominante en cada régimen.
- Diferencia absoluta de frecuencia dominante.
- Diferencia absoluta de entropía (bits).
- Distancia Jensen–Shannon entre distribuciones empíricas (normalizada por su rango natural [0,1]).
- Clasificación descriptiva:
  - `persistent-same-dominant`: ambos regímenes tienen estabilidad interna `stable-dominant` y comparten dígito dominante.
  - `regime-specific-dominant`: ambos son estables internamente, pero el dígito dominante cambia.
  - `distribution-shift`: la distancia Jensen–Shannon alcanza 0.10 o la diferencia de entropía alcanza 0.25 bits.
  - `not-established`: soporte suficiente, pero no se cumplen las reglas anteriores.
  - `insufficient`: alguno de los regímenes no alcanza el soporte mínimo (30 por defecto).

Los umbrales son explícitos y descriptivos, no optimizados por aciertos. La estabilidad interna se hereda de la fase 24 y requiere al menos tres bloques soportados.

## Integración y ejecución
El flujo `npm run research:regime-analysis -- <local-Tris.csv> [ledger-directory]` agrega el contraste al JSON de diagnóstico y al reporte Markdown.

Parámetros:
- `TRIS_REGIME_CONTRAST_MIN_SUPPORT` (30).
- `TRIS_REGIME_CONTRAST_JS_THRESHOLD` (0.10).
- `TRIS_REGIME_CONTRAST_ENTROPY_BITS` (0.25).

## Límites
Las comparaciones son observacionales, secuenciales y descriptivas. Un mismo dominante no implica distribuciones idénticas; un dominante distinto no demuestra causalidad. No hay p-valores ni supuestos de independencia. No se demuestra sesgo físico ni predictibilidad. No cambia pronósticos, candidatos, pesos, portafolios o ledger.

Sin APIs, polling ni descargas; usa únicamente CSV y ledger locales.
