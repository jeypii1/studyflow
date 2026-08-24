'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Priority = 'High' | 'Medium' | 'Low';
type Page = 'Overview' | 'My tasks' | 'Calendar' | 'Study sessions';
type Filter = 'All' | 'Active' | 'Completed';

type Task = {
  id: number;
  title: string;
  subject: string;
  date: string;
  due: string;
  priority: Priority;
  completed: boolean;
};

const localDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const createStarterTasks = (): Task[] => {
  const today = localDate();
  const tomorrow = new Date(`${today}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);
  return [
    { id: 1, title: 'Review chapter 4 notes', subject: 'Mathematics', date: today, due: '9:00 AM', priority: 'High', completed: true },
    { id: 2, title: 'Draft research introduction', subject: 'English', date: today, due: '1:30 PM', priority: 'High', completed: false },
    { id: 3, title: 'Practice JavaScript arrays', subject: 'Programming', date: today, due: '4:00 PM', priority: 'Medium', completed: false },
    { id: 4, title: 'Prepare biology flashcards', subject: 'Science', date: tomorrowISO, due: '6:00 PM', priority: 'Low', completed: false },
  ];
};

const subjects = ['Mathematics', 'English', 'Programming', 'Science', 'General'];
const navItems: { label: Page; icon: string }[] = [
  { label: 'Overview', icon: '⌂' },
  { label: 'My tasks', icon: '✓' },
  { label: 'Calendar', icon: '□' },
  { label: 'Study sessions', icon: '◷' },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(createStarterTasks);
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(false);
  const [activePage, setActivePage] = useState<Page>('Overview');
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Programming');
  const [taskDate, setTaskDate] = useState(localDate);
  const [due, setDue] = useState('4:00 PM');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [notice, setNotice] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const todayISO = localDate();

  useEffect(() => {
    const savedTasks = localStorage.getItem('studyflow-tasks');
    const savedTheme = localStorage.getItem('studyflow-theme');
    const savedSessions = Number(localStorage.getItem('studyflow-sessions') || 0);
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks) as Partial<Task>[];
        setTasks(parsed.map((task, index) => ({
          id: task.id ?? Date.now() + index,
          title: task.title ?? 'Untitled task',
          subject: task.subject ?? 'General',
          date: task.date ?? todayISO,
          due: task.due ?? 'Anytime',
          priority: task.priority ?? 'Medium',
          completed: task.completed ?? false,
        })));
      } catch { /* Keep the starter tasks if saved data is invalid. */ }
    }
    setDark(savedTheme === 'dark');
    setSessions(savedSessions);
    setReady(true);
  }, [todayISO]);

  useEffect(() => {
    if (ready) localStorage.setItem('studyflow-tasks', JSON.stringify(tasks));
  }, [tasks, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem('studyflow-theme', dark ? 'dark' : 'light');
  }, [dark, ready]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setTimerSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          setTimerRunning(false);
          setSessions((count) => {
            const next = count + 1;
            localStorage.setItem('studyflow-sessions', String(next));
            return next;
          });
          setNotice('Focus session complete — great work!');
          return 25 * 60;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowForm(false);
        setShowProfile(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const completed = tasks.filter((task) => task.completed).length;
  const todayTasks = tasks.filter((task) => task.date === todayISO);
  const activeTasks = tasks.filter((task) => !task.completed).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === 'All' || (filter === 'Completed' ? task.completed : !task.completed);
    const matchesQuery = `${task.title} ${task.subject}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }).sort((a, b) => a.date.localeCompare(b.date)), [tasks, filter, query]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${todayISO}T12:00:00`);
    date.setDate(date.getDate() + index);
    return {
      iso: date.toISOString().slice(0, 10),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  }), [todayISO]);

  function flash(message: string) { setNotice(message); }

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setSubject('Programming');
    setTaskDate(todayISO);
    setDue('4:00 PM');
    setPriority('Medium');
  }

  function openAdd(date = todayISO) {
    resetForm();
    setTaskDate(date);
    setShowForm(true);
  }

  function openEdit(task: Task) {
    setEditingId(task.id);
    setTitle(task.title);
    setSubject(task.subject);
    setTaskDate(task.date || todayISO);
    setDue(task.due);
    setPriority(task.priority);
    setShowForm(true);
  }

  function saveTask(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    if (editingId) {
      setTasks((current) => current.map((task) => task.id === editingId ? { ...task, title: title.trim(), subject, date: taskDate, due: due.trim() || 'Anytime', priority } : task));
      flash('Task updated');
    } else {
      setTasks((current) => [...current, { id: Date.now(), title: title.trim(), subject, date: taskDate, due: due.trim() || 'Anytime', priority, completed: false }]);
      flash('New task added');
    }
    setShowForm(false);
    resetForm();
  }

  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, completed: !task.completed } : task));
  }

  function deleteTask(task: Task) {
    setTasks((current) => current.filter((item) => item.id !== task.id));
    flash(`Deleted “${task.title}”`);
  }

  function changePage(page: Page) {
    setActivePage(page);
    setShowProfile(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function formatTaskDate(date: string) {
    if (date === todayISO) return 'Today';
    return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const timerLabel = `${String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:${String(timerSeconds % 60).padStart(2, '0')}`;

  function TaskRow({ task, showDate = false }: { task: Task; showDate?: boolean }) {
    return (
      <article className="task-row group flex items-center gap-4 rounded-2xl border border-black/5 p-4">
        <button onClick={() => toggleTask(task.id)} aria-label={task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`} className={`check-button grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs font-bold ${task.completed ? 'border-[#7667f5] bg-[#7667f5] text-white' : 'border-[#ccccd4]'}`}>{task.completed ? '✓' : ''}</button>
        <div className="min-w-0 flex-1">
          <h3 className={`truncate font-bold ${task.completed ? 'text-[#a0a0aa] line-through' : ''}`}>{task.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#8c8c97]"><span>{task.subject}</span><span>•</span>{showDate && <><span>{formatTaskDate(task.date)}</span><span>•</span></>}<span>{task.due}</span><span className={`rounded-full px-2 py-0.5 font-bold ${task.priority === 'High' ? 'bg-[#ffe8e4] text-[#d45b4c]' : task.priority === 'Medium' ? 'bg-[#fff0df] text-[#b66b22]' : 'bg-[#e7f5ed] text-[#42805d]'}`}>{task.priority}</span></div>
        </div>
        <div className="task-actions flex gap-1"><button onClick={() => openEdit(task)} className="rounded-lg px-2.5 py-2 text-sm text-[#686875]" aria-label={`Edit ${task.title}`}>Edit</button><button onClick={() => deleteTask(task)} className="rounded-lg px-2.5 py-2 text-lg leading-none text-[#d45b4c]" aria-label={`Delete ${task.title}`}>×</button></div>
      </article>
    );
  }

  function TaskFilters() {
    return <div className="filter-tabs flex rounded-xl bg-[#f4f3f8] p-1">{(['All', 'Active', 'Completed'] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === item ? 'active-filter bg-white text-[#6151e8] shadow-sm' : 'text-[#8b8b96]'}`}>{item}</button>)}</div>;
  }

  function Overview() {
    const visibleToday = todayTasks.filter((task) => filter === 'All' || (filter === 'Completed' ? task.completed : !task.completed)).filter((task) => `${task.title} ${task.subject}`.toLowerCase().includes(query.toLowerCase()));
    return <>
      <section className="page-heading flex flex-wrap items-end justify-between gap-5">
        <div><p className="eyebrow text-xs font-bold uppercase tracking-[0.17em] text-[#7667f5]">{dateLabel}</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Good morning, JP.</h1><p className="mt-2 text-[#7d7d89]">A little progress today adds up to big results.</p></div>
        <button onClick={() => openAdd()} className="primary-button rounded-xl bg-[#7667f5] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(118,103,245,.25)]">+ Add new task</button>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Daily summary">
        <button onClick={() => changePage('My tasks')} className="summary-card interactive-card relative overflow-hidden rounded-[20px] bg-[#7667f5] p-5 text-left text-white"><div className="absolute -right-7 -top-9 h-28 w-28 rounded-full border-[18px] border-white/10" /><p className="text-sm text-white/70">Tasks completed</p><p className="mt-3 text-3xl font-extrabold">{completed}<span className="text-lg text-white/50"> / {tasks.length}</span></p><p className="mt-4 text-xs text-white/60">Open task manager →</p></button>
        <button onClick={() => changePage('Study sessions')} className="summary-card interactive-card rounded-[20px] border border-black/5 bg-white p-5 text-left"><div className="flex items-start justify-between"><p className="text-sm text-[#83838e]">Focus sessions</p><span className="rounded-lg bg-[#fff0df] px-2 py-1 text-xs text-[#b96c22]">Today</span></div><p className="mt-3 text-3xl font-extrabold">{sessions}</p><p className="mt-4 text-xs text-[#8b8b96]">Start a 25-minute timer →</p></button>
        <div className="summary-card interactive-card rounded-[20px] border border-black/5 bg-white p-5"><div className="flex items-start justify-between"><p className="text-sm text-[#83838e]">Current streak</p><span className="text-[#f4a261]">●</span></div><p className="mt-3 text-3xl font-extrabold">12 days</p><p className="mt-4 text-xs text-[#8b8b96]">Personal best: 18 days</p></div>
      </section>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="panel rounded-[22px] border border-black/5 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold">Today’s focus</h2><p className="mt-1 text-sm text-[#898994]">{todayTasks.filter((task) => !task.completed).length} tasks remaining</p></div><TaskFilters /></div>
          <div className="mt-5 space-y-3">{visibleToday.map((task) => <TaskRow key={task.id} task={task} />)}{!visibleToday.length && <EmptyTasks />}</div>
        </section>
        <aside className="space-y-5">
          <ProgressCard />
          <div className="panel interactive-card rounded-[22px] border border-black/5 bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-extrabold">Up next</h2><span className="rounded-lg bg-[#ebe9ff] px-2 py-1 text-xs font-bold text-[#6858e8]">Coming up</span></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-[#a0a0aa]">10:30 AM</p><p className="mt-2 font-bold">Database Systems lecture</p><p className="mt-1 text-sm text-[#858590]">Room 204 · 1 hour</p><button onClick={() => changePage('Calendar')} className="secondary-button mt-5 w-full rounded-xl bg-[#efedff] py-3 text-sm font-bold text-[#6151e8]">Open schedule →</button></div>
        </aside>
      </div>
    </>;
  }

  function EmptyTasks() {
    return <div className="rounded-2xl border border-dashed border-[#d8d8df] py-12 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#efedff] text-[#7667f5]">✓</div><p className="mt-3 font-bold">Nothing here yet</p><p className="mt-1 text-sm text-[#8b8b96]">Try another filter or add a new task.</p><button onClick={() => openAdd()} className="mt-4 text-sm font-bold text-[#6757ea]">Add a task</button></div>;
  }

  function ProgressCard() {
    return <div className="rounded-[22px] bg-[#202026] p-6 text-white"><div className="flex items-center justify-between"><p className="text-sm text-white/55">Overall progress</p><span className="text-xs font-bold text-[#9e93ff]">{activeTasks} ACTIVE</span></div><div className="mt-5 flex items-end gap-3"><p className="text-5xl font-extrabold tracking-[-0.05em]">{progress}%</p><p className="pb-1 text-xs text-[#7fe0aa]">Keep going!</p></div><div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#8b7eff] transition-all duration-500" style={{ width: `${progress}%` }} /></div><div className="mt-6 flex items-end justify-between gap-2" aria-label="Weekly activity chart">{[45, 72, 52, 88, 66, 92, 34].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-sm bg-white/10" style={{ height: `${height * .55}px` }}><div className="chart-bar h-full w-full rounded-t-sm bg-[#887aff]" style={{ opacity: index === 5 ? 1 : .42 }} /></div><span className="text-[10px] text-white/35">{['M','T','W','T','F','S','S'][index]}</span></div>)}</div></div>;
  }

  function TasksPage() {
    return <><section className="page-heading flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-xs font-bold uppercase tracking-[0.17em] text-[#7667f5]">Stay organized</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">My tasks</h1><p className="mt-2 text-[#7d7d89]">Everything on your plate, clearly prioritized.</p></div><button onClick={() => openAdd()} className="primary-button rounded-xl bg-[#7667f5] px-5 py-3 text-sm font-bold text-white">+ Add new task</button></section><section className="mt-8 grid gap-4 sm:grid-cols-3"><div className="metric-card"><span>All tasks</span><strong>{tasks.length}</strong></div><div className="metric-card"><span>Still active</span><strong>{activeTasks}</strong></div><div className="metric-card"><span>Completed</span><strong>{completed}</strong></div></section><section className="panel mt-6 rounded-[22px] border border-black/5 bg-white p-5 md:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold">Task manager</h2><p className="mt-1 text-sm text-[#898994]">Search, filter, edit, or complete any task.</p></div><TaskFilters /></div><div className="mt-5 space-y-3">{visibleTasks.map((task) => <TaskRow key={task.id} task={task} showDate />)}{!visibleTasks.length && <EmptyTasks />}</div></section></>;
  }

  function CalendarPage() {
    return <><section className="page-heading flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-xs font-bold uppercase tracking-[0.17em] text-[#7667f5]">Your week at a glance</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Calendar</h1><p className="mt-2 text-[#7d7d89]">Plan around deadlines before they pile up.</p></div><button onClick={() => openAdd()} className="primary-button rounded-xl bg-[#7667f5] px-5 py-3 text-sm font-bold text-white">+ Schedule task</button></section><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{weekDays.map((day, index) => { const dayTasks = tasks.filter((task) => task.date === day.iso); return <section key={day.iso} className={`calendar-day panel rounded-[20px] border p-4 ${index === 0 ? 'border-[#7667f5] bg-[#f1efff]' : 'border-black/5 bg-white'}`}><button onClick={() => openAdd(day.iso)} className="w-full text-left"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8b8b96]">{day.day} · {day.month}</p><p className="mt-1 text-3xl font-extrabold">{day.date}</p></div><span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#7667f5] shadow-sm">+</span></div></button><div className="mt-5 space-y-2">{dayTasks.map((task) => <button key={task.id} onClick={() => openEdit(task)} className={`calendar-task w-full rounded-xl border-l-4 p-3 text-left ${task.completed ? 'border-[#7fc99d] bg-[#eff8f3]' : task.priority === 'High' ? 'border-[#e47769] bg-[#fff2ef]' : 'border-[#7667f5] bg-white'}`}><p className={`text-sm font-bold ${task.completed ? 'line-through opacity-60' : ''}`}>{task.title}</p><p className="mt-1 text-xs text-[#888893]">{task.due} · {task.subject}</p></button>)}{!dayTasks.length && <p className="rounded-xl border border-dashed border-[#d9d9e0] py-5 text-center text-xs text-[#9b9ba5]">No tasks</p>}</div></section>; })}</div></>;
  }

  function SessionsPage() {
    return <><section className="page-heading"><p className="eyebrow text-xs font-bold uppercase tracking-[0.17em] text-[#7667f5]">Deep work mode</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Study sessions</h1><p className="mt-2 text-[#7d7d89]">Focus for 25 minutes, then give your brain a break.</p></section><div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><section className="focus-card relative overflow-hidden rounded-[28px] bg-[#202026] p-8 text-center text-white md:p-12"><div className="focus-orb absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#7667f5]/20 blur-2xl" /><p className="relative text-xs font-bold uppercase tracking-[0.2em] text-[#9e93ff]">Pomodoro focus</p><p className="relative mt-8 text-7xl font-extrabold tracking-[-0.06em] sm:text-8xl">{timerLabel}</p><p className="relative mt-3 text-sm text-white/50">{timerRunning ? 'Stay with it — you’re doing great.' : 'Ready when you are, JP.'}</p><div className="relative mt-9 flex flex-wrap justify-center gap-3"><button onClick={() => setTimerRunning((running) => !running)} className="primary-button min-w-36 rounded-xl bg-[#7667f5] px-6 py-3.5 font-bold">{timerRunning ? 'Pause session' : timerSeconds < 25 * 60 ? 'Resume session' : 'Start focusing'}</button><button onClick={() => { setTimerRunning(false); setTimerSeconds(25 * 60); }} className="rounded-xl border border-white/15 px-6 py-3.5 font-bold text-white/70 hover:bg-white/10 hover:text-white">Reset</button></div></section><aside className="space-y-5"><div className="panel rounded-[22px] border border-black/5 bg-white p-6"><p className="text-sm text-[#858590]">Sessions completed</p><p className="mt-3 text-5xl font-extrabold">{sessions}</p><p className="mt-3 text-sm text-[#858590]">Each completed timer is saved on this device.</p></div><div className="panel rounded-[22px] border border-black/5 bg-white p-6"><h2 className="font-extrabold">Focus checklist</h2><ul className="mt-4 space-y-3 text-sm text-[#777783]"><li>✓ Put your phone out of reach</li><li>✓ Choose one specific task</li><li>✓ Close unrelated browser tabs</li><li>✓ Take a short break afterward</li></ul></div></aside></div></>;
  }

  return (
    <main className={dark ? 'dark min-h-screen' : 'min-h-screen'}>
      <div className="app-shell min-h-screen bg-[#f5f5f2] text-[#202026] transition-colors">
        <aside className="sidebar fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-black/5 bg-[#202026] p-6 text-white lg:flex">
          <button onClick={() => changePage('Overview')} className="flex items-center gap-3 text-left"><span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#7667f5] text-lg font-extrabold">S</span><span><span className="block text-lg font-bold">StudyFlow</span><span className="block text-xs text-white/50">JP’s workspace</span></span></button>
          <nav className="mt-12 space-y-2" aria-label="Main navigation">{navItems.map((item) => <button key={item.label} onClick={() => changePage(item.label)} className={`nav-button flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${activePage === item.label ? 'active-nav bg-white text-[#202026]' : 'text-white/60'}`}><span className="text-base">{item.icon}</span>{item.label}</button>)}</nav>
          <div className="mt-auto rounded-2xl bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a99fff]">Daily thought</p><p className="mt-3 text-sm leading-6 text-white/70">“Small steps every day create remarkable results.”</p></div>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f5f5f2]/90 px-5 py-4 backdrop-blur-xl md:px-9"><div className="mx-auto flex max-w-[1400px] items-center gap-4"><button onClick={() => changePage('Overview')} className="flex items-center gap-3 lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#7667f5] font-bold text-white">S</span><b>StudyFlow</b></button><label className="search-box ml-auto hidden max-w-sm flex-1 items-center gap-2 rounded-xl border border-black/5 bg-white px-4 py-2.5 sm:flex"><span className="text-[#92929d]">⌕</span><span className="sr-only">Search tasks</span><input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => { if (activePage !== 'Overview' && activePage !== 'My tasks') setActivePage('My tasks'); }} placeholder="Search your tasks" className="w-full bg-transparent text-sm outline-none" /></label><button onClick={() => setDark((value) => !value)} aria-label="Toggle color theme" className="icon-button grid h-10 w-10 place-items-center rounded-xl border border-black/5 bg-white text-lg">{dark ? '☀' : '◐'}</button><div className="relative"><button onClick={() => setShowProfile((value) => !value)} aria-label="Open JP profile menu" className="profile-button grid h-10 w-10 place-items-center rounded-full bg-[#f4a261] text-sm font-bold text-white">JP</button>{showProfile && <div className="profile-menu panel absolute right-0 top-12 w-56 rounded-2xl border border-black/5 bg-white p-3 shadow-xl"><div className="border-b border-black/5 px-2 pb-3"><p className="font-bold">JP</p><p className="text-xs text-[#8b8b96]">Student account</p></div><button onClick={() => { setDark((value) => !value); setShowProfile(false); }} className="mt-2 w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-[#f3f2f8]">Switch appearance</button><button onClick={() => { setTasks(createStarterTasks()); setSessions(0); localStorage.setItem('studyflow-sessions', '0'); setShowProfile(false); flash('Demo data restored'); }} className="w-full rounded-lg px-2 py-2 text-left text-sm text-[#d45b4c] hover:bg-[#fff0ed]">Reset demo data</button></div>}</div></div></header>

          <div className="mx-auto max-w-[1400px] px-5 pb-28 pt-8 md:px-9 md:py-10">
            {activePage === 'Overview' && <Overview />}
            {activePage === 'My tasks' && <TasksPage />}
            {activePage === 'Calendar' && <CalendarPage />}
            {activePage === 'Study sessions' && <SessionsPage />}
          </div>
        </div>

        <nav className="mobile-nav fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-black/5 bg-[#202026]/95 p-2 text-white shadow-2xl backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">{navItems.map((item) => <button key={item.label} onClick={() => changePage(item.label)} className={`rounded-xl px-1 py-2 text-center ${activePage === item.label ? 'bg-[#7667f5]' : 'text-white/55'}`}><span className="block text-base">{item.icon}</span><span className="mt-1 block text-[10px] font-bold">{item.label === 'Study sessions' ? 'Focus' : item.label}</span></button>)}</nav>

        {notice && <div role="status" className="toast fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-[#202026] px-5 py-3 text-sm font-bold text-white shadow-2xl lg:bottom-8">{notice}</div>}

        {showForm && <div className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-[#16161c]/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}><form onSubmit={saveTask} className="modal-card w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7667f5]">{editingId ? 'Update your plan' : 'Plan your next win'}</p><h2 className="mt-2 text-2xl font-extrabold">{editingId ? 'Edit task' : 'Add a new task'}</h2></div><button type="button" onClick={() => setShowForm(false)} className="icon-button grid h-9 w-9 place-items-center rounded-full bg-[#f3f3f5] text-lg" aria-label="Close form">×</button></div><label className="mt-6 block text-sm font-bold">Task name<input required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Finish history essay" className="form-input mt-2 w-full rounded-xl border border-[#dddde5] bg-transparent px-4 py-3 font-normal outline-none" /></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Subject<select value={subject} onChange={(event) => setSubject(event.target.value)} className="form-input mt-2 w-full rounded-xl border border-[#dddde5] bg-transparent px-3 py-3 font-normal outline-none">{subjects.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm font-bold">Due date<input type="date" value={taskDate} onChange={(event) => setTaskDate(event.target.value)} className="form-input mt-2 w-full rounded-xl border border-[#dddde5] bg-transparent px-3 py-3 font-normal outline-none" /></label></div><label className="mt-4 block text-sm font-bold">Due time<input value={due} onChange={(event) => setDue(event.target.value)} placeholder="4:00 PM" className="form-input mt-2 w-full rounded-xl border border-[#dddde5] bg-transparent px-3 py-3 font-normal outline-none" /></label><fieldset className="mt-4"><legend className="text-sm font-bold">Priority</legend><div className="mt-2 grid grid-cols-3 gap-2">{(['Low', 'Medium', 'High'] as const).map((item) => <button type="button" key={item} onClick={() => setPriority(item)} className={`priority-button rounded-xl border py-2.5 text-sm font-bold ${priority === item ? 'border-[#7667f5] bg-[#efedff] text-[#6151e8]' : 'border-[#dddde5] text-[#777783]'}`}>{item}</button>)}</div></fieldset><button type="submit" className="primary-button mt-6 w-full rounded-xl bg-[#7667f5] py-3.5 text-sm font-bold text-white">{editingId ? 'Save changes' : 'Add to my tasks'}</button></form></div>}
      </div>
    </main>
  );
}
