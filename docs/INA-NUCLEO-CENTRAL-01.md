# INA — Núcleo central de inteligencia TRIS

**Proyecto:** TRIS Analytics  
**Rama:** `research-core-v1`  
**Estado:** decisión arquitectónica aprobada; implementación incremental pendiente de auditoría.

## 1. Definición de INA

INA (Inteligencia Núcleo Analítico) es la autoridad interna de conocimiento del proyecto TRIS. Mantiene una representación coherente, versionada y trazable de:

- todos los sorteos históricos validados;
- estadísticas globales, temporales y por posición;
- presencia, ausencia, recurrencia, aging y distribución de intervalos;
- relaciones y transiciones entre posiciones y dígitos;
- estructuras, agrupaciones, concentraciones y dispersiones observadas;
- hipótesis, experimentos y resultados de sus evaluaciones;
- predicciones congeladas y su evaluación posterior;
- procedencia, integridad, fecha de actualización y límites de cada conjunto de datos.

INA conoce íntegramente la evidencia observada hasta un corte determinado. No conoce el resultado futuro: toda predicción es una estimación o hipótesis que debe identificarse como tal y medirse fuera de muestra y prospectivamente.

## 2. Regla de autoridad

**Los módulos no mantienen verdades estadísticas independientes.** INA administra el contexto y publica salidas analíticas versionadas. Los módulos de investigación consumen esas salidas y pueden proponer nuevos análisis; sus resultados regresan a INA como evidencia etiquetada, sin modificar silenciosamente la historia ni promover una hipótesis a método aceptado.

La autoridad se divide así:

1. **Base canónica:** verdad histórica validada, append-only y con correcciones auditadas.
2. **INA Core:** catálogo de conocimiento, estadísticas y salidas compartidas construidas desde la base canónica.
3. **Laboratorios:** motores descriptivos o experimentales que consumen contratos de INA.
4. **Evaluador:** validación retrospectiva cronológica y prospectiva, preservando pronósticos congelados.
5. **Interfaz:** representación de las salidas reales de INA y de los laboratorios, sin fórmulas paralelas ni cifras manuales.

## 3. Ciclo de alimentación diaria

```text
Pakin / Tris.csv
      ↓
Captura programada + snapshot + SHA-256 + fecha
      ↓
Validación de esquema, dígitos, duplicados, secuencia y fechas
      ↓
Base canónica versionada
      ↓
Evento de actualización (datasetVersion, hash, drawCutoff)
      ↓
INA Core recalcula/invalida dependencias
      ├── Historial y estadísticas
      ├── Posiciones, presencia y ausencia
      ├── Recurrencia y aging
      ├── Transiciones y estructuras
      ├── Hipótesis y laboratorios
      ├── Evaluación walk-forward
      ├── Ledger prospectivo
      └── Pronóstico del siguiente sorteo
                 ↓
          Dashboard conectado
```

La actualización debe ser idempotente. Repetir el mismo snapshot no puede duplicar sorteos, estadísticas acumuladas, experimentos ni evaluaciones. Si cambia una fila histórica ya conocida, el proceso debe detenerse y generar una revisión explícita; no debe reescribir la evidencia silenciosamente.

## 4. Contrato de salida de INA

Toda salida consumible por un módulo o gráfico debe declarar, como mínimo:

- `datasetVersion` y huella del snapshot;
- `source`, `fetchedAt`, cantidad de sorteos y rango;
- `drawCutoff` (último concurso incluido);
- identificador y versión del motor;
- parámetros, ventana y filtros;
- resultado estructurado;
- estado epistemológico: `descriptive`, `exploratory`, `backtested`, `prospective` o `accepted-experimental`;
- advertencias, limitaciones y pruebas aplicables.

Las visualizaciones deben recibir la salida estructurada del motor. No se permite recalcular una métrica distinta dentro del componente visual ni mostrar un gráfico sin identificar muestra, corte y procedencia.

## 5. Flujo de aprendizaje de INA

INA se alimenta en dos direcciones:

- **Evidencia entrante:** nuevos sorteos validados, correcciones auditadas y nuevas variables con procedencia.
- **Conocimiento derivado:** resultados de análisis, hipótesis, evaluaciones y resultados prospectivos.

Cada hipótesis conserva su versión, fecha de creación, datos disponibles al formularse, método, métricas y resultados. Los hallazgos experimentales no se mezclan con estadísticas observadas ni con el pronóstico principal hasta cumplir los criterios de validación definidos por el proyecto.

## 6. Papel de los módulos

Los módulos pasan a ser vistas especializadas del conocimiento de INA:

| Área | Responsabilidad | Relación con INA |
|---|---|---|
| Historial e integridad | Explorar sorteos y calidad de fuente | Lee la base y manifiesto |
| Frecuencia y posiciones | Distribuciones y cambios por posición | Consume estadísticas de INA |
| Presencia, ausencia y aging | Recurrencia e intervalos | Consume series temporales de INA |
| Transiciones y estructuras | Relaciones, redes, agrupaciones | Consume matrices y eventos derivados |
| Laboratorio de hipótesis | Crear y comparar métodos | Lee INA; devuelve hipótesis versionadas |
| Evaluación | Walk-forward y prospectiva | Lee pronósticos congelados y resultados |
| Próximo sorteo | Presentar candidatos y evidencia | Consume solo salidas elegibles de INA |
| Dashboard | Navegación y visualización | No es fuente de verdad; representa INA |

## 7. Estado observado en el código al crear este documento

La rama ya contiene un adaptador CSV, un núcleo de evaluación de pools, una vista descriptiva por posición, una red INA y una sincronización automática del CSV canónico en el dashboard. Sin embargo, la inspección actual muestra que:

- el dashboard descarga el CSV canónico directamente en el navegador y también permite importación manual;
- el estado local del navegador puede restaurarse por separado;
- hay cálculos estadísticos directamente dentro de `TrisOpsDashboard.tsx`;
- `ResearchSignalOverview` consume un motor compartido, pero no un contrato central general de INA;
- la sección INA existente representa una red, no todavía el catálogo completo del conocimiento del sistema;
- el workflow de actualización y los artefactos prospectivos aún requieren demostrar propagación integral a todos los consumidores.

Por lo tanto, **INA todavía no es técnicamente la autoridad central única**. Este documento fija el destino arquitectónico, no declara terminada su implementación.

## 8. Secuencia de implementación

1. Auditar e inventariar motores, salidas, datos, visualizaciones y dependencias actuales.
2. Crear el contrato de dataset/versionado y el servicio central de INA.
3. Mover estadísticas duplicadas desde la UI a motores puros consumidos por INA.
4. Conectar cada laboratorio a los contratos de INA y registrar su evidencia de vuelta.
5. Conectar el workflow diario con la base canónica y la invalidación/reconstrucción de dependencias.
6. Reconstruir el dashboard como vistas de INA, con filtros compartidos y trazabilidad.
7. Probar actualización repetida, nuevo sorteo, corrección histórica, pronóstico congelado y consistencia de gráficas.

## 9. Criterio de aceptación

INA solo se considerará núcleo operativo cuando un nuevo sorteo publicado en la fuente oficial pueda seguirse de extremo a extremo: captura, validación, base versionada, actualización de INA, recomputación de dependencias, evaluación prospectiva y actualización de cada vista afectada. La prueba debe mostrar una misma versión y corte en todos los módulos dependientes.

**Principio rector: INA es dueña del conocimiento observado del sorteo; los laboratorios investigan, el evaluador exige evidencia y el dashboard hace visible ese conocimiento.**
