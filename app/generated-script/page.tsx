'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Silk from "@/components/ui/Silk";
import { Navbar } from "@/components/Navbar";

export default function GenerateScriptPage() {
  const searchParams = useSearchParams()
  const promptId = searchParams.get('id')
  const router = useRouter()
  const [status, setStatus] = useState('Generating script...')
  const [script, setScript] = useState<any>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!promptId) return

    const runPipeline = async () => {
      try {
        // 1. Generate Script
        const scriptRes = await fetch('/api/generated-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptId })
        })
        const scriptResult = await scriptRes.json()
        if (!scriptRes.ok) throw new Error(scriptResult.error || 'Failed to generate script')
          // Handle different script formats
        const scriptData = scriptResult.script
        setScript(scriptData)

        setStatus('✅ Script generated! Now generating audio...')

        // 2. Generate Audio
        const audioRes = await fetch('/api/generate-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptId })
        })
        const audioResult = await audioRes.json()
        if (!audioRes.ok) throw new Error(audioResult.error || 'Failed to generate audio')
        setAudioUrl(audioResult.audioUrl)

        setStatus('✅ Audio ready!')
      } catch (err: any) {
        console.error(err)
        setStatus(`❌ ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    runPipeline()
  }, [promptId])

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Silk background */}
      <div className="absolute inset-0 -z-10">
        <Silk speed={5} scale={1} color="#7CA3C7" noiseIntensity={0.2} rotation={0.14} />
      </div>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-lg p-8 md:p-12 w-full max-w-2xl flex flex-col items-center animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 font-playfair text-center drop-shadow-lg">Generating Your Script and Audio</h1>
          <p className="text-sm text-gray-100 mb-6">{status}</p>
          {script && (
            <div className="space-y-4 w-full">
              {/* TTS Narration Script */}
              {script.ttsNarration && (
                <div className="bg-blue-100/60 p-4 rounded-lg border border-blue-200">
                  <h2 className="font-semibold mb-2 text-blue-900">🎧 TTS Narration Script</h2>
                  <div className="bg-white/80 p-3 rounded border">
                    <h3 className="font-medium text-sm text-gray-600 mb-2">Full Narration:</h3>
                    <p className="text-sm leading-relaxed">{script.ttsNarration.fullScript}</p>
                  </div>
                  {script.ttsNarration.segments && script.ttsNarration.segments.length > 0 && (
                    <div className="mt-3 bg-white/80 p-3 rounded border">
                      <h3 className="font-medium text-sm text-gray-600 mb-2">Timed Segments:</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {script.ttsNarration.segments.map((segment: any, index: number) => (
                          <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                            <span className="font-mono text-gray-500">{segment.startTime}s-{segment.endTime}s:</span>
                            <span className="ml-2">{segment.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Remotion Video Script */}
              {script.remotionScript && (
                <div className="bg-green-100/60 p-4 rounded-lg border border-green-200">
                  <h2 className="font-semibold mb-2 text-green-900">🎬 Remotion Video Script</h2>
                  <div className="bg-white/80 p-3 rounded border">
                    <h3 className="font-medium text-sm text-gray-600 mb-2">
                      {script.remotionScript.title} ({script.remotionScript.totalDuration}s)
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {script.remotionScript.scenes && script.remotionScript.scenes.map((scene: any) => (
                        <div key={scene.id} className="text-xs bg-gray-50 p-3 rounded border-l-2 border-green-400">
                          <div className="font-mono text-gray-500 mb-1">
                            Scene {scene.id}: {scene.startTime}s - {scene.endTime}s
                          </div>
                          <div className="mb-1"><strong>Text:</strong> {scene.text}</div>
                          <div className="mb-1"><strong>Visual:</strong> {scene.description}</div>
                          <div className="mb-1"><strong>Animation:</strong> {scene.animation}</div>
                          <div><strong>Background:</strong> {scene.background}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {/* Fallback for legacy format */}
              {!script.ttsNarration && !script.remotionScript && (
                <div className="bg-gray-100/80 p-4 rounded">
                  <h2 className="font-semibold mb-2">📝 Generated Script</h2>
                  <pre className="whitespace-pre-wrap text-sm">
                    {typeof script === 'object' ? JSON.stringify(script, null, 2) : script}
                  </pre>
                </div>
              )}
            </div>
          )}
          {audioUrl && (
            <div className="w-full">
              <h2 className="mt-6 font-semibold text-white">🎧 Preview Audio</h2>
              <audio controls src={audioUrl} className="mt-2 w-full rounded" />
            </div>
          )}
          {!loading && (
            <button
              onClick={() => router.push(`/generate-video?id=${promptId}`)}
              className="mt-6 px-4 py-2 bg-black/80 text-white rounded hover:bg-gray-800 transition-all shadow-md"
            >
              Generate Video ➡
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
