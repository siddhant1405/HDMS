import { useEffect, useMemo, useState } from 'react'

export function useCamera(file: File | null) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return useMemo(() => ({ previewUrl, supportsCapture: true }), [previewUrl])
}
