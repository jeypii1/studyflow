'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Task = {
  id: number;
  title: string;
  subject: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
};

const starterTasks: Task[] = [
  { id: 1, title: 'Review chapter 4 notes', subject: 'Mathematics', due: '9:00 AM', priority: 'High', completed: true },
  { id: 2, title: 'Draft research introduction', subject: 'English', due: '1:30 PM', priority: 'High', completed: false },
  { id: 3, title: 'Practice JavaScript arrays', subject: 'Programming', due: '4:00 PM', priority: 'Medium', completed: false },
  { id: 4, title: 'Prepare biology flashcards', subject: 'Science', due: '6:00 PM', priority: 'Low', completed: false },
];

const subjects = ['Mathematics', 'English', 'Programming', 'Science', 'General'];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(starterTasks);
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Programming');
  const [due, setDue] = useState('4:00 PM');
  const [priority, setPriority] = useState<Task['priority']>('Medium');

  useEffect(() => {
    const savedTasks = localStorage.getItem('studyflow-tasks');
    const savedTheme = localStorage.getItem('studyflow-theme');
    if (savedTasks) {
      try { setTasks(JSON.parse(savedTasks)); } catch { /* Keep starter tasks. */ }
    }
    setDark(savedTheme === 'dark');
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem('studyflow-tasks', JSON.stringify(tasks));
  }, [tasks, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem('studyflow-theme', dark ? 'dark' : 'light');
  }, [dark, ready]);

  const completed = tasks.filter((task) => task.completed).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === 'All' || (filter === 'Completed' ? task.completed : !task.completed);
    const matchesQuery = `${task.title} ${task.subject}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }), [tasks, filter, query]);

  function resetForm() {
    setEditingId(null); setTitle(''); setSubject('Programming'); setDue('4:00 PM'); setPriority('Medium');
  }

  function openEdit(task: Task) {
    setEditingId(task.id); setTitle(task.title); setSubject(task.subject); setDue(task.due); setPriority(task.priority); setShowForm(true);
  }

  function saveTask(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    if (editingId) {
      setTasks((current) => current.map((task) => task.id === editingId ? { ...task, title: title.trim(), subject, due: due.trim() || 'Anytime', priority } : task));
    } else {
      setTasks((current) => [...current, { id: Date.now(), title: title.trim(), subject, due: due.trim() || 'Anytime', priority, completed: false }]);
    }
    setShowForm(false); resetForm();
  }

  function closeForm() { setShowForm(false); resetForm(); }

  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <main className={dark ? 'dark min-h-screen' : 'min-h-screen'}>
      <div className="app-shell min-h-screen bg-[#f5f5f2] text-[#202026] transition-colors">
        <aside className="sidebar fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-black/5 bg-[#202026] p-6 text-white lg:flex">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#7667f5] text-lg font-extrabold">S</div>
            <div><p className="text-lg font-bold">StudyFlow</p><p className="text-xs text-white/50">Student workspace</p></div>
          </div>
          <nav className="mt-12 space-y-2" aria-label="Main navigation">
            {['Overview', 'My tasks', 'Calendar', 'Study sessions'].map((item, index) => (
              <button key={item} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${index === 0 ? 'bg-white text-[#202026]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                <span className="text-base">{['⌂', '✓', '□', '◷'][index]}</span>{item}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-white/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a99fff]">Daily thought</p>
            <p className="mt-3 text-sm leading-6 text-white/70">“Small steps every day create remarkable results.”</p>
          </div>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-10 border-b border-black/5 bg-[#f5f5f2]/90 px-5 py-4 backdrop-blur-xl md:px-9">
            <div className="mx-auto flex max-w-[1400px] items-center gap-4">
              <div className="flex items-center gap-3 lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#7667f5] font-bold text-white">S</span><b>StudyFlow</b></div>
              <label className="ml-auto hidden max-w-sm flex-1 items-center gap-2 rounded-xl border border-black/5 bg-white px-4 py-2.5 sm:flex">
                <span className="text-[#92929d]">⌕</span>
                <span className="sr-only">Search tasks</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your tasks" className="w-full bg-transparent text-sm outline-none" />
              </label>
              <button onClick={() => setDark((value) => !value)} aria-label="Toggle color theme" className="grid h-10 w-10 place-items-center rounded-xl border border-black/5 bg-white text-lg">{dark ? '☀' : '◐'}</button>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f4a261] text-sm font-bold text-white">JD</div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] px-5 py-8 md:px-9 md:py-10">
            <section className="flex flex-wrap items-end justify-between gap-5">
              <div><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#7667f5]">{dateLabel}</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Good morning, Jamie.</h1><p className="mt-2 text-[#7d7d89]">A little progress today adds up to big results.</p></div>
              <button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-xl bg-[#7667f5] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(118,103,245,.25)] transition hover:-translate-y-0.5">+ Add new task</button>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Daily summary">
              <div className="summary-card relative overflow-hidden rounded-[20px] bg-[#7667f5] p-5 text-white"><div className="absolute -right-7 -top-9 h-28 w-28 rounded-full border-[18px] border-white/10" /><p className="text-sm text-white/70">Tasks completed</p><p className="mt-3 text-3xl font-extrabold">{completed}<span className="text-lg text-white/50"> / {tasks.length}</span></p><p className="mt-4 text-xs text-white/60">Keep the momentum going</p></div>
              <div className="summary-card rounded-[20px] border border-black/5 bg-white p-5"><div className="flex items-start justify-between"><p className="text-sm text-[#83838e]">Study time</p><span className="rounded-lg bg-[#fff0df] px-2 py-1 text-xs text-[#b96c22]">Today</span></div><p className="mt-3 text-3xl font-extrabold">3h 20m</p><p className="mt-4 text-xs text-[#8b8b96]">42 minutes above average</p></div>
              <div className="summary-card rounded-[20px] border border-black/5 bg-white p-5"><div className="flex items-start justify-between"><p className="text-sm text-[#83838e]">Current streak</p><span className="text-lg">●</span></div><p className="mt-3 text-3xl font-extrabold">12 days</p><p className="mt-4 text-xs text-[#8b8b96]">Personal best: 18 days</p></div>
            </section>

            <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
              <section className="panel rounded-[22px] border border-black/5 bg-white p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div><h2 className="text-xl font-extrabold">Today’s focus</h2><p className="mt-1 text-sm text-[#898994]">{tasks.length - completed} tasks remaining</p></div>
                  <div className="flex rounded-xl bg-[#f4f3f8] p-1">{(['All', 'Active', 'Completed'] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === item ? 'bg-white text-[#6151e8] shadow-sm' : 'text-[#8b8b96]'}`}>{item}</button>)}</div>
                </div>
                <label className="mt-5 flex items-center gap-2 rounded-xl border border-black/5 bg-[#fafafa] px-3 py-2.5 sm:hidden"><span>⌕</span><span className="sr-only">Search tasks</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" className="w-full bg-transparent text-sm outline-none" /></label>
                <div className="mt-5 space-y-3">
                  {visibleTasks.map((task) => (
                    <article key={task.id} className="task-row group flex items-center gap-4 rounded-2xl border border-black/5 p-4 transition hover:border-[#7667f5]/30 hover:shadow-sm">
                      <button onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item))} aria-label={task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`} className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs font-bold ${task.completed ? 'border-[#7667f5] bg-[#7667f5] text-white' : 'border-[#ccccd4]'}`}>{task.completed ? '✓' : ''}</button>
                      <div className="min-w-0 flex-1"><h3 className={`truncate font-bold ${task.completed ? 'text-[#a0a0aa] line-through' : ''}`}>{task.title}</h3><div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#8c8c97]"><span>{task.subject}</span><span>•</span><span>{task.due}</span><span className={`rounded-full px-2 py-0.5 font-bold ${task.priority === 'High' ? 'bg-[#ffe8e4] text-[#d45b4c]' : task.priority === 'Medium' ? 'bg-[#fff0df] text-[#b66b22]' : 'bg-[#e7f5ed] text-[#42805d]'}`}>{task.priority}</span></div></div>
                      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100"><button onClick={() => openEdit(task)} className="rounded-lg px-2.5 py-2 text-sm text-[#686875] hover:bg-[#f2f1f7]" aria-label={`Edit ${task.title}`}>Edit</button><button onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))} className="rounded-lg px-2.5 py-2 text-sm text-[#d45b4c] hover:bg-[#fff0ed]" aria-label={`Delete ${task.title}`}>×</button></div>
                    </article>
                  ))}
                  {!visibleTasks.length && <div className="rounded-2xl border border-dashed border-[#d8d8df] py-12 text-center"><p className="font-bold">Nothing here yet</p><p className="mt-1 text-sm text-[#8b8b96]">Try another filter or add a new task.</p></div>}
                </div>
              </section>

              <aside className="space-y-5">
                <div className="rounded-[22px] bg-[#202026] p-6 text-white"><div className="flex items-center justify-between"><p className="text-sm text-white/55">Weekly progress</p><span className="text-xs font-bold text-[#9e93ff]">WEEK 34</span></div><div className="mt-5 flex items-end gap-3"><p className="text-5xl font-extrabold tracking-[-0.05em]">{progress}%</p><p className="pb-1 text-xs text-[#7fe0aa]">Keep going!</p></div><div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-[#8b7eff] transition-all" style={{ width: `${progress}%` }} /></div><div className="mt-6 flex items-end justify-between gap-2" aria-label="Weekly activity chart">{[45, 72, 52, 88, 66, 92, 34].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-sm bg-white/10" style={{ height: `${height * .55}px` }}><div className="h-full w-full rounded-t-sm bg-[#887aff]" style={{ opacity: index === 5 ? 1 : .42 }} /></div><span className="text-[10px] text-white/35">{['M','T','W','T','F','S','S'][index]}</span></div>)}</div></div>
                <div className="panel rounded-[22px] border border-black/5 bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-extrabold">Up next</h2><span className="rounded-lg bg-[#ebe9ff] px-2 py-1 text-xs font-bold text-[#6858e8]">In 45 min</span></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-[#a0a0aa]">10:30 AM</p><p className="mt-2 font-bold">Database Systems lecture</p><p className="mt-1 text-sm text-[#858590]">Room 204 · 1 hour</p><button className="mt-5 w-full rounded-xl bg-[#efedff] py-3 text-sm font-bold text-[#6151e8]">Open schedule</button></div>
              </aside>
            </div>
          </div>
        </div>

        {showForm && <div className="fixed inset-0 z-50 grid place-items-center bg-[#16161c]/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <form onSubmit={saveTask} className="modal-card w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7667f5]">{editingId ? 'Update your plan' : 'Plan your next win'}</p><h2 className="mt-2 text-2xl font-extrabold">{editingId ? 'Edit task' : 'Add a new task'}</h2></div><button type="button" onClick={closeForm} className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f3f5] text-lg" aria-label="Close form">×</button></div>
            <label className="mt-6 block text-sm font-bold">Task name<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Finish history essay" className="mt-2 w-full rounded-xl border border-[#ddddE5] bg-transparent px-4 py-3 font-normal outline-none focus:border-[#7667f5]" /></label>
            <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm font-bold">Subject<select value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dddde5] bg-transparent px-3 py-3 font-normal outline-none">{subjects.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm font-bold">Due time<input value={due} onChange={(event) => setDue(event.target.value)} placeholder="4:00 PM" className="mt-2 w-full rounded-xl border border-[#dddde5] bg-transparent px-3 py-3 font-normal outline-none" /></label></div>
            <fieldset className="mt-4"><legend className="text-sm font-bold">Priority</legend><div className="mt-2 grid grid-cols-3 gap-2">{(['Low', 'Medium', 'High'] as const).map((item) => <button type="button" key={item} onClick={() => setPriority(item)} className={`rounded-xl border py-2.5 text-sm font-bold ${priority === item ? 'border-[#7667f5] bg-[#efedff] text-[#6151e8]' : 'border-[#dddde5] text-[#777783]'}`}>{item}</button>)}</div></fieldset>
            <button type="submit" className="mt-6 w-full rounded-xl bg-[#7667f5] py-3.5 text-sm font-bold text-white">{editingId ? 'Save changes' : 'Add to my tasks'}</button>
          </form>
        </div>}
      </div>
    </main>
  );
}
