# P2.1 — Migración del resumen posicional a INA

**Estado:** implementado y validado por TypeScript, build y suite de pruebas.  
**Rama:** `research-core-v1`

## Problema resuelto

Antes, `ResearchSignalOverview` recibía `Draw[]` directamente y calculaba su propio resumen. El dashboard además cargaba CSV canónico y caché local por dos rutas independientes, sin una identidad común de snapshot.

## Cambios realizados

1. `ina-snapshot.ts` convierte el manifiesto canónico en `DatasetSnapshot`, calcula SHA-256 de CSV local y verifica los bytes descargados contra el hash del manifiesto.
2. `DatasetSnapshot` distingue origen remoto y local; los archivos locales no reciben una URL remota ficticia.
3. `TrisOpsDashboard` descarga CSV y manifiesto en paralelo, comprueba SHA-256, valida filas y crea INA Core antes de publicar los sorteos en el estado del dashboard.
4. La restauración local sólo se permite si existe snapshot guardado y vuelve a pasar la validación INA. La caché antigua sin hash/metadatos ya no puede imponerse silenciosamente al histórico oficial.
5. La importación manual genera su propio snapshot local con hash y metadatos.
6. `ina-dashboard-overview.ts` genera `ResearchOutput` con la misma versión/hash/corte del contexto INA y verifica su correspondencia con el registro de módulos.
7. `ResearchSignalOverview` dejó de recibir `Draw[]`; recibe el contexto INA y representa la salida del motor. La vista muestra identificador de versión, prefijo SHA-256, corte y tamaño de muestra.

## Pruebas y ejecución

- SHA-256 estándar para bytes exactos.
- Manifiesto remoto convertido a snapshot.
- Snapshot local sin URL remota inventada.
- Verificación positiva y negativa de bytes contra el digest.
- Resumen posicional con herencia de versión, hash, corte y muestra.
- Rechazo de contexto en cuarentena.
- TypeScript, build visual, suite de investigación y build de integración histórica aprobados en:
  - [Research validation 46121566269](https://github.com/cedalonu/tris_analytics/actions/runs/46121566269)
  - [Real-history validation 46121566242](https://github.com/cedalonu/tris_analytics/actions/runs/46121566242)

## Límites que permanecen

- Otras secciones del dashboard todavía calculan frecuencias, recurrencia, pools y transiciones directamente desde `Draw[]`; se migrarán por separado en P2.
- El ledger prospectivo sigue en un estado de almacenamiento/importación separado; su conexión a INA será otro bloque.
- La ejecución de CI prueba compilación y tests; la verificación SHA-256 en el navegador se ejecutará cuando la aplicación se abra con la fuente real. El código ya detiene la carga si el hash no coincide.
- La sección INA de red aún no consume el catálogo completo de conocimiento.

## Criterio de cierre de este subpaso

- [x] CSV remoto ligado al manifiesto por SHA-256.
- [x] Snapshot local explícito y verificable.
- [x] Cache antigua sin snapshot no se restaura como dato confiable.
- [x] Contexto INA compartido para el resumen posicional.
- [x] Salida de motor trazable en la visualización.
- [x] CI: TypeScript, build y pruebas aprobadas.
