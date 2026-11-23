// Port of the mock's fbar(): count + removable filter chips + "clear all".
export interface FilterChip {
  label: string;
  remove: () => void;
}

export function FilterBar({
  chips,
  count,
  onClear,
}: {
  chips: FilterChip[];
  count: string;
  onClear: () => void;
}) {
  if (!chips.length) return null;
  return (
    <div className="fbar">
      {count ? <span className="muted">{count}</span> : null}
      {chips.map((c) => (
        <button key={c.label} type="button" className="fchip" aria-label={"Usuń filtr: " + c.label} onClick={c.remove}>
          {c.label} <span aria-hidden="true">×</span>
        </button>
      ))}
      <button type="button" className="lnk" onClick={onClear}>
        Wyczyść filtry
      </button>
    </div>
  );
}
