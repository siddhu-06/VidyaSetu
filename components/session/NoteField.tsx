'use client';

interface NoteFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/*
export function NoteField({ value, onChange, placeholder }: NoteFieldProps) {
  const gapDetection = detectLearningGaps(value);

  return (
    <div className="grid gap-3">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Observation notes</span>
        <textarea
          className="min-h-36 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
          placeholder={
            placeholder ??
            'Example: Student struggled with subtraction borrowing and skipped words while reading aloud.'
          }
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>{value.trim().length} characters</span>
        <span>{gapDetection.matches.length} gap signals detected</span>
        <span>Confidence {Math.round(gapDetection.confidence * 100)}%</span>
      </div>
      {gapDetection.gaps.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Detected learning gaps</p>
          <p className="mt-1">{gapDetection.gaps.join(' • ')}</p>
        </div>
      ) : null}
    </div>
  );
}
*/

export function NoteField({ value, onChange }: NoteFieldProps) {
  return (
    <div className="grid gap-3">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Session note</span>
        <textarea
          className="min-h-36 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
          maxLength={280}
          placeholder="What happened in today's session? (e.g. Priya understood carrying today using the house method)"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>Your note helps the system detect learning gaps automatically</span>
        <span>{value.length} / 280</span>
      </div>
    </div>
  );
}
