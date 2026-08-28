import { Link } from 'react-router-dom';

export default function EmptyState({ icon = '📭', title, message, ctaLabel, ctaTo }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-6xl mb-5 float-anim">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      {message && <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-6">{message}</p>}
      {ctaLabel && ctaTo && (
        <Link to={ctaTo} className="btn-primary">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
