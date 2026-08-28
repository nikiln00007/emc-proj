import { Link } from 'react-router-dom';

const TAG_COLORS = [
  'bg-orange-100 text-orange-700',
  'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700',
  'bg-pink-100 text-pink-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-yellow-100 text-yellow-700',
  'bg-red-100 text-red-700',
];

function tagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

function StarDisplay({ rating }) {
  const full = Math.floor(rating);
  const partial = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-sm ${i <= full ? 'text-amber-400' : i === full + 1 && partial ? 'text-amber-300' : 'text-gray-200'}`}>★</span>
      ))}
    </span>
  );
}

export default function ProjectCard({ project }) {
  const { _id, title, description, tags = [], owner, likes = 0, averageRating = 0, ratingCount = 0, createdAt } = project;

  const date = new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const initials = (owner?.name || 'A')[0].toUpperCase();

  return (
    <div className="card flex flex-col h-full group">
      {/* Color accent bar */}
      <div className="h-1.5 rounded-t-[1.25rem] bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400" />

      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-bold text-gray-900 text-lg mb-2 leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 4).map(tag => (
            <span key={tag} className={`tag-pill ${tagColor(tag)}`}>{tag}</span>
          ))}
          {tags.length > 4 && (
            <span className="tag-pill bg-gray-100 text-gray-500">+{tags.length - 4}</span>
          )}
        </div>

        {/* Author row */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to={`/profile/${owner?.firebaseUid}`}
            className="flex items-center gap-2 group/author"
            onClick={e => e.stopPropagation()}
          >
            {owner?.profileImage ? (
              <img src={owner.profileImage} alt={owner.name} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
            <span className="text-sm font-medium text-gray-600 group-hover/author:text-orange-500 transition-colors">
              {owner?.name || 'Anonymous'}
            </span>
          </Link>
          <span className="text-xs text-gray-400">{date}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <span className="text-red-400">♥</span>
              <span className="font-semibold text-gray-700">{likes}</span>
            </span>
            {ratingCount > 0 && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <StarDisplay rating={averageRating} />
                <span className="font-semibold text-gray-700">{averageRating.toFixed(1)}</span>
              </span>
            )}
          </div>
          <Link
            to={`/project/${_id}`}
            className="text-xs font-semibold text-orange-500 hover:text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}
