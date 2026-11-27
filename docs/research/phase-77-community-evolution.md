# Fase 77 — Evolución temporal de comunidades

## Objetivo
Seguir las comunidades respaldadas en ventanas cronológicas sucesivas y describir persistencia, aparición, desaparición, división y fusión.

## Diseño
- Ordenar paquetes por fecha y nombre.
- Crear ventanas no superpuestas de al menos 9 paquetes. Una cola final menor de 9 se agrega a la ventana anterior.
- Recalcular asociaciones y comunidades dentro de cada ventana, con la misma metodología de Fases 74–76.
- Enlazar comunidades consecutivas por Jaccard de integrantes, umbral configurable (predeterminado 0.25).
- Una comunidad actual con dos o más predecesoras se etiqueta como fusión; una comunidad previa enlazada a dos o más actuales indica división; una relación uno-a-uno es persistencia; sin enlaces se etiqueta aparición o desaparición.

## Interpretación y límites
Los eventos son etiquetas heurísticas de solapamiento, no evidencia formal de una transformación. Las ventanas pequeñas reducen potencia y estabilidad de las pruebas por permutación. Los paquetes deben representar snapshots comparables y fechas correctas. No se interpolan hipótesis ausentes; no se infiere causalidad ni capacidad predictiva.
