# INA Core — contrato técnico compartido v1

**Etapa:** P1.1 del plan maestro TRIS  
**Rama:** `research-core-v1`  
**Estado:** contrato implementado como tipos y funciones puras; integración de consumidores pendiente (P1.2/P1.3).

## 1. Propósito

Definir una identidad única del histórico que todos los motores y vistas puedan compartir. INA no debe aceptar un resultado analítico que no declare de qué snapshot, huella y corte proviene.

## 2. Tipos implementados

En `src/research/ina-contracts.ts`:
- `DatasetSnapshot`: URL de origen, hora de captura, SHA-256, tamaño opcional, cantidad de filas, rango de concursos y metadatos HTTP.
- `DatasetVersion`: identidad determinista por SHA-256 y último concurso, rango y tamaño.
- `InaContext`: versión, snapshot, sorteos ordenados, calidad de datos y hora de construcción.
- `ResearchOutput<T>`: salida genérica de un motor con módulo, versión del motor, parámetros, resultado, evidencia, warnings, versión/hash/corte y tamaño de muestra heredados de INA.
- `EvidenceStatus`: observed, descriptive, exploratory, backtested, holdout, prospective, accepted-experimental y quarantined.
- `InaModuleDefinition`: registro de motor, entradas y salidas.

## 3. Reglas de integridad

1. La URL de fuente debe ser HTTP(S), la captura y construcción deben tener timestamps válidos y el digest debe tener 64 caracteres hexadecimales.
2. La cantidad de filas y los concursos inicial/final declarados deben coincidir con las filas validadas.
3. Los errores del validador, duplicados o resultados que no contengan cinco dígitos 0–9 hacen que el contexto quede inválido.
4. Los warnings no se ocultan ni se convierten automáticamente en errores; el consumidor debe decidir si el tipo de warning es tolerable.
5. Un contexto inválido no puede publicar una salida de investigación.
6. Toda salida hereda del contexto su `datasetVersionId`, `snapshotSha256`, `drawCutoff` y `sampleSize`. El módulo no puede sobrescribir esos valores.
7. `ID` del CSV no forma parte del contrato ni de la identidad estadística.

## 4. Versionado y límites

El identificador es `tris:<sha256>:<drawCutoff>`. El SHA-256 debe provenir de la captura verificada, no de una huella improvisada del navegador. La identidad cambia si cambia el snapshot, incluso si el último concurso no cambia. Un snapshot vacío conserva un corte nulo.

El contrato no implementa todavía persistencia, invalidación de dependencias, actualización automática ni un catálogo de resultados; esos son trabajos P1.2, P1.3 y P4. El servicio tampoco certifica que un hash declarado corresponda a los bytes: esa comprobación pertenece a la etapa de ingestión.

## 5. Pruebas

`src/research/ina-core.test.ts` cubre orden cronológico, identidad/corte, discrepancia de rango y conteo, errores de validación, publicación de salida con metadatos heredados, metadatos inválidos y dataset vacío.

## 6. Estado

- [x] Tipos compartidos iniciales.
- [x] Construcción determinista del contexto.
- [x] Validación de identidad y rango de snapshot.
- [x] Contrato de salida que hereda versión/hash/corte.
- [x] Pruebas unitarias específicas.
- [ ] Registro ejecutable de módulos y dependencias (P1.3).
- [ ] Consumidores conectados al contexto único (P2/P3).
- [ ] Propagación automática de actualizaciones (P4).
