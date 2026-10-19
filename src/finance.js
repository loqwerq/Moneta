export const MAX_AMOUNT = 999_999_999_99;
export const CATEGORIES = {
  expense: ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Покупки', 'Здоровье', 'Другое'],
  income: ['Зарплата', 'Подработка', 'Подарки', 'Другое'],
};
export const COLORS = ['#8062dc', '#b49aee', '#67b9a8', '#efb971', '#8fa9e5', '#dd8eac', '#b3b6c7'];
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(+date) && localDate(date) === value && value >= '1900-01-01' && value <= '9999-12-31';
}
export function parseAmount(input, allowZero = false) {
  const value = String(input).trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error('Введите положительную сумму, не более двух знаков после запятой.');
  const [whole, fraction = ''] = value.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount) || amount > MAX_AMOUNT) throw new Error('Максимальная сумма — 999 999 999,99 ₸.');
  if (amount < (allowZero ? 0 : 1)) throw new Error('Сумма должна быть больше нуля.');
  return amount;
}
export function validateOperation(value) {
  if (!value || !['income', 'expense'].includes(value.type)) throw new Error('Выберите тип операции.');
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.trim().length > 100) throw new Error('Укажите название до 100 символов.');
  if (!Number.isSafeInteger(value.amount) || value.amount <= 0 || value.amount > MAX_AMOUNT) throw new Error('Некорректная сумма.');
  if (!CATEGORIES[value.type].includes(value.category)) throw new Error('Выберите категорию.');
  if (!validDate(value.date)) throw new Error('Укажите корректную дату.');
  if (typeof value.comment !== 'string' || value.comment.length > 500) throw new Error('Комментарий должен быть не длиннее 500 символов.');
  return { ...value, title: value.title.trim() };
}
export function summarize(operations, initialBalance = 0, month = localDate().slice(0, 7), today = localDate()) {
  let balance = initialBalance, income = 0, expense = 0;
  const categories = {};
  for (const op of operations) {
    if (op.date > today) continue;
    balance += op.type === 'income' ? op.amount : -op.amount;
    if (!Number.isSafeInteger(balance)) throw new Error('Общий баланс превышает допустимый предел.');
    if (op.date.slice(0, 7) !== month) continue;
    if (op.type === 'income') income += op.amount;
    else { expense += op.amount; categories[op.category] = (categories[op.category] || 0) + op.amount; }
  }
  return { balance, income, expense, categories: Object.entries(categories).sort((a, b) => b[1] - a[1]) };
}
export function sorted(operations) {
  return [...operations].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt || b.id.localeCompare(a.id));
}
export function readSaved(raw) {
  if (!raw) return { initialBalance: 0, operations: [] };
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Number.isSafeInteger(data.initialBalance) || data.initialBalance < 0 || data.initialBalance > MAX_AMOUNT || !Array.isArray(data.operations)) throw new Error('Некорректный формат сохранённых данных.');
  const ids = new Set();
  const operations = data.operations.map(op => {
    if (typeof op.id !== 'string' || !op.id || ids.has(op.id) || !Number.isFinite(op.createdAt)) throw new Error('Некорректный формат операций.');
    ids.add(op.id);
    return validateOperation(op);
  });
  summarize(operations, data.initialBalance);
  return { initialBalance: data.initialBalance, operations };
}
export function demoOperations(today = localDate()) {
  const month = today.slice(0, 7);
  const entries = [
    ['Зарплата', 320000, 'income', 'Зарплата', 1],
    ['Аренда квартиры', 85000, 'expense', 'Жильё', 2],
    ['Продукты на неделю', 18650, 'expense', 'Еда', 3],
    ['Кофе и завтрак', 3400, 'expense', 'Еда', 5],
    ['Поездки по городу', 6200, 'expense', 'Транспорт', 6],
    ['Новые кроссовки', 24500, 'expense', 'Покупки', 8],
    ['Билеты в кино', 5600, 'expense', 'Развлечения', 9],
    ['Продукты домой', 12750, 'expense', 'Еда', 12],
    ['Проект на выходных', 45000, 'income', 'Подработка', 14],
    ['Аптека', 4800, 'expense', 'Здоровье', 16],
  ];
  const day = Number(today.slice(8));
  const result = entries.map(([title, amount, type, category, d], i) => ({ id: crypto.randomUUID(), title, amount: amount * 100, type, category, date: `${month}-${String(Math.min(d, day)).padStart(2, '0')}`, comment: 'Демонстрационная операция', createdAt: Date.now() + i }));
  const next = new Date(`${today}T12:00:00`); next.setDate(next.getDate() + 7);
  result.push({ id: crypto.randomUUID(), title: 'Ожидаемая подработка', amount: 2500000, type: 'income', category: 'Подработка', date: localDate(next), comment: 'Демонстрационная операция', createdAt: Date.now() + 100 });
  return result;
}
