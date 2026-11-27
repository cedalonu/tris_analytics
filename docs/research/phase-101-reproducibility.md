# Fase 101 — Evaluación de reproducibilidad

## Alcance
Compara los informes de las fases 94–99 con una línea base local. Para cada fase registra:
- SHA-256 de cada archivo de entrada declarado en `sourceReport` o `sourceReports`.
- Método y configuración declarados por el informe.
- SHA-256 de `latest.json` y `latest.md`.
- Entorno Node/plataforma/arquitectura y versión del paquete.

La huella de salida se calcula sobre los bytes exactos del archivo. Una diferencia de formato también cambia el hash y se reporta, sin intentar normalizarla.

## Uso

Genera primero la cadena completa 94–99. Después captura una referencia:

```bash
npm run research:structural-reproducibility -- --capture-baseline
```

Vuelve a ejecutar las fases 94–99 con las mismas entradas, parámetros y semillas, y compara:

```bash
npm run research:structural-reproducibility -- --compare
```

La línea base se guarda en `reports/structural-motif-reproducibility/baseline.json`; el último resultado queda en `latest.json` y `latest.md`. La captura no sobrescribe una línea base existente. Para sustituirla deliberadamente:

```bash
npm run research:structural-reproducibility -- --capture-baseline --replace-baseline
```

## Interpretación
- `reproducible`: entradas, parámetros y hashes de salida coinciden.
- `non-reproducible`: entradas y parámetros coinciden, pero cambió una salida.
- `changed-inputs`, `changed-settings`, `changed-context`: hubo un cambio de contexto; no se etiqueta como fallo de determinismo.
- `not-evaluable`: falta un artefacto o una entrada declarada.
- `baseline-required`: aún no existe una referencia válida.

## Limitaciones
Los hashes verifican identidad de bytes, no autenticidad de la fuente ni validez estadística. El entorno se informa, pero una diferencia de entorno no determina por sí sola el resultado. Solo se rastrean entradas declaradas por los informes; dependencias externas no registradas quedan fuera. Repetir la misma ejecución no demuestra que el método sea predictivo.
