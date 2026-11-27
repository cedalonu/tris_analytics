# Fase 102 — Registro histórico de experimentos TRIS

## Objetivo
Conservar cada ejecución de la cadena 94–101 como un evento separado, con copias byte a byte de los informes disponibles, sus SHA-256, parámetros de contexto disponibles, identificador Git y estado de integridad.

## Ejecución
Después de generar los informes de fases 94–99 y ejecutar la comparación de Fase101:

```bash
npm run research:structural-experiment-ledger
```

El comando:
- crea una carpeta exclusiva `reports/structural-motif-experiment-ledger/records/<runId>/`;
- copia los artefactos disponibles de fases 94–99 y fase101, incluida la línea base si existe;
- escribe `record.json` en la carpeta de la captura;
- agrega un registro a `ledger.jsonl` sin sustituir capturas anteriores;
- actualiza vistas derivadas `latest.json` y `latest.md`.

Importa `reports/structural-motif-experiment-ledger/latest.json` en el dashboard, pestaña Fase102.

## Integridad operativa
Cada ejecución usa un identificador único y una carpeta creada en modo exclusivo. Los snapshots no se reescriben. El ledger JSONL es append-only por diseño; `latest.json` y `latest.md` son índices derivados que se regeneran. Conserva también una copia externa del directorio completo para respaldo.

## Interpretación
- Una ejecución incompleta se archiva con la lista explícita de artefactos ausentes.
- Una huella de contenido repetida no elimina el evento: pueden existir varias capturas con los mismos bytes.
- Los hashes permiten detectar cambios byte a byte, pero no autentican la fuente original ni la identidad del operador.

## Límites
El historial reside inicialmente en el equipo donde se ejecuta el comando. No se sincroniza automáticamente con GitHub ni con la nube. No es almacenamiento WORM: un usuario con acceso al disco puede modificar o borrar los archivos. Para protección real contra alteraciones, mantener respaldos externos de solo escritura o almacenamiento con retención inmutable.
