/**
 * useVoice.js
 * Web Speech API wrapper for voice input.
 * Falls back gracefully in unsupported browsers.
 */

import { useState, useRef, useCallback } from 'react'

export function useVoice({ onResult, onError }) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  const recRef = useRef(null)

  const start = useCallback(() => {
    if (!supported) {
      onError?.('Voice input requires Chrome or Edge browser.')
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false

    rec.onstart = () => setListening(true)
    rec.onend   = () => setListening(false)
    rec.onerror = (e) => {
      setListening(false)
      onError?.(e.error === 'not-allowed' ? 'Microphone permission denied.' : 'Voice input failed. Try again.')
    }
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      onResult?.(transcript)
    }

    recRef.current = rec
    rec.start()
  }, [supported, onResult, onError])

  const stop = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    listening ? stop() : start()
  }, [listening, start, stop])

  return { listening, supported, toggle, start, stop }
}
