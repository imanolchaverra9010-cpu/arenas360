export type EventFilterValue = 'TODOS' | 'EN CURSO' | 'PRÓXIMO' | 'FINALIZADO';

export const EVENT_FILTERS: ReadonlyArray<{ label: string; value: EventFilterValue }> = [
  { label: 'TODOS', value: 'TODOS' },
  { label: 'EN CURSO', value: 'EN CURSO' },
  { label: 'PRÓXIMOS', value: 'PRÓXIMO' },
  { label: 'FINALIZADOS', value: 'FINALIZADO' },
];

function normalizeStatus(status: string): string {
  return status
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchesEventFilter(status: string, filter: EventFilterValue): boolean {
  if (filter === 'TODOS') {
    return true;
  }

  const normalized = normalizeStatus(status);

  if (filter === 'PRÓXIMO') {
    return normalized === 'PROXIMO' || normalized === 'PROXIMOS';
  }

  if (filter === 'FINALIZADO') {
    return normalized === 'FINALIZADO' || normalized === 'FINALIZADOS';
  }

  return normalized === normalizeStatus(filter);
}
