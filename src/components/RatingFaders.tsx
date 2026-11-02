type Props = {
  quality: number;
  emotion: number;
  onChange: (quality: number, emotion: number) => void;
};

// Zwei Regler von 1 bis 10, beim Posten und beim Bewerten.
export function RatingFaders({ quality, emotion, onChange }: Props) {
  return (
    <div className="faders">
      <label>
        <span className="fader-label">
          Qualität <span className="fader-value">{quality}</span>
        </span>
        <input
          type="range"
          min={1}
          max={10}
          value={quality}
          onChange={event => onChange(Number(event.target.value), emotion)}
        />
        <span className="fader-scale">
          <span>schwach</span>
          <span>meisterhaft</span>
        </span>
      </label>
      <label>
        <span className="fader-label">
          Emotion <span className="fader-value">{emotion}</span>
        </span>
        <input
          type="range"
          min={1}
          max={10}
          value={emotion}
          onChange={event => onChange(quality, Number(event.target.value))}
        />
        <span className="fader-scale">
          <span>lässt mich kalt</span>
          <span>trifft mich voll</span>
        </span>
      </label>
    </div>
  );
}
