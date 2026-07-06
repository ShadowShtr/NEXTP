import { getSupabase } from "@/lib/supabase";

const BUCKET = "attachments";
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

/**
 * STORAGE-01 — envia uma foto/fatura para o Supabase Storage, dentro da
 * pasta do próprio utilizador (bucket "attachments", ver supabase/schema.sql
 * para as policies de RLS por pasta). Devolve o URL público para guardar
 * no campo de imagem existente (invoice_image_path / image_path).
 */
export async function uploadAttachment(userId: string, file: File): Promise<{ url: string | null; error: string | null }> {
  if (!file.type.startsWith("image/")) return { url: null, error: "Escolhe uma imagem." };
  if (file.size > MAX_SIZE) return { url: null, error: "Imagem demasiado grande (máx. 8MB)." };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const sb = getSupabase();
  const { error: uploadErr } = await sb.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadErr) return { url: null, error: uploadErr.message };

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
