import { supabase, isSupabaseConfigured } from './supabase';

export async function uploadStudyFile(file: File, blockId: string): Promise<{ fileUrl: string; filePath: string }> {
  let fileUrl = '#';
  let filePath = '';

  if (isSupabaseConfigured) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${blockId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('study_materials')
        .upload(fileName, file);

      if (!uploadError) {
        filePath = fileName;
        const { data } = supabase.storage.from('study_materials').getPublicUrl(fileName);
        fileUrl = data.publicUrl;
      }
    } catch (e) {
      console.warn('Storage upload error, using local fallback:', e);
    }
  }

  return { fileUrl, filePath };
}
