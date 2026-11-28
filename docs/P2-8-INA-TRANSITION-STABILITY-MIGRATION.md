# P2.8 — Integración INA de estabilidad y entropía

**Rama:** `research-core-v1`  
**Estado:** parcial; motor y panel conectados, falta retirar cálculo redundante y validar equivalencia.

## Alcance de este checkpoint

- Se reutiliza el motor puro `buildInaTransitionStability`; no se altera su definición estadística.
- Dashboard construye la salida desde el contexto INA activo.
- Centro INA representa la salida versionada: rangos y tamaños de ventanas, entropía por posición y mayores cambios de tasa de transición.
- Se añade prueba de ventanas no superpuestas, conteos, entropía, histórico corto/vacío y rechazo de contexto inválido.
- Registro INA declara los archivos reales del módulo y su consumidor visual.

## Límites

- La comparación es descriptiva; no prueba dependencia ni predicción.
- Con histórico menor a la suma de ventanas, la ventana anterior puede tener menos observaciones.
- La vista general todavía contiene un comparador inline de top-conexiones por 50/150/500 sorteos. Se conserva P2.8 abierto hasta reemplazarlo por salidas INA y demostrar equivalencia.
- Los umbrales y cambios de tasa no se promueven a señales predictivas sin calibración y validación prospectiva.

## Verificación pendiente

TypeScript, build visual, prueba específica, suite de investigación y workflows aplicables deben terminar en verde antes de declarar este checkpoint validado.
