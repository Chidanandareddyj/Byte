import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function main(prompt: string) {
  const scriptPrompt = `
    Create both a detailed video script for Remotion AND a separate TTS narration script based on this user prompt: "${prompt}"
    
    Please provide TWO scripts in your response:
    
    1. REMOTION SCRIPT: A detailed video script with:
       - Scene descriptions with timing
       - Text content for each scene
       - Visual elements and transitions
       - Duration for each segment
       - Any animations or effects needed
    
    2. TTS NARRATION SCRIPT: A smooth, natural narration script that:
       - Flows naturally when read aloud
       - Is engaging and conversational
       - Matches the timing of the video scenes
       - Uses proper pronunciation and pacing
       - Avoids technical jargon or formatting references
    
    Format the response as a JSON object with this structure:
    {
      "remotionScript": {
        "title": "Video Title",
        "totalDuration": 30,
        "scenes": [
          {
            "id": 1,
            "startTime": 0,
            "endTime": 5,
            "text": "Scene text content",
            "description": "Visual description",
            "animation": "fade-in",
            "background": "color or image description"
          }
        ]
      },
      "ttsNarration": {
        "title": "Video Title",
        "fullScript": "Complete narration text that flows naturally for TTS to read aloud...",
        "segments": [
          {
            "startTime": 0,
            "endTime": 5,
            "text": "Natural speaking text for this segment"
          }
        ]
      }
    }
    
    Keep the video duration between 15-60 seconds and make it engaging for social media.
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: scriptPrompt,
    });
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error(`Error generating script: No response received`);
    }
    console.log(response.candidates?.[0]?.content?.parts?.[0]?.text);
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;    try {
      if (!text) throw new Error("No text received");
      
      // Clean the text to remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsedResponse = JSON.parse(cleanedText);
      
      // Return both scripts in a structured format
      return {
        remotionScript: parsedResponse.remotionScript || parsedResponse, // fallback to old format
        ttsNarration: parsedResponse.ttsNarration || {
          title: parsedResponse.title || "Generated Video",
          fullScript: extractNarrationFromScenes(parsedResponse.scenes || []),
          segments: parsedResponse.scenes?.map((scene: any) => ({
            startTime: scene.startTime,
            endTime: scene.endTime,
            text: scene.text
          })) || []
        }
      };
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return { 
        error: "Failed to parse JSON response",
        rawText: text,
        format: "text" 
      };
    }
  } catch (error) {
    console.error("Error generating script:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate script: ${errorMessage}`);
  }
}

// Helper function to extract narration text from scenes if needed
function extractNarrationFromScenes(scenes: any[]): string {
  return scenes.map(scene => scene.text).join(' ');
}
