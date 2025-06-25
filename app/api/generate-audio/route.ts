import fs from "fs";
import path from "path";
import util from "util";
import os from "os"; // Added import for os module
import { getScriptByPromptId, saveAudio } from "@/lib/databse";
import { supabaseAdmin } from "@/lib/supabaseClient";

const textToSpeech = require("@google-cloud/text-to-speech");

// Initialize Google Cloud client with explicit credentials
let client: any;

try {
  // Explicitly provide credentials path
  const credentialsPath = path.join(process.cwd(), "gcloud-credentials.json");
  
  // Check if credentials file exists
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Credentials file not found at: ${credentialsPath}`);
  }
  
  // Read and parse credentials
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  
  client = new textToSpeech.TextToSpeechClient({
    credentials: credentials,
    projectId: credentials.project_id,
  });
  
  console.log("Google Cloud TTS client initialized successfully with credentials file");
} catch (error) {
  console.error("Failed to initialize with credentials file, trying environment variable:", error);
  
  try {
    // Fallback: try using environment variable authentication
    client = new textToSpeech.TextToSpeechClient();
    console.log("Google Cloud TTS client initialized successfully with environment variable");
  } catch (envError) {
    console.error("Failed to initialize Google Cloud TTS client with environment variable:", envError);
    client = null;
  }
}

// Helper function to clean text for Text-to-Speech
function cleanTextForTTS(text: string): string {
  // Remove unwanted characters and normalize text
  return text
    // Remove escape sequences
    .replace(/\\[nrt]/g, ' ')
    // Remove backslashes and forward slashes
    .replace(/[\\\/]+/g, '')
    // Remove JSON syntax characters
    .replace(/[{}[\]"]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove duplicate punctuation
    .replace(/\.{2,}/g, '.')
    .replace(/[,;:]{2,}/g, ',')
    // Clean up and trim
    .trim();
}

// Helper function to split text into chunks under 5000 bytes
function splitTextIntoChunks(text: string, maxBytes: number = 4500): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+\s+/);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const testChunk = currentChunk + (currentChunk ? '. ' : '') + sentence;
    
    if (Buffer.byteLength(testChunk, 'utf8') > maxBytes && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = testChunk;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Helper function to combine audio buffers
function combineAudioBuffers(audioBuffers: Buffer[]): Buffer {
  return Buffer.concat(audioBuffers);
}

export async function POST(request: Request) {
  let tempPaths: string[] = []; // Keep track of all temp files for cleanup
  let finalTempPath: string | null = null;

  try {
    // Check if supabaseAdmin is available (server-side only)
    if (!supabaseAdmin) {
      return Response.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Check if Google Cloud TTS client is properly initialized
    if (!client) {
      console.error("Google Cloud TTS client not initialized");
      return Response.json({ error: "Text-to-Speech service not available" }, { status: 500 });
    }

    const { promptId } = await request.json();
    if (!promptId) {
      return Response.json({ error: "Prompt ID is required" }, { status: 400 });
    }

    const script = await getScriptByPromptId(promptId);
    if (!script) {
      return Response.json({ error: "Script not found for the given prompt ID" }, { status: 404 });
     }    // Extract narration text, supporting both new dual-script format and legacy formats
    let scriptText: string;
    try {
      const rawScript = JSON.parse(script.script_text);
      
      // Check if it's the new dual-script format
      if (rawScript?.ttsNarration?.fullScript) {
        scriptText = rawScript.ttsNarration.fullScript;
        console.log("Using TTS narration script from dual-script format");
      } 
      // Check if it has ttsNarration with segments (fallback)
      else if (rawScript?.ttsNarration?.segments && Array.isArray(rawScript.ttsNarration.segments)) {
        scriptText = rawScript.ttsNarration.segments.map((s: any) => s.text).join('. ');
        console.log("Using TTS segments from dual-script format");
      }
      // Check if it's the remotion script format (legacy support)
      else if (rawScript?.remotionScript?.scenes && Array.isArray(rawScript.remotionScript.scenes)) {
        scriptText = rawScript.remotionScript.scenes.map((s: any) => s.text).join('. ');
        console.log("Using remotion script scenes as fallback");
      }
      // Check if it's old single script format with scenes
      else if (rawScript?.scenes && Array.isArray(rawScript.scenes)) {
        scriptText = rawScript.scenes.map((s: any) => s.text).join('. ');
        console.log("Using legacy scenes format");
      } 
      else {
        scriptText = script.script_text;
        console.log("Using raw script text");
      }
    } catch {
      // Fallback: script_text is plain text
      scriptText = script.script_text;
      console.log("Using plain text fallback");
    }// Clean the script text to remove unwanted characters that TTS reads aloud
    scriptText = cleanTextForTTS(scriptText);
    const textBytes = Buffer.byteLength(scriptText, 'utf8');
    
    let audioBuffers: Buffer[] = [];
    const tempDir = os.tmpdir();

    if (textBytes > 4500) {
      // Split text into chunks
      const textChunks = splitTextIntoChunks(scriptText);
      console.log(`Text too long (${textBytes} bytes), splitting into ${textChunks.length} chunks`);
      
      // Generate audio for each chunk
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        const ttsRequest = {
          input: { text: chunk },
          voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
          audioConfig: { audioEncoding: "MP3" },
        };

        try {
          const [response] = await client.synthesizeSpeech(ttsRequest);
          
          const chunkTempPath = path.join(tempDir, `audio-chunk-${promptId}-${i}.mp3`);
          tempPaths.push(chunkTempPath);
          
          await util.promisify(fs.writeFile)(
            chunkTempPath,
            response.audioContent,
            "binary"
          );
          
          audioBuffers.push(fs.readFileSync(chunkTempPath));
        } catch (ttsError: any) {
          console.error(`TTS synthesis error for chunk ${i}:`, ttsError);
          if (ttsError.code === 16) {
            return Response.json({ 
              error: "Google Cloud authentication failed. Please check your service account credentials." 
            }, { status: 500 });
          }
          throw ttsError;
        }
      }
      
      // Combine all audio buffers
      const combinedAudio = combineAudioBuffers(audioBuffers);
      finalTempPath = path.join(tempDir, `audio-${promptId}.mp3`);
      
      await util.promisify(fs.writeFile)(
        finalTempPath,
        combinedAudio,
        "binary"
      );
    } else {
      // Text is short enough, use single request
      const ttsRequest = {
        input: { text: scriptText },
        voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
        audioConfig: { audioEncoding: "MP3" },
      };

      try {
        const [response] = await client.synthesizeSpeech(ttsRequest);
        
        finalTempPath = path.join(tempDir, `audio-${promptId}.mp3`);
        
        await util.promisify(fs.writeFile)(
          finalTempPath,
          response.audioContent,
          "binary"
        );
      } catch (ttsError: any) {
        console.error("TTS synthesis error:", ttsError);
        if (ttsError.code === 16) {
          return Response.json({ 
            error: "Google Cloud authentication failed. Please check your service account credentials." 
          }, { status: 500 });
        }
        throw ttsError;
      }
    }    const audiobuffer = fs.readFileSync(finalTempPath);
    const filepath = `${promptId}.mp3`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("audio-files")
      .upload(filepath, audiobuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError); // Added specific logging
      return Response.json({ error: "Failed to upload audio file" }, { status: 500 });
    }

    // audioUrl was defined on the same line as saveAudio call, separated for clarity
    const audioUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio-files/${promptId}.mp3`;
    const audio = await saveAudio(script.id.toString(), audioUrl);

    return Response.json({
      message: "Audio generated successfully",
      audioUrl: audioUrl,
      audioId: audio.id,
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    return Response.json({ error: "Failed to generate audio" }, { status: 500 });  } finally {
    // Cleanup all temporary files
    const allTempPaths = [...tempPaths];
    if (finalTempPath) {
      allTempPaths.push(finalTempPath);
    }
    
    for (const tempPath of allTempPaths) {
      try {
        await util.promisify(fs.unlink)(tempPath);
      } catch (unlinkError) {
        console.warn(`Failed to delete temporary file: ${tempPath}`, unlinkError);
      }
    }
  }
}
