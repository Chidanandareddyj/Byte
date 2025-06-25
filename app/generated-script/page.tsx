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
        console.log(audioResult)
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
              {/* Manim Script Display */}
              <div className="bg-green-100/60 p-4 rounded-lg border border-green-200">
                <h2 className="font-semibold mb-2 text-green-900">📐 Manim Script</h2>
                <div className="bg-white/80 p-3 rounded border">
                  <h3 className="font-medium text-sm text-gray-600 mb-2">
                    {script.title}
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {script.steps && script.steps.map((step: any, idx: number) => (
                      <div key={idx} className="text-xs bg-gray-50 p-3 rounded border-l-2 border-green-400 mb-2">
                        {step.text && <div className="mb-1"><strong>Text:</strong> {step.text}</div>}
                        {step.math && <div className="mb-1"><strong>Math:</strong> <span className="font-mono">{step.math}</span></div>}
                        {step.narration && <div className="mb-1"><strong>Narration:</strong> {step.narration}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {audioUrl && (
            <div className="w-full">
              <h2 className="mt-6 font-semibold text-white">🎧 Preview Audio</h2>
              <audio
                controls
                src={audioUrl}
                className="mt-2 w-full rounded"
                onError={() => alert('Failed to load audio. Please check if the file exists and is a valid MP3.')}
              />
              <a
                href={audioUrl}
                download
                className="block mt-2 text-blue-200 underline text-xs"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Audio
              </a>
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
