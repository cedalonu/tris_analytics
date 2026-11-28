# TRIS — Auditoría de adaptador, importación e integridad

**Fecha:** 2026-11-28  
**Rama:** `research-core-v1`  
**Etapa:** 1 — Auditoría y estabilización  
**Estado:** implementación realizada; cierre sujeto a CI verde y validación real del flujo.

## 1. Alcance y arquitectura existente

La captura oficial de Pakin ya está automatizada en `.github/workflows/tris-live-prospective.yml`:

- Se ejecuta cada hora al minuto 25 (cron UTC), además de los eventos de push y ejecución manual.
- Invoca `npm run research:cycles:source`, que consulta `https://raw.githubusercontent.com/pakinja/pakin/master/Tris.csv`.
- El proceso valida el CSV, crea un snapshot con nombre derivado del concurso final y SHA-256, y ejecuta el ciclo y su auditoría contra el mismo snapshot.
- El workflow publica el histórico validado en `data/canonical/Tris.csv` y `data/canonical/source-manifest.json`.
- El ledger prospectivo se restaura desde el último artefacto exitoso y se vuelve a publicar como artefacto de Actions.

La tarea de esta etapa no es duplicar esa captura. Es reforzar el adaptador y las puertas de integridad utilizadas por el proceso automático.

Componentes relacionados:

- `src/research/data-adapter.ts`: importador CSV.
- `scripts/run-tris-cycles-source.ts`: captura oficial y snapshot; delega la puerta del prefijo canónico al validador testeable `src/research/canonical-prefix-guard.ts`.
- `src/research/tris-csv-sync.ts` y `scripts/run-tris-sync.ts`: detector incremental local/manual; no sustituye al workflow de captura.
- `data/canonical/source-manifest.json`: manifiesto del snapshot canónico.
- `src/research/load-canonical-tris.ts`: verificación de SHA-256, tamaño, conteo, rango, fechas de borde, continuidad y preparación INA.
- `src/App.tsx`: la aplicación principal ahora intenta cargar el histórico canónico verificado al iniciar; solo recurre a caché local si la fuente canónica falla y muestra una advertencia de posible desactualización.
- `.github/workflows/tris-research.yml`: auditoría de salidas INA y conexiones del dashboard cuando cambia el código o el histórico canónico.

## 2. Línea base observada

El manifiesto canónico consultado en esta auditoría declara:

| Campo | Valor |
|---|---|
| Fuente | Pakin `Tris.csv` |
| Último concurso | 37007 |
| Primer concurso | 11033 |
| Registros | 25,975 |
| Última fecha de sorteo | 2026-11-27 |
| SHA-256 | `e77a3ef65259bff02fded5490714edf8caf5e6c4f1bd854f6f457918f948c1a6` |
| Tamaño | 958,251 bytes |

El ciclo live de Actions `46179007511` terminó `success` y confirmó el mismo snapshot: 25,975 registros, corte 37007 y la misma huella SHA-256. Esto acredita una captura/validación correcta en esa ejecución; no demuestra que hubiera llegado un sorteo nuevo ni que todos los motores de investigación hubieran actualizado sus salidas.

## 3. Hallazgos y correcciones

### Adaptador CSV

Se corrigió `src/research/data-adapter.ts` para:

- Interpretar campos entre comillas, comas dentro de campos citados y comillas escapadas.
- Detectar CSV vacío y encabezados obligatorios ausentes o duplicados.
- Rechazar filas incompletas y registros con comillas mal formadas.
- Exigir `CONCURSO`, `R1`–`R5` y `FECHA`.
- Rechazar fechas ausentes, no interpretables e imposibles en formato ISO.
- Mantener `CONCURSO` como única clave; la columna `ID` sigue fuera del modelo.
- Conservar la detección de duplicados y huecos en la secuencia de concursos.

### Sincronizador incremental local

Se reforzó `src/research/tris-csv-sync.ts` para:

- Validar cada registro incluso si el llamador evita el adaptador.
- Rechazar fechas ausentes o inválidas.
- Validar formato SHA-256, corte, conteo y fecha del checkpoint antes de usarlo.
- Seguir rechazando alteraciones del prefijo histórico y lotes con huecos.
- Mantener idempotencia: un snapshot repetido no produce sorteos nuevos.

### Captura automática

Se reforzó `scripts/run-tris-cycles-source.ts` para:

- Pasar la marca de captura al adaptador.
- No depender de una comparación literal y frágil del encabezado antes de parsear el CSV.
- Verificar los bytes de un snapshot ya existente cuyo nombre está basado en su hash.
- Mantener inmutables el snapshot y su manifiesto; una consulta horaria sin cambios no debe generar commits de datos repetidos.
- Dejar explícito que el calendario lo administra GitHub Actions, no un bucle interno del script.

## 4. Pruebas añadidas

- CSV vacío.
- Encabezados ausentes y duplicados.
- Dígitos fuera del rango 0–9.
- Fecha ausente, inválida e imposible.
- Fila incompleta.
- Campos citados y comas dentro de campos citados.
- Comillas mal formadas.
- `CONCURSO` como clave e indiferencia de `ID`.
- Duplicados y huecos.
- Checkpoint mal formado.
- Valores de sorteo inválidos.
- Fechas ausentes o inválidas en la entrada del sincronizador.
- Repetición del mismo snapshot y protección del prefijo histórico.
- Fixture del guard del runner: acepta append intacto, rechaza cambio retroactivo de dígitos, CSV/manifiesto huérfanos, snapshot previo corrupto e histórico entrante truncado (`src/research/canonical-prefix-guard.test.ts`).

**CI:** los workflows de validación fueron iniciados para los cambios de esta etapa. Su estado final debe registrarse antes de cerrar la etapa; no se marca como exitoso mientras siga `in_progress` ni se oculta un fallo de un intento anterior.

## 5. Refuerzo adicional de la puerta canónica (2026-11-28)

Se detectó que el cargador compartido verificaba hash, bytes y número de filas, pero no contrastaba de forma explícita los límites de concurso ni las fechas de borde declaradas por el manifiesto. Se añadió `assertCanonicalManifestMatchesDraws` en `src/research/load-canonical-tris.ts` para comprobar:

- Esquema, SHA-256 con formato válido, fecha de captura y metadatos numéricos.
- Tamaño exacto en bytes y número exacto de filas.
- `earliestDrawId` y `latestDrawId` contra el primer y último concurso importado.
- `earliestDate` y `latestDate` contra las fechas de esos concursos.

Se añadió `src/research/load-canonical-tris.test.ts` con pruebas de éxito y rechazo para conteo, rango, fechas, SHA-256, timestamp y tamaño. Esta puerta corre antes de construir el contexto INA; cualquier discordancia detiene la carga.

## 6. Verificación de la puerta retroactiva a nivel del runner (2026-11-28)

La validación de prefijo se extrajo a `validateCanonicalPrefix` y ahora la invoca directamente `scripts/run-tris-cycles-source.ts` antes de crear snapshots o lanzar el ledger. Esto permite probar la misma puerta que ejecuta el workflow sin tocar el CSV oficial.

Los fixtures sintéticos cubren cinco rutas: append válido, mutación de un sorteo histórico, CSV/manifiesto desparejados, snapshot previo cuyo hash no coincide y truncamiento del histórico entrante. El caso de mutación debe fallar antes de cualquier escritura. Research core checks run `46182581025` terminó `success`; su log confirma que el fixture de mutación retroactiva pasó (`ok 24`) y también pasaron los cuatro controles restantes. El ciclo live run `46182612431` terminó `success` con el mismo histórico 37008 y `newDrawCount: 0`, demostrando que la extracción del guard no alteró el comportamiento idempotente.

## 7. Pendientes para cerrar Etapa 1

- [x] TypeScript, pruebas del núcleo y fixture de mutación retroactiva en verde: Research core run `46182581025` (HEAD de código `526a82d3`).
- [x] Build y despliegue de la vista previa en verde: run `46182580991`.
- [x] Validación real-histórica extensa completada en run `46182720859`: success.
- [x] Auditoría INA y construcción del dashboard verificadas; runs posteriores `46185535815` completaron TypeScript/build/auditoría de wiring antes de calibración sintética final.
- [x] Captura live y auditoría del corte 37008 completadas: run `46185535779`, success; 25,976 filas, hash canónico coincidente.
- [x] Despliegue combinado del dashboard y payload estático: run `46185535796`, success.
- [ ] Inspección visual manual en navegador del loader, indicador de corte y fallback de caché.

## 8. Límites de esta entrega

- La carga inicial de `App.tsx` ahora usa el loader canónico, pero la ruta manual de importación CSV sigue disponible y puede sustituir el conjunto de datos durante la sesión.
- `App.tsx` y `TrisOpsDashboard.tsx` usan el loader canónico; el indicador de corte, fecha de captura y SHA está integrado. La inspección manual de navegador permanece pendiente.
- La propagación INA está verificada para 11 módulos en corte 37008; la auditoría de los 82 expedientes sigue separada y todavía reporta 82 `unverified`.
- La captura horaria de Pakin ejecuta guard retroactivo, reconstrucción INA, evaluación prospectiva y auditoría de fases; cada ciclo conserva el snapshot y los reportes de evidencia.
- El workflow real-histórico usa un snapshot fechado de noviembre 25 para pruebas reproducibles; no debe confundirse con el histórico canónico live.
- No se altera `main`.
