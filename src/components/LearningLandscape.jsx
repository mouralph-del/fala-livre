import './LearningLandscape.css'

import { learningScenes } from './learningScenes'

function Tree({ x, y, scale = 1 }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <g fill="#71BA91"><circle cx="0" cy="-100" r="62" /><circle cx="-40" cy="-56" r="52" /><circle cx="37" cy="-55" r="52" /></g>
    <g fill="#94CC92"><circle cx="-25" cy="-120" r="30" /><circle cx="26" cy="-101" r="32" /><circle cx="-54" cy="-63" r="23" /></g>
    <path d="M0 20V-82M0-18L-35-50M0-42L33-65" stroke="#9A7650" strokeWidth="9" strokeLinecap="round" fill="none" />
  </g>
}
function Books() {
  return <g stroke="#63869E" strokeWidth="2" strokeLinejoin="round">
    <path d="M0 60H108V80H0Z" fill="#ECA96B" /><path d="M8 63H108V76H8Z" fill="#FFFBEF" />
    <path d="M10 38H119V59H10Z" fill="#73B8D7" /><path d="M17 42H118V54H17Z" fill="#FFFBEF" />
    <path d="M5 14H99V37H5Z" fill="#8FBD85" /><path d="M13 18H98V32H13Z" fill="#FFFBEF" />
  </g>
}
function Cards() {
  return <g fill="#F8FDFF" stroke="#7CACBE" strokeWidth="3">
    <rect x="0" y="0" width="60" height="76" rx="10" transform="rotate(-8)" />
    <rect x="48" y="16" width="60" height="76" rx="10" transform="rotate(8 78 54)" />
    <path d="M15 22H43V43H29L20 51V43H15ZM60 41H94M60 54H88M60 67H82" fill="none" strokeLinecap="round" />
  </g>
}
function House() {
  return <g stroke="#B18A60" strokeWidth="3" strokeLinejoin="round">
    <path d="M18 48H145V140H18Z" fill="#FFE6AD" /><path d="M0 50 80 0 160 50Z" fill="#EAA279" />
    <rect x="70" y="86" width="34" height="54" rx="3" fill="#9CC3CF" />
    <path d="M32 69H56V99H32ZM117 69H138V99H117Z" fill="#D4F2F7" />
  </g>
}
function Heart() {
  return <path d="M48 83C-18 40 8-12 48 18 88-12 114 40 48 83Z" fill="#F5A59B" stroke="#E88C87" strokeWidth="3" />
}
function Flowers() {
  return <g fill="#FFF5D8" stroke="#EAC16C" strokeWidth="3">
    {[0, 70, 130].map((x, i) => <g key={x} transform={`translate(${x} ${i % 2 * 25})`}>
      <path d="M0 0q-15-18-22-3t13 17q-22 5-11 17t20-8q15 18 22 3t-13-17q22-5 11-17t-20 8Z" />
      <circle cy="7" r="6" fill="#FFD571" />
    </g>)}
  </g>
}

export default function LearningLandscape({ activity }) {
  const kind = learningScenes[activity]
  const indoor = kind === 'indoor'
  const village = kind === 'village'
  const emotional = kind === 'emotions'
  return <div className="home-decoration page-scene learning-landscape" data-learning-scene={activity} data-learning-kind={kind} aria-hidden="true">
    <svg className="learning-landscape-art" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMin slice" focusable="false">
      <path className="learning-sky" d="M0 0H1440V760H0Z" />
      {!indoor && <>
        <g fill="#FFFFFF" opacity=".85"><path d="M0 75Q25 30 60 75Q105 38 138 90Q175 80 180 118H0Z" /><path d="M1130 80Q1160 30 1200 70Q1250 20 1300 75Q1335 60 1370 110H1130Z" /></g>
        <path fill="#B5DCCC" d="M0 330Q250 195 470 340T880 320T1440 300V760H0Z" />
        <path fill="#ABD683" d="M0 390Q200 295 410 430T830 410T1440 400V760H0Z" />
        <g stroke="#C49F70" strokeWidth="9" strokeLinecap="round"><path d="M0 438H230M1190 425H1440" />{[18, 70, 124, 178, 1230, 1290, 1350, 1410].map(x => <path key={x} d={`M${x} 405v65`} />)}</g>
        <Tree x={70} y={390} scale={1.15} /><Tree x={1350} y={400} scale={1.1} />
        <Tree x={200} y={370} scale={.6} /><Tree x={1240} y={370} scale={.65} />
        <path fill="#FFF0CC" d="M970 420Q1200 445 990 550T1040 760H230Q850 620 830 550T970 420Z" />
        {village && <g transform="translate(1160 235) scale(.9)"><House /></g>}
      </>}
      {indoor && <>
        <path fill="#F7E6CC" d="M0 480H1440V760H0Z" />
        <g stroke="#D4B792" strokeWidth="10"><rect x="25" y="120" width="180" height="245" rx="14" fill="#C7EAF4" /><path d="M115 120V365M25 240H205" /><path d="M1240 225H1440M1260 385H1440" /></g>
        <g transform="translate(1270 140) scale(.9)"><Books /></g>
        <g transform="translate(1280 290) scale(.8)"><Books /></g>
      </>}
      <g fill="#73B591"><path d="M0 760V660Q20 580 45 650Q100 575 90 690Q145 660 155 760Z" /><path d="M1440 760V650Q1410 570 1390 670Q1330 580 1340 700Q1280 650 1290 760Z" /></g>
      <g transform="translate(55 660)"><Flowers /></g><g transform="translate(1250 650)"><Flowers /></g>
    </svg>
    {!indoor && !emotional && <svg className="learning-scene-sun" viewBox="0 0 120 120" focusable="false">
      <g stroke="#FFD45E" strokeWidth="6" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <path key={angle} d="M60 9V18" transform={`rotate(${angle} 60 60)`} />)}
      </g>
      <circle cx="60" cy="60" r="31" fill="#FFE079" />
    </svg>}
    <svg className="learning-scene-object learning-scene-object--left" viewBox="-15 -20 170 170" focusable="false">
      {emotional ? <Heart /> : kind === 'message' ? <Cards /> : <Books />}
    </svg>
    {emotional && <svg className="learning-scene-object learning-scene-object--right" viewBox="-15 -20 170 170" focusable="false"><Cards /></svg>}
  </div>
}
