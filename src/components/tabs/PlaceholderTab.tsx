export function PlaceholderTab({ title, emoji, text }: { title: string; emoji: string; text: string }) {
  return (
    <div className="px-5 py-3 space-y-4">
      <h1 className="text-2xl font-black">{title}</h1>
      <div className="clay-card grid place-items-center text-center py-16 space-y-2">
        <div className="text-5xl">{emoji}</div>
        <p className="text-nextp-muted">{text}</p>
      </div>
    </div>
  );
}
