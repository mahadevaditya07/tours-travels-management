export default function SearchBar({ value, onChange, placeholder = "Search destinations, tours..." }) {
  return (
    <div className="search-bar">
      <span>⌕</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {value && <button onClick={() => onChange("")}>×</button>}
    </div>
  );
}