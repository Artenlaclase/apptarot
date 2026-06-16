const ARCANE_NAMES: Record<number, string> = {
  1: 'El Mago',
  2: 'La Sacerdotisa',
  3: 'La Emperatriz',
  4: 'El Emperador',
  5: 'El Hierofante (El Papa)',
  6: 'Los Enamorados',
  7: 'El Carro',
  8: 'La Justicia',
  9: 'El Ermitaño',
  10: 'La Rueda de la Fortuna',
  11: 'La Fuerza',
  12: 'El Colgado',
  13: 'La Muerte',
  14: 'La Templanza',
  15: 'El Diablo',
  16: 'La Torre',
  17: 'La Estrella',
  18: 'La Luna',
  19: 'El Sol',
  20: 'El Juicio',
  21: 'El Mundo',
};

export interface ArcaneResult {
  number: number;
  name: string;
}

export interface ArcaneValidationResult {
  valid: boolean;
  message?: string;
}

export interface ArcaneBreakdownStep {
  day: string;
  month: string;
  yearValue: string;
  total: number;
}

function reduceNumber(value: number): number {
  let result = value;

  while (result > 21) {
    result = result
      .toString()
      .split('')
      .map(Number)
      .reduce((acc, curr) => acc + curr, 0);
  }

  return result;
}

function sumDigits(value: number): number {
  return value
    .toString()
    .split('')
    .map(Number)
    .reduce((acc, curr) => acc + curr, 0);
}

export function getArcaneName(arcaneNumber: number): string {
  return ARCANE_NAMES[arcaneNumber] ?? 'Arcano desconocido';
}

export function normalizeBirthDateInput(input: string): string {
  const value = (input || '').trim();
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  return '';
}

export function validateFullName(fullName: string): ArcaneValidationResult {
  const clean = (fullName || '').trim().replace(/\s+/g, ' ');
  if (!clean) {
    return { valid: false, message: 'El nombre completo es obligatorio.' };
  }

  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\-\s.]+$/.test(clean)) {
    return { valid: false, message: 'El nombre solo puede contener letras y separadores simples.' };
  }

  const parts = clean.split(' ').filter(Boolean);
  if (parts.length < 2) {
    return { valid: false, message: 'Ingresa al menos nombre y apellido.' };
  }

  return { valid: true };
}

export function validateBirthDate(rawBirthDate: string): ArcaneValidationResult {
  const normalized = normalizeBirthDateInput(rawBirthDate);
  if (!normalized) {
    return { valid: false, message: 'Usa el formato de fecha DD/MM/AAAA.' };
  }

  const [dd, mm, yyyy] = normalized.split('/').map(Number);
  if (!dd || !mm || !yyyy) {
    return { valid: false, message: 'La fecha de nacimiento es obligatoria.' };
  }

  if (yyyy < 1900) {
    return { valid: false, message: 'La fecha debe ser posterior a 1900.' };
  }

  const date = new Date(yyyy, mm - 1, dd);
  const isValidDate =
    date.getFullYear() === yyyy &&
    date.getMonth() === mm - 1 &&
    date.getDate() === dd;

  if (!isValidDate) {
    return { valid: false, message: 'La fecha ingresada no es válida.' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return { valid: false, message: 'La fecha de nacimiento no puede ser futura.' };
  }

  return { valid: true };
}

export function validateBirthHour(hour: string): ArcaneValidationResult {
  const value = (hour || '').trim();
  if (!value) return { valid: true };

  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
    return { valid: false, message: 'La hora debe tener formato HH:MM.' };
  }

  return { valid: true };
}

export function calculatePersonalArcane(birthDateInput: string): ArcaneResult {
  const birthDate = normalizeBirthDateInput(birthDateInput);
  const validation = validateBirthDate(birthDate);
  if (!validation.valid) {
    throw new Error(validation.message || 'Fecha de nacimiento inválida.');
  }

  const [day, month, year] = birthDate.split('/').map(Number);
  const initialSum = day + month + year;
  const arcaneNumber = reduceNumber(initialSum);

  return {
    number: arcaneNumber,
    name: getArcaneName(arcaneNumber),
  };
}

export function getPersonalArcaneBreakdown(birthDateInput: string): ArcaneBreakdownStep[] {
  const birthDate = normalizeBirthDateInput(birthDateInput);
  const validation = validateBirthDate(birthDate);
  if (!validation.valid) {
    return [];
  }

  const [day, month, year] = birthDate.split('/').map(Number);
  const dayLabel = String(day).padStart(2, '0');
  const monthLabel = String(month).padStart(2, '0');
  const steps: ArcaneBreakdownStep[] = [];

  let currentYear = year;
  let total = day + month + currentYear;

  steps.push({
    day: dayLabel,
    month: monthLabel,
    yearValue: String(currentYear),
    total,
  });

  while (total > 21) {
    currentYear = sumDigits(currentYear);
    total = day + month + currentYear;
    steps.push({
      day: dayLabel,
      month: monthLabel,
      yearValue: String(currentYear),
      total,
    });
  }

  return steps;
}

export function getDailyArcaneHint(arcaneNumber: number): string {
  const hints: Record<number, string> = {
    1: 'Hoy es ideal para iniciar algo nuevo con decisión.',
    2: 'Escucha tu intuición y observa antes de actuar.',
    3: 'Nutre tus proyectos con creatividad y paciencia.',
    4: 'Pon orden y estructura en lo que deseas consolidar.',
    5: 'Aprender o enseñar algo te abrirá una puerta valiosa.',
    6: 'Elige desde el corazón, con claridad y compromiso.',
    7: 'Avanza con determinación; el movimiento trae respuestas.',
    8: 'Busca equilibrio y honestidad en cada decisión.',
    9: 'Dedica tiempo al silencio interior para comprender mejor.',
    10: 'Acepta los cambios: una oportunidad está girando a tu favor.',
    11: 'Canaliza tu fuerza con calma y autocontrol.',
    12: 'Una pausa consciente puede darte una nueva perspectiva.',
    13: 'Suelta lo que ya cumplió su ciclo para renovarte.',
    14: 'La armonía llega cuando integras extremos con serenidad.',
    15: 'Observa a qué te aferras para recuperar tu poder.',
    16: 'Lo que cae hoy abre espacio para una verdad más sólida.',
    17: 'Confía en tu luz: hay esperanza y guía disponible.',
    18: 'No todo será evidente; avanza con sensibilidad y prudencia.',
    19: 'Exprésate con autenticidad: hoy brillas con fuerza.',
    20: 'Escucha el llamado interno y decide con propósito.',
    21: 'Un ciclo se completa: celebra y prepara el siguiente paso.',
  };

  return hints[arcaneNumber] ?? 'Conecta con tu arcano y observa su mensaje para hoy.';
}
