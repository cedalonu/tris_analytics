# Fase 29 — concordancia entre dominancia posicional y dinámica de pools

## Propósito
Contrastar dos descripciones distintas: la persistencia/cambio del dígito dominante observado por posición y el comportamiento de pools construidos con historia anterior. No se presupone que coincidan ni que una variable prediga la otra.

## Método
- Reutiliza los bloques fijos, consecutivos y no solapados de la fase 24.
- Para cada régimen, posición, bloque, método y tamaño de pool, construye el pool de cada concurso objetivo usando exclusivamente concursos anteriores a ese objetivo.
- Métodos: frequency, long-absence, short-absence, balanced y recent-frequency.
- Tamaños predeterminados: 3, 5 y 7; se pueden ajustar mediante las opciones del módulo.
- Calcula acierto del pool frente al resultado del objetivo, referencia uniforme k/10, inclusión del dominante del bloque en los pools pasados, Jaccard medio entre pools consecutivos y rotación (1 − Jaccard).
- Compara por grupo, entre bloques, frecuencia del dominante frente a inclusión del dominante; cambio de dominante frente a rotación; e inclusión del dominante frente a tasa de acierto.
- Correlaciones de Pearson solo se muestran con al menos tres pares válidos. La lectura de grupo requiere al menos tres bloques y dos correlaciones calculables. Umbrales descriptivos fijos: +0.30 o más para concordancia positiva; −0.30 o menos para discordancia negativa; el resto es mixto. No son umbrales inferenciales.

## Integración
El flujo `npm run research:regime-analysis -- <local-Tris.csv> [ledger-directory]` agrega `positionalPoolConcordance` a JSON de diagnóstico y reporte integral Markdown. Parámetro: `TRIS_POSITIONAL_POOL_MIN_HISTORY` (30 por defecto). La configuración programática permite elegir métodos y tamaños.

## Salvaguardas
- Rechaza etiquetas duplicadas o que utilicen el propio concurso objetivo o información posterior.
- No puentea bloques no soportados al comparar cambios de dominante.
- El dominante de bloque se calcula retrospectivamente para contraste; no se presenta como información disponible al comienzo del bloque.
- Las tasas de acierto no prueban ventaja; k/10 supone uniformidad y se reporta solo como referencia.
- Los bloques y concursos pueden depender; no se calculan p-valores ni se corrige por todas las comparaciones exploratorias.
- No modifica pronósticos congelados, candidatos, pesos, portafolio ni ledger.
- Sin APIs, polling, descargas ni actualización automática de resultados.
