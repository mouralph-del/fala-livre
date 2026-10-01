export function SpeakerIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3ZM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14" /></svg>
}

export default function CommunicationCard({ label, image, audioText = label, onSelect, onSpeak, selected = false, onRemove, removable = false }) {
  return (
    <div className={`communication-card${selected ? ' communication-card--selected' : ''}${removable ? ' communication-card--removable' : ''}`}>
      {onSelect ? <button type="button" className="communication-select" onClick={onSelect} aria-label={`Selecionar ${label}`} aria-pressed={selected}>
        {image && <img src={image} alt="" width="300" height="300" draggable="false" />}
        <span>{label}</span>
      </button> : <span className="communication-word">{label}</span>}
      {removable && <button type="button" className="communication-remove" onClick={onRemove} aria-label={`Remover ${label}`}>Remover</button>}
      <button type="button" className="communication-audio" aria-label={`Ouvir palavra ${audioText}`} onClick={() => onSpeak(audioText)}><SpeakerIcon /></button>
    </div>
  )
}
