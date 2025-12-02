import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Upload audio file to Supabase Storage (voice-applications bucket)
 * @param audioBlob - The audio blob to upload
 * @param fileNamePrefix - Prefix for the file name (e.g., job ID)
 * @returns Public URL of the uploaded file
 */
export async function uploadAudioFile(audioBlob: Blob, fileNamePrefix: string): Promise<string> {
  try {

    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured. Cannot upload audio file.");
    }

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error("Invalid audio blob provided.");
    }

    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.user) {
      throw new Error("User not authenticated for audio upload.");
    }

    const fileExtension = audioBlob.type?.split('/')[1] || 'webm';
    const filePath = `${user.user.id}/${fileNamePrefix}-${Date.now()}.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from('voice-applications') // Ensure this bucket exists in Supabase
      .upload(filePath, audioBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: audioBlob.type || 'audio/webm',
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      throw new Error(`Failed to upload audio file: ${error.message}`);
    }

    if (!data?.path) {
      throw new Error("Upload succeeded but no path returned.");
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('voice-applications')
      .getPublicUrl(data.path);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Failed to get public URL for uploaded audio.");
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadAudioFile:', error);
    // Re-throw with more context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Audio upload failed: ${errorMessage}`);
  }
}

