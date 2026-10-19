import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, summarize, readSaved, validateOperation, validDate, sorted, demoOperations } from '../src/finance.js';

const op = (id, type, amount, date = '2026-10-19', category = type === 'income' ? 'Зарплата' : 'Еда') => ({ id, type, amount, date, category, title: id, comment: '', createdAt: 1 });

test('Приёмка: доход, расход, удаление и редактирование пересчитывают баланс', () => {
  const income = op('income', 'income', parseAmount('100000'));
  const expense = op('expense', 'expense', parseAmount('25000'));
  assert.equal(summarize([income], 0, '2026-10', '2026-10-19').balance, 10_000_000);
  assert.equal(summarize([income, expense], 0, '2026-10', '2026-10-19').balance, 7_500_000);
  assert.equal(summarize([income], 0, '2026-10', '2026-10-19').balance, 10_000_000);
  assert.equal(summarize([{ ...income, amount: parseAmount('120000') }, expense], 0, '2026-10', '2026-10-19').balance, 9_500_000);
});
test('Будущая операция учитывается только с указанной даты', () => {
  const future = op('salary', 'income', 10_000_000, '2026-10-25');
  assert.equal(summarize([future], 0, '2026-10', '2026-10-24').balance, 0);
  assert.equal(summarize([future], 0, '2026-10', '2026-10-24').income, 0);
  assert.equal(summarize([future], 0, '2026-10', '2026-10-25').income, 10_000_000);
});
test('Сценарий заказчика: 50 000 на 22 октября активируются без создания новой записи', () => {
  const operations = [op('planned', 'income', 5_000_000, '2026-10-22')];
  for (const today of ['2026-10-19', '2026-10-20', '2026-10-21']) {
    assert.equal(summarize(operations, 0, '2026-10', today).balance, 0);
    assert.equal(summarize(operations, 0, '2026-10', today).income, 0);
  }
  assert.equal(summarize(operations, 0, '2026-10', '2026-10-22').balance, 5_000_000);
  assert.equal(operations.length, 1);
  assert.equal(operations[0].id, 'planned');
});
test('Смена начального остатка со 100 000 на 150 000 не создаёт доход', () => {
  const operations = [op('expense', 'expense', 2_000_000)];
  assert.equal(summarize(operations, 10_000_000, '2026-10', '2026-10-19').balance, 8_000_000);
  const after = summarize(operations, 15_000_000, '2026-10', '2026-10-19');
  assert.equal(after.balance, 13_000_000);
  assert.equal(after.income, 0);
  assert.equal(operations.length, 1);
});
test('Смена месяца обнуляет месячную статистику, сохраняя общий баланс и начальный остаток', () => {
  const operations = [op('oct', 'income', 10_000_000, '2026-10-31')];
  assert.deepEqual(summarize(operations, 15_000_000, '2026-11', '2026-11-01'), { balance: 25_000_000, income: 0, expense: 0, categories: [] });
});
test('Денежные значения проверяются без потери точности и экспоненциальной записи', () => {
  assert.equal(parseAmount('0,29'), 29);
  assert.equal(parseAmount('999999999.99'), 99_999_999_999);
  assert.equal(parseAmount('0', true), 0);
  for (const input of ['', '-1', '0', 'NaN', 'Infinity', '1e5', '1.001', '1000000000', '999999999999999999999']) assert.throws(() => parseAmount(input), undefined, input);
  const amounts = Array.from({ length: 500 }, (_, i) => op(String(i), 'income', 29));
  assert.equal(summarize(amounts, 0, '2026-10', '2026-10-19').balance, 14500);
});
test('Категории суммируются, сортируются и исключают будущие расходы', () => {
  const operations = [op('a', 'expense', 1000), op('b', 'expense', 2000), op('c', 'expense', 9000, '2026-10-19', 'Жильё'), op('future', 'expense', 99999, '2026-10-25', 'Транспорт')];
  assert.deepEqual(summarize(operations, 0, '2026-10', '2026-10-19').categories, [['Жильё', 9000], ['Еда', 3000]]);
});
test('Сохранённые операции проходят JSON roundtrip и валидацию', () => {
  const operations = [op('one', 'income', 100)];
  assert.deepEqual(readSaved(JSON.stringify({ version: 1, initialBalance: 1000, operations })), { operations, initialBalance: 1000 });
  assert.deepEqual(readSaved(null), { initialBalance: 0, operations: [] });
  for (const raw of ['{oops', '{"version":99}', JSON.stringify({ version: 1, initialBalance: 0, operations: [...operations, ...operations] })]) assert.throws(() => readSaved(raw));
});
test('Неверные даты, категории и пустые названия отклоняются', () => {
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2026-13-01'), false);
  assert.throws(() => validateOperation({ ...op('a', 'income', 1), category: 'Еда' }));
  assert.throws(() => validateOperation({ ...op('a', 'income', 1), title: '   ' }));
});
test('Сортировка не меняет исходный список, демонстрационные данные валидны', () => {
  const operations = [op('older', 'income', 100, '2026-09-01'), op('newer', 'expense', 100)];
  assert.equal(sorted(operations)[0].id, 'newer');
  assert.equal(operations[0].id, 'older');
  for (const date of ['2026-01-01', '2026-10-19', '2026-12-31']) {
    const demo = demoOperations(date);
    for (const item of demo) assert.doesNotThrow(() => validateOperation(item));
    assert.equal(demo.filter(op => op.date > date).length, 1);
  }
});
