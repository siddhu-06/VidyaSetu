import { SessionLoggerForm } from '@/components/session/SessionLoggerForm';

export default function SessionPage() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Module 01</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Offline session logging</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Log a volunteer session in under a minute, detect learning gaps from notes, and queue everything safely on the device.
        </p>
      </div>
      <SessionLoggerForm />
    </div>
  );
}

