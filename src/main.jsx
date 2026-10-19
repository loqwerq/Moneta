import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowRight, LayoutDashboard, ArrowLeftRight, ChartNoAxesCombined, Settings, Plus, ChevronLeft, ChevronRight, ChevronDown, Sun, Moon, Wallet, X, ShoppingBag, Coffee, Home, Car, Heart, Gift, BriefcaseBusiness, CircleHelp, Film, MoreHorizontal, Pencil, Trash2, Check, ShieldCheck, Sparkles, CalendarDays, Search, Inbox, CircleAlert, Download } from 'lucide-react';
import { CATEGORIES, COLORS, localDate, parseAmount, summarize, sorted, readSaved, demoOperations, validateOperation } from './finance';
import './styles.css';

const STORAGE_KEY = 'moneta.finances.v1';
const money = (amount) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: amount % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(amount / 100);
const monthLabel = (value) => new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(`${value}-01T12:00:00`)).replace(' г.', '');
const dateLabel = (value) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`)).replace('.', '');
const icons = { 'Еда': Coffee, 'Транспорт': Car, 'Жильё': Home, 'Развлечения': Film, 'Покупки': ShoppingBag, 'Здоровье': Heart, 'Зарплата': BriefcaseBusiness, 'Подработка': BriefcaseBusiness, 'Подарки': Gift, 'Другое': MoreHorizontal };
const tabs = [{ id: 'dashboard', label: 'Обзор', icon: LayoutDashboard }, { id: 'history', label: 'Операции', icon: ArrowLeftRight }, { id: 'analytics', label: 'Аналитика', icon: ChartNoAxesCombined }];
function loadData() {
  try { return { ...readSaved(localStorage.getItem(STORAGE_KEY)), error: '' }; }
  catch { return { initialBalance: 0, operations: [], error: 'Не удалось прочитать сохранённые данные. Они не перезаписаны. Проверьте доступ к хранилищу браузера или восстановите данные перед продолжением.' }; }
}
function loadTheme() { try { return localStorage.getItem('moneta.theme') || 'light'; } catch { return 'light'; } }
function Icon({ name, ...props }) { const Component = icons[name] || Wallet; return <Component {...props} />; }
function Brand() { return <div className="brand"><img src="/favicon.svg" alt="" /><span>moneta<span className="brand-dot">.</span></span></div>; }

function Modal({ title, subtitle, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current.focus();
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const nodes = [...ref.current.querySelectorAll('button:not([disabled]), input, select, textarea, [href]')].filter(el => el.getClientRects().length);
      const first = nodes[0], last = nodes.at(-1);
      if (!nodes.length) return e.preventDefault();
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = priorOverflow; document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref} tabIndex={-1}>
    <header className="modal-head"><div><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X size={21} /></button></header>{children}
  </section></div>;
}
function OperationForm({ operation, today, onSave, onClose }) {
  const [type, setType] = useState(operation?.type || 'expense');
  const [error, setError] = useState('');
  const [category, setCategory] = useState(operation?.category || CATEGORIES.expense[0]);
  const [date, setDate] = useState(operation?.date || today);
  const submit = e => {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    try {
      const title = String(values.get('title')).trim();
      if (!title) throw new Error('Введите название операции.');
      const amount = parseAmount(values.get('amount'));
      onSave({ id: operation?.id || crypto.randomUUID(), createdAt: operation?.createdAt || Date.now(), title, amount, type, category: String(values.get('category')), date: String(values.get('date')), comment: String(values.get('comment')).trim() });
    } catch (err) { setError(err.message); }
  };
  return <Modal title={operation ? 'Редактировать операцию' : 'Новая операция'} subtitle="Маленькая запись — больше ясности в финансах." onClose={onClose}>
    <form onSubmit={submit} className="operation-form">
      <div className="segmented" aria-label="Тип операции">{['expense', 'income'].map(t => <button key={t} type="button" className={type === t ? `selected ${t}` : ''} aria-pressed={type === t} onClick={() => { setType(t); setCategory(CATEGORIES[t][0]); }} >{t === 'expense' ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}{t === 'expense' ? 'Расход' : 'Доход'}</button>)}</div>
      <label className="amount-field">Сумма<span className="amount-input"><input name="amount" inputMode="decimal" required placeholder="0" maxLength={16} defaultValue={operation ? String(operation.amount / 100) : ''} aria-label="Сумма операции" /><span>₸</span></span></label>
      <label>Название<input name="title" required maxLength={100} placeholder="Например, продукты на неделю" defaultValue={operation?.title || ''} /></label>
      <div className="form-row"><label>Категория<select name="category" value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES[type].map(c => <option key={c}>{c}</option>)}</select></label><label>Дата<input type="date" name="date" min="1900-01-01" max="9999-12-31" value={date} required onInput={e => setDate(e.target.value)} onChange={e => setDate(e.target.value)} /></label></div>
      {date > today && <div className="form-info"><CalendarDays size={17} /><span>Запланировано. Учтём в балансе {dateLabel(date)}.</span></div>}
      <label>Комментарий <span className="optional">необязательно</span><textarea name="comment" maxLength={500} placeholder="Что стоит запомнить об этой операции?" rows={2} defaultValue={operation?.comment || ''} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-footer"><button type="button" className="button secondary" onClick={onClose}>Отмена</button><button className="button primary" type="submit"><Check size={17} />{operation ? 'Сохранить' : 'Добавить операцию'}</button></div>
    </form>
  </Modal>;
}
function BalanceForm({ current, onSave, onClose }) {
  const [error, setError] = useState('');
  return <Modal title="Начальный баланс" subtitle="Сколько денег у вас было до начала учёта?" onClose={onClose}><form className="operation-form" onSubmit={e => { e.preventDefault(); try { onSave(parseAmount(new FormData(e.currentTarget).get('balance'), true)); } catch (err) { setError(err.message); } }}>
    <label>Сумма в тенге<input name="balance" inputMode="decimal" required defaultValue={String(current / 100)} maxLength={16} /></label><p className="muted small">Эта сумма станет точкой отсчёта. Она влияет на общий баланс, но не считается доходом за месяц.</p>{error && <p className="error" role="alert">{error}</p>}<div className="form-footer"><button type="button" className="button secondary" onClick={onClose}>Отмена</button><button className="button primary" type="submit">Сохранить баланс</button></div></form></Modal>;
}
function Donut({ categories, total }) {
  let cumulative = 0;
  const segments = categories.map(([name, amount]) => { const start = cumulative; cumulative += amount / total * 100; return `${COLORS[CATEGORIES.expense.indexOf(name)]} ${start}% ${cumulative}%`; });
  return <div className="donut-layout"><div className={`donut ${total ? '' : 'empty-donut'}`} style={total ? { background: `conic-gradient(${segments.join(',')})` } : {}} role="img" aria-label={total ? `Расходы: ${categories.map(([c, v]) => `${c} — ${money(v)} тенге`).join(', ')}` : 'Расходов в выбранном месяце пока нет'}><div className="donut-hole"><span>{total ? 'Всего расходов' : 'Пока без трат'}</span><strong>{money(total)} <small>₸</small></strong><span className="donut-caption">{total ? `${categories.length} категорий` : 'Отличное начало'}</span></div></div>
    {total ? <div className="legend">{categories.map(([name, amount]) => <div className="legend-row" key={name}><span className="legend-name"><i style={{ background: COLORS[CATEGORIES.expense.indexOf(name)] }} />{name}</span><span className="legend-value">{money(amount)} <small>₸</small><em>{Math.round(amount / total * 100)}%</em></span></div>)}</div> : <div className="empty-legend"><div className="mini-icon"><ChartNoAxesCombined size={20} /></div><strong>У каждой траты своя история</strong><p>Добавьте первый расход —<br />здесь появится распределение<br />по категориям.</p></div>}
  </div>;
}
function Bars({ operations, month, today }) {
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(`${month}-01T12:00:00`); d.setMonth(d.getMonth() - 5 + i); const m = localDate(d).slice(0, 7); return { month: m, label: new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(d).replace('.', ''), ...summarize(operations, 0, m, today) }; });
  const max = Math.max(...months.flatMap(m => [m.income, m.expense]), 100);
  return <><div className="bar-chart" role="img" aria-label={`Доходы и расходы за шесть месяцев: ${months.map(m => `${monthLabel(m.month)}: доходы ${money(m.income)}, расходы ${money(m.expense)} тенге`).join('; ')}`}><div className="chart-grid"><span>{money(max)} ₸</span><span>{money(Math.round(max / 2))} ₸</span><span>0</span></div><div className="bar-columns">{months.map(m => <div className="bar-column" key={m.month}><div className="bar-pair"><div className="bar income-bar" style={{ height: `${m.income / max * 100}%` }} title={`Доходы: ${money(m.income)} ₸`} /><div className="bar expense-bar" style={{ height: `${m.expense / max * 100}%` }} title={`Расходы: ${money(m.expense)} ₸`} /></div><span>{m.label}</span></div>)}</div></div><div className="chart-key"><span><i className="key-income" />Доходы</span><span><i className="key-expense" />Расходы</span></div></>;
}
function TransactionList({ operations, today, onEdit, onDelete, compact = false, onAdd }) {
  if (!operations.length) return <div className="transactions-empty"><div className="empty-art"><Inbox size={30} strokeWidth={1.4} /><span className="empty-art-badge"><Plus size={12} /></span></div><h3>Здесь начнётся ваша история</h3><p>Запишите первую операцию.<br />Остальное Moneta посчитает за вас.</p><button className="text-button" onClick={onAdd}>Добавить операцию <ArrowRight size={15} /></button></div>;
  return <div className="transaction-list">{operations.map(op => <div className="transaction" key={op.id}><div className={`transaction-icon ${op.type}`}><Icon name={op.category} size={19} /></div><div className="transaction-info"><strong>{op.title}</strong><span>{op.category}<i>·</i>{dateLabel(op.date)}{op.date > today && <em className="planned"><span />Запланировано</em>}</span>{!compact && op.comment && <small>{op.comment}</small>}</div><div className={`transaction-amount ${op.type}`}>{op.type === 'income' ? '+' : '−'}{money(op.amount)} <small>₸</small></div><div className="transaction-actions"><button className="icon-button" onClick={() => onEdit(op)} aria-label={`Редактировать: ${op.title}`}><Pencil size={15} /></button>{!compact && <button className="icon-button danger-icon" onClick={() => onDelete(op)} aria-label={`Удалить: ${op.title}`}><Trash2 size={15} /></button>}</div></div>)}</div>;
}

const systemClock = () => new Date();
export default function App({ clock = systemClock, pollMs = 15000 }) {
  const [data, setData] = useState(loadData);
  const [theme, setTheme] = useState(loadTheme);
  const [tab, setTab] = useState('dashboard');
  const [today, setToday] = useState(() => localDate(clock()));
  const [month, setMonth] = useState(() => localDate(clock()).slice(0, 7));
  const [autoMonth, setAutoMonth] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const closeModal = React.useCallback(() => setModal(null), []);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('moneta.theme', theme); } catch { /* The selected theme still works in the current session. */ } }, [theme]);
  useEffect(() => {
    const tick = () => setToday(localDate(clock()));
    const interval = setInterval(tick, pollMs);
    window.addEventListener('focus', tick); document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(interval); window.removeEventListener('focus', tick); document.removeEventListener('visibilitychange', tick); };
  }, [clock, pollMs]);
  useEffect(() => { if (autoMonth) setMonth(today.slice(0, 7)); }, [today, autoMonth]);
  useEffect(() => {
    const sync = event => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try { setData({ ...readSaved(event.newValue), error: '' }); }
      catch { setData(previous => ({ ...previous, error: 'В другой вкладке появились некорректные данные. Сохранение остановлено, чтобы не перезаписать историю.' })); }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timer); }, [toast]);
  const summary = summarize(data.operations, data.initialBalance, month, today);
  const recent = sorted(data.operations);
  const planned = recent.filter(op => op.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const save = (next, { recover = false } = {}) => {
    if (data.error && !recover) throw new Error('Сохранение заблокировано: сначала восстановите доступ к ранее сохранённым данным.');
    summarize(next.operations, next.initialBalance, month, today);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, initialBalance: next.initialBalance, operations: next.operations })); }
    catch { throw new Error('Не удалось сохранить данные. Возможно, память браузера заполнена или доступ запрещён. Операция не сохранена.'); }
    setData({ ...next, error: '' });
  };
  const saveOperation = (value) => { const op = validateOperation(value); const operations = data.operations.some(x => x.id === op.id) ? data.operations.map(x => x.id === op.id ? op : x) : [...data.operations, op]; save({ ...data, operations }); setModal(null); setToast('Операция сохранена'); };
  const add = () => setModal({ type: 'operation' });
  const edit = op => setModal({ type: 'operation', operation: op });
  const remove = op => setModal({ type: 'delete', operation: op });
  const changeMonth = offset => { const date = new Date(`${month}-01T12:00:00`); date.setMonth(date.getMonth() + offset); const next = localDate(date).slice(0, 7); if (next < '1900-01' || next > '9999-12') return; setMonth(next); setAutoMonth(next === today.slice(0, 7)); };
  const demo = () => { try { if (data.operations.length) return; save({ ...data, operations: demoOperations(today) }); setToast('Демонстрационные данные загружены'); } catch (err) { setToast(err.message); } };
  const filtered = recent.filter(op => (filterType === 'all' || op.type === filterType) && (filterCategory === 'all' || op.category === filterCategory) && (!startDate || op.date >= startDate) && (!endDate || op.date <= endDate) && op.title.toLowerCase().includes(search.toLowerCase()));
  const selectedName = tabs.find(t => t.id === tab)?.label || 'Настройки';
  const isEmpty = !data.operations.length;
  const changeFilterType = type => { setFilterType(type); setFilterCategory('all'); };
  return <div className="app-shell">
    <aside className="sidebar"><Brand /><p className="sidebar-caption">ВАШИ ФИНАНСЫ</p><nav aria-label="Главное меню">{tabs.map(({ id, label, icon: NavIcon }) => <button key={id} onClick={() => setTab(id)} className={`nav-item ${tab === id ? 'active' : ''}`} aria-current={tab === id ? 'page' : undefined}><NavIcon size={20} /><span>{label}</span>{tab === id && <span className="nav-active-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="privacy-card"><div className="privacy-icon"><ShieldCheck size={21} /></div><strong>Только ваши данные</strong><p>Финансы сохраняются<br />в этом браузере.<br />Без регистрации и лишних глаз.</p><span><i />Локальное хранение</span></div><button className={`nav-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}><Settings size={20} /><span>Настройки</span></button><div className="theme-switch" role="group" aria-label="Цветовая тема"><button onClick={() => setTheme('light')} aria-pressed={theme === 'light'} className={theme === 'light' ? 'selected' : ''}><Sun size={16} />Светлая</button><button onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'} className={theme === 'dark' ? 'selected' : ''}><Moon size={16} />Тёмная</button></div><div className="sidebar-footer">Порядок в деньгах. Спокойствие в голове.</div></div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb"><span>Личное пространство</span><ChevronRight size={14} /><strong>{selectedName}</strong></div><div className="topbar-right"><span className="currency-badge">₸ <span>Казахстанский тенге</span></span><span className="avatar">Я</span></div></header>
      <main><div className="page-heading"><div><p className="eyebrow">ВАШИ ДЕНЬГИ ПОД КОНТРОЛЕМ</p><h1>{tab === 'dashboard' ? 'Финансы без лишнего шума' : tab === 'history' ? 'У каждой операции есть история' : tab === 'analytics' ? 'Большая картина в деталях' : 'Всё так, как вам удобно'}</h1><p className="page-description">{tab === 'dashboard' ? 'Всё, что нужно знать о ваших деньгах, — в одном месте.' : tab === 'history' ? 'Находите, редактируйте и планируйте свои доходы и расходы.' : tab === 'analytics' ? 'Замечайте привычки и принимайте взвешенные решения.' : 'Начальный баланс, оформление и ваши данные.'}</p></div><button className="button primary add-button" onClick={add}><Plus size={19} />Добавить операцию</button></div>
      {data.error && <div className="error-banner" role="alert"><CircleAlert size={20} />{data.error}</div>}
      {tab !== 'settings' && tab !== 'history' && <div className="overview-toolbar"><div className="section-label"><span className="live-dot" />{tab === 'dashboard' ? 'Финансовый обзор' : 'Ваша статистика'}</div><div className="month-control"><button className="icon-button" onClick={() => changeMonth(-1)} aria-label="Предыдущий месяц"><ChevronLeft size={17} /></button><label className="month-picker"><CalendarDays size={16} /><span>{monthLabel(month)}</span><input type="month" aria-label="Месяц статистики" value={month} min="1900-01" max="9999-12" onChange={e => { if (/^\d{4}-\d{2}$/.test(e.target.value)) { setMonth(e.target.value); setAutoMonth(e.target.value === today.slice(0, 7)); } }} /></label><button className="icon-button" onClick={() => changeMonth(1)} aria-label="Следующий месяц"><ChevronRight size={17} /></button></div></div>}
      {tab === 'dashboard' && <>
        <section className="stats-grid" aria-label="Финансовые показатели"><article className="stat-card balance-card"><div className="card-kicker"><span>Общий баланс</span><span className="stat-icon"><Wallet size={19} /></span></div><div className="stat-value">{money(summary.balance)} <span>₸</span></div><div className="stat-bottom"><span>Все операции по {dateLabel(today)}</span><span className="balance-caption">Всё время</span></div><div className="balance-decoration" aria-hidden="true" /></article><article className="stat-card"><div className="card-kicker"><span>Доходы за месяц</span><span className="stat-icon income"><ArrowDownLeft size={20} /></span></div><div className="stat-value">{money(summary.income)} <span>₸</span></div><div className="stat-bottom"><span><i className="legend-dot income-dot" />Поступления</span><span>{monthLabel(month).split(' ')[0]}</span></div></article><article className="stat-card"><div className="card-kicker"><span>Расходы за месяц</span><span className="stat-icon expense"><ArrowUpRight size={20} /></span></div><div className="stat-value">{money(summary.expense)} <span>₸</span></div><div className="stat-bottom"><span><i className="legend-dot expense-dot" />Траты по категориям</span><span>{monthLabel(month).split(' ')[0]}</span></div></article></section>
        {isEmpty && data.initialBalance === 0 && <section className="welcome-strip"><div className="welcome-icon"><Sparkles size={23} /></div><div><h3>Начните с того, что уже есть</h3><p>Укажите начальный баланс — это ваша точка отсчёта.</p></div><button className="button welcome-button" onClick={() => setModal({ type: 'balance' })}>Указать баланс<ArrowRight size={16} /></button></section>}
        <div className="dashboard-grid"><section className="panel categories-panel"><header className="panel-heading"><div><h2>Куда уходят деньги</h2><p>Расходы по категориям</p></div><span className="subtle-chip">{monthLabel(month).split(' ')[0]}</span></header><Donut categories={summary.categories} total={summary.expense} /><footer className="panel-foot"><span><span className="tiny-dot" />{summary.expense ? 'Учитываются только совершённые расходы' : 'Здесь появится ваша финансовая картина'}</span><button className="text-button" onClick={() => setTab('analytics')}>Подробнее<ArrowRight size={14} /></button></footer></section><section className="panel activity-panel"><header className="panel-heading"><div><h2>Последние операции</h2><p>Пять последних записей</p></div><button className="text-button" onClick={() => setTab('history')}>Все<ArrowRight size={14} /></button></header><TransactionList operations={recent.slice(0, 5)} today={today} onEdit={edit} onDelete={remove} compact onAdd={add} /></section></div>
        <section className="bottom-grid"><div className="panel dynamics-panel"><header className="panel-heading"><div><h2>Деньги в движении</h2><p>Доходы и расходы за 6 месяцев</p></div><ChartNoAxesCombined size={20} className="muted" /></header><Bars operations={data.operations} month={month} today={today} /></div><div className="plans-panel"><div className="plans-heading"><div className="mini-icon"><CalendarDays size={20} /></div><span>НА ШАГ ВПЕРЁД</span></div><h2>{planned.length ? 'Ваши ближайшие планы' : 'Планы тоже под контролем'}</h2>{planned.length ? <div className="planned-list">{planned.slice(0, 2).map(op => <button key={op.id} onClick={() => edit(op)}><span>{op.title}<small>{dateLabel(op.date)}</small></span><strong>{op.type === 'income' ? '+' : '−'}{money(op.amount)} ₸</strong></button>)}</div> : <p>Запишите будущую зарплату или покупку.<br />Учтём её, когда наступит нужная дата.</p>}<button className="text-button" onClick={add}>Запланировать операцию <ArrowRight size={15} /></button><div className="plan-decoration" aria-hidden="true">↗</div></div></section>
        {isEmpty && <div className="demo-strip"><div><Sparkles size={16} /><span>Хотите сначала осмотреться?</span></div><button className="text-button" onClick={demo} disabled={!!data.error}>Загрузить демонстрационные данные<ArrowRight size={14} /></button></div>}
      </>}
      {tab === 'history' && <section className="panel history-panel"><header className="panel-heading"><div><h2>Все операции <span className="count">{filtered.length}</span></h2><p>От новых к старым, включая запланированные</p></div><button className="text-button" onClick={() => { setSearch(''); setFilterType('all'); setFilterCategory('all'); setStartDate(''); setEndDate(''); }}>Сбросить фильтры</button></header><div className="filters"><label className="search-field"><Search size={17} /><input aria-label="Поиск по названию" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по названию" /></label><select aria-label="Тип операции" value={filterType} onChange={e => changeFilterType(e.target.value)}><option value="all">Все типы</option><option value="income">Доходы</option><option value="expense">Расходы</option></select><select aria-label="Категория операций" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}><option value="all">Все категории</option>{[...new Set(filterType === 'all' ? [...CATEGORIES.expense, ...CATEGORIES.income] : CATEGORIES[filterType])].map(c => <option key={c}>{c}</option>)}</select><div className="period-fields"><label>С<input aria-label="Начало периода" type="date" value={startDate} max={endDate || '9999-12-31'} onInput={e => setStartDate(e.target.value)} onChange={e => setStartDate(e.target.value)} /></label><label>По<input aria-label="Конец периода" type="date" value={endDate} min={startDate || '1900-01-01'} onInput={e => setEndDate(e.target.value)} onChange={e => setEndDate(e.target.value)} /></label></div></div>{filtered.length ? <TransactionList operations={filtered} today={today} onEdit={edit} onDelete={remove} onAdd={add} /> : isEmpty ? <TransactionList operations={[]} onAdd={add} /> : <div className="filter-empty"><Search size={28} /><h3>Ничего не нашлось</h3><p>Попробуйте изменить фильтры или период.</p></div>}</section>}
      {tab === 'analytics' && <><div className="analytics-highlight"><div className="mini-icon"><ChartNoAxesCombined size={22} /></div><div><span>Самая большая категория расходов</span><h2>{summary.categories[0] ? `${summary.categories[0][0]} · ${money(summary.categories[0][1])} ₸` : 'В этом месяце расходов пока нет'}</h2></div><span className="subtle-chip">{summary.categories[0] ? `${Math.round(summary.categories[0][1] / summary.expense * 100)}% всех расходов` : 'С чистого листа'}</span></div><div className="analytics-grid"><section className="panel"><header className="panel-heading"><div><h2>Расходы по категориям</h2><p>{monthLabel(month)}</p></div></header><Donut categories={summary.categories} total={summary.expense} /></section><section className="panel"><header className="panel-heading"><div><h2>Доходы и расходы</h2><p>Последние шесть месяцев до выбранного</p></div></header><Bars operations={data.operations} month={month} today={today} /></section></div></>}
      {tab === 'settings' && <div className="settings-grid"><section className="panel settings-panel"><div className="settings-icon"><Wallet size={24} /></div><h2>Начальный баланс</h2><p>Деньги, с которых вы начали учёт.<br />В месячные доходы эта сумма не входит.</p><div className="settings-balance">{money(data.initialBalance)} <small>₸</small></div><button className="button secondary" onClick={() => setModal({ type: 'balance' })}><Pencil size={16} />Изменить баланс</button></section><section className="panel settings-panel"><div className="settings-icon"><ShieldCheck size={24} /></div><h2>Ваши данные</h2><p>Операции хранятся только в этом браузере. При очистке его данных история удалится. Сохраняйте резервную копию.</p><button className="button secondary" onClick={() => { const blob = new Blob([JSON.stringify({ version: 1, initialBalance: data.initialBalance, operations: data.operations }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `moneta-${today}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); }}><Download size={16} />Скачать копию JSON</button><label className="button secondary import-button">Восстановить из JSON<input type="file" accept=".json,application/json" onChange={async e => { const file = e.target.files[0]; if (!file) return; try { if (file.size > 10_000_000) throw new Error('Файл слишком большой. Максимум — 10 МБ.'); const imported = readSaved(await file.text()); setModal({ type: 'import', data: imported }); } catch (err) { setToast(`Не удалось прочитать копию: ${err.message}`); } e.target.value = ''; }} /></label></section><section className="panel settings-panel"><div className="settings-icon"><Sun size={24} /></div><h2>Оформление</h2><p>Выберите тему, в которой вам комфортно.</p><div className="theme-switch settings-theme"><button onClick={() => setTheme('light')} aria-pressed={theme === 'light'} className={theme === 'light' ? 'selected' : ''}><Sun size={16} />Светлая</button><button onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'} className={theme === 'dark' ? 'selected' : ''}><Moon size={16} />Тёмная</button></div></section></div>}
      <footer className="page-footer"><span>moneta<span className="brand-dot">.</span> <i>Меньше суеты. Больше ясности.</i></span><span><ShieldCheck size={13} />Ваши финансы остаются у вас</span></footer>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Мобильная навигация">{[...tabs, { id: 'settings', label: 'Настройки', icon: Settings }].map(({ id, label, icon: NavIcon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}><NavIcon size={20} /><span>{label}</span></button>)}</nav>
    {modal?.type === 'operation' && <OperationForm operation={modal.operation} today={today} onSave={saveOperation} onClose={closeModal} />}
    {modal?.type === 'balance' && <BalanceForm current={data.initialBalance} onClose={closeModal} onSave={value => { save({ ...data, initialBalance: value }); closeModal(); setToast('Начальный баланс сохранён'); }} />}
    {modal?.type === 'delete' && <Modal title="Удалить операцию?" subtitle={`${modal.operation.title} · ${money(modal.operation.amount)} ₸`} onClose={closeModal}><div className="operation-form"><p className="muted">Операция исчезнет из истории. Баланс и статистика пересчитаются.</p><div className="form-footer"><button className="button secondary" onClick={closeModal}>Отмена</button><button className="button danger" onClick={() => { try { save({ ...data, operations: data.operations.filter(op => op.id !== modal.operation.id) }); closeModal(); setToast('Операция удалена'); } catch (err) { setToast(err.message); } }}>Удалить</button></div></div></Modal>}
    {modal?.type === 'import' && <Modal title="Восстановить резервную копию?" subtitle={`В копии ${modal.data.operations.length} операций.`} onClose={closeModal}><div className="operation-form"><p className="muted">Текущая история будет полностью заменена данными из файла. Сначала скачайте её копию, если хотите сохранить её отдельно.</p><div className="form-footer"><button className="button secondary" onClick={closeModal}>Отмена</button><button className="button primary" onClick={() => { try { save(modal.data, { recover: true }); closeModal(); setToast('Резервная копия восстановлена'); } catch (err) { setToast(err.message); } }}>Восстановить</button></div></div></Modal>}
    {toast && <div className="toast" role="status"><CircleAlert size={18} /><span>{toast}</span><button className="icon-button" aria-label="Закрыть уведомление" onClick={() => setToast('')}><X size={16} /></button></div>}
  </div>;
}

