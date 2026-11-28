# Auditoría del catálogo de fases — checkpoint 01

**Fecha:** 2026-11-28  
**Rama:** `research-core-v1`  
**Catálogo:** `src/ResearchPhaseCatalog.tsx`  
**Objetivo:** corregir la clasificación inicial y separar evidencia documental, existencia de componentes y conexión funcional comprobada.

## Resultado de la conciliación

El árbol del repositorio contiene expedientes de fase identificables en estos bloques:

| Bloque | Fases | Cantidad | Fuente documental |
|---|---:|---:|---|
| Roadmap inicial | 0–13 | 14 | `docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md` |
| Regímenes posicionales | 23–30 | 8 | `docs/phase-23…30-*.md` |
| Decisiones, estabilidad y auditoría | 59–68 | 10 | `docs/research/phase-59…68-*.md` |
| Evolución, comunidades y motivos | 70–99 | 30 | `docs/research/phase-70…99-*.md` |
| Centro de evidencia y análisis posicional conjunto | 100–119 | 20 | `docs/research/phase-100…119-*.md` |

**Total: 82 expedientes localizados.** Se verificó automáticamente que las 102 referencias de documento/componente declaradas en el catálogo apuntan a rutas existentes en el árbol de `research-core-v1` (89 rutas únicas, sin referencias rotas).

## Correcciones realizadas

1. Se retiraron los registros 41–45 del catálogo de fases. La revisión no encontró expedientes formales de fase con esos identificadores; se habían asociado indebidamente a un panel genérico.
2. Para 100–119 se separó la referencia documental de la ruta del componente visual.
3. “Componente localizado” ya no se presenta como “vista conectada”. La existencia de un archivo TSX no demuestra que esté montado en una ruta activa ni que consuma la salida versionada correcta.
4. Se eliminaron las etiquetas “importación manual” asignadas artificialmente a fases 41–45. La carga manual que existe en el dashboard es una brecha transversal de consumo de informes, no una fase analítica 41–45 acreditada.

## Huecos que permanecen abiertos

Los números 14–22, 31–58 y 69 no aparecen como expedientes de fase formalmente conciliados en este catálogo. **No se declaran inexistentes**: deben buscarse en roadmaps anteriores, commits, scripts, informes y conversaciones de desarrollo antes de cerrar el inventario histórico.

El programa denominado “fase 120” está descrito en `docs/TRIS-FASE-RECONCILIACION-0-13-Y-PROGRAMA-120.md` como un programa paraguas de cierre operativo de seis objetivos, no como una fase analítica 120 adicional.

## Estado de integración — lectura conservadora

- 82 expedientes documentales localizados.
- 24 rutas visuales localizadas en el catálogo; se añadieron referencias específicas para fase 0 (`src/App.tsx`), fase 1 (`src/TrisOpsDashboard.tsx`), fase 3 (`src/InaProspectivePanel.tsx`) y fase 4 (`src/InaMemoryPanel.tsx`).
- 0 expedientes declarados plenamente `verified`; fases 0, 1, 3 y 4 están `partially_verified`; fase 0 tiene paridad de 25,976 filas, fase 1 tiene paridad parcial, fase 3 valida 589 resoluciones contra el histórico canónico y fase 4 tiene pruebas sintéticas; los otros 78 permanecen `unverified`.
- 58 expedientes todavía sin una ruta visual específica registrada aquí; esto significa **sin correspondencia catalogada**, no que no exista ninguna visualización en el repositorio.
- La matriz `docs/MATRIZ-INVESTIGACION-VISUAL-01.md` continúa siendo la autoridad para el estado investigación → motor → salida → visualización y sus brechas.

La publicación automática ya se implementó para el informe prospectivo: `public/research-data/prospective-evaluation.json` se actualiza cuando cambia el ledger congelado y el workflow despacha un despliegue. La integración automática de los demás informes `reports/**` sigue pendiente; se requiere un índice público versionado (corte, hash, workflow run, fecha, ruta y estado) y consumo automático en UI sin confundir informes faltantes con resultados cero.

## Evidencia y límites

- Revisión estática del árbol GitHub de `research-core-v1`.
- Validación de existencia de las rutas declaradas por el catálogo.
- No se ejecutó en este checkpoint una prueba navegador de montaje de cada componente.
- No se hizo paridad numérica motor↔vista para las 82 fases.
- No se considera aprobada estadísticamente ninguna hipótesis por la mera presencia de un expediente o componente.

## Commits del checkpoint

- `5e22831d`: primer catálogo de fases.
- `5cfb19bc`: integración del catálogo en el Centro de investigación.
- `e0e2d5e2`: primera corrección de estados y referencias documentales/visuales.
- `718cab47`: corrección de filtros y tipado del catálogo.

## Siguiente tarea

Diseñar y ejecutar la publicación automática de informes de GitHub Actions para el dashboard: índice público versionado, archivos JSON realmente producidos por workflows, procedencia completa y consumo automático en UI. Después, reconciliar los huecos numéricos con evidencia histórica y completar el mapeo visual de los expedientes 0–99.


## Checkpoint de visualización — 2026-11-28

Live run `46185821125` confirmó sobre el snapshot 37008: 82 documentos localizados, 24 visualizaciones localizadas, 58 sin ruta visual catalogada, 0 referencias visuales rotas, 0 expedientes plenamente verificados, 4 `partially_verified` (fases 0, 1, 3 y 4) y 78 `unverified`. El despliegue de la vista previa con las cuatro rutas nuevas terminó en success en run `46185821059`.

El catálogo ahora reconoce explícitamente las vistas de fases 0, 1, 3 y 4. La publicación automática del evaluador prospectivo está activa, pero no se extiende a todos los informes de las 82 investigaciones. La siguiente tarea sigue siendo construir el índice público general de informes y conectar las vistas específicas, sin marcar como actuales los expedientes que no tienen prueba de paridad.


## Checkpoint de evidencia fase 0 — 2026-11-28

El nuevo runner `scripts/run-tris-phase-0-adapter-audit.ts` ejecutó el cargador de producción con un fetcher controlado que sirve los mismos bytes y manifiesto del snapshot oficial. Validó SHA-256, longitud, filas, rango, fechas, estado INA, guard de prefijo idempotente y el mapeo canónico→dashboard.

Evidencia publicada en `public/research-data/research-phase-audit.json` (corte 37008, 25,976 filas, SHA `3a7c40e21738f8d181c7bab725c0c8de023496a4c7dc65d97a246565068907b2`):
- Motor y entrada canónica: `verified`.
- Output `data.canonical-adapter`: `verified`.
- Prefijo histórico: `verified`, idempotente.
- Paridad numérica: 25,976/25,976 filas; IDs, cinco dígitos y fechas coinciden.
- Montaje y binding: confirmados por código.
- Estado global: `partially_verified`, porque la inspección real del navegador y fallback visual sigue pendiente.

El inventario actualizado registra 82 documentos, 24 visualizaciones localizadas, 58 sin ruta visual catalogada, 1 parcial, 81 sin verificar y 0 bloqueados. No se extiende la evidencia de fase 0 a las demás investigaciones.


## Checkpoint de evidencia fases 1, 3 y 4 — 2026-11-28

Live run `46188347254` terminó success y publicó el inventario actualizado:
- **Fase 1 — descriptiva, pools y memoria:** 10 outputs con el mismo datasetVersionId/hash/corte; 7 módulos INA requeridos current; bindings de dashboard verificados por código. Paridad numérica parcial: overview y ausencia tienen comprobaciones, pero faltan fixtures independientes para recurrencia, pools, aging y transiciones.
- **Fase 3 — señales y ciclos prospectivos:** ledger clean; 7 ciclos, 689 pronósticos congelados, 589 resueltos y 100 pendientes; cada resultado resuelto coincide con el concurso canónico. Panel estático montado y publicado. Falta revisión visual y evaluación independiente de ventaja predictiva.
- **Fase 4 — memoria posicional/contextual:** output `research.memory-state` reconstruido desde el mismo INA context; 3 alcances temporales y contextuales, panel con selectores de alcance, rezago, posiciones y contexto. Pruebas sintéticas presentes; falta paridad numérica independiente sobre todo el histórico y revisión visual.

El reporte público se normaliza para no generar despliegues horarios por cambios de `fetchedAt`. Estado del inventario: 82 documentos, 24 visualizaciones localizadas, 58 sin ruta visual catalogada, 4 parciales, 78 unverified, 0 bloqueados y 0 plenamente verificados. La vista previa fue desplegada con éxito en run `46188347255`.
