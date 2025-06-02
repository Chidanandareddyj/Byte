'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function GenerateScriptPage() {
  const searchParams = useSearchParams()
  const promptId = searchParams.get('id')
  const router = useRouter()

  const [status, setStatus] = useState('Generating script...')
  const [script, setScript] = useState<string | null>(null)
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
        if (typeof scriptData === 'object') {
          // If it's an object, stringify it for display
          setScript(JSON.stringify(scriptData, null, 2))
        } else {
          // If it's already a string, use it directly
          setScript(scriptData || 'Script generated and saved.')
        }

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
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      <h1 className="text-2xl font-semibold">Generating Your Script and Audio</h1>
      <p className="text-sm text-gray-500">{status}</p>

      {script && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">📝 Generated Script</h2>
          <pre className="whitespace-pre-wrap">{script}</pre>
        </div>
      )}

      {audioUrl && (
        <div>
          <h2 className="mt-6 font-semibold">🎧 Preview Audio</h2>
          <audio controls src={audioUrl} className="mt-2 w-full" />
        </div>
      )}

      {!loading && (
        <button
          onClick={() => router.push(`/generate-video?id=${promptId}`)}
          className="mt-6 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Generate Video ➡
        </button>
      )}
    </div>
  )
}
