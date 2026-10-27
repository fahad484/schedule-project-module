'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';

type Role = 'PATIENT' | 'DOCTOR';
type User = { id: string; email: string; role: Role; fullName: string; specialty?: string };
type Doctor = {
  id: string;
  fullName: string;
  specialty: string;
  bio: string | null;
  consultationFeeCents: number;
  timeZone: string;
};
type Slot = { startsAt: string; endsAt: string };
type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  patient: { id: string; fullName: string };
  doctor: { id: string; fullName: string; specialty: string };
};
type Availability = {
  id: string;
  weekday: number;
  localStart: string;
  localEnd: string;
  slotMinutes: number;
  validFrom: string;
  validUntil: string | null;
};

const API = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api' : '/api')
).replace(/\/$/, '');

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
    throw new Error(message || 'Something went wrong. Please try again.');
  }
  return payload as T;
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', ...options,
  }).format(new Date(value));
}

function money(cents: number) {
  return cents === 0 ? 'Fee not listed' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(cents / 100);
}

const weekdays = [
  { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' }, { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' }, { value: 5, label: 'Friday' }, { value: 6, label: 'Saturday' }, { value: 7, label: 'Sunday' },
];

export default function MediNestApp({
  today,
  currentYear,
  nowTimestamp,
}: {
  today: string;
  currentYear: number;
  nowTimestamp: number;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'doctors' | 'auth' | 'dashboard'>('doctors');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<Role>('PATIENT');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '', specialty: '', doctorSignupCode: '', phone: '' });
  const [availabilityForm, setAvailabilityForm] = useState({ weekday: '1', localStart: '09:00', localEnd: '17:00', slotMinutes: '30' });
  const [loading, setLoading] = useState(false);
  const [busySlots, setBusySlots] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadDoctors = useCallback(async (query = '') => {
    try {
      const result = await api<Doctor[]>(`/doctors${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      setDoctors(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load doctors.');
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      const result = await api<Appointment[]>('/appointments/me');
      setAppointments(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load appointments.');
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    try {
      const result = await api<Availability[]>('/availability/me');
      setAvailability(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your availability.');
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDoctors();
      void api<{ user: User }>('/auth/me').then((result) => setUser(result.user)).catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDoctors]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDoctors(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search, loadDoctors]);

  useEffect(() => {
    if (!user || view !== 'dashboard') return;
    const timer = window.setTimeout(() => {
      void loadAppointments();
      if (user.role === 'DOCTOR') void loadAvailability();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user, view, loadAppointments, loadAvailability]);

  const activeAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'CONFIRMED' || appointment.status === 'PENDING'),
    [appointments],
  );
  const upcomingAppointments = activeAppointments.filter((appointment) => new Date(appointment.startsAt).getTime() >= nowTimestamp);
  const pastAppointments = appointments.filter((appointment) =>
    new Date(appointment.startsAt).getTime() < nowTimestamp || appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED',
  );

  async function openDoctor(doctor: Doctor) {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setSlots([]);
    setBusySlots(true);
    setError('');
    try {
      setSlots(await api<Slot[]>(`/doctors/${doctor.id}/slots?date=${date}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load available times.');
    } finally {
      setBusySlots(false);
    }
  }

  async function refreshSelectedSlots(nextDate = date) {
    if (!selectedDoctor) return;
    setBusySlots(true);
    setSelectedSlot(null);
    try {
      setSlots(await api<Slot[]>(`/doctors/${selectedDoctor.id}/slots?date=${nextDate}`));
    } catch (err) {
      setSlots([]);
      setError(err instanceof Error ? err.message : 'Could not load available times.');
    } finally {
      setBusySlots(false);
    }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const body = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authRole === 'PATIENT'
          ? { role: 'PATIENT', fullName: authForm.fullName, phone: authForm.phone || undefined, email: authForm.email, password: authForm.password }
          : {
              role: 'DOCTOR', fullName: authForm.fullName, specialty: authForm.specialty,
              doctorSignupCode: authForm.doctorSignupCode,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              email: authForm.email, password: authForm.password,
            };
      const result = await api<{ user: User }>(path, { method: 'POST', body: JSON.stringify(body) });
      setUser(result.user);
      setView(selectedDoctor && result.user.role === 'PATIENT' ? 'doctors' : 'dashboard');
      setNotice(`Welcome, ${result.user.fullName}.`);
      if (selectedDoctor && result.user.role === 'PATIENT') await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  }

  async function bookSelectedSlot() {
    if (!user) {
      setAuthMode('login');
      setAuthRole('PATIENT');
      setView('auth');
      setNotice('Sign in as a patient to finish booking your selected time.');
      return;
    }
    if (user.role !== 'PATIENT') {
      setError('Sign in with a patient account to book an appointment.');
      return;
    }
    if (!selectedDoctor || !selectedSlot) return;
    setLoading(true);
    setError('');
    try {
      await api<Appointment>('/appointments', {
        method: 'POST',
        body: JSON.stringify({ doctorId: selectedDoctor.id, startsAt: selectedSlot.startsAt }),
      });
      setNotice(`You're booked with ${selectedDoctor.fullName} for ${formatDate(selectedSlot.startsAt)}.`);
      setSelectedDoctor(null);
      setSelectedSlot(null);
      await loadAppointments();
      setView('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed. Refresh the slots and try again.');
      await refreshSelectedSlots();
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    setAppointments([]);
    setAvailability([]);
    setSelectedDoctor(null);
    setView('doctors');
    setNotice('You have been signed out.');
  }

  async function changeAppointment(appointment: Appointment, action: 'cancel' | 'complete') {
    setLoading(true);
    setError('');
    try {
      await api(`/appointments/${appointment.id}/${action}`, { method: 'PATCH' });
      setNotice(action === 'cancel' ? 'Appointment cancelled. The slot is available again.' : 'Appointment marked complete.');
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the appointment.');
    } finally {
      setLoading(false);
    }
  }

  async function addAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api('/availability/me', {
        method: 'POST',
        body: JSON.stringify({ rules: [{
          weekday: Number(availabilityForm.weekday),
          localStart: availabilityForm.localStart,
          localEnd: availabilityForm.localEnd,
          slotMinutes: Number(availabilityForm.slotMinutes),
          validFrom: today,
          validUntil: null,
        }] }),
      });
      setNotice('Weekly availability added. Patients can now book these times.');
      await loadAvailability();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save availability.');
    } finally {
      setLoading(false);
    }
  }

  function openAuth(mode: 'login' | 'register', role: Role = 'PATIENT') {
    setAuthMode(mode);
    setAuthRole(role);
    setError('');
    setView('auth');
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button className="flex items-center gap-3" onClick={() => { setView('doctors'); setSelectedDoctor(null); }} aria-label="MediNest home">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-700 text-lg font-bold text-white">M</span>
            <span className="text-left"><span className="block text-lg font-bold tracking-tight">MediNest</span><span className="block text-[11px] text-slate-500">Care, made simple</span></span>
          </button>
          <nav className="hidden items-center gap-2 sm:flex" aria-label="Main navigation">
            <Button variant={view === 'doctors' ? 'secondary' : 'ghost'} onClick={() => { setView('doctors'); setSelectedDoctor(null); }}>Find a doctor</Button>
            {user && <Button variant={view === 'dashboard' ? 'secondary' : 'ghost'} onClick={() => setView('dashboard')}>My appointments</Button>}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm text-slate-600 md:block">Hi, {user.fullName.split(' ')[0]}</span>
                <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => openAuth('login')}>Sign in</Button>
                <Button size="sm" onClick={() => openAuth('register')}>Get started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {notice && <div role="status" className="mb-5 flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900"><span>{notice}</span><button onClick={() => setNotice('')} className="ml-4 font-bold" aria-label="Dismiss message">×</button></div>}
        {error && <div role="alert" className="mb-5 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{error}</span><button onClick={() => setError('')} className="ml-4 font-bold" aria-label="Dismiss error">×</button></div>}

        {view === 'auth' && (
          <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 md:grid-cols-[0.9fr_1.1fr]">
            <div className="hidden flex-col justify-between bg-teal-800 p-10 text-white md:flex">
              <div><div className="mb-8 grid size-12 place-items-center rounded-2xl bg-white/15 text-xl font-bold">M</div><h1 className="text-3xl font-semibold leading-tight">A healthier schedule starts here.</h1><p className="mt-4 text-teal-100">Book trusted care around your life, or help patients find time with you.</p></div>
              <p className="text-sm text-teal-100">Your appointments, all in one calm place.</p>
            </div>
            <div className="p-6 sm:p-10">
              <div className="mb-6 flex gap-2 rounded-xl bg-slate-100 p-1">
                <button className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`} onClick={() => setAuthMode('login')}>Sign in</button>
                <button className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`} onClick={() => setAuthMode('register')}>Create account</button>
              </div>
              {authMode === 'register' && <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-1">
                {(['PATIENT', 'DOCTOR'] as const).map((role) => <button key={role} onClick={() => setAuthRole(role)} className={`rounded-lg py-2 text-sm font-semibold ${authRole === role ? 'bg-teal-50 text-teal-800' : 'text-slate-500'}`}>{role === 'PATIENT' ? 'I’m a patient' : 'I’m a doctor'}</button>)}
              </div>}
              <h2 className="text-2xl font-semibold">{authMode === 'login' ? 'Welcome back' : `Join as a ${authRole.toLowerCase()}`}</h2>
              <p className="mb-6 mt-1 text-sm text-slate-500">{authMode === 'login' ? 'Sign in to manage your care.' : 'Create a secure MediNest account.'}</p>
              <form className="space-y-4" onSubmit={submitAuth}>
                {authMode === 'register' && <label className="block text-sm font-medium">Full name<Input required minLength={2} maxLength={160} autoComplete="name" value={authForm.fullName} onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })} className="mt-1.5" placeholder="Your name" /></label>}
                {authMode === 'register' && authRole === 'PATIENT' && <label className="block text-sm font-medium">Phone <span className="font-normal text-slate-400">(optional)</span><Input type="tel" value={authForm.phone} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} className="mt-1.5" placeholder="Phone number" /></label>}
                {authMode === 'register' && authRole === 'DOCTOR' && <>
                  <label className="block text-sm font-medium">Specialty<Input required value={authForm.specialty} onChange={(e) => setAuthForm({ ...authForm, specialty: e.target.value })} className="mt-1.5" placeholder="e.g. Family Medicine" /></label>
                  <label className="block text-sm font-medium">Doctor invitation code<Input required value={authForm.doctorSignupCode} onChange={(e) => setAuthForm({ ...authForm, doctorSignupCode: e.target.value })} className="mt-1.5" placeholder="Provided by your practice" /></label>
                </>}
                <label className="block text-sm font-medium">Email<Input required type="email" autoComplete="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} className="mt-1.5" placeholder="you@example.com" /></label>
                <label className="block text-sm font-medium">Password<Input required type="password" minLength={10} maxLength={128} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} className="mt-1.5" placeholder="At least 10 characters" /></label>
                <Button type="submit" disabled={loading} className="w-full">{loading ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}</Button>
              </form>
              <button className="mt-5 text-sm font-medium text-teal-800 hover:underline" onClick={() => { setView('doctors'); setError(''); }}>← Back to doctors</button>
            </div>
          </div>
        )}

        {view === 'doctors' && !selectedDoctor && <>
          <section className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-700 px-6 py-10 text-white sm:px-10 sm:py-14">
            <div className="relative z-10 max-w-2xl"><Badge className="bg-white/15 text-teal-50">YOUR CARE, ON YOUR TIME</Badge><h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Find the care that<br className="hidden sm:block" /> fits your life.</h1><p className="mt-4 max-w-xl text-base leading-7 text-teal-50/90">Discover trusted doctors, see real availability, and book your next appointment in just a few steps.</p><div className="mt-7 flex flex-wrap gap-3"><Button className="bg-white text-teal-900 hover:bg-teal-50" onClick={() => document.getElementById('doctor-search')?.focus()}>Explore doctors <span aria-hidden>↓</span></Button><button onClick={() => openAuth('register', 'DOCTOR')} className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">I’m a doctor</button></div></div>
            <div className="absolute -right-16 -top-28 size-96 rounded-full border border-white/10"/><div className="absolute -right-2 -top-14 size-72 rounded-full border border-white/10"/><div className="absolute -bottom-20 right-32 size-56 rounded-full bg-white/5"/>
          </section>
          <section aria-labelledby="doctors-heading">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Care starts with a conversation</p><h2 id="doctors-heading" className="mt-1 text-2xl font-semibold tracking-tight">Meet our doctors</h2></div><div className="w-full sm:max-w-sm"><Input id="doctor-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or specialty" aria-label="Search doctors" /></div></div>
            {doctors.length === 0 ? <Card className="px-6 py-12 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-50 text-2xl text-teal-700">✚</div><h3 className="mt-4 text-lg font-semibold">{search ? 'No doctors match that search' : 'Your care team is growing'}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{search ? 'Try another name or specialty.' : 'No doctor profiles are available yet. If you’re a clinician, create a doctor account and publish your first weekly availability.'}</p>{!search && <Button className="mt-5" variant="secondary" onClick={() => openAuth('register', 'DOCTOR')}>Create a doctor profile</Button>}</Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{doctors.map((doctor) => <Card key={doctor.id} className="flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-50 text-xl font-bold text-teal-800">{doctor.fullName.split(' ').slice(1).map((part) => part[0]).join('').slice(0, 2) || doctor.fullName[0]}</div><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{doctor.fullName}</h3><p className="mt-0.5 text-sm text-teal-800">{doctor.specialty}</p><p className="mt-1 text-xs text-slate-500">{money(doctor.consultationFeeCents)}</p></div></div><p className="mt-4 min-h-12 text-sm leading-6 text-slate-600">{doctor.bio || 'A trusted clinician ready to support your health goals.'}</p><div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">{doctor.timeZone.replaceAll('_', ' ')}</span><Button size="sm" onClick={() => void openDoctor(doctor)}>View availability <span aria-hidden>→</span></Button></div></Card>)}</div>}
          </section>
        </>}

        {view === 'doctors' && selectedDoctor && <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="h-fit p-6"><button onClick={() => { setSelectedDoctor(null); setError(''); }} className="mb-6 text-sm font-semibold text-teal-800 hover:underline">← All doctors</button><div className="grid size-16 place-items-center rounded-2xl bg-teal-50 text-2xl font-bold text-teal-800">{selectedDoctor.fullName[0]}</div><h1 className="mt-4 text-2xl font-semibold">{selectedDoctor.fullName}</h1><p className="mt-1 font-medium text-teal-800">{selectedDoctor.specialty}</p><p className="mt-3 text-sm leading-6 text-slate-600">{selectedDoctor.bio || 'This doctor is ready to meet you. Choose a time that works and we’ll take care of the booking.'}</p><div className="mt-5 flex flex-wrap gap-2"><Badge className="bg-teal-50 text-teal-800">{money(selectedDoctor.consultationFeeCents)}</Badge><Badge className="bg-slate-100 text-slate-600">{selectedDoctor.timeZone}</Badge></div><div className="mt-6 border-t border-slate-100 pt-5"><p className="text-sm font-semibold">Booking with MediNest</p><p className="mt-2 text-sm leading-6 text-slate-500">Your slot is confirmed immediately after booking. You can review or cancel it in your dashboard.</p></div></Card>
          <Card className="p-6 sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-teal-700">APPOINTMENT</p><h2 className="mt-1 text-xl font-semibold">Choose a date & time</h2></div><label className="text-sm font-medium">Date<Input type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); void refreshSelectedSlots(e.target.value); }} className="mt-1.5 sm:w-48" /></label></div>
            <div className="mt-6">{busySlots ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="h-11 animate-pulse rounded-xl bg-slate-100"/><div className="h-11 animate-pulse rounded-xl bg-slate-100"/><div className="h-11 animate-pulse rounded-xl bg-slate-100"/></div> : slots.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{slots.map((slot) => <button key={slot.startsAt} onClick={() => setSelectedSlot(slot)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${selectedSlot?.startsAt === slot.startsAt ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-200 text-slate-700 hover:border-teal-500 hover:bg-teal-50'}`}>{formatDate(slot.startsAt, { weekday: undefined, month: undefined, day: undefined })}</button>)}</div> : <div className="rounded-xl bg-slate-50 px-4 py-10 text-center"><p className="font-medium text-slate-700">No times available on this date</p><p className="mt-1 text-sm text-slate-500">Try another day, or check back later.</p></div>}</div>
            {selectedSlot && <div className="mt-6 rounded-xl border border-teal-100 bg-teal-50 p-4"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-teal-950">Selected time</p><p className="mt-1 text-sm text-teal-900">{formatDate(selectedSlot.startsAt)}</p></div><Button disabled={loading} onClick={() => void bookSelectedSlot()}>{loading ? 'Booking…' : user ? 'Confirm appointment' : 'Sign in to book'}</Button></div></div>}
          </Card>
        </section>}

        {view === 'dashboard' && user && <section>
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{user.role === 'DOCTOR' ? 'Doctor workspace' : 'Patient workspace'}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Good to see you, {user.fullName.split(' ')[0]}</h1><p className="mt-2 text-sm text-slate-500">{user.role === 'DOCTOR' ? 'Your schedule and weekly availability.' : 'Your upcoming care and appointment history.'}</p></div>{user.role === 'PATIENT' && <Button variant="secondary" onClick={() => { setView('doctors'); setSelectedDoctor(null); }}>Find another doctor</Button>}</div>
          {user.role === 'DOCTOR' && <div className="mb-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="p-5"><h2 className="text-lg font-semibold">Set weekly availability</h2><p className="mt-1 text-sm text-slate-500">Times use your doctor profile time zone.</p><form onSubmit={addAvailability} className="mt-5 space-y-3"><label className="block text-sm font-medium">Day<select className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm" value={availabilityForm.weekday} onChange={(e) => setAvailabilityForm({ ...availabilityForm, weekday: e.target.value })}>{weekdays.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">From<Input type="time" value={availabilityForm.localStart} onChange={(e) => setAvailabilityForm({ ...availabilityForm, localStart: e.target.value })} className="mt-1.5" /></label><label className="block text-sm font-medium">Until<Input type="time" value={availabilityForm.localEnd} onChange={(e) => setAvailabilityForm({ ...availabilityForm, localEnd: e.target.value })} className="mt-1.5" /></label></div><label className="block text-sm font-medium">Appointment length<select className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm" value={availabilityForm.slotMinutes} onChange={(e) => setAvailabilityForm({ ...availabilityForm, slotMinutes: e.target.value })}><option value="15">15 minutes</option><option value="20">20 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label><Button type="submit" disabled={loading} className="w-full">Add weekly hours</Button></form></Card>
            <Card className="p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Your availability</h2><Badge className="bg-teal-50 text-teal-800">{availability.length} {availability.length === 1 ? 'window' : 'windows'}</Badge></div>{availability.length === 0 ? <div className="mt-5 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Add a weekly window to let patients book with you.</div> : <div className="mt-4 space-y-2">{availability.map((rule) => <div key={rule.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"><div><p className="font-medium">{weekdays.find((day) => day.value === rule.weekday)?.label}</p><p className="mt-0.5 text-sm text-slate-500">{rule.localStart.slice(0, 5)}–{rule.localEnd.slice(0, 5)} · {rule.slotMinutes} min</p></div><span className="text-xs text-slate-400">From {rule.validFrom}</span></div>)}</div>}</Card>
          </div>}
          <div className="grid gap-6 lg:grid-cols-2">
            <AppointmentList title="Upcoming appointments" appointments={upcomingAppointments} role={user.role} loading={loading} nowTimestamp={nowTimestamp} onCancel={(appointment) => void changeAppointment(appointment, 'cancel')} onComplete={(appointment) => void changeAppointment(appointment, 'complete')} />
            <AppointmentList title="Appointment history" appointments={pastAppointments} role={user.role} loading={loading} nowTimestamp={nowTimestamp} history onCancel={(appointment) => void changeAppointment(appointment, 'cancel')} onComplete={(appointment) => void changeAppointment(appointment, 'complete')} />
          </div>
        </section>}
      </div>
      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8"><span>© {currentYear} MediNest · A trusted place for healthcare</span><span>For non-emergency care. If you need urgent help, contact local emergency services.</span></div></footer>
    </main>
  );
}

function AppointmentList({
  title,
  appointments,
  role,
  loading,
  nowTimestamp,
  history = false,
  onCancel,
  onComplete,
}: {
  title: string;
  appointments: Appointment[];
  role: Role;
  loading: boolean;
  nowTimestamp: number;
  history?: boolean;
  onCancel: (appointment: Appointment) => void;
  onComplete: (appointment: Appointment) => void;
}) {
  return (<Card className="p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><Badge className="bg-slate-100 text-slate-600">{appointments.length}</Badge></div>{appointments.length === 0 ? <div className="rounded-xl bg-slate-50 px-4 py-10 text-center"><div className="mx-auto grid size-12 place-items-center rounded-xl bg-white text-xl text-slate-400">▦</div><p className="mt-3 text-sm font-medium text-slate-700">Nothing here yet</p><p className="mt-1 text-sm text-slate-500">{history ? 'Completed and cancelled appointments will appear here.' : role === 'DOCTOR' ? 'Patient bookings will show up here.' : 'Your next appointment will show up here.'}</p></div> : <div className="space-y-3">{appointments.map((appointment) => <article key={appointment.id} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{role === 'DOCTOR' ? appointment.patient.fullName : appointment.doctor.fullName}</h3><Badge className={appointment.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : appointment.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-700'}>{appointment.status.toLowerCase()}</Badge></div><p className="mt-1 text-sm text-slate-500">{role === 'DOCTOR' ? 'Patient appointment' : appointment.doctor.specialty}</p><p className="mt-2 text-sm font-medium text-slate-700">{formatDate(appointment.startsAt)}</p></div>{!history && appointment.status === 'CONFIRMED' && <div className="flex shrink-0 gap-2">{role === 'DOCTOR' && new Date(appointment.endsAt).getTime() <= nowTimestamp && <Button size="sm" variant="secondary" disabled={loading} onClick={() => onComplete(appointment)}>Complete</Button>}<Button size="sm" variant="danger" disabled={loading} onClick={() => onCancel(appointment)}>Cancel</Button></div>}</div></article>)}</div>}</Card>);
}
