import './PageScene.css'
import HomeLandscape from './HomeLandscape'

function Book() {
  return <g><path d="M0 6Q20 0 38 10Q56 0 76 6V58Q56 52 38 62Q20 52 0 58Z" fill="var(--scene-paper)" /><path d="M38 10V62M10 20L28 23M10 33L28 36M48 23L66 20M48 36L66 33" /></g>
}
function Bubble() {
  return <g><path d="M8 0H68Q80 0 80 12V44Q80 56 68 56H32L12 72V56H8Q0 56 0 44V12Q0 0 8 0Z" fill="var(--scene-paper)" /><path d="M16 19H62M16 33H48" /></g>
}
function Piece() {
  return <path d="M0 0H22Q14-22 32-22T42 0H64V22Q86 14 86 32T64 42V64H42Q50 42 32 42T22 64H0V42Q22 50 22 32T0 22Z" fill="var(--scene-piece)" />
}
function House() {
  return <g><path d="M0 30L36 0L72 30M8 24V74H64V24" fill="var(--scene-paper)" /><path d="M28 74V44H46V74M15 37H23V48H15Z" /></g>
}

export default function PageScene({ family }) {
  if (family === 'home') return <HomeLandscape />
  const daily = family === 'daily'
  const playful = family === 'play' || family === 'home'
  return <div className="home-decoration page-scene" data-family={family} aria-hidden="true">
    <svg className="scene-landscape" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMin slice" focusable="false">
      <path className="scene-shore" d="M0 0H1440V180Q1100 70 820 190T0 170Z" />
      <path className="scene-bank" d="M0 300Q170 240 200 460T0 760Z" />
      <path className="scene-bank scene-bank--right" d="M1440 260Q1280 370 1350 610T1440 850Z" />
      <path className="scene-floor" d="M0 900Q330 740 710 870T1440 820V1000H0Z" />
      <path className="scene-line" d="M0 226Q270 110 430 180M1290 350Q1410 480 1340 740" />
      {playful && <path className="scene-route" d="M18 290Q115 390 38 520T68 780" />}
      <g className="scene-detail" transform="translate(18 62) rotate(-9)">{daily ? <House /> : <Bubble />}</g>
      <g className="scene-detail" transform="translate(1350 380) rotate(12)">{playful ? <Piece /> : <Book />}</g>
      <g className="scene-detail scene-detail--secondary" transform="translate(18 760) rotate(-8)">{playful ? <Book /> : <Bubble />}</g>
      <g className="scene-detail scene-detail--secondary" transform="translate(1380 72) rotate(22)">
        <path d="M0 0H16V72L8 88L0 72Z" fill="var(--scene-piece)" /><path d="M0 12H16M0 72H16M8 16V68" />
      </g>
    </svg>
  </div>
}
