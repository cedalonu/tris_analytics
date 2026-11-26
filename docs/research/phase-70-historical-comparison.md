# Phase 70 — Historial longitudinal de comparaciones

Carga dos o más paquetes reproducibles, los ordena por fecha y compara cada paquete con el anterior. Resume candidatos agregados/retirados/modificados y cambios de configuración. Para cada candidato muestra presencia o ausencia, clasificación, valor resuelto, rango descriptivo, primera/última aparición y variaciones entre extremos.

Las fechas de referencia se derivan de la última fecha de snapshot y pueden corregirse en la interfaz. El análisis permanece en memoria durante la sesión; el usuario puede exportar y recuperar un JSON. No se interpolan observaciones ausentes. El rango por valor resuelto es descriptivo, no el ranking de prioridad ni una predicción. Fingerprints no criptográficos.
