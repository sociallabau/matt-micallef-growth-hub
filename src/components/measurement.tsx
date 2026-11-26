import { measurementCopy, type MeasurementSource } from "@/lib/measurement";

export function HowMeasured({ source }: { source: MeasurementSource }) {
  const copy = measurementCopy(source);
  return (
    <details className="text-sm" open>
      <summary className="cursor-pointer text-xs text-muted hover:text-fg">How these numbers are measured</summary>
      <div className="mt-3 space-y-3">
        <p>{copy.intro}</p>
        <p>{copy.monthLine}</p>
        <ul className="space-y-1.5">
          {copy.points.map((point) => (
            <li key={point.term} className="flex gap-2">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted" />
              <span>
                <span className="font-medium">{point.term}.</span> {point.text}
              </span>
            </li>
          ))}
        </ul>
        {copy.extras.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </details>
  );
}
