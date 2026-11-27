# Fase 118 — Dependencia conjunta de dígitos

## Objetivo
Estudiar las asociaciones entre los valores categóricos concretos (0–9) en subconjuntos de 2, 3, 4 y 5 posiciones, sin reducirlos a cambio/no cambio.

## Método
- Enumerar 26 subconjuntos de posiciones de tamaño 2 a 5.
- Para cada subconjunto, calcular correlación total: suma de entropías marginales menos entropía conjunta, en bits.
- Medir el dígito-tuple conjunto dominante, su frecuencia observada, frecuencia esperada por producto marginal y lift descriptivo.
- En cada réplica, permutar independientemente el orden de cada columna. Esto conserva exactamente las frecuencias marginales por posición y elimina la alineación conjunta.
- Comparar la correlación total observada con la distribución nula; p-valores empíricos unilaterales y ajuste Benjamini-Hochberg sobre 26 subconjuntos.

## Ejecución
```bash
npm run research:joint-digit-dependence -- Tris.csv 5000 6000 999 1182026
```
Genera `reports/joint-digit-dependence/latest.json` y `latest.md`.

## Interpretación y límites
La correlación total mide dependencia estadística categórica, no causalidad. La permutación independiente conserva frecuencias pero destruye autocorrelación y orden temporal; el control no representa necesariamente un mecanismo físico. El dígito-tuple dominante se selecciona de los datos y su lift es descriptivo. La familia de 26 pruebas se ajusta por FDR, pero la selección exploratoria acumulada en fases anteriores no queda anulada. Se requiere evaluación temporal fuera de muestra antes de hablar de estabilidad; nada aquí predice el próximo sorteo.
