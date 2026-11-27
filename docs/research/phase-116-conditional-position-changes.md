# Fase 116 — Dependencias condicionales entre posiciones

## Pregunta
¿El cambio en una posición se asocia con una mayor o menor tasa de cambio en otra posición, en el mismo concurso o hasta maxLag concursos después?

## Definición
Cambio binario: el dígito difiere del concurso anterior. Para cada par dirigido fuente→objetivo y lag 0..maxLag se calcula P(cambio objetivo | evento fuente), P(cambio objetivo | sin evento fuente), diferencia en puntos porcentuales y riesgo relativo cuando es calculable.

## Contraste
Se desplaza circularmente la serie fuente para crear controles que conservan aproximadamente tasa y autocorrelación marginal. Prueba empírica bilateral sobre la magnitud de la diferencia y ajuste Benjamini-Hochberg entre pruebas con soporte mínimo. También se desglosa por bloques.

## Ejecución
```bash
npm run research:conditional-position-changes -- Tris.csv 5000 6000 3 999 1162026 20
```
Salidas: `reports/conditional-position-changes/latest.json` y `latest.md`.

## Límites
No controla simultáneamente por las otras posiciones ni por regímenes; los controles circulares tienen efectos de borde. Cambios binarios no usan los valores de los dígitos. Asociación no es causalidad ni predicción. Requiere validación prospectiva separada.
