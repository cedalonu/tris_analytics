# Fase 27 — persistencia y recurrencia de transiciones posicionales

## Objetivo
Medir cuánto duran los cambios del dígito dominante entre bloques temporales, distinguir episodios breves de sostenidos y contar retornos a dominantes vistos anteriormente.

## Método
- Reutiliza los bloques fijos, consecutivos y no solapados de la fase 24, por régimen y posición R1–R5.
- Convierte bloques con soporte suficiente en episodios de dominancia consecutiva.
- Un bloque insuficiente rompe la continuidad; no se puentean huecos.
- Cada transición registra dígito anterior/nuevo, bloque y concurso de inicio, duración en bloques y concursos soportados, condición transitoria/sostenida y si el nuevo dominante ya había aparecido antes en esa serie.
- Por defecto, un episodio es sostenido con al menos dos bloques consecutivos; se informa sensibilidad a 1, 2 y 3 bloques, sin escoger un umbral óptimo.
- Resume recuentos y tasas de retorno por posición.

## Integración
El análisis integrado `npm run research:regime-analysis -- <local-Tris.csv> [ledger-directory]` agrega `positionalTransitions` al JSON de diagnósticos y al reporte Markdown.

Variable: `TRIS_POSITIONAL_TRANSITION_MIN_BLOCKS` (2).

## Límites
La unidad es el bloque, no el sorteo individual; un cambio dentro del bloque puede ocultarse. Retorno no significa periodicidad. Las duraciones no son tiempo de reloj. Las métricas son descriptivas y no prueban causalidad, sesgo físico ni capacidad predictiva. Sin APIs, polling ni descargas.
