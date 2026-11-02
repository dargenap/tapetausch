import { useState } from "react";
import type { Step } from "../lib/hints";

type Props = {
  steps: Step[];
  onClose: () => void;
};

// Blatt von unten mit einem oder mehreren Erklär-Schritten.
export function HintSheet({ steps, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const single = steps.length === 1;

  return (
    <div
      className="sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hint-title"
    >
      <div className="card">
        {!single && (
          <div
            className="dots"
            aria-label={`Schritt ${index + 1} von ${steps.length}`}
          >
            {steps.map((_, dot) => (
              <span key={dot} className={dot === index ? "active" : undefined} />
            ))}
          </div>
        )}
        <h2 id="hint-title">{step.title}</h2>
        <p>{step.text}</p>
        {step.tip && (
          <p className="tip">
            <strong>Tipp:</strong> {step.tip}
          </p>
        )}

        <div className="sheet-actions">
          {single ? null : index > 0 ? (
            <button type="button" onClick={() => setIndex(index - 1)}>
              Zurück
            </button>
          ) : (
            <button type="button" className="text-button" onClick={onClose}>
              Überspringen
            </button>
          )}
          <button
            type="button"
            className="primary"
            onClick={isLast ? onClose : () => setIndex(index + 1)}
          >
            {single ? "Verstanden" : isLast ? "Los geht’s" : "Weiter"}
          </button>
        </div>
      </div>
    </div>
  );
}
