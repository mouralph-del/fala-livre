// Simple decorative scenery, separate from the original character PNGs and controls.
export default function HomeLandscape() {
  return <div className="home-decoration home-landscape" aria-hidden="true">
    <svg className="home-landscape-backdrop" viewBox="0 0 1440 900" preserveAspectRatio="none" focusable="false">
      <defs>
        <linearGradient id="home-sky" x2="0" y2="1"><stop stopColor="#83D6F7" /><stop offset="1" stopColor="#DDF5FC" /></linearGradient>
        <linearGradient id="home-path" x2="0" y2="1"><stop stopColor="#FFF3D5" /><stop offset="1" stopColor="#F8EAC4" /></linearGradient>
      </defs>
      <path fill="url(#home-sky)" d="M0 0h1440v900H0Z" />
      <g fill="#FFFFFF" opacity=".75">
        <path d="M0 30q40-10 48 35 40-5 45 30 0 20-25 20H0Z" />
        <path d="M270 145q0-30 24-30 5-30 30-30 29 0 34 31 27-5 29 25 0 14-18 14h-80Z" />
        <path d="M1310 95q10-35 40-28 8-55 58-45 45 0 55 47v67h-135q-38 0-18-41Z" />
      </g>
      <path fill="#9BCFB8" d="M0 320Q210 180 370 350Q500 410 690 320Q1000 190 1440 305V900H0Z" />
      <path fill="#A8D775" d="M0 280Q160 290 285 435L620 900H0Z" />
      <path fill="#A6D675" d="M1440 265Q1220 270 1140 415L850 900h590Z" />
      <g fill="#75B996">
        <path d="M0 425V180Q40 135 75 185Q110 145 140 200Q160 245 115 285Q170 320 115 365Q155 405 90 425Z" />
        <path d="M1440 420V180Q1400 140 1360 185Q1300 145 1290 220Q1250 260 1300 310Q1245 345 1300 385Q1270 425 1350 440Z" />
      </g>
      <g fill="none" stroke="#967652" strokeWidth="8" strokeLinecap="round">
        <path d="M72 425V235M72 295L36 265M72 330L112 285M1350 435V250M1350 315L1300 280M1350 340L1390 295" />
      </g>
      <path fill="url(#home-path)" d="M0 565Q330 445 660 535T1440 560V705Q1170 690 1010 790Q850 885 1040 900H410Q260 790 100 755Q-30 700 0 565Z" />
      <path fill="none" stroke="#DFC78F" strokeWidth="5" strokeDasharray="10 12" strokeLinecap="round" opacity=".7" d="M-20 520Q140 490 190 665T510 760Q700 690 840 815M1300 465Q1140 480 1230 620T1460 740" />
      <path fill="#A5D6C4" d="M0 765Q160 780 220 900H0ZM1440 760Q1260 730 1160 900h280Z" />
      <g fill="#6AB69C">
        <path d="M0 900V760q20-95 40-10 35-75 40-15 75-40 40 10 80 0 30 35 70 28 35 55l-30 65Z" />
        <path d="M1440 900V740q-30-95-45-5-50-65-50-5-80-35-45 20-80 5-40 45-60 25-25 55l30 50Z" />
      </g>
      <g fill="#FFF9DC" stroke="#F0CC61" strokeWidth="5">
        <path d="M220 819q-15-20-23-5t12 20q-23 5-12 19t23-7q15 20 23 5t-12-20q23-5 12-19t-23 7Z" />
        <path d="M1240 789q-15-20-23-5t12 20q-23 5-12 19t23-7q15 20 23 5t-12-20q23-5 12-19t-23 7Z" />
      </g>
    </svg>
    <svg className="home-landscape-sun" viewBox="0 0 160 160" focusable="false">
      <g stroke="#FFD65D" strokeWidth="8" strokeLinecap="round">
        <circle cx="80" cy="80" r="37" fill="#FFDA6D" stroke="none" />
        <path d="M80 24V12M80 136v12M24 80H12M136 80h12M40 40l-9-9M120 120l9 9M40 120l-9 9M120 40l9-9" />
      </g>
    </svg>
  </div>
}
