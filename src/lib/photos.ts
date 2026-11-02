import { supabase } from './supabase';

const BUCKET = 'pick-photos';
const MAX_SIZE = 1080;

// Verkleinert ein Foto auf höchstens 1080 px an der längsten Seite und speichert es als JPEG.
async function resizeImage(file: File): Promise<Blob> {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIZE / Math.max(image.width, image.height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Das Foto konnte nicht verarbeitet werden.'))),
      'image/jpeg',
      0.85,
    );
  });
}

// Lädt das Foto in den eigenen Ordner hoch und gibt den Pfad zurück.
export async function uploadPhoto(userId: string, file: File) {
  const blob = await resizeImage(file);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw new Error('Das Foto konnte nicht hochgeladen werden.');
  return path;
}

export async function deletePhoto(path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
}

// Erzeugt für mehrere Fotos auf einmal Links, die eine Stunde gültig sind.
export async function getPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  if (error || !data) return {};

  const urls: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  }
  return urls;
}
