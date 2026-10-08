// Simple decorative scenery, separate from the original character PNGs and controls.
export default function HomeLandscape() {
  return <div className="home-decoration home-landscape" aria-hidden="true">
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMin slice" focusable="false">
      <defs>
        <linearGradient id="home-sky" x2="0" y2="1"><stop stopColor="#ACE0FD" /><stop offset="1" stopColor="#E4F5FD" /></linearGradient>
        <linearGradient id="home-path" x2="0" y2="1"><stop stopColor="#FFF3D5" /><stop offset="1" stopColor="#F8EAC4" /></linearGradient>
      </defs>
      <path fill="url(#home-sky)" d="M0 0h1440v900H0Z" />
      <g fill="#FFFFFF" opacity=".75">
        <path d="M0 30q40-10 48 35 40-5 45 30 0 20-25 20H0Z" />
        <path d="M270 145q0-30 24-30 5-30 30-30 29 0 34 31 27-5 29 25 0 14-18 14h-80Z" />
        <path d="M1310 95q10-35 40-28 8-55 58-45 45 0 55 47v67h-135q-38 0-18-41Z" />
      </g>
      <g className="home-landscape-sun" stroke="#FFD65D" strokeWidth="8" strokeLinecap="round">
        <circle cx="100" cy="165" r="37" fill="#FFDA6D" stroke="none" />
        <path d="M100 109v-12M100 221v12M44 165H32M156 165h12M60 125l-9-9M140 205l9 9M60 205l-9 9M140 125l9-9" />
      </g>
      <path fill="#A3D7B7" d="M0 320Q210 180 370 350Q500 410 690 320Q1000 190 1440 305V900H0Z" />
      <path fill="#BEDD8C" d="M0 280Q160 290 285 435L620 900H0Z" />
      <path fill="#B9DC93" d="M1440 265Q1220 270 1140 415L850 900h590Z" />
      <path fill="url(#home-path)" d="M0 460Q290 340 590 425T1440 440V780Q1080 740 830 850Q510 780 0 755Z" />
      <path fill="none" stroke="#DFC78F" strokeWidth="5" strokeDasharray="10 12" strokeLinecap="round" opacity=".7" d="M-20 520Q140 490 190 665T510 760Q700 690 840 815M1300 465Q1140 480 1230 620T1460 740" />
      <path fill="#A5D6C4" d="M0 765Q160 780 220 900H0ZM1440 760Q1260 730 1160 900h280Z" />
      <g fill="#6AB69C">
        <path d="M0 900V760q20-95 40-10 35-75 40-15 75-40 40 10 80 0 30 35 70 28 35 55l-30 65Z" />
        <path d="M1440 900V740q-30-95-45-5-50-65-50-5-80-35-45 20-80 5-40 45-60 25-25 55l30 50Z" />
      </g>
    </svg>
  </div>
}
