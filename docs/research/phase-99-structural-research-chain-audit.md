# Fase 99 — Auditoría de la cadena TRIS

Comprueba estructura y trazabilidad declarada de informes 94–98: presencia, método, esquema de filas, duplicados, huecos, rutas de origen, hash SHA-256, claves de grupo y campos esenciales.

## Ejecución
```bash
npm run research:structural-chain-audit
npm run research:structural-chain-audit -- path/94.json path/95.json path/96.json path/97.json path/98.json
npm run test:research
```
Salida: reports/structural-motif-research-chain-audit/latest.json y latest.md.

Estados: passed (sin hallazgos), review-required (advertencias) y blocked (informes ausentes o errores).

La auditoría no certifica el CSV ni las hipótesis. El hash identifica el archivo local, no autentica la fuente externa. Las fases comparten datos y no son evidencia independiente ni validación prospectiva.
