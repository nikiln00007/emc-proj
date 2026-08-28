export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-6 h-6 border-2', md: 'w-10 h-10 border-4', lg: 'w-16 h-16 border-4' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizes[size]} border-orange-500 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-gray-500 text-sm font-medium">{text}</p>}
    </div>
  );
}
