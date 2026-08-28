import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function CommentCard({ comment, onDelete }) {
  const { currentUser } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const initials = (comment.userName || 'A')[0].toUpperCase();
  const date = new Date(comment.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    setDeleting(true);
    try {
      await api.delete(`/api/comments/${comment._id}`);
      onDelete(comment._id);
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      {comment.userImage ? (
        <img src={comment.userImage} alt={comment.userName} className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-teal-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
          {initials}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-sm text-gray-800">{comment.userName}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{date}</span>
            {currentUser?.uid === comment.userId && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-400 hover:text-red-600 font-medium"
                aria-label="Delete comment"
              >
                {deleting ? '...' : '✕'}
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
      </div>
    </div>
  );
}
