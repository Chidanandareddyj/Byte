import {main} from '@/lib/gemini';
import {getpromptbyID,saveScript} from '@/lib/databse';

export async function POST(request) {
    try {
        const { promptId } = await request.json();
        
        if (!promptId) {
            return Response.json({ error: 'Missing promptId' }, { status: 400 });
        }

        console.log("Received promptId:", promptId);

        const prompt = await getpromptbyID(promptId);
        if (!prompt) {
            return Response.json({ error: 'Prompt not found' }, { status: 404 });
        }

        console.log("Found prompt:", prompt);

        const script = await main(prompt.prompt_text);
        if (!script) {
            return Response.json({ error: 'Failed to generate script' }, { status: 500 });
        }
        
        console.log("Generated script:", script);
        
        const savedScript = await saveScript(promptId, script);
        
        console.log("Saved script:", savedScript);
        
        return Response.json({ 
            success: true, 
            script: script,
            savedScript: savedScript 
        });

    } catch (error) {
        console.error("Error generating script:", error);
        return Response.json({ 
            error: 'Internal Server Error',
            details: error.message 
        }, { status: 500 });
    }
}
