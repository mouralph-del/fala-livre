import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const toolLabels = {
  pencil: 'Lápis',
  marker: 'Marcador',
  crayon: 'Giz de cera',
  eraser: 'Borracha',
}

const thicknessOptions = {
  fine: { label: 'Fino', width: 3, opacity: 1 },
  medium: { label: 'Médio', width: 6, opacity: 1 },
  thick: { label: 'Grosso', width: 11, opacity: 1 },
}

const colorOptions = [
  { name: 'Preto', value: '#203F69' },
  { name: 'Azul', value: '#2D7BC8' },
  { name: 'Verde', value: '#2F9C74' },
  { name: 'Vermelho', value: '#D95C5C' },
  { name: 'Amarelo', value: '#F3C75A' },
  { name: 'Roxo', value: '#7A5AD8' },
]

const resolveStrokeStyle = (tool, baseColor, thicknessKey) => {
  if (tool === 'marker') return { width: thicknessOptions[thicknessKey].width * 2.5, opacity: 0.35, color: baseColor }
  if (tool === 'crayon') return { width: thicknessOptions[thicknessKey].width * 1.7, opacity: 0.7, color: baseColor }
  if (tool === 'eraser') return { width: thicknessOptions[thicknessKey].width * 3.2, opacity: 1, color: '#000000' }
  return { width: thicknessOptions[thicknessKey].width, opacity: 1, color: baseColor }
}

export default function DrawingCanvas({ showKeyboardLink = true }) {
  const canvas = useRef(null)
  const active = useRef(null)
  const [strokes, setStrokes] = useState([])
  const [tool, setTool] = useState('pencil')
  const [color, setColor] = useState('#203F69')
  const [thickness, setThickness] = useState('medium')
  const [statusMessage, setStatusMessage] = useState('Ferramenta ativa: lápis.')

  const currentToolLabel = useMemo(() => toolLabels[tool], [tool])

  const redraw = useCallback(() => {
    const element = canvas.current
    if (!element) return

    const { width, height } = element.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1
    const pixelWidth = Math.round(width * ratio)
    const pixelHeight = Math.round(height * ratio)

    if (element.width !== pixelWidth || element.height !== pixelHeight) {
      element.width = pixelWidth
      element.height = pixelHeight
    }

    const ctx = element.getContext('2d')
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const stroke of strokes) {
      const style = resolveStrokeStyle(stroke.tool, stroke.color, stroke.thickness)
      ctx.save()
      ctx.lineWidth = style.width
      ctx.strokeStyle = style.color
      ctx.fillStyle = style.color
      ctx.globalAlpha = style.opacity
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'

      if (stroke.points.length === 1) {
        const point = stroke.points[0]
        ctx.beginPath()
        ctx.arc(point.x * width, point.y * height, style.width / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        stroke.points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x * width, point.y * height)
          else ctx.lineTo(point.x * width, point.y * height)
        })
        ctx.stroke()
      }
      ctx.restore()
    }

    if (active.current) {
      const style = resolveStrokeStyle(active.current.tool, active.current.color, active.current.thickness)
      ctx.save()
      ctx.lineWidth = style.width
      ctx.strokeStyle = style.color
      ctx.fillStyle = style.color
      ctx.globalAlpha = style.opacity
      ctx.globalCompositeOperation = active.current.tool === 'eraser' ? 'destination-out' : 'source-over'

      if (active.current.points.length === 1) {
        const point = active.current.points[0]
        ctx.beginPath()
        ctx.arc(point.x * width, point.y * height, style.width / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        active.current.points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x * width, point.y * height)
          else ctx.lineTo(point.x * width, point.y * height)
        })
        ctx.stroke()
      }
      ctx.restore()
    }
  }, [strokes])

  useEffect(() => {
    const observer = new ResizeObserver(() => redraw())
    if (canvas.current) observer.observe(canvas.current)
    window.addEventListener('resize', redraw)
    redraw()
    return () => { observer.disconnect(); window.removeEventListener('resize', redraw) }
  }, [redraw])

  function point(event) {
    const rect = canvas.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    }
  }

  function start(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (active.current) return
    event.preventDefault()
    canvas.current.setPointerCapture(event.pointerId)
    active.current = {
      id: event.pointerId,
      tool,
      color: tool === 'eraser' ? '#000000' : color,
      thickness,
      points: [point(event)],
    }
    setStatusMessage(`Desenhando com ${toolLabels[tool].toLowerCase()}.`)
    redraw()
  }

  function move(event) {
    if (active.current?.id !== event.pointerId) return
    const samples = event.nativeEvent.getCoalescedEvents?.() || []
    for (const sample of samples.length ? samples : [event]) active.current.points.push(point(sample))
    redraw()
  }

  function finish(event) {
    if (active.current?.id !== event.pointerId) return

    const nextStroke = active.current
    if (event.type === 'pointerup' || event.type === 'pointercancel') {
      const finalPoint = point(event)
      const lastPoint = nextStroke.points[nextStroke.points.length - 1]
      if (!lastPoint || lastPoint.x !== finalPoint.x || lastPoint.y !== finalPoint.y) {
        nextStroke.points.push(finalPoint)
      }
    }

    setStrokes(current => [...current, { ...nextStroke, style: undefined }])
    active.current = null
    if (canvas.current?.hasPointerCapture(event.pointerId)) canvas.current.releasePointerCapture(event.pointerId)
    setStatusMessage(`${toolLabels[nextStroke.tool]} registrado no caderno.`)
  }

  function handleToolChange(nextTool) {
    setTool(nextTool)
    setStatusMessage(`Ferramenta ativa: ${toolLabels[nextTool].toLowerCase()}.`)
  }

  return <>
    <p id="canvas-help" className="writing-canvas-help">
      No computador, pressione o botão esquerdo do mouse e arraste para desenhar.
      No celular ou tablet, use o dedo ou uma caneta.
      {showKeyboardLink && <> Para praticar com teclado, use o <a href="#/aprender/escrever/teclado">Teclado educativo</a>.</>}
    </p>

    <div className="writing-notebook-toolbar" aria-label="Ferramentas do caderno">
      <div className="writing-tool-group" aria-label="Ferramentas de desenho">
        {Object.entries(toolLabels).map(([value, label]) => <button key={value} type="button" className="writing-tool-button" aria-pressed={tool === value} aria-label={`Selecionar ferramenta ${label}`} onClick={() => handleToolChange(value)}>{label}</button>)}
      </div>

      <div className="writing-tool-group" aria-label="Cores">
        {colorOptions.map(({ name, value }) => <button key={value} type="button" className="writing-color-swatch" style={{ background: value }} aria-label={`Cor ${name}`} aria-pressed={tool !== 'eraser' && color === value} onClick={() => { setColor(value); setStatusMessage(`Cor selecionada: ${name}.`); }} title={name} />)}
      </div>

      <div className="writing-tool-group" aria-label="Espessura">
        {Object.entries(thicknessOptions).map(([value, config]) => <button key={value} type="button" className="writing-thickness" aria-pressed={thickness === value} aria-label={`Espessura ${config.label}`} onClick={() => { setThickness(value); setStatusMessage(`Espessura selecionada: ${config.label.toLowerCase()}.`); }}>{config.label}</button>)}
      </div>

      <div className="writing-tool-group" aria-label="Ações do caderno">
        <button type="button" className="writing-action-button" disabled={!strokes.length} onClick={() => setStrokes(current => current.slice(0, -1))}>Desfazer</button>
        <button type="button" className="writing-action-button" disabled={!strokes.length} onClick={() => { setStrokes([]); setStatusMessage('Caderno limpo.'); }}>Limpar</button>
      </div>
    </div>

    <div className="writing-status" role="status" aria-live="polite">{statusMessage}</div>

    <div className="writing-sheet">
      <canvas
        ref={canvas}
        tabIndex={-1}
        aria-label="Folha para desenho e escrita livre"
        aria-describedby="canvas-help"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
      >Área de desenho livre. Use o Teclado educativo como alternativa.</canvas>
    </div>

    <div className="writing-canvas-meta" aria-live="polite">{currentToolLabel} · {tool === 'eraser' ? 'apagando' : colorOptions.find(item => item.value === color)?.name || 'Preto'} · {thicknessOptions[thickness].label}</div>
  </>
}
