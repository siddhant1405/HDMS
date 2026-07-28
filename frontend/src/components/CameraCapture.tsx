import { Camera, Check, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { useCamera } from '../hooks/useCamera'

type CameraCaptureProps = {
  busy: boolean
  onConfirm: (file: File) => void
}

export function CameraCapture({ busy, onConfirm }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const { previewUrl } = useCamera(file)

  return (
    <div className="capture-box">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        id="camera-input"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      {previewUrl ? (
        <img className="capture-preview" src={previewUrl} alt="Captured patient document preview" />
      ) : (
        <button
          type="button"
          className="capture-trigger"
          onClick={() => inputRef.current?.click()}
          id="open-camera-btn"
        >
          <span className="capture-trigger-inner">
            <span className="capture-trigger-icon">
              <Camera size={30} />
            </span>
            Open camera
          </span>
        </button>
      )}
      {file ? (
        <div className="button-row">
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setFile(null)
              // reset input so same file can be re-selected
              if (inputRef.current) inputRef.current.value = ''
              setTimeout(() => inputRef.current?.click(), 50)
            }}
            disabled={busy}
            id="retake-btn"
          >
            <RotateCcw size={18} /> Retake
          </button>
          <button
            type="button"
            className="button primary"
            onClick={() => onConfirm(file)}
            disabled={busy}
            id="confirm-upload-btn"
          >
            {busy ? <span className="spinner" /> : <Check size={18} />}
            {busy ? 'Uploading…' : 'Confirm upload'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
