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
- 20 componentes visuales localizados para el bloque 100–119.
- 0 conexiones funcionales declaradas como verificadas por este catálogo.
- 62 expedientes todavía sin una ruta visual específica registrada aquí; esto significa **sin correspondencia catalogada**, no que no exista ninguna visualización en el repositorio.
- La matriz `docs/MATRIZ-INVESTIGACION-VISUAL-01.md` continúa siendo la autoridad para el estado investigación → motor → salida → visualización y sus brechas.

La integración automática de los informes sigue pendiente. El workflow de historia real genera informes bajo `reports/**` y los conserva como artefacto de Actions; el dashboard actual todavía recibe varios de esos informes mediante selección manual de JSON. La siguiente tarea debe publicar un índice de informes versionado (corte, hash, workflow run, fecha, ruta y estado de disponibilidad) y hacer que la UI consuma ese índice sin confundir informes faltantes con resultados cero.

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
