# Task Plan

## Goal
Completar y verificar los cambios para que el propietario gestione imagenes multiples, precios dinamicos por horario/dia, intervalos de horarios flexibles y aprobacion automatica o manual de reservas, y documentar huecos funcionales para la tesis.

## Phases
- [completed] Auditar estado actual del codigo relevante y detectar diferencias entre lo prometido y lo realmente implementado.
- [completed] Implementar o corregir backend, modelos y tipos faltantes.
- [completed] Implementar o corregir UI del propietario y flujo de reservas.
- [completed] Validar parcialmente con chequeos locales disponibles y documentar casos no cubiertos/riesgos.

## Errors Encountered
- `bun install`, `tsc --noEmit` y otras validaciones globales del repo no devolvieron salida util en este entorno, por lo que la verificacion se degrado a revision dirigida y parseo manual de los archivos tocados.
