import { useState } from "react";
import "./StarRating.css";

export default function StarRating({ initial = 0, onRate, size = 20 }) {
  const [hover, setHover] = useState(0);
  const [value, setValue] = useState(initial);
  const stars = [1, 2, 3, 4, 5];

  const handleClick = async (v) => {
    setValue(v);
    if (onRate) await onRate(v);
  };

  // size classes: small (<18), medium (18-28), large (>28)
  const sizeClass = size < 18 ? 'small' : size > 28 ? 'large' : 'medium';

  return (
    <div className={`star-rating ${sizeClass}`} style={{ fontSize: size }}>
      {stars.map(s => {
        const filled = (hover || value) >= s;
        return (
          <button
            key={s}
            className={filled ? 'star-filled' : ''}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleClick(s)}
            aria-label={`Rate ${s}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
