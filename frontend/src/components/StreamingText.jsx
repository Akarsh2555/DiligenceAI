export default function StreamingText({ text }) {
  if (!text) return null;

  return (
    <span className="inline">
      {text}
      <span className="inline-block w-1.5 h-4 bg-accent-blue ml-0.5 animate-pulse rounded-sm align-text-bottom" />
    </span>
  );
}
