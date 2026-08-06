import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Link, useLocation, useRoute } from 'wouter';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity, ArrowRight, BarChart3, Bell, Check, ChevronRight, CircleAlert,
  ClipboardList, Download, FileText, HeartPulse, History, Info,
  LayoutDashboard, LockKeyhole, Menu, MessageCircle, RefreshCw, Send,
  ShieldCheck, Sparkles, Stethoscope, X, Zap
} from 'lucide-react';
import {
  getGetConsultationQueryKey, getGetDashboardSummaryQueryKey,
  getGetReportQueryKey,
  useAnswerConsultation, useCreateConsultation, useGetConsultation,
  useGetDashboardSummary, useGetReport, useListConsultations, useListWorkflowAgents
} from '@workspace/api-client-react';
import type {
  CaseSummary, Consultation, ConsultationDetail, DashboardSummary, Report, WorkflowAgent
} from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type Risk = 'green' | 'yellow' | 'orange' | 'red';

const riskTheme: Record<Risk, { label: string; bg: string; text: string; dot: string }> = {
  green: { label: 'Low priority', bg: 'bg-[#e4f1e9]', text: 'text-[#2f735e]', dot: 'bg-[#5a9c7d]' },
  yellow: { label: 'Monitor', bg: 'bg-[#faf0d8]', text: 'text-[#a2772c]', dot: 'bg-[#d5a943]' },
  orange: { label: 'Needs attention', bg: 'bg-[#fbe6d8]', text: 'text-[#b75e37]', dot: 'bg-[#d77a4e]' },
  red: { label: 'Urgent', bg: 'bg-[#f8dddd]', text: 'text-[#ae4b49]', dot: 'bg-[#c95b59]' },
};

function formatDate(date?: string | null) {
  if (!date) return 'Not yet recorded';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}
function formatTime(date?: string | null) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
}
function getStoredId() {
  return typeof window !== 'undefined' ? window.localStorage.getItem('mediguide-current') : null;
}
function rememberId(id: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem('mediguide-current', id);
}

function RiskBadge({ risk, label }: { risk: Risk; label?: string }) {
  const theme = riskTheme[risk] || riskTheme.green;
  return <span data-testid={`status-risk-${risk}`} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${theme.bg} ${theme.text}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />{label || theme.label}
  </span>;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#e8e5dd] ${className}`} />;
}

function QueryState({ loading, error, retry, children }: { loading?: boolean; error?: boolean; retry?: () => void; children: ReactNode }) {
  if (loading) return <div className="space-y-4"><Skeleton className="h-28 w-full" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div></div>;
  if (error) return <div className="rounded-2xl border border-[#ebcac4] bg-[#fff8f5] p-8 text-center"><CircleAlert className="mx-auto mb-3 text-[#b75e37]" size={24} /><p className="font-semibold text-[#713f35]">We couldn't load this view.</p><p className="mt-1 text-sm text-[#93675d]">Your private information is safe. Try again in a moment.</p>{retry && <button data-testid="button-retry" onClick={retry} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#b75e37] px-4 py-2 text-sm font-semibold text-white"><RefreshCw size={14} /> Try again</button>}</div>;
  return <>{children}</>;
}

function Brand() {
  return <Link href="/" data-testid="link-brand" className="flex items-center gap-3">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#a7d7c5] text-[#173e3b]"><HeartPulse size={18} strokeWidth={2.5} /></span>
    <span><span className="block font-serif text-[20px] leading-none tracking-tight text-[#f8f3e9]">MediGuide</span><span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.2em] text-[#a7d7c5]">private care companion</span></span>
  </Link>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/consultation', label: 'New consultation', icon: MessageCircle },
    { href: '/timeline', label: 'My timeline', icon: History },
    { href: '/reports', label: 'Reports', icon: FileText },
  ];
  return <div className="min-h-[100dvh] bg-[#f7f4ed] text-[#1f3434]">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[254px] flex-col bg-[#173e3b] px-5 py-6 transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between"><Brand /><button data-testid="button-close-menu" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-[#a7d7c5] md:hidden"><X size={18} /></button></div>
      <div className="mt-12"><p className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#7aa99d]">Your care space</p><nav className="space-y-1">{nav.map(({ href, label, icon: Icon }) => <Link data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${location === href ? 'bg-[#2a5c57] font-semibold text-[#f8f3e9]' : 'text-[#a9c7bd] hover:bg-[#214c48] hover:text-[#f8f3e9]'}`}><Icon size={17} />{label}{href === '/consultation' && <span className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-[#9bd2bf] text-xs font-bold text-[#173e3b]">+</span>}</Link>)}</nav></div>
      <div className="mt-auto rounded-2xl border border-[#3b6861] bg-[#204a46] p-4"><div className="mb-3 flex items-center gap-2 text-[#b8e1d3]"><LockKeyhole size={14} /><span className="font-mono text-[9px] uppercase tracking-[0.15em]">Private by design</span></div><p className="text-xs leading-relaxed text-[#9bbdb3]">Your conversations are kept in your private care space and never shared without your permission.</p></div>
      <div className="mt-5 flex items-center justify-between px-1 text-[#7aa99d]"><span className="font-mono text-[10px]">MEDIGUIDE / 01</span><button data-testid="button-notifications" className="rounded-lg p-2 hover:bg-[#214c48]"><Bell size={15} /></button></div>
    </aside>
    {mobileOpen && <button aria-label="Close navigation" data-testid="button-overlay-menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[#173e3b]/40 md:hidden" />}
    <main className="min-h-[100dvh] md:pl-[254px]"><header className="flex h-[72px] items-center justify-between border-b border-[#e5e0d5] bg-[#f7f4ed]/90 px-5 backdrop-blur md:px-10"><button data-testid="button-open-menu" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-[#54706d] md:hidden"><Menu size={20} /></button><div className="hidden md:block" /><div className="flex items-center gap-4"><span className="hidden text-xs text-[#70817d] sm:block">Tuesday, October 15</span><span className="h-8 w-px bg-[#e5e0d5]" /><div className="grid h-8 w-8 place-items-center rounded-full bg-[#e7c4a9] text-xs font-bold text-[#6d4030]">AM</div></div></header><div className="mx-auto max-w-[1260px] px-5 py-8 md:px-10 md:py-12">{children}</div></main>
  </div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: ReactNode; description: string; action?: ReactNode }) {
  return <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#4c8d7a]"><span className="h-1.5 w-1.5 rounded-full bg-[#e7a58a]" />{eyebrow}</p><h1 className="font-serif text-4xl leading-[1.05] tracking-[-0.03em] text-[#173e3b] md:text-[50px]">{title}</h1><p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#637572]">{description}</p></div>{action}</div>;
}

function Dashboard() {
  const queryClient = useQueryClient();
  const summaryQuery = useGetDashboardSummary();
  const data = summaryQuery.data as DashboardSummary | undefined;
  const create = useCreateConsultation();
  const [, setLocation] = useLocation();
  const start = () => create.mutate({ data: { message: 'I would like help understanding a symptom.' } }, { onSuccess: (detail) => { rememberId(detail.id); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation('/consultation'); } });
  return <><PageHeader eyebrow="Tuesday, October 15 · Your private care space" title={<>Clarity for the<br /><em className="not-italic text-[#4c8d7a]">next right step.</em></>} description="A calm place to understand what your body may be telling you. Start with one honest answer at a time." action={<button data-testid="button-start-consultation" onClick={start} disabled={create.isPending} className="group inline-flex items-center justify-center gap-3 rounded-xl bg-[#e7a58a] px-5 py-3.5 text-sm font-bold text-[#51372d] shadow-[0_5px_0_#d28c70] transition-transform hover:-translate-y-0.5 disabled:opacity-60">{create.isPending ? 'Opening your space…' : 'Start a consultation'}<ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></button>} />
    <QueryState loading={summaryQuery.isLoading} error={summaryQuery.isError} retry={() => summaryQuery.refetch()}><div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
      <div className="relative min-h-[220px] overflow-hidden rounded-2xl bg-[#d9eee5] p-6 md:p-7"><div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border-[18px] border-[#bbdfd0]/80" /><div className="absolute -bottom-20 right-16 h-40 w-40 rounded-full bg-[#b8dfcf]/60" /><div className="relative z-10 flex h-full flex-col justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#528679]">Care snapshot</p><h2 className="mt-4 max-w-sm font-serif text-3xl leading-tight text-[#173e3b]">Your health story,<br />held in one place.</h2></div><div className="mt-8 flex items-end justify-between"><p className="max-w-[240px] text-xs leading-relaxed text-[#52756d]">Each consultation adds a little more context, so your next decision feels less uncertain.</p><Link data-testid="link-learn-workflow" href="/workflow" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#173e3b] text-[#d9eee5] transition-transform hover:scale-105"><ArrowRight size={17} /></Link></div></div></div>
      <MetricCard icon={<ClipboardList size={16} />} label="Consultations" value={data?.totalConsultations ?? 0} note={`${data?.completedConsultations ?? 0} completed`} />
      <MetricCard icon={<BarChart3 size={16} />} label="Average risk" value={data?.averageRisk || '—'} note="Across your consultations" />
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <LatestCard consultation={data?.latestConsultation} onStart={start} />
      <RiskBreakdown breakdown={data?.riskBreakdown} />
    </div>
    <div className="mt-12 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4c8d7a]">Keep your context close</p><h2 className="mt-2 font-serif text-3xl text-[#173e3b]">Recent reports</h2></div><Link data-testid="link-all-reports" href="/reports" className="flex items-center gap-1 text-sm font-semibold text-[#4c8d7a]">View all <ChevronRight size={15} /></Link></div>
    <RecentReports reports={data?.recentReports || []} />
    </QueryState>
  </>;
}

function MetricCard({ icon, label, value, note }: { icon: ReactNode; label: string; value: string | number; note: string }) {
  return <div className="rounded-2xl border border-[#e4ded2] bg-[#fbfaf6] p-6"><div className="flex items-center gap-2 text-[#679386]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e3f0ea]">{icon}</span><span className="font-mono text-[10px] uppercase tracking-[0.15em]">{label}</span></div><p data-testid={`text-metric-${label.toLowerCase().replaceAll(' ', '-')}`} className="mt-7 font-serif text-4xl text-[#173e3b]">{value}</p><p className="mt-1 text-xs text-[#71817e]">{note}</p></div>;
}
function LatestCard({ consultation, onStart }: { consultation?: Consultation | null; onStart: () => void }) {
  if (!consultation) return <div className="flex min-h-[206px] flex-col items-start justify-between rounded-2xl border border-dashed border-[#c8d5cd] bg-[#eef5f0] p-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4c8d7a]">Latest consultation</p><h3 className="mt-5 font-serif text-2xl text-[#173e3b]">No consultations yet.</h3><p className="mt-2 text-sm text-[#6a807a]">Your first check-in takes about five minutes.</p></div><button data-testid="button-empty-start" onClick={onStart} className="mt-5 flex items-center gap-2 text-sm font-bold text-[#4c8d7a]">Begin your first one <ArrowRight size={15} /></button></div>;
  return <Link href={`/consultation`} data-testid={`card-latest-consultation-${consultation.id}`} onClick={() => rememberId(consultation.id)} className="group block min-h-[206px] rounded-2xl border border-[#e4ded2] bg-[#fbfaf6] p-6 transition hover:border-[#a7cfc0] hover:shadow-[0_12px_30px_-20px_#345e53]"><div className="flex items-start justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4c8d7a]">Latest consultation</p><RiskBadge risk={consultation.riskLevel as Risk} label={consultation.riskLabel} /></div><h3 className="mt-6 font-serif text-2xl text-[#173e3b]">{consultation.title}</h3><p className="mt-1 text-sm text-[#71817e]">{consultation.symptomPreview}</p><div className="mt-6 flex items-center justify-between border-t border-[#ece6db] pt-4 text-xs text-[#778682]"><span>{formatDate(consultation.updatedAt)}</span><span className="flex items-center gap-1 font-semibold text-[#4c8d7a]">Open case <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span></div></Link>;
}
function RiskBreakdown({ breakdown }: { breakdown?: DashboardSummary['riskBreakdown'] }) {
  const values = breakdown || { green: 0, yellow: 0, orange: 0, red: 0 };
  const total = Object.values(values).reduce((a, b) => a + b, 0) || 1;
  return <div className="rounded-2xl bg-[#173e3b] p-6 text-[#f8f3e9]"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9bcabc]">Risk landscape</p><h3 className="mt-2 font-serif text-2xl">At a glance</h3></div><Activity size={22} className="text-[#9bcabc]" /></div><div className="mt-8 flex h-3 overflow-hidden rounded-full bg-[#2b5a54]">{(['green', 'yellow', 'orange', 'red'] as Risk[]).map((risk) => <div key={risk} style={{ width: `${(values[risk] / total) * 100}%` }} className={`${riskTheme[risk].dot} transition-all`} />)}</div><div className="mt-5 grid grid-cols-4 gap-2">{(['green', 'yellow', 'orange', 'red'] as Risk[]).map((risk) => <div key={risk}><p className="font-mono text-[10px] text-[#9bcabc]">{risk === 'green' ? 'Low' : risk[0].toUpperCase() + risk.slice(1)}</p><p data-testid={`text-risk-count-${risk}`} className="mt-1 text-lg font-semibold">{values[risk]}</p></div>)}</div></div>;
}
function RecentReports({ reports }: { reports: Consultation[] }) {
  if (!reports.length) return <div className="mt-5 rounded-2xl border border-dashed border-[#d9d4ca] p-8 text-center text-sm text-[#778682]">Completed reports will appear here after your first consultation.</div>;
  return <div className="mt-5 grid gap-3 md:grid-cols-2">{reports.slice(0, 4).map((report) => <Link href="/reports" onClick={() => rememberId(report.id)} data-testid={`card-report-${report.id}`} key={report.id} className="flex items-center justify-between rounded-xl border border-[#e4ded2] bg-[#fbfaf6] p-4 transition hover:-translate-y-0.5 hover:border-[#a7cfc0]"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f1e9da] text-[#8f7953]"><FileText size={16} /></span><div><p className="text-sm font-semibold text-[#28413e]">{report.title}</p><p className="mt-1 text-xs text-[#87938f]">{formatDate(report.createdAt)}</p></div></div><RiskBadge risk={report.riskLevel as Risk} /></Link>)}</div>;
}

function ConsultationPage() {
  const [, setLocation] = useLocation();
  const dashboard = useGetDashboardSummary();
  const [id, setId] = useState<string | null>(getStoredId());
  const detailQuery = useGetConsultation(id || '', { query: { enabled: !!id, queryKey: getGetConsultationQueryKey(id || '') } });
  const create = useCreateConsultation();
  const answer = useAnswerConsultation();
  const [input, setInput] = useState('');
  const [started, setStarted] = useState(false);
  const detail = detailQuery.data as ConsultationDetail | undefined;
  useEffect(() => { if (!id && dashboard.data?.latestConsultation?.id) { setId(dashboard.data.latestConsultation.id); rememberId(dashboard.data.latestConsultation.id); } }, [dashboard.data, id]);
  const begin = () => create.mutate({ data: { message: 'I would like help understanding a symptom.' } }, { onSuccess: (newDetail) => { setId(newDetail.id); rememberId(newDetail.id); setStarted(true); detailQuery.refetch(); } });
  const submit = () => { if (!input.trim() || !id) return; answer.mutate({ id, data: { answer: input.trim() } }, { onSuccess: () => { setInput(''); detailQuery.refetch(); } }); };
  const messages = detail?.messages || [];
  const isBusy = create.isPending || answer.isPending;
  return <div className="mx-auto max-w-[900px]"><PageHeader eyebrow="Guided intake · one question at a time" title="Let's make sense of it." description="There is no perfect way to describe a symptom. Start wherever feels easiest—we'll bring the pieces together." action={<div className="flex items-center gap-2 text-xs text-[#7c8b87]"><ShieldCheck size={15} className="text-[#4c8d7a]" />Private session</div>} />
    {!id && !started ? <div className="rounded-3xl border border-[#e1ded4] bg-[#fbfaf6] p-8 md:p-12"><div className="mx-auto max-w-xl text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#d9eee5] text-[#347865]"><Sparkles size={26} /></span><h2 className="mt-6 font-serif text-3xl text-[#173e3b]">A few thoughtful questions.<br />A clearer next step.</h2><p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#6f807b]">MediGuide will ask about what you're feeling, how long it's been happening, and anything else that may be useful context.</p><button data-testid="button-begin-intake" onClick={begin} disabled={create.isPending} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#173e3b] px-6 py-3.5 text-sm font-bold text-[#f8f3e9] transition hover:bg-[#24534e] disabled:opacity-60">{create.isPending ? 'Preparing your questions…' : 'Begin gently'}<ArrowRight size={16} /></button><p className="mt-5 text-[11px] text-[#9a9f98]">Usually 4–6 questions · You can pause at any time</p></div></div> : <QueryState loading={detailQuery.isLoading && !detail} error={detailQuery.isError} retry={() => detailQuery.refetch()}><div className="rounded-3xl border border-[#e1ded4] bg-[#fbfaf6] p-5 md:p-8"><div className="mb-8 flex items-center justify-between border-b border-[#ece6db] pb-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#4c8d7a]">Current consultation</p><p className="mt-1 text-sm font-semibold text-[#31524c]">{detail?.title || 'Your new consultation'}</p></div><div className="text-right"><p className="font-mono text-[10px] text-[#8a9893]">PROGRESS</p><div className="mt-2 flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#e5e5db]"><div style={{ width: `${detail?.progress || 8}%` }} className="h-full rounded-full bg-[#4c8d7a] transition-all duration-500" /></div><span className="font-mono text-[11px] text-[#4c8d7a]">{detail?.progress || 8}%</span></div></div></div>
      <div className="min-h-[280px] space-y-5">{messages.map((message) => <div key={message.id} data-testid={`message-${message.id}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>{message.role !== 'user' && <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#d9eee5] text-[#347865]"><HeartPulse size={14} /></span>}<div className={`max-w-[78%] ${message.role === 'user' ? 'order-first' : ''}`}><div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'rounded-br-sm bg-[#173e3b] text-[#f8f3e9]' : message.role === 'system' ? 'bg-[#f7ecd9] text-[#806a45]' : 'rounded-bl-sm bg-[#edf3ef] text-[#35534d]'}`}>{message.content}</div><p className={`mt-1 px-1 text-[10px] text-[#a0a49e] ${message.role === 'user' ? 'text-right' : ''}`}>{formatTime(message.timestamp)}</p></div></div>)}{isBusy && <div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#d9eee5] text-[#347865]"><HeartPulse size={14} /></span><div className="flex gap-1 rounded-2xl rounded-bl-sm bg-[#edf3ef] px-4 py-3"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#78a99a]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#78a99a] [animation-delay:120ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#78a99a] [animation-delay:240ms]" /></div></div>}</div>
      {detail?.summary && <SummaryCard summary={detail.summary} />}
      {detail?.nextQuestion && !detail.summary && <div className="mt-8 border-t border-[#ece6db] pt-6"><label htmlFor="answer" className="mb-2 block text-xs font-semibold text-[#526863]">Your answer</label><div className="flex gap-2 rounded-xl border border-[#cfded5] bg-[#f7fbf8] p-2 focus-within:border-[#4c8d7a]"><input id="answer" data-testid="input-consultation-answer" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Take your time…" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#28413e] outline-none placeholder:text-[#9aa9a3]" disabled={isBusy} /><button data-testid="button-submit-answer" onClick={submit} disabled={isBusy || !input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#4c8d7a] text-white transition hover:bg-[#347865] disabled:opacity-40"><Send size={16} /></button></div><p className="mt-2 text-[11px] text-[#9aa49f]">Press Enter to continue</p></div>}
      {detail?.summary && <button data-testid="button-view-report" onClick={() => { rememberId(detail.id); setLocation('/reports'); }} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e7a58a] px-5 py-3 text-sm font-bold text-[#51372d]">View your completed report <ArrowRight size={15} /></button>}
      </div></QueryState>}
  </div>;
}

function SummaryCard({ summary }: { summary: CaseSummary }) {
  return <div className="mt-8 rounded-2xl border border-[#bedbce] bg-[#edf7f1] p-5 md:p-6"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#cfe9dc] text-[#347865]"><Check size={18} /></span><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#4c8d7a]">Case summary ready</p><h3 className="mt-1 font-serif text-2xl text-[#173e3b]">A clearer picture</h3></div><div className="ml-auto"><RiskBadge risk={summary.riskLevel as Risk} /></div></div><p className="mt-5 text-sm leading-relaxed text-[#46645d]">{summary.riskReason}</p><div className="mt-5 grid gap-3 border-t border-[#d2e8dc] pt-5 sm:grid-cols-2"><div><p className="font-mono text-[9px] uppercase tracking-widest text-[#72978b]">Recommended action</p><p className="mt-1 text-sm font-semibold text-[#31554c]">{summary.recommendedAction}</p></div><div><p className="font-mono text-[9px] uppercase tracking-widest text-[#72978b]">Confidence</p><p className="mt-1 text-sm font-semibold text-[#31554c]">{summary.confidenceScore}% context match</p></div></div></div>;
}

function TimelinePage() {
  const query = useListConsultations();
  const [, setLocation] = useLocation();
  const consultations = (query.data as Consultation[] | undefined) || [];
  return <><PageHeader eyebrow="Your private timeline" title="Every check-in,<br />remembered." description="A quiet record of what you've noticed, what changed, and what to bring forward." action={<div className="flex items-center gap-2 rounded-full bg-[#e3f0ea] px-3 py-2 text-xs font-semibold text-[#4c8d7a]"><LockKeyhole size={13} />Only you can see this</div>} /><QueryState loading={query.isLoading} error={query.isError} retry={() => query.refetch()}>{consultations.length ? <div className="space-y-3">{consultations.map((item, index) => <TimelineItem key={item.id} item={item} index={index} onOpen={() => { rememberId(item.id); setLocation('/consultation'); }} />)}</div> : <div className="rounded-3xl border border-dashed border-[#c7d8ce] bg-[#eef5f0] p-12 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#d9eee5] text-[#4c8d7a]"><History size={24} /></span><h2 className="mt-5 font-serif text-2xl text-[#173e3b]">Your timeline starts here.</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#6e827b]">Every consultation becomes a useful thread in your personal health story.</p><Link href="/consultation" data-testid="link-timeline-start" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173e3b] px-5 py-3 text-sm font-bold text-white">Start a consultation <ArrowRight size={15} /></Link></div>}</QueryState></>;
}
function TimelineItem({ item, index, onOpen }: { item: Consultation; index: number; onOpen: () => void }) {
  return <div data-testid={`row-consultation-${item.id}`} className="group grid gap-4 rounded-2xl border border-[#e4ded2] bg-[#fbfaf6] p-5 transition hover:border-[#a7cfc0] md:grid-cols-[100px_1fr_auto] md:items-center"><div className="flex items-center gap-2 text-xs text-[#81908b] md:block"><span className="font-mono text-[10px] uppercase tracking-wider text-[#4c8d7a]">#{String(index + 1).padStart(2, '0')}</span><span className="mx-1 md:hidden">·</span><span>{formatDate(item.createdAt)}</span></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h3 className="font-serif text-xl text-[#24433f]">{item.title}</h3><RiskBadge risk={item.riskLevel as Risk} label={item.riskLabel} /></div><p className="mt-2 max-w-2xl truncate text-sm text-[#71817e]">{item.symptomPreview}</p><div className="mt-3 flex items-center gap-2 text-[11px] text-[#8a9792]"><span className="h-1 w-1 rounded-full bg-[#a7cfc0]" />{item.status === 'complete' ? 'Summary available' : 'In progress'}<span>·</span>{item.progress}% explored</div></div><button data-testid={`button-reopen-${item.id}`} onClick={onOpen} className="flex items-center gap-2 self-start rounded-lg px-3 py-2 text-xs font-bold text-[#4c8d7a] transition hover:bg-[#e7f0eb] md:self-center">Reopen <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></button></div>;
}

function ReportsPage() {
  const dashboard = useGetDashboardSummary();
  const [id, setId] = useState<string | null>(getStoredId());
  const reportQuery = useGetReport(id || '', { query: { enabled: !!id, queryKey: getGetReportQueryKey(id || '') } });
  useEffect(() => { if (!id && dashboard.data?.latestConsultation?.id) { setId(dashboard.data.latestConsultation.id); rememberId(dashboard.data.latestConsultation.id); } }, [dashboard.data, id]);
  const report = reportQuery.data as Report | undefined;
  return <><PageHeader eyebrow="Private consultation report" title="Your care note." description="A concise record of what you shared and the next steps MediGuide recommends. Keep it for yourself or bring it to a clinician." action={<button data-testid="button-download-report" onClick={() => window.print()} disabled={!report} className="inline-flex items-center gap-2 rounded-xl border border-[#c9d8d0] bg-[#fbfaf6] px-4 py-3 text-sm font-bold text-[#4c8d7a] transition hover:bg-[#e7f0eb] disabled:opacity-40"><Download size={16} /> Download / print</button>} /><QueryState loading={reportQuery.isLoading || (dashboard.isLoading && !id)} error={reportQuery.isError} retry={() => reportQuery.refetch()}>{report ? <ReportView report={report} /> : <div className="rounded-3xl border border-dashed border-[#d5d8cf] bg-[#fbfaf6] p-12 text-center"><FileText className="mx-auto text-[#8ca69c]" size={30} /><h2 className="mt-4 font-serif text-2xl text-[#173e3b]">No report to show yet.</h2><p className="mt-2 text-sm text-[#71817e]">Complete a consultation and your care note will be ready here.</p><Link href="/consultation" data-testid="link-report-start" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173e3b] px-5 py-3 text-sm font-bold text-white">Begin a consultation <ArrowRight size={15} /></Link></div>}</QueryState></>;
}
function ReportView({ report }: { report: Report }) {
  const s = report.summary;
  return <article className="overflow-hidden rounded-3xl border border-[#dedbd1] bg-[#fbfaf6]"><div className="border-b border-[#e6e1d7] bg-[#eef5f0] p-6 md:p-9"><div className="flex flex-col justify-between gap-5 sm:flex-row"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4c8d7a]">MEDIGUIDE / CARE NOTE</p><h2 className="mt-3 font-serif text-3xl text-[#173e3b]">{report.consultation.title}</h2><p className="mt-2 text-sm text-[#668078]">Generated {formatDate(report.generatedAt)}</p></div><RiskBadge risk={s.riskLevel as Risk} label={report.consultation.riskLabel} /></div></div><div className="grid gap-8 p-6 md:grid-cols-[1.3fr_0.7fr] md:p-9"><div><SectionBlock title="Patient summary"><p className="text-[15px] leading-relaxed text-[#49635d]">{s.chiefComplaint}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><ReportDatum label="Duration" value={s.duration} /><ReportDatum label="Severity" value={s.severity} /><ReportDatum label="Medical history" value={s.medicalHistory} /></div></SectionBlock><SectionBlock title="What you shared"><div className="flex flex-wrap gap-2">{s.symptoms.map((symptom) => <span key={symptom} className="rounded-full bg-[#f1e9da] px-3 py-1.5 text-xs font-semibold text-[#806a45]">{symptom}</span>)}</div><p className="mt-4 text-sm leading-relaxed text-[#647771]"><strong className="font-semibold text-[#3c5952]">Associated symptoms:</strong> {s.associatedSymptoms.join(', ') || 'None noted'}</p></SectionBlock><SectionBlock title="Possible conditions"><div className="space-y-2">{s.possibleConditions.map((condition) => <div key={condition} className="flex items-center gap-3 rounded-xl bg-[#f4f3ed] px-4 py-3 text-sm text-[#47615b]"><span className="h-1.5 w-1.5 rounded-full bg-[#d38b6e]" />{condition}</div>)}</div><p className="mt-3 text-[11px] text-[#899590]">These are possibilities to discuss, not a diagnosis.</p></SectionBlock></div><div className="space-y-4"><div className="rounded-2xl bg-[#173e3b] p-5 text-[#f8f3e9]"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a7d7c5]">What to do next</p><p className="mt-4 font-serif text-2xl leading-tight">{s.recommendedAction}</p><p className="mt-3 text-sm leading-relaxed text-[#bdd5cb]">{s.doctorRecommendation}</p></div><div className="rounded-2xl border border-[#e3ded2] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7e918a]">Helpful self-care</p><ul className="mt-4 space-y-3">{s.selfCareAdvice.map((tip) => <li key={tip} className="flex gap-2 text-sm leading-relaxed text-[#5d746e]"><Check size={15} className="mt-0.5 shrink-0 text-[#4c8d7a]" />{tip}</li>)}</ul></div><div className="flex gap-2 rounded-xl bg-[#faf0d8] p-4 text-xs leading-relaxed text-[#806a45]"><Info size={15} className="mt-0.5 shrink-0" />{s.disclaimer}</div></div></div></article>;
}
function SectionBlock({ title, children }: { title: string; children: ReactNode }) { return <section className="mb-9"><h3 className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#4c8d7a]"><span className="h-px w-5 bg-[#9ac6b6]" />{title}</h3>{children}</section>; }
function ReportDatum({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] uppercase tracking-wider text-[#91a09b]">{label}</p><p className="mt-1 text-sm text-[#3e5a54]">{value}</p></div>; }

function WorkflowPage() {
  const query = useListWorkflowAgents();
  const agents = useMemo(() => [...((query.data as WorkflowAgent[] | undefined) || [])].sort((a, b) => a.order - b.order), [query.data]);
  return <><PageHeader eyebrow="How MediGuide thinks" title={<>A chain of care,<br /><em className="not-italic text-[#4c8d7a]">not a black box.</em></>} description="Meet the focused agents that work together behind every consultation. Each has one job, one handoff, and a clear reason for being here." action={<div className="flex items-center gap-2 text-xs text-[#71817e]"><Zap size={15} className="text-[#d38b6e]" />Explained for curious minds</div>} /><QueryState loading={query.isLoading} error={query.isError} retry={() => query.refetch()}>{agents.length ? <div className="relative">{agents.map((agent, index) => <AgentRow key={agent.id} agent={agent} index={index} last={index === agents.length - 1} />)}</div> : <div className="rounded-2xl border border-dashed border-[#d5d8cf] p-10 text-center text-sm text-[#71817e]">The workflow map is getting ready.</div>}</QueryState></>;
}
function AgentRow({ agent, index, last }: { agent: WorkflowAgent; index: number; last: boolean }) {
  const icons = [MessageCircle, Activity, Stethoscope, FileText, ShieldCheck];
  const Icon = icons[index % icons.length];
  return <div className="relative flex gap-5 md:gap-8"><div className="relative flex w-12 shrink-0 flex-col items-center"><div className="z-10 grid h-12 w-12 place-items-center rounded-2xl border border-[#b7d8c9] bg-[#e3f0ea] text-[#347865] shadow-[0_0_0_6px_#f7f4ed]"><Icon size={20} /></div>{!last && <div className="absolute top-12 h-[calc(100%+1px)] w-px bg-[#b7d8c9]" />}</div><div className={`mb-6 flex-1 rounded-2xl border border-[#e3ded2] bg-[#fbfaf6] p-5 transition hover:-translate-y-0.5 hover:border-[#a7cfc0] md:mb-8 md:p-7`}><div className="flex flex-col justify-between gap-4 md:flex-row"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#d0876b]">STEP {String(agent.order).padStart(2, '0')}</p><h2 className="mt-2 font-serif text-2xl text-[#173e3b]">{agent.name}</h2><p className="mt-1 text-sm font-semibold text-[#668078]">{agent.role}</p></div><span className="flex h-fit items-center gap-2 rounded-full bg-[#f1e9da] px-3 py-1.5 text-[11px] font-semibold text-[#806a45]"><ArrowRight size={12} /> handoff ready</span></div><p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#61746f]">{agent.description}</p><div className="mt-6 grid gap-3 border-t border-[#ece6db] pt-5 sm:grid-cols-2"><div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9aa49f]">Receives</p><p className="mt-1 text-sm text-[#4b665f]">{agent.input}</p></div><div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9aa49f]">Passes forward</p><p className="mt-1 text-sm text-[#4b665f]">{agent.output}</p></div></div></div></div>;
}

function AppRouter() {
  return <Shell><Switch><Route path="/" component={Dashboard} /><Route path="/consultation" component={ConsultationPage} /><Route path="/timeline" component={TimelinePage} /><Route path="/reports" component={ReportsPage} /><Route path="/workflow" component={WorkflowPage} /><Route component={NotFound} /></Switch></Shell>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><AppRouter /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;