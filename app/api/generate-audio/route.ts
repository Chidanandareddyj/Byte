import fs from "fs";
import path from "path";
import util from "util";
import os from "os"; // Added import for os module
import { getScriptByPromptId, saveAudio } from "@/lib/databse";
import { supabaseAdmin } from "@/lib/supabaseClient";

const textToSpeech = require("@google-cloud/text-to-speech");

// Explicitly provide credentials path
const credentialsPath = path.join(process.cwd(), "gcloud-credentials.json");
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: credentialsPath,
});

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

    const { promptId } = await request.json();
    if (!promptId) {
      return Response.json({ error: "Prompt ID is required" }, { status: 400 });
    }

    const script = await getScriptByPromptId(promptId);
    if (!script) {
      return Response.json({ error: "Script not found for the given prompt ID" }, { status: 404 });
    }    // Extract only narration text from JSON script
    const rawScript = JSON.parse(script.script_text);
    if (!rawScript || !rawScript.scenes || !Array.isArray(rawScript.scenes)) {
      return Response.json({ error: "Invalid script format: 'scenes' array is missing or invalid" }, { status: 400 });
    }
    const scriptText = rawScript.scenes.map((s: any) => s.text).join('. ');
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

        const [response] = await client.synthesizeSpeech(ttsRequest);
        
        const chunkTempPath = path.join(tempDir, `audio-chunk-${promptId}-${i}.mp3`);
        tempPaths.push(chunkTempPath);
        
        await util.promisify(fs.writeFile)(
          chunkTempPath,
          response.audioContent,
          "binary"
        );
        
        audioBuffers.push(fs.readFileSync(chunkTempPath));
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

      const [response] = await client.synthesizeSpeech(ttsRequest);
      
      finalTempPath = path.join(tempDir, `audio-${promptId}.mp3`);
      
      await util.promisify(fs.writeFile)(
        finalTempPath,
        response.audioContent,
        "binary"
      );
    }    const audiobuffer = fs.readFileSync(finalTempPath);
    const filepath = `audio-files/${promptId}.mp3`;const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
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
