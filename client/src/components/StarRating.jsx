import { useState } from 'react';

export default function StarRating({ rating = 0, onRate, readOnly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);

  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };

  if (readOnly) {
    return (
      <span className={`flex items-center gap-0.5 ${sizes[size]}`}>
        {[1,2,3,4,5].map(i => (
          <span key={i} className={i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}>★</span>
        ))}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-0.5 ${sizes[size]}`}
      onMouseLeave={() => setHovered(0)}
      role="group"
      aria-label="Star rating"
    >
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          className={`star-btn ${i <= (hovered || rating) ? 'text-amber-400' : 'text-gray-300'}`}
          onMouseEnter={() => setHovered(i)}
          onClick={() => onRate && onRate(i)}
          aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  );
}
