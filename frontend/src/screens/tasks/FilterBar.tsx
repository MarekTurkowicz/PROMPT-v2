// Port of the mock's fbar(): active-filter chips with a "clear all" link.
export interface FilterChip {
  label: string;
  onRemove: () => void;
}

export function FilterBar({ chips, count, onClear }: { chips: FilterChip[]; count?: string; onClear: () => void }) {
  if (!chips.length) return null;
  return (
    <div className="fbar">
      {count ? <span className="muted">{count}</span> : null}
      {chips.map((c) => (
        <button key={c.label} type="button" className="fchip" aria-label={"Usuń filtr: " + c.label} onClick={c.onRemove}>
          {c.label} <span aria-hidden="true">×</span>
        </button>
      ))}
      <button type="button" className="lnk" onClick={onClear}>
        Wyczyść filtry
      </button>
    </div>
  );
}
