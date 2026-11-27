# Fase 119 — Validación temporal de dependencias conjuntas

## Objetivo
Comprobar si la dependencia categórica entre posiciones se mantiene en una ventana cronológica posterior y no solapada.

## Método
- El usuario define ventanas de descubrimiento y validación.
- Se evalúan los mismos 26 subconjuntos predefinidos de 2 a 5 posiciones.
- Se calcula correlación total: suma de entropías marginales menos entropía conjunta.
- En cada ventana se permuta independientemente cada columna, conservando frecuencias marginales exactas.
- Se calculan p-valores empíricos y ajuste Benjamini-Hochberg por separado.
- «Replicado» exige significancia ajustada en ambas ventanas y correlación de validación superior al percentil 95 del control.
- Mínimo 30 sorteos por ventana para clasificar replicación; 20–29 se informa insuficiente.

## Ejecución
```bash
npm run research:joint-digit-dependence-validation -- Tris.csv 5000 5500 5501 6000 999 1192026
```
Genera `reports/joint-digit-dependence-validation/latest.json` y `latest.md`.

## Limitaciones
Las ventanas no se solapan y deben ser internamente contiguas. La permutación destruye autocorrelación y orden temporal. FDR no corrige toda la exploración acumulada del proyecto. Replicación histórica no es pronóstico ni causalidad. Para probar capacidad predictiva se requiere evaluación prospectiva congelada antes de conocer resultados.
