from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import os
from manim import *
from gtts import gTTS
import json
import tempfile
import shutil

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str
    topic: str

class MathScene(Scene):
    def __init__(self, content, *args, **kwargs):
        self.content = content
        super().__init__(*args, **kwargs)
    
    def construct(self):
        # This is a basic example - you'll want to expand this based on the prompt
        title = Text(self.content["topic"], font_size=40)
        self.play(Write(title))
        self.wait()
        self.play(title.animate.to_edge(UP))
        
        # Create a simple equation as an example
        equation = MathTex(self.content["equation"])
        self.play(Write(equation))
        self.wait(2)
        
        if "explanation" in self.content:
            explanation = Text(self.content["explanation"], font_size=24)
            self.play(Write(explanation))
            self.wait(2)

@app.post("/generate")
async def generate_video(request: PromptRequest):
    try:
        # Create temporary directory for our files
        with tempfile.TemporaryDirectory() as temp_dir:
            # 1. Process the prompt to generate content
            # This is a simple example - you'll want to use more sophisticated prompt processing
            content = {
                "topic": request.topic,
                "equation": "E = mc^2",  # This should come from prompt processing
                "explanation": request.prompt
            }
            
            # 2. Generate the Manim animation
            scene = MathScene(content)
            output_file = os.path.join(temp_dir, "animation.mp4")
            scene.render(output_file)
            
            # 3. Generate audio narration
            tts = gTTS(text=request.prompt, lang='en')
            audio_file = os.path.join(temp_dir, "narration.mp3")
            tts.save(audio_file)
            
            # 4. Combine video and audio (you'll need to implement this)
            # For now, we'll just return paths to both files
            
            # 5. Move files to a permanent location
            output_dir = Path("output")
            output_dir.mkdir(exist_ok=True)
            
            final_video = output_dir / "final_video.mp4"
            final_audio = output_dir / "final_audio.mp3"
            
            shutil.copy2(output_file, final_video)
            shutil.copy2(audio_file, final_audio)
            
            return {
                "status": "success",
                "video_path": str(final_video),
                "audio_path": str(final_audio)
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 