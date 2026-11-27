# Fase 78 — Detección de cambios de régimen en comunidades

## Objetivo
Distinguir alteraciones persistentes en la composición y estructura de comunidades de las fluctuaciones de una sola ventana.

## Indicadores
- Rotación de integrantes: 1 menos el índice Jaccard entre comunidades enlazadas.
- Variación de cohesión interna.
- Variación de conductancia (peso relativo de conexiones que salen del grupo).
- Umbrales iniciales: rotación >= 0.40; cambio absoluto de cohesión o conductancia >= 0.20.

## Confirmación temporal
Un cambio se marca provisional cuando supera un umbral y no existe una ventana posterior. Se marca persistente si la comunidad descendiente conserva la modificación de composición (al menos 50% de solapamiento entre ventanas consecutivas) o mantiene una alteración estructural de al menos la mitad del umbral original. Se marca transitorio si la siguiente ventana no conserva el cambio o no hay descendiente enlazable.

## Límites
La asociación entre comunidades se basa en Jaccard y el mejor enlace disponible; divisiones y fusiones complejas pueden ser ambiguas. La confirmación es descriptiva, no un contraste de hipótesis ni una prueba formal de cambio de régimen. Los umbrales son heurísticos y deben validarse con más historial. No implica causalidad ni capacidad predictiva.
