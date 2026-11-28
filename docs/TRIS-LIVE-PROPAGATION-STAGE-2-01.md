# TRIS — Etapa 2: propagación en el ciclo live (checkpoint 01)

**Fecha:** 2026-11-28  
**Rama:** `research-core-v1`  
**Commit de implementación:** `659480882a7adb0c04ade6bd865bee70c65ea478`  
**Estado:** propagación inicial implementada y validada en el ciclo live; cobertura completa de módulos pendiente.

## 1. Hallazgo operativo

El workflow `.github/workflows/tris-live-prospective.yml` ya consulta Pakin cada hora al minuto 25 UTC, valida el CSV, conserva un snapshot direccionado por contenido, ejecuta el ciclo prospectivo y publica el histórico canónico.

Sin embargo, la publicación de `data/canonical/Tris.csv` se realiza con `GITHUB_TOKEN`. Los pushes realizados por el token de GitHub Actions no deben tratarse como un disparador fiable de otros workflows. Por tanto, no era suficiente depender del workflow `tris-research.yml` para ejecutar una auditoría downstream después de cada actualización canónica.

## 2. Cambio implementado

El workflow live ahora ejecuta, en la misma ejecución que captura y publica el CSV:

```sh
npm run research:ina-canonical-audit -- data/canonical/Tris.csv data/canonical/source-manifest.json
```

La auditoría se ejecuta después de copiar el snapshot validado y su manifiesto a la ubicación canónica. Si la auditoría falla, el ciclo live falla y no puede presentar la propagación como satisfactoria.

El reporte `reports/ina-canonical-audit/latest.json` y su versión Markdown se agregan al artefacto `tris-live-prospective-ledger`, y el resumen del workflow incorpora el resultado.

## 3. Cobertura real de esta auditoría

La auditoría reconstruye desde el mismo snapshot canónico:

- Contexto compartido INA y perfil posicional.
- Ausencia posicional.
- Estabilidad de transiciones en ventanas 50/50.
- Comparación de ventanas de transición 50/150/500.

Comprueba para cada salida auditada:

- `datasetVersionId` coincidente con el contexto INA.
- SHA-256 coincidente con los bytes canónicos.
- Mismo concurso de corte.
- Mismo tamaño de muestra.
- Comprobaciones de conexión de código entre dashboard y salidas INA.

La auditoría es descriptiva. No acredita capacidad predictiva ni sustituye una inspección visual en navegador.

## 4. Qué no se declara todavía

Este cambio **no** certifica que los 82 expedientes, todos los módulos del registro INA, todos los reportes históricos ni todas las visualizaciones estén actualizados sorteo a sorteo.

La auditoría actual cubre explícitamente las salidas enumeradas en la sección 3. Los demás módulos deben incorporarse a una matriz de propagación con estados `verified`, `pending` o `blocked`, basados en pruebas de corte, hash y correspondencia; la presencia de código no será evidencia suficiente.

Tampoco se considera probado el comportamiento ante una corrección retroactiva del histórico de Pakin. Esa ruta requiere comparar el nuevo snapshot con el prefijo canónico previo y poner en cuarentena cualquier alteración antes de reemplazar el histórico.

## 5. Correcciones operativas durante la validación

- El primer intento con la nueva auditoría INA terminó correctamente en el run `46179666650`: captura, publicación canónica, auditoría INA y carga del artefacto completadas.
- La revisión del artefacto detectó que `upload-artifact` conserva las rutas bajo `data/cycles` y `data/source-snapshots`, mientras que el paso de restauración esperaba directorios en la raíz. Se corrigió la restauración para aceptar ambas estructuras.
- Se añadió al capturador una guarda del prefijo canónico: verifica CSV+manifiesto previos, hash, tamaño, rango, conteo y huella lógica del prefijo antes de aceptar la nueva fuente. Las modificaciones retroactivas se rechazan en vez de sobrescribirse.
- Tras corregir la restauración, el run live `46179854472` terminó `success` con el código que incluye la guarda del prefijo.
- En ese ciclo, la fuente mantuvo el corte 37007 y la guarda reportó `newDrawCount: 0`: no había un sorteo nuevo que propagar. La auditoría INA pasó sobre 25,975 registros, rango 11033–37007 y SHA-256 `e77a3ef65259bff02fded5490714edf8caf5e6c4f1bd854f6f457918f948c1a6`.
- El artefacto live se publicó correctamente. Esto prueba el ciclo sin cambios y la auditoría sobre el corte vigente; todavía no prueba la llegada de un concurso nuevo ni el rechazo real de una modificación retroactiva.

## 6. Pruebas de aceptación pendientes

- [x] Workflow live ejecuta la auditoría INA después de cada captura y termina en `success` (run `46179854472`).
- [x] Artefacto live contiene los reportes de auditoría (run `46179854472`).
- [x] El resumen del job muestra corte, filas y SHA-256 del snapshot auditado.
- [x] Un snapshot repetido conserva el corte y no crea un nuevo ciclo; el ledger auditó 6 ciclos y 489 outcomes ya resueltos sin duplicación.
- [ ] Un nuevo concurso cambia la versión del dataset y el corte de todas las salidas auditadas.
- [ ] Una alteración de un sorteo histórico anterior se rechaza o se pone en cuarentena.
- [ ] Se amplía la cobertura desde estas salidas iniciales al resto de módulos INA y expedientes.
- [ ] Se verifica la representación en navegador, no solo la conexión por inspección de código.

## 7. Siguiente tarea

Implementar la comparación de prefijo histórico en el proceso live y crear el manifiesto de propagación por módulo/expediente. Ningún componente se marcará como actualizado si su versión de dataset no coincide con el snapshot canónico del ciclo.
