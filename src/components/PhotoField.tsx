"use client";

import { useRef, useState } from "react";
import { isValidUrl } from "@/lib/wishlist";
import { uploadAttachment } from "@/lib/storage";

/** STORAGE-01 — campo de foto: colar link OU tirar/escolher foto (Supabase Storage). */
export default function PhotoField({
  userId, value, onChange,
}: { userId: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setErr(null);
    setUploading(true);
    const { url, error } = await uploadAttachment(userId, file);
    setUploading(false);
    if (error) return setErr(error);
    if (url) onChange(url);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input className="clay-input flex-1" placeholder="Link da foto do produto (opcional)" value={value} onChange={(e) => onChange(e.target.value)} />
        {value && isValidUrl(value) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-12 h-12 rounded-clay object-cover shrink-0 shadow-clay-sm" onError={(e) => (e.currentTarget.style.display = "none")} />
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="clay-btn-ghost w-full text-sm py-2">
        {uploading ? "A enviar…" : "📷 Anexar foto"}
      </button>
      {err && <p className="text-nextp-danger text-xs text-center">{err}</p>}
    </div>
  );
}
