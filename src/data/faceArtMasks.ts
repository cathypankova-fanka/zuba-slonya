export interface FaceArtMaskDef {
  id: string;
  name: string;
  aspectRatio: number; // width / height
  baseWidthRatio: number; // relative to canvas width
  previewBg: string;
  svg: string;
}

export const FACE_ART_MASKS: FaceArtMaskDef[] = [
  {
    id: 'butterfly_fairy',
    name: 'Бабочка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FCE7F3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <defs>
        <linearGradient id="bfWingL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6B21A8" stop-opacity="0.92"/>
          <stop offset="35%" stop-color="#EC4899" stop-opacity="0.9"/>
          <stop offset="72%" stop-color="#38BDF8" stop-opacity="0.88"/>
          <stop offset="100%" stop-color="#F472B6" stop-opacity="0.72"/>
        </linearGradient>
        <linearGradient id="bfWingR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#6B21A8" stop-opacity="0.92"/>
          <stop offset="35%" stop-color="#EC4899" stop-opacity="0.9"/>
          <stop offset="72%" stop-color="#38BDF8" stop-opacity="0.88"/>
          <stop offset="100%" stop-color="#F472B6" stop-opacity="0.72"/>
        </linearGradient>
        <radialGradient id="bfCheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FF5CA8" stop-opacity="0.82"/>
          <stop offset="65%" stop-color="#A855F7" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#A855F7" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Left Upper & Lower Wing around left eye (cx=114, cy=146) -->
      <path d="M174 128 C162 84, 108 42, 42 36 C16 42, 12 88, 34 114 C16 130, 18 164, 46 176 C36 206, 56 244, 102 246 C134 246, 152 214, 148 192 C110 202, 68 184, 66 146 C64 112, 106 88, 152 110 Z" fill="url(#bfWingL)" stroke="#7E22CE" stroke-width="4" stroke-linejoin="round"/>
      <!-- Right Upper & Lower Wing around right eye (cx=286, cy=146) -->
      <path d="M226 128 C238 84, 292 42, 358 36 C384 42, 388 88, 366 114 C384 130, 382 164, 354 176 C364 206, 344 244, 298 246 C266 246, 248 214, 252 192 C290 202, 332 184, 334 146 C336 112, 294 88, 248 110 Z" fill="url(#bfWingR)" stroke="#7E22CE" stroke-width="4" stroke-linejoin="round"/>
      <!-- Soft Cheek Shimmer -->
      <ellipse cx="76" cy="212" rx="46" ry="30" fill="url(#bfCheek)"/>
      <ellipse cx="324" cy="212" rx="46" ry="30" fill="url(#bfCheek)"/>
      <!-- Cheek Swirls & Mini Butterflies -->
      <path d="M62 238 C46 254, 48 278, 70 282 C84 284, 88 268, 76 264" fill="none" stroke="#6B21A8" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M338 238 C354 254, 352 278, 330 282 C316 284, 312 268, 324 264" fill="none" stroke="#6B21A8" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Forehead Butterfly Body & Antennae -->
      <circle cx="200" cy="88" r="11" fill="#EC4899" stroke="#FFFFFF" stroke-width="2.5"/>
      <path d="M200 106 Q208 128 200 156 Q192 128 200 106 Z" fill="#A855F7" stroke="#FFFFFF" stroke-width="2"/>
      <path d="M193 78 C178 46, 148 34, 134 46 C126 54, 136 66, 146 58" fill="none" stroke="#A855F7" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M207 78 C222 46, 252 34, 266 46 C274 54, 264 66, 254 58" fill="none" stroke="#A855F7" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Sparkling Stars & Glitter Dots -->
      <path d="M100 68 L104 77 L114 78 L106 84 L108 94 L100 88 L92 94 L94 84 L86 78 L96 77 Z" fill="#FFFFFF"/>
      <path d="M300 68 L304 77 L314 78 L306 84 L308 94 L300 88 L292 94 L294 84 L286 78 L296 77 Z" fill="#FFFFFF"/>
      <path d="M68 214 L71 220 L78 221 L73 225 L74 232 L68 228 L62 232 L63 225 L58 221 L65 220 Z" fill="#FFFFFF"/>
      <path d="M332 214 L335 220 L342 221 L337 225 L338 232 L332 228 L326 232 L327 225 L322 221 L329 220 Z" fill="#FFFFFF"/>
      <g fill="#FFFFFF" opacity="0.92">
        <circle cx="58" cy="58" r="4"/>
        <circle cx="72" cy="52" r="2.5"/>
        <circle cx="48" cy="84" r="3"/>
        <circle cx="342" cy="58" r="4"/>
        <circle cx="328" cy="52" r="2.5"/>
        <circle cx="352" cy="84" r="3"/>
        <circle cx="152" cy="60" r="3.5"/>
        <circle cx="248" cy="60" r="3.5"/>
        <circle cx="182" cy="176" r="2.5"/>
        <circle cx="218" cy="176" r="2.5"/>
        <circle cx="194" cy="184" r="2"/>
        <circle cx="206" cy="184" r="2"/>
        <circle cx="96" cy="216" r="3"/>
        <circle cx="304" cy="216" r="3"/>
      </g>
    </svg>`,
  },
  {
    id: 'rainbow_magic',
    name: 'Радуга',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0F2FE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <g fill="none" stroke-linecap="round" opacity="0.88">
        <!-- Left Rainbow Arch above eye -->
        <path d="M30 132 C46 58, 134 52, 174 106" stroke="#FF3B5C" stroke-width="11"/>
        <path d="M40 138 C56 72, 132 68, 168 114" stroke="#FF9F1C" stroke-width="10"/>
        <path d="M50 144 C64 86, 130 84, 162 122" stroke="#FFD13B" stroke-width="9"/>
        <path d="M60 150 C72 100, 128 98, 156 130" stroke="#10C97A" stroke-width="8"/>
        <path d="M70 156 C80 114, 126 112, 150 136" stroke="#38BDF8" stroke-width="7"/>
        <!-- Right Rainbow Arch above eye -->
        <path d="M370 132 C354 58, 266 52, 226 106" stroke="#FF3B5C" stroke-width="11"/>
        <path d="M360 138 C344 72, 268 68, 232 114" stroke="#FF9F1C" stroke-width="10"/>
        <path d="M350 144 C336 86, 270 84, 238 122" stroke="#FFD13B" stroke-width="9"/>
        <path d="M340 150 C328 100, 272 98, 244 130" stroke="#10C97A" stroke-width="8"/>
        <path d="M330 156 C320 114, 274 112, 250 136" stroke="#38BDF8" stroke-width="7"/>
      </g>
      <!-- Fluffy Cheek Clouds -->
      <g fill="#FFFFFF" stroke="#BAE6FD" stroke-width="3">
        <circle cx="52" cy="196" r="18"/>
        <circle cx="74" cy="190" r="20"/>
        <circle cx="94" cy="200" r="16"/>
        <circle cx="348" cy="196" r="18"/>
        <circle cx="326" cy="190" r="20"/>
        <circle cx="306" cy="200" r="16"/>
      </g>
      <!-- Forehead Rainbow Star -->
      <path d="M200 44 L208 66 L232 68 L213 82 L219 106 L200 92 L181 106 L187 82 L168 68 L192 66 Z" fill="#FFD13B" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/>
      <!-- Glitter Sparkles -->
      <g fill="#FFFFFF">
        <circle cx="174" cy="184" r="3.5"/>
        <circle cx="188" cy="192" r="2.5"/>
        <circle cx="226" cy="184" r="3.5"/>
        <circle cx="212" cy="192" r="2.5"/>
        <circle cx="122" cy="218" r="4"/>
        <circle cx="278" cy="218" r="4"/>
      </g>
    </svg>`,
  },
  {
    id: 'princess_tiara',
    name: 'Принцесса',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#F3E8FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <defs>
        <radialGradient id="prCheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#F472B6" stop-opacity="0.72"/>
          <stop offset="100%" stop-color="#F472B6" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Forehead Royal Tiara Swirls -->
      <path d="M126 84 C144 58, 174 52, 200 28 C226 52, 256 58, 274 84" fill="none" stroke="#F59E0B" stroke-width="6" stroke-linecap="round"/>
      <path d="M148 90 C168 74, 188 70, 200 50 C212 70, 232 74, 252 90" fill="none" stroke="#EC4899" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Crown Gems -->
      <polygon points="200,26 212,48 200,70 188,48" fill="#FF3B5C" stroke="#FFFFFF" stroke-width="2.5"/>
      <circle cx="162" cy="66" r="7" fill="#A855F7" stroke="#FFFFFF" stroke-width="2.5"/>
      <circle cx="238" cy="66" r="7" fill="#A855F7" stroke="#FFFFFF" stroke-width="2.5"/>
      <circle cx="132" cy="82" r="5.5" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="268" cy="82" r="5.5" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2"/>
      <!-- Temple Wing Curls around eyes -->
      <path d="M158 102 C112 78, 56 88, 38 122 C28 142, 42 172, 62 184" fill="none" stroke="#A855F7" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M242 102 C288 78, 344 88, 362 122 C372 142, 358 172, 338 184" fill="none" stroke="#A855F7" stroke-width="5.5" stroke-linecap="round"/>
      <!-- Rosy Cheek Glow & Hearts -->
      <ellipse cx="82" cy="212" rx="44" ry="26" fill="url(#prCheek)"/>
      <ellipse cx="318" cy="212" rx="44" ry="26" fill="url(#prCheek)"/>
      <path d="M74 226 C74 226 56 214 56 204 C56 198 62 194 67 194 C71 194 73 197 74 200 C75 197 77 194 81 194 C86 194 92 198 92 204 C92 214 74 226 74 226 Z" fill="#FF3B5C" opacity="0.88"/>
      <path d="M326 226 C326 226 308 214 308 204 C308 198 314 194 319 194 C323 194 325 197 326 200 C327 197 329 194 333 194 C338 194 344 198 344 204 C344 214 326 226 326 226 Z" fill="#FF3B5C" opacity="0.88"/>
      <!-- Golden Sparkles -->
      <g fill="#FDE047">
        <circle cx="104" cy="96" r="4"/>
        <circle cx="296" cy="96" r="4"/>
        <circle cx="52" cy="148" r="3.5"/>
        <circle cx="348" cy="148" r="3.5"/>
        <circle cx="200" cy="92" r="4"/>
      </g>
    </svg>`,
  },
  {
    id: 'kitty_glam',
    name: 'Кошечка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFE4E6',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <defs>
        <radialGradient id="ktCheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FF5CA8" stop-opacity="0.72"/>
          <stop offset="100%" stop-color="#FF5CA8" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Cat-eye glam swoops above outer eyes -->
      <path d="M56 132 C74 102, 118 96, 154 114 C122 108, 86 116, 44 148 Z" fill="#A855F7" opacity="0.85"/>
      <path d="M344 132 C326 102, 282 96, 246 114 C278 108, 314 116, 356 148 Z" fill="#A855F7" opacity="0.85"/>
      <!-- Cute Forehead Kitty Bow -->
      <path d="M196 68 L168 50 Q162 68 168 86 Z" fill="#FF5CA8" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M204 68 L232 50 Q238 68 232 86 Z" fill="#FF5CA8" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="200" cy="68" r="9" fill="#FFD13B" stroke="#FFFFFF" stroke-width="2.5"/>
      <!-- Cheek Glow -->
      <ellipse cx="86" cy="212" rx="46" ry="26" fill="url(#ktCheek)"/>
      <ellipse cx="314" cy="212" rx="46" ry="26" fill="url(#ktCheek)"/>
      <!-- Cute Pink Heart Nose -->
      <path d="M200 202 C200 202 182 188 182 178 C182 171 188 167 194 167 C197 167 199 170 200 173 C201 170 203 167 206 167 C212 167 218 171 218 178 C218 188 200 202 200 202 Z" fill="#FF3B5C" stroke="#FFFFFF" stroke-width="2.5"/>
      <!-- Graceful Cheek Whiskers -->
      <g stroke="#4C1D95" stroke-width="4.5" stroke-linecap="round">
        <path d="M132 202 Q90 192 48 184"/>
        <path d="M130 216 Q86 218 40 222"/>
        <path d="M134 228 Q96 242 58 256"/>
        <path d="M268 202 Q310 192 352 184"/>
        <path d="M270 216 Q314 218 360 222"/>
        <path d="M266 228 Q304 242 342 256"/>
      </g>
      <circle cx="68" cy="112" r="4" fill="#FFFFFF"/>
      <circle cx="332" cy="112" r="4" fill="#FFFFFF"/>
    </svg>`,
  },
  {
    id: 'tiger_cub',
    name: 'Тигрёнок',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFEDD5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <defs>
        <radialGradient id="tgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FF7A1A" stop-opacity="0.72"/>
          <stop offset="65%" stop-color="#FBBF24" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#FBBF24" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Warm Orange Aqua Cheek & Brow Glow -->
      <ellipse cx="200" cy="64" rx="88" ry="34" fill="url(#tgGlow)"/>
      <ellipse cx="78" cy="204" rx="54" ry="38" fill="url(#tgGlow)"/>
      <ellipse cx="322" cy="204" rx="54" ry="38" fill="url(#tgGlow)"/>
      <!-- Bold Curved Tiger Stripes -->
      <g fill="#1E293B" opacity="0.88">
        <path d="M200 22 L192 66 L208 66 Z"/>
        <path d="M168 34 C156 54, 160 72, 174 84 C168 68, 170 50, 178 38 Z"/>
        <path d="M232 34 C244 54, 240 72, 226 84 C232 68, 230 50, 222 38 Z"/>
        <!-- Temple & Cheek Stripes -->
        <path d="M38 102 C62 108, 76 122, 82 140 C66 130, 52 120, 34 116 Z"/>
        <path d="M362 102 C338 108, 324 122, 318 140 C334 130, 348 120, 366 116 Z"/>
        <path d="M30 184 C62 184, 84 192, 98 206 C76 202, 54 198, 28 198 Z"/>
        <path d="M370 184 C338 184, 316 192, 302 206 C324 202, 346 198, 372 198 Z"/>
        <path d="M40 226 C68 220, 92 224, 108 234 C86 234, 64 236, 42 242 Z"/>
        <path d="M360 226 C332 220, 308 224, 292 234 C314 234, 336 236, 358 242 Z"/>
      </g>
      <!-- Cute Tiger Nose Tip -->
      <path d="M184 176 Q200 168 216 176 Q214 196 200 198 Q186 196 184 176 Z" fill="#1E293B"/>
      <ellipse cx="195" cy="179" rx="5" ry="2.5" fill="#FFFFFF" opacity="0.65"/>
    </svg>`,
  },
  {
    id: 'superhero',
    name: 'Супергерой',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#DBEAFE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <defs>
        <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#2563EB" stop-opacity="0.92"/>
          <stop offset="50%" stop-color="#7C3AED" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#2563EB" stop-opacity="0.92"/>
        </linearGradient>
      </defs>
      <!-- Hero Mask Band with Clear Eye Cutouts -->
      <path fill-rule="evenodd" d="M34 114 L92 84 L166 106 L200 92 L234 106 L308 84 L366 114 L344 178 L272 184 L200 164 L128 184 L56 178 Z M116 114 A46 34 0 1 0 116 182 A46 34 0 1 0 116 114 Z M284 114 A46 34 0 1 0 284 182 A46 34 0 1 0 284 114 Z" fill="url(#heroGrad)" stroke="#1E3A8A" stroke-width="4" stroke-linejoin="round"/>
      <!-- Golden Lightning Bolts at Temples -->
      <polygon points="56,74 36,112 54,112 42,148 74,104 54,104" fill="#FFD13B" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
      <polygon points="344,74 364,112 346,112 358,148 326,104 346,104" fill="#FFD13B" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
      <!-- Forehead Star -->
      <path d="M200 44 L207 62 L226 64 L211 76 L216 94 L200 84 L184 94 L189 76 L174 64 L193 62 Z" fill="#FFD13B" stroke="#B45309" stroke-width="2.5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'spider_hero',
    name: 'Паучок',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEE2E2',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <!-- Red Mask Frame with Eye Holes -->
      <path fill-rule="evenodd" d="M40 108 L106 76 L174 102 L200 72 L226 102 L294 76 L360 108 L342 182 L266 192 L200 170 L134 192 L58 182 Z M116 114 A46 34 0 1 0 116 182 A46 34 0 1 0 116 114 Z M284 114 A46 34 0 1 0 284 182 A46 34 0 1 0 284 114 Z" fill="#EF4444" fill-opacity="0.9" stroke="#7F1D1D" stroke-width="4" stroke-linejoin="round"/>
      <!-- Crisp Spider Web Lines -->
      <g stroke="#1E293B" stroke-width="2.8" fill="none" opacity="0.78">
        <line x1="200" y1="74" x2="200" y2="170"/>
        <line x1="200" y1="126" x2="106" y2="76"/>
        <line x1="200" y1="126" x2="294" y2="76"/>
        <line x1="200" y1="126" x2="40" y2="108"/>
        <line x1="200" y1="126" x2="360" y2="108"/>
        <path d="M168 106 Q200 118 232 106"/>
        <path d="M52 132 Q80 110 100 84"/>
        <path d="M348 132 Q320 110 300 84"/>
      </g>
      <!-- Tiny Webs on Cheeks -->
      <g stroke="#1E293B" stroke-width="2.8" stroke-linecap="round" opacity="0.75">
        <line x1="88" y1="204" x2="54" y2="238"/>
        <line x1="88" y1="204" x2="86" y2="248"/>
        <path d="M68 224 Q78 234 88 230" fill="none"/>
        <line x1="312" y1="204" x2="346" y2="238"/>
        <line x1="312" y1="204" x2="314" y2="248"/>
        <path d="M332 224 Q322 234 312 230" fill="none"/>
      </g>
    </svg>`,
  },
  {
    id: 'mermaid',
    name: 'Русалочка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#CFFAFE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <defs>
        <linearGradient id="merGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.86"/>
          <stop offset="50%" stop-color="#A855F7" stop-opacity="0.82"/>
          <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.78"/>
        </linearGradient>
      </defs>
      <!-- Forehead Shell Crown -->
      <path d="M200 86 L166 50 A38 38 0 0 1 234 50 Z" fill="url(#merGrad)" stroke="#FFFFFF" stroke-width="3"/>
      <line x1="200" y1="84" x2="182" y2="42" stroke="#FFFFFF" stroke-width="2.5" opacity="0.8"/>
      <line x1="200" y1="84" x2="200" y2="38" stroke="#FFFFFF" stroke-width="2.5" opacity="0.8"/>
      <line x1="200" y1="84" x2="218" y2="42" stroke="#FFFFFF" stroke-width="2.5" opacity="0.8"/>
      <!-- Iridescent Scale Clusters at Temples & Cheeks -->
      <g fill="url(#merGrad)" stroke="#FFFFFF" stroke-width="2.2" opacity="0.9">
        <path d="M46 116 A16 16 0 0 1 78 116 A16 16 0 0 1 46 116 Z"/>
        <path d="M64 98 A16 16 0 0 1 96 98 A16 16 0 0 1 64 98 Z"/>
        <path d="M44 196 A16 16 0 0 1 76 196 A16 16 0 0 1 44 196 Z"/>
        <path d="M64 214 A16 16 0 0 1 96 214 A16 16 0 0 1 64 214 Z"/>
        <path d="M84 196 A16 16 0 0 1 116 196 A16 16 0 0 1 84 196 Z"/>

        <path d="M322 116 A16 16 0 0 1 354 116 A16 16 0 0 1 322 116 Z"/>
        <path d="M304 98 A16 16 0 0 1 336 98 A16 16 0 0 1 304 98 Z"/>
        <path d="M324 196 A16 16 0 0 1 356 196 A16 16 0 0 1 324 196 Z"/>
        <path d="M304 214 A16 16 0 0 1 336 214 A16 16 0 0 1 304 214 Z"/>
        <path d="M284 196 A16 16 0 0 1 316 196 A16 16 0 0 1 284 196 Z"/>
      </g>
      <!-- Pearls -->
      <g fill="#FFFFFF" stroke="#BAE6FD" stroke-width="2">
        <circle cx="200" cy="96" r="7"/>
        <circle cx="146" cy="84" r="5"/>
        <circle cx="254" cy="84" r="5"/>
        <circle cx="116" cy="222" r="5"/>
        <circle cx="284" cy="222" r="5"/>
      </g>
    </svg>`,
  },
  {
    id: 'flower_fairy',
    name: 'Фея цветов',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#DCFCE7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <!-- Botanical Vines -->
      <path d="M164 88 C118 68, 66 86, 46 132 C34 162, 46 212, 88 232" fill="none" stroke="#10C97A" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M236 88 C282 68, 334 86, 354 132 C366 162, 354 212, 312 232" fill="none" stroke="#10C97A" stroke-width="5.5" stroke-linecap="round"/>
      <!-- Cute Leaves -->
      <g fill="#22C55E" stroke="#15803D" stroke-width="2">
        <ellipse cx="122" cy="76" rx="14" ry="7" transform="rotate(-24 122 76)"/>
        <ellipse cx="44" cy="156" rx="14" ry="7" transform="rotate(60 44 156)"/>
        <ellipse cx="278" cy="76" rx="14" ry="7" transform="rotate(24 278 76)"/>
        <ellipse cx="356" cy="156" rx="14" ry="7" transform="rotate(-60 356 156)"/>
      </g>
      <!-- Pink Blossom Left Temple -->
      <g transform="translate(66,104)">
        <circle cx="0" cy="-14" r="10" fill="#FF5CA8"/>
        <circle cx="13" cy="-4" r="10" fill="#FF5CA8"/>
        <circle cx="8" cy="11" r="10" fill="#FF5CA8"/>
        <circle cx="-8" cy="11" r="10" fill="#FF5CA8"/>
        <circle cx="-13" cy="-4" r="10" fill="#FF5CA8"/>
        <circle cx="0" cy="0" r="8" fill="#FFD13B"/>
      </g>
      <!-- Pink Blossom Right Temple -->
      <g transform="translate(334,104)">
        <circle cx="0" cy="-14" r="10" fill="#FF5CA8"/>
        <circle cx="13" cy="-4" r="10" fill="#FF5CA8"/>
        <circle cx="8" cy="11" r="10" fill="#FF5CA8"/>
        <circle cx="-8" cy="11" r="10" fill="#FF5CA8"/>
        <circle cx="-13" cy="-4" r="10" fill="#FF5CA8"/>
        <circle cx="0" cy="0" r="8" fill="#FFD13B"/>
      </g>
      <!-- Cheek Lavender Mini-Flowers -->
      <g transform="translate(88,224) scale(0.75)">
        <circle cx="0" cy="-12" r="9" fill="#A855F7"/>
        <circle cx="12" cy="-3" r="9" fill="#A855F7"/>
        <circle cx="7" cy="10" r="9" fill="#A855F7"/>
        <circle cx="-7" cy="10" r="9" fill="#A855F7"/>
        <circle cx="-12" cy="-3" r="9" fill="#A855F7"/>
        <circle cx="0" cy="0" r="7" fill="#FFD13B"/>
      </g>
      <g transform="translate(312,224) scale(0.75)">
        <circle cx="0" cy="-12" r="9" fill="#A855F7"/>
        <circle cx="12" cy="-3" r="9" fill="#A855F7"/>
        <circle cx="7" cy="10" r="9" fill="#A855F7"/>
        <circle cx="-7" cy="10" r="9" fill="#A855F7"/>
        <circle cx="-12" cy="-3" r="9" fill="#A855F7"/>
        <circle cx="0" cy="0" r="7" fill="#FFD13B"/>
      </g>
      <!-- Forehead Flower -->
      <g transform="translate(200,66) scale(0.85)">
        <circle cx="0" cy="-12" r="9" fill="#F472B6"/>
        <circle cx="12" cy="-3" r="9" fill="#F472B6"/>
        <circle cx="7" cy="10" r="9" fill="#F472B6"/>
        <circle cx="-7" cy="10" r="9" fill="#F472B6"/>
        <circle cx="-12" cy="-3" r="9" fill="#F472B6"/>
        <circle cx="0" cy="0" r="7" fill="#FFD13B"/>
      </g>
    </svg>`,
  },
  {
    id: 'galaxy_cosmic',
    name: 'Космос',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0E7FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <defs>
        <radialGradient id="nebulaL" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#6366F1" stop-opacity="0.78"/>
          <stop offset="60%" stop-color="#06B6D4" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#06B6D4" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Nebula Cheek & Temple Glow -->
      <ellipse cx="74" cy="204" rx="52" ry="34" fill="url(#nebulaL)"/>
      <ellipse cx="326" cy="204" rx="52" ry="34" fill="url(#nebulaL)"/>
      <ellipse cx="64" cy="108" rx="44" ry="28" fill="url(#nebulaL)"/>
      <ellipse cx="336" cy="108" rx="44" ry="28" fill="url(#nebulaL)"/>
      <!-- Forehead Golden Crescent Moon -->
      <path d="M210 34 C184 36 168 58 172 80 C176 98 198 106 220 94 C198 92 188 72 194 54 C198 44 203 38 210 34 Z" fill="#FDE047" stroke="#D97706" stroke-width="3" stroke-linejoin="round"/>
      <!-- Mini Cheek Planet -->
      <circle cx="72" cy="210" r="14" fill="#A855F7" stroke="#FFFFFF" stroke-width="2.5"/>
      <ellipse cx="72" cy="211" rx="28" ry="7" transform="rotate(-18 72 211)" fill="none" stroke="#FFD13B" stroke-width="4"/>
      <!-- Sparkling Stars & Constellations -->
      <path d="M326 196 L331 207 L343 209 L334 217 L336 229 L326 223 L316 229 L318 217 L309 209 L321 207 Z" fill="#FFD13B" stroke="#FFFFFF" stroke-width="2"/>
      <g fill="#FFFFFF">
        <circle cx="58" cy="102" r="4"/>
        <circle cx="82" cy="90" r="3"/>
        <circle cx="342" cy="102" r="4"/>
        <circle cx="318" cy="90" r="3"/>
        <circle cx="152" cy="64" r="3.5"/>
        <circle cx="248" cy="64" r="3.5"/>
        <circle cx="174" cy="184" r="2.5"/>
        <circle cx="226" cy="184" r="2.5"/>
      </g>
    </svg>`,
  },
  {
    id: 'bunny_cute',
    name: 'Зайка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFE4E6',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <defs>
        <radialGradient id="bnBlush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FB7185" stop-opacity="0.72"/>
          <stop offset="100%" stop-color="#FB7185" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Rosy Bunny Cheeks -->
      <ellipse cx="86" cy="210" rx="48" ry="30" fill="url(#bnBlush)"/>
      <ellipse cx="314" cy="210" rx="48" ry="30" fill="url(#bnBlush)"/>
      <!-- Cute Pink Bunny Nose -->
      <path d="M186 178 Q200 170 214 178 Q210 196 200 198 Q190 196 186 178 Z" fill="#FF5CA8" stroke="#FFFFFF" stroke-width="2.5"/>
      <!-- Whisker Dots & Soft Whiskers -->
      <g fill="#BE185D">
        <circle cx="164" cy="204" r="3.5"/>
        <circle cx="150" cy="212" r="3.5"/>
        <circle cx="236" cy="204" r="3.5"/>
        <circle cx="250" cy="212" r="3.5"/>
      </g>
      <g stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" opacity="0.88">
        <line x1="132" y1="202" x2="62" y2="190"/>
        <line x1="130" y1="216" x2="56" y2="218"/>
        <line x1="268" y1="202" x2="338" y2="190"/>
        <line x1="270" y1="216" x2="344" y2="218"/>
      </g>
      <!-- Tiny Cheek Hearts & White Sparkles -->
      <path d="M74 224 C74 224 62 215 62 208 C62 204 66 201 70 201 C72 201 73 203 74 205 C75 203 76 201 78 201 C82 201 86 204 86 208 C86 215 74 224 74 224 Z" fill="#FFFFFF" opacity="0.9"/>
      <path d="M326 224 C326 224 314 215 314 208 C314 204 318 201 322 201 C324 201 325 203 326 205 C327 203 328 201 330 201 C334 201 338 204 338 208 C338 215 326 224 326 224 Z" fill="#FFFFFF" opacity="0.9"/>
      <path d="M200 62 Q204 78 220 82 Q204 86 200 102 Q196 86 180 82 Q196 78 200 62 Z" fill="#FF5CA8" stroke="#FFFFFF" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'dragon_fire',
    name: 'Дракончик',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#D1FAE5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <defs>
        <linearGradient id="drGradL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#059669" stop-opacity="0.9"/>
          <stop offset="55%" stop-color="#10C97A" stop-opacity="0.86"/>
          <stop offset="100%" stop-color="#FFD13B" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <!-- Dragon Wing Brows -->
      <path d="M40 124 L68 74 L112 92 L166 96 L154 114 L92 110 Z" fill="url(#drGradL)" stroke="#065F46" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M360 124 L332 74 L288 92 L234 96 L246 114 L308 110 Z" fill="url(#drGradL)" stroke="#065F46" stroke-width="3.5" stroke-linejoin="round"/>
      <!-- Forehead Dragon Crest -->
      <polygon points="200,28 216,74 200,98 184,74" fill="#FFD13B" stroke="#B45309" stroke-width="3" stroke-linejoin="round"/>
      <!-- Cheek Flame Swirls -->
      <path d="M46 218 C48 188, 74 182, 86 198 C98 184, 114 196, 108 216 C102 234, 62 246, 46 218 Z" fill="#FF7A1A" opacity="0.88" stroke="#FFFFFF" stroke-width="2.5"/>
      <path d="M354 218 C352 188, 326 182, 314 198 C302 184, 286 196, 292 216 C298 234, 338 246, 354 218 Z" fill="#FF7A1A" opacity="0.88" stroke="#FFFFFF" stroke-width="2.5"/>
      <circle cx="78" cy="214" r="7" fill="#FFD13B"/>
      <circle cx="322" cy="214" r="7" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'unicorn_aqua',
    name: 'Единорог',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FCE7F3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M200 18 L222 92 Q200 100 178 92 Z" fill="#FDE047" stroke="#D97706" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M189 48 L213 58 M184 68 L218 80" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M168 88 C134 62, 74 72, 46 116" fill="none" stroke="#FF5CA8" stroke-width="9" stroke-linecap="round" opacity="0.88"/>
      <path d="M232 88 C266 62, 326 72, 354 116" fill="none" stroke="#38BDF8" stroke-width="9" stroke-linecap="round" opacity="0.88"/>
      <ellipse cx="78" cy="214" rx="40" ry="24" fill="#F472B6" opacity="0.48"/>
      <ellipse cx="322" cy="214" rx="40" ry="24" fill="#A855F7" opacity="0.45"/>
      <path d="M78 226 C78 226 62 214 62 204 C62 198 68 194 73 196 C76 197 77 199 78 201 C79 199 80 197 83 196 C88 194 94 198 94 204 C94 214 78 226 78 226 Z" fill="#FFFFFF" opacity="0.92"/>
      <path d="M322 226 C322 226 306 214 306 204 C306 198 312 194 317 196 C320 197 321 199 322 201 C323 199 324 197 327 196 C332 194 338 198 338 204 C338 214 322 226 322 226 Z" fill="#FFFFFF" opacity="0.92"/>
      <circle cx="152" cy="64" r="5" fill="#38BDF8"/>
      <circle cx="248" cy="64" r="5" fill="#FF5CA8"/>
    </svg>`,
  },
  {
    id: 'mermaid_scales',
    name: 'Морская волна',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#CFFAFE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M40 120 Q80 84 128 102 Q156 112 174 96" fill="none" stroke="#06B6D4" stroke-width="10" stroke-linecap="round" opacity="0.86"/>
      <path d="M360 120 Q320 84 272 102 Q244 112 226 96" fill="none" stroke="#06B6D4" stroke-width="10" stroke-linecap="round" opacity="0.86"/>
      <path d="M46 138 Q86 106 132 120" fill="none" stroke="#38BDF8" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
      <path d="M354 138 Q314 106 268 120" fill="none" stroke="#38BDF8" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
      <g fill="#22D3EE" opacity="0.72" stroke="#FFFFFF" stroke-width="2">
        <circle cx="66" cy="206" r="14"/>
        <circle cx="90" cy="218" r="14"/>
        <circle cx="114" cy="206" r="14"/>
        <circle cx="334" cy="206" r="14"/>
        <circle cx="310" cy="218" r="14"/>
        <circle cx="286" cy="206" r="14"/>
      </g>
      <circle cx="200" cy="70" r="12" fill="#FFFFFF" stroke="#06B6D4" stroke-width="3.5"/>
      <circle cx="172" cy="76" r="6" fill="#A855F7"/>
      <circle cx="228" cy="76" r="6" fill="#A855F7"/>
    </svg>`,
  },
  {
    id: 'fox_aqua',
    name: 'Лисичка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFEDD5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M44 128 C58 84, 114 78, 162 112 C122 108, 86 120, 48 150 Z" fill="#FF7A1A" opacity="0.9"/>
      <path d="M356 128 C342 84, 286 78, 238 112 C278 108, 314 120, 352 150 Z" fill="#FF7A1A" opacity="0.9"/>
      <ellipse cx="78" cy="206" rx="46" ry="28" fill="#FF7A1A" opacity="0.62"/>
      <ellipse cx="322" cy="206" rx="46" ry="28" fill="#FF7A1A" opacity="0.62"/>
      <ellipse cx="86" cy="222" rx="34" ry="18" fill="#FFFFFF" opacity="0.72"/>
      <ellipse cx="314" cy="222" rx="34" ry="18" fill="#FFFFFF" opacity="0.72"/>
      <polygon points="186,174 214,174 200,196" fill="#1E293B"/>
      <path d="M188 76 L200 44 L212 76 Z" fill="#FF7A1A" stroke="#FFFFFF" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'panda_cute',
    name: 'Панда',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#F1F5F9',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path fill-rule="evenodd" d="M112 104 C148 104, 170 128, 164 158 C158 184, 128 194, 96 184 C68 176, 56 146, 68 122 C78 106, 94 104, 112 104 Z M116 118 A38 30 0 1 0 116 178 A38 30 0 1 0 116 118 Z" fill="#1E293B" opacity="0.88"/>
      <path fill-rule="evenodd" d="M288 104 C252 104, 230 128, 236 158 C242 184, 272 194, 304 184 C332 176, 344 146, 332 122 C322 106, 306 104, 288 104 Z M284 118 A38 30 0 1 0 284 178 A38 30 0 1 0 284 118 Z" fill="#1E293B" opacity="0.88"/>
      <ellipse cx="200" cy="184" rx="16" ry="11" fill="#1E293B"/>
      <ellipse cx="78" cy="218" rx="30" ry="18" fill="#FF5CA8" opacity="0.58"/>
      <ellipse cx="322" cy="218" rx="30" ry="18" fill="#FF5CA8" opacity="0.58"/>
      <ellipse cx="200" cy="64" rx="18" ry="8" fill="#10C97A" stroke="#065F46" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'puppy_spots',
    name: 'Щенок',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF3C7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path fill-rule="evenodd" d="M114 96 C148 92, 174 120, 168 156 C162 186, 126 196, 88 186 C60 176, 52 142, 68 114 C78 100, 96 98, 114 96 Z M116 116 A40 32 0 1 0 116 180 A40 32 0 1 0 116 116 Z" fill="#B45309" opacity="0.86"/>
      <ellipse cx="200" cy="182" rx="18" ry="12" fill="#1E293B"/>
      <ellipse cx="194" cy="179" rx="5" ry="2.5" fill="#FFFFFF" opacity="0.6"/>
      <g fill="#451A03">
        <circle cx="152" cy="204" r="3.5"/>
        <circle cx="138" cy="212" r="3.5"/>
        <circle cx="248" cy="204" r="3.5"/>
        <circle cx="262" cy="212" r="3.5"/>
      </g>
      <rect x="296" y="206" width="38" height="14" rx="7" fill="#FFFFFF" stroke="#B45309" stroke-width="3"/>
      <circle cx="294" cy="206" r="7" fill="#FFFFFF" stroke="#B45309" stroke-width="2.5"/>
      <circle cx="294" cy="220" r="7" fill="#FFFFFF" stroke="#B45309" stroke-width="2.5"/>
      <circle cx="336" cy="206" r="7" fill="#FFFFFF" stroke="#B45309" stroke-width="2.5"/>
      <circle cx="336" cy="220" r="7" fill="#FFFFFF" stroke="#B45309" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'owl_mask',
    name: 'Совушка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#EDE9FE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path fill-rule="evenodd" d="M52 104 L96 72 L162 110 L200 132 L238 110 L304 72 L348 104 C368 148, 352 192, 300 198 C256 202, 224 186, 200 162 C176 186, 144 202, 100 198 C48 192, 32 148, 52 104 Z M116 114 A44 34 0 1 0 116 182 A44 34 0 1 0 116 114 Z M284 114 A44 34 0 1 0 284 182 A44 34 0 1 0 284 114 Z" fill="#8B5CF6" opacity="0.86" stroke="#5B21B6" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="186,162 214,162 200,192" fill="#FF9F1C" stroke="#B45309" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="76" cy="96" r="6" fill="#FFD13B"/>
      <circle cx="324" cy="96" r="6" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'frog_mask',
    name: 'Лягушонок',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#DCFCE7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M56 120 C76 80, 140 80, 168 112" fill="none" stroke="#10C97A" stroke-width="12" stroke-linecap="round" opacity="0.88"/>
      <path d="M344 120 C324 80, 260 80, 232 112" fill="none" stroke="#10C97A" stroke-width="12" stroke-linecap="round" opacity="0.88"/>
      <ellipse cx="82" cy="212" rx="40" ry="24" fill="#FB7185" opacity="0.58"/>
      <ellipse cx="318" cy="212" rx="40" ry="24" fill="#FB7185" opacity="0.58"/>
      <path d="M180 68 C180 48, 220 48, 220 68 C220 82, 200 92, 200 92 C200 92, 180 82, 180 68 Z" fill="#FF5CA8" stroke="#FFFFFF" stroke-width="2.5"/>
      <circle cx="62" cy="204" r="14" fill="#22C55E" opacity="0.72"/>
      <circle cx="338" cy="204" r="14" fill="#22C55E" opacity="0.72"/>
    </svg>`,
  },
  {
    id: 'ladybug_mask',
    name: 'Божья коровка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEE2E2',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M50 118 C78 88, 134 90, 166 114" fill="none" stroke="#FF3B5C" stroke-width="11" stroke-linecap="round" opacity="0.88"/>
      <path d="M350 118 C322 88, 266 90, 234 114" fill="none" stroke="#FF3B5C" stroke-width="11" stroke-linecap="round" opacity="0.88"/>
      <ellipse cx="82" cy="212" rx="42" ry="28" fill="#FF3B5C" opacity="0.65"/>
      <ellipse cx="318" cy="212" rx="42" ry="28" fill="#FF3B5C" opacity="0.65"/>
      <g fill="#1E293B">
        <circle cx="68" cy="202" r="7"/>
        <circle cx="94" cy="218" r="6"/>
        <circle cx="72" cy="226" r="5"/>
        <circle cx="332" cy="202" r="7"/>
        <circle cx="306" cy="218" r="6"/>
        <circle cx="328" cy="226" r="5"/>
        <circle cx="200" cy="76" r="12"/>
      </g>
      <path d="M194 64 Q180 40 166 44 M206 64 Q220 40 234 44" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'bee_mask',
    name: 'Пчёлка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF9C3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <ellipse cx="86" cy="210" rx="40" ry="28" fill="#FFD13B" opacity="0.78" stroke="#78350F" stroke-width="3"/>
      <ellipse cx="314" cy="210" rx="40" ry="28" fill="#FFD13B" opacity="0.78" stroke="#78350F" stroke-width="3"/>
      <path d="M72 184 L72 236 M94 184 L94 236 M306 184 L306 236 M328 184 L328 236" stroke="#1E293B" stroke-width="6"/>
      <ellipse cx="64" cy="116" rx="28" ry="18" transform="rotate(-24 64 116)" fill="#E0F2FE" fill-opacity="0.85" stroke="#38BDF8" stroke-width="3"/>
      <ellipse cx="336" cy="116" rx="28" ry="18" transform="rotate(24 336 116)" fill="#E0F2FE" fill-opacity="0.85" stroke="#38BDF8" stroke-width="3"/>
      <circle cx="200" cy="68" r="14" fill="#FFD13B" stroke="#78350F" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'dolphin_sea',
    name: 'Дельфины',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0F2FE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M36 128 C64 76, 134 74, 164 114" fill="none" stroke="#38BDF8" stroke-width="11" stroke-linecap="round" opacity="0.85"/>
      <path d="M364 128 C336 76, 266 74, 236 114" fill="none" stroke="#38BDF8" stroke-width="11" stroke-linecap="round" opacity="0.85"/>
      <path d="M56 226 C56 196, 98 188, 114 214 C96 212, 82 220, 74 236 Z" fill="#2563EB" opacity="0.85"/>
      <path d="M344 226 C344 196, 302 188, 286 214 C304 212, 318 220, 326 236 Z" fill="#2563EB" opacity="0.85"/>
      <circle cx="104" cy="192" r="5" fill="#BAE6FD"/>
      <circle cx="296" cy="192" r="5" fill="#BAE6FD"/>
      <circle cx="200" cy="70" r="8" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'ice_princess',
    name: 'Снежинка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#EFF6FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M132 82 Q166 56 200 38 Q234 56 268 82" fill="none" stroke="#60A5FA" stroke-width="6" stroke-linecap="round"/>
      <polygon points="200,26 214,50 200,74 186,50" fill="#BAE6FD" stroke="#2563EB" stroke-width="3"/>
      <g stroke="#38BDF8" stroke-width="4" stroke-linecap="round">
        <line x1="74" y1="194" x2="74" y2="234"/>
        <line x1="56" y1="204" x2="92" y2="224"/>
        <line x1="92" y1="204" x2="56" y2="224"/>
        <line x1="326" y1="194" x2="326" y2="234"/>
        <line x1="308" y1="204" x2="344" y2="224"/>
        <line x1="344" y1="204" x2="308" y2="224"/>
      </g>
      <path d="M50 124 C74 96, 128 92, 162 112" fill="none" stroke="#93C5FD" stroke-width="8" stroke-linecap="round"/>
      <path d="M350 124 C326 96, 272 92, 238 112" fill="none" stroke="#93C5FD" stroke-width="8" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'sunshine_aqua',
    name: 'Солнышко',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF3C7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <circle cx="200" cy="68" r="22" fill="#FFD13B" stroke="#F59E0B" stroke-width="3"/>
      <g stroke="#FF9F1C" stroke-width="5" stroke-linecap="round">
        <line x1="200" y1="24" x2="200" y2="38"/>
        <line x1="166" y1="38" x2="176" y2="48"/>
        <line x1="234" y1="38" x2="224" y2="48"/>
        <line x1="58" y1="126" x2="86" y2="118"/>
        <line x1="68" y1="98" x2="94" y2="104"/>
        <line x1="342" y1="126" x2="314" y2="118"/>
        <line x1="332" y1="98" x2="306" y2="104"/>
      </g>
      <ellipse cx="82" cy="212" rx="40" ry="24" fill="#FFD13B" opacity="0.58"/>
      <ellipse cx="318" cy="212" rx="40" ry="24" fill="#FFD13B" opacity="0.58"/>
    </svg>`,
  },
  {
    id: 'strawberry_aqua',
    name: 'Клубничка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFE4E6',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M78 238 C56 226 48 198 56 184 C64 172 92 172 100 184 C108 198 100 226 78 238 Z" fill="#FF3B5C" stroke="#FFFFFF" stroke-width="2.5"/>
      <path d="M322 238 C300 226 292 198 300 184 C308 172 336 172 344 184 C352 198 344 226 322 238 Z" fill="#FF3B5C" stroke="#FFFFFF" stroke-width="2.5"/>
      <ellipse cx="78" cy="178" rx="16" ry="7" fill="#10C97A"/>
      <ellipse cx="322" cy="178" rx="16" ry="7" fill="#10C97A"/>
      <path d="M56 122 Q108 82 162 114" fill="none" stroke="#10C97A" stroke-width="7" stroke-linecap="round"/>
      <path d="M344 122 Q292 82 238 114" fill="none" stroke="#10C97A" stroke-width="7" stroke-linecap="round"/>
      <circle cx="200" cy="68" r="10" fill="#FF3B5C" stroke="#FFFFFF" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'cherry_blossom',
    name: 'Сакура',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FCE7F3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M46 116 Q104 82 156 106" fill="none" stroke="#9D174D" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M354 116 Q296 82 244 106" fill="none" stroke="#9D174D" stroke-width="4.5" stroke-linecap="round"/>
      <g fill="#FBCFE8" stroke="#F472B6" stroke-width="2">
        <circle cx="72" cy="100" r="14"/><circle cx="328" cy="100" r="14"/>
        <circle cx="80" cy="212" r="16"/><circle cx="320" cy="212" r="16"/>
        <circle cx="200" cy="68" r="13"/>
      </g>
      <g fill="#FFD13B">
        <circle cx="72" cy="100" r="5"/><circle cx="328" cy="100" r="5"/>
        <circle cx="80" cy="212" r="5"/><circle cx="320" cy="212" r="5"/>
        <circle cx="200" cy="68" r="4"/>
      </g>
    </svg>`,
  },
  {
    id: 'watermelon_aqua',
    name: 'Арбузик',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#DCFCE7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M44 206 A38 38 0 0 0 116 206 Z" fill="#10C97A" stroke="#065F46" stroke-width="3"/>
      <path d="M52 206 A30 30 0 0 0 108 206 Z" fill="#FF3B5C"/>
      <path d="M284 206 A38 38 0 0 0 356 206 Z" fill="#10C97A" stroke="#065F46" stroke-width="3"/>
      <path d="M292 206 A30 30 0 0 0 348 206 Z" fill="#FF3B5C"/>
      <path d="M52 122 C86 84, 134 88, 166 112" fill="none" stroke="#10C97A" stroke-width="9" stroke-linecap="round"/>
      <path d="M348 122 C314 84, 266 88, 234 112" fill="none" stroke="#10C97A" stroke-width="9" stroke-linecap="round"/>
      <circle cx="72" cy="216" r="2.5" fill="#1E293B"/>
      <circle cx="88" cy="218" r="2.5" fill="#1E293B"/>
      <circle cx="312" cy="216" r="2.5" fill="#1E293B"/>
      <circle cx="328" cy="218" r="2.5" fill="#1E293B"/>
    </svg>`,
  },
  {
    id: 'dino_mask',
    name: 'Динозаврик',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#DCFCE7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <polygon points="172,78 184,38 196,78" fill="#10C97A" stroke="#065F46" stroke-width="3"/>
      <polygon points="196,78 210,32 224,78" fill="#FFD13B" stroke="#D97706" stroke-width="3"/>
      <path d="M44 126 C64 82, 128 82, 164 114" fill="none" stroke="#22C55E" stroke-width="11" stroke-linecap="round"/>
      <path d="M356 126 C336 82, 272 82, 236 114" fill="none" stroke="#22C55E" stroke-width="11" stroke-linecap="round"/>
      <circle cx="78" cy="214" r="14" fill="#10C97A" opacity="0.8"/>
      <circle cx="66" cy="196" r="5" fill="#10C97A"/>
      <circle cx="78" cy="192" r="5" fill="#10C97A"/>
      <circle cx="90" cy="196" r="5" fill="#10C97A"/>
      <circle cx="322" cy="214" r="14" fill="#10C97A" opacity="0.8"/>
      <circle cx="310" cy="196" r="5" fill="#10C97A"/>
      <circle cx="322" cy="192" r="5" fill="#10C97A"/>
      <circle cx="334" cy="196" r="5" fill="#10C97A"/>
    </svg>`,
  },
  {
    id: 'pirate_aqua',
    name: 'Пират',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#F1F5F9',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <line x1="46" y1="106" x2="346" y2="162" stroke="#1E293B" stroke-width="8" stroke-linecap="round"/>
      <path d="M74 112 C94 102, 148 102, 162 126 C166 164, 140 184, 114 182 C82 180, 64 148, 74 112 Z" fill="#1E293B" stroke="#FFD13B" stroke-width="4"/>
      <path d="M116 128 L121 139 L133 141 L124 149 L126 161 L116 155 L106 161 L108 149 L99 141 L111 139 Z" fill="#FFD13B"/>
      <path d="M312 196 L312 228 M302 206 L322 206 M298 220 Q312 236 326 220" fill="none" stroke="#2563EB" stroke-width="4.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'astronaut_aqua',
    name: 'Космонавт',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0E7FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M44 106 Q200 44 356 106" fill="none" stroke="#38BDF8" stroke-width="9" stroke-linecap="round" opacity="0.82"/>
      <ellipse cx="78" cy="212" rx="34" ry="20" fill="#6366F1" opacity="0.5"/>
      <ellipse cx="322" cy="212" rx="34" ry="20" fill="#6366F1" opacity="0.5"/>
      <circle cx="78" cy="212" r="12" fill="#A855F7" stroke="#FFFFFF" stroke-width="2"/>
      <ellipse cx="78" cy="212" rx="22" ry="6" transform="rotate(-18 78 212)" fill="none" stroke="#FFD13B" stroke-width="3.5"/>
      <path d="M322 190 L332 214 L312 214 Z" fill="#FF3B5C" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="200" cy="54" r="7" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'robot_aqua',
    name: 'Робот',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0F2FE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path fill-rule="evenodd" d="M46 104 L172 104 L172 190 L46 190 Z M112 118 A38 28 0 1 0 112 174 A38 28 0 1 0 112 118 Z" fill="#38BDF8" opacity="0.72" stroke="#0369A1" stroke-width="4" stroke-linejoin="round"/>
      <path fill-rule="evenodd" d="M228 104 L354 104 L354 190 L228 190 Z M288 118 A38 28 0 1 0 288 174 A38 28 0 1 0 288 118 Z" fill="#38BDF8" opacity="0.72" stroke="#0369A1" stroke-width="4" stroke-linejoin="round"/>
      <line x1="172" y1="146" x2="228" y2="146" stroke="#0369A1" stroke-width="6"/>
      <circle cx="78" cy="216" r="14" fill="none" stroke="#F59E0B" stroke-width="6" stroke-dasharray="6 4"/>
      <circle cx="322" cy="216" r="14" fill="none" stroke="#F59E0B" stroke-width="6" stroke-dasharray="6 4"/>
      <rect x="184" y="48" width="32" height="16" rx="8" fill="#FFD13B" stroke="#0369A1" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'bat_cute',
    name: 'Ночная фея',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#EDE9FE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path fill-rule="evenodd" d="M28 122 L66 78 L112 102 L166 98 L200 120 L234 98 L288 102 L334 78 L372 122 L344 176 L282 184 L200 156 L118 184 L56 176 Z M116 114 A42 32 0 1 0 116 178 A42 32 0 1 0 116 114 Z M284 114 A42 32 0 1 0 284 178 A42 32 0 1 0 284 114 Z" fill="#7C3AED" opacity="0.86" stroke="#4C1D95" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="80" cy="214" r="6" fill="#FFD13B"/>
      <circle cx="320" cy="214" r="6" fill="#FFD13B"/>
      <circle cx="200" cy="64" r="8" fill="#FDE047"/>
    </svg>`,
  },
  {
    id: 'clown_happy',
    name: 'Клоун',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF2F2',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <circle cx="200" cy="182" r="24" fill="#FF3B5C" stroke="#9F1239" stroke-width="3.5"/>
      <circle cx="192" cy="174" r="6" fill="#FFFFFF" opacity="0.7"/>
      <ellipse cx="80" cy="214" rx="34" ry="24" fill="#FF5CA8" opacity="0.65"/>
      <ellipse cx="320" cy="214" rx="34" ry="24" fill="#FF5CA8" opacity="0.65"/>
      <path d="M116 86 L124 102 L140 104 L128 114 L131 130 L116 122 L101 130 L104 114 L92 104 L108 102 Z" fill="#FFD13B" opacity="0.9"/>
      <path d="M284 86 L292 102 L308 104 L296 114 L299 130 L284 122 L269 130 L272 114 L260 104 L276 102 Z" fill="#38BDF8" opacity="0.9"/>
    </svg>`,
  },
  {
    id: 'peacock_plume',
    name: 'Павлин',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#CCFBF1',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <ellipse cx="64" cy="108" rx="34" ry="18" transform="rotate(-24 64 108)" fill="#10C97A" opacity="0.86"/>
      <ellipse cx="60" cy="108" rx="18" ry="10" transform="rotate(-24 60 108)" fill="#2563EB"/>
      <circle cx="56" cy="108" r="6" fill="#FFD13B"/>
      <ellipse cx="336" cy="108" rx="34" ry="18" transform="rotate(24 336 108)" fill="#10C97A" opacity="0.86"/>
      <ellipse cx="340" cy="108" rx="18" ry="10" transform="rotate(24 340 108)" fill="#2563EB"/>
      <circle cx="344" cy="108" r="6" fill="#FFD13B"/>
      <path d="M132 88 Q166 56 200 76 Q234 56 268 88" fill="none" stroke="#06B6D4" stroke-width="6" stroke-linecap="round"/>
      <circle cx="200" cy="54" r="9" fill="#06B6D4" stroke="#FFD13B" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'fairy_wings_gold',
    name: 'Золотая фея',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF9C3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M168 100 C124 66, 56 78, 36 126 C26 154, 48 184, 78 190" fill="none" stroke="#F59E0B" stroke-width="7" stroke-linecap="round"/>
      <path d="M232 100 C276 66, 344 78, 364 126 C374 154, 352 184, 322 190" fill="none" stroke="#F59E0B" stroke-width="7" stroke-linecap="round"/>
      <polygon points="200,36 214,60 200,84 186,60" fill="#10C97A" stroke="#F59E0B" stroke-width="3"/>
      <circle cx="76" cy="212" r="8" fill="#FFD13B"/>
      <circle cx="324" cy="212" r="8" fill="#FFD13B"/>
      <circle cx="52" cy="144" r="5" fill="#10C97A"/>
      <circle cx="348" cy="144" r="5" fill="#10C97A"/>
    </svg>`,
  },
  {
    id: 'pink_flamingo',
    name: 'Фламинго',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FCE7F3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M42 126 C64 82, 128 84, 162 114" fill="none" stroke="#FF5CA8" stroke-width="11" stroke-linecap="round"/>
      <path d="M358 126 C336 82, 272 84, 238 114" fill="none" stroke="#FF5CA8" stroke-width="11" stroke-linecap="round"/>
      <ellipse cx="78" cy="212" rx="40" ry="26" fill="#FB7185" opacity="0.62"/>
      <ellipse cx="322" cy="212" rx="40" ry="26" fill="#FB7185" opacity="0.62"/>
      <ellipse cx="56" cy="170" rx="16" ry="7" transform="rotate(-35 56 170)" fill="#10C97A"/>
      <ellipse cx="344" cy="170" rx="16" ry="7" transform="rotate(35 344 170)" fill="#10C97A"/>
      <circle cx="200" cy="68" r="9" fill="#FF5CA8" stroke="#FFFFFF" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'starlight_aqua',
    name: 'Звездопад',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0E7FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M46 112 Q104 72 164 96" fill="none" stroke="#FFD13B" stroke-width="6" stroke-linecap="round" stroke-dasharray="8 8"/>
      <path d="M354 112 Q296 72 236 96" fill="none" stroke="#FFD13B" stroke-width="6" stroke-linecap="round" stroke-dasharray="8 8"/>
      <path d="M78 192 L84 206 L98 208 L88 216 L90 230 L78 222 L66 230 L68 216 L58 208 L72 206 Z" fill="#FFD13B" stroke="#F59E0B" stroke-width="2"/>
      <path d="M322 192 L328 206 L342 208 L332 216 L334 230 L322 222 L310 230 L312 216 L302 208 L316 206 Z" fill="#FFD13B" stroke="#F59E0B" stroke-width="2"/>
      <path d="M200 40 L207 58 L226 60 L211 72 L216 90 L200 80 L184 90 L189 72 L174 60 L193 58 Z" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'candy_pop',
    name: 'Карамелька',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FCE7F3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <circle cx="76" cy="214" r="24" fill="#FF5CA8" stroke="#FFFFFF" stroke-width="3"/>
      <path d="M76 214 C84 214 84 202 74 200 C62 198 58 212 64 222 C72 234 90 232 94 216" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
      <circle cx="324" cy="214" r="24" fill="#38BDF8" stroke="#FFFFFF" stroke-width="3"/>
      <path d="M324 214 C332 214 332 202 322 200 C310 198 306 212 312 222 C320 234 338 232 342 216" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
      <line x1="146" y1="74" x2="158" y2="62" stroke="#FF3B5C" stroke-width="6" stroke-linecap="round"/>
      <line x1="200" y1="62" x2="212" y2="70" stroke="#10C97A" stroke-width="6" stroke-linecap="round"/>
      <line x1="246" y1="66" x2="256" y2="78" stroke="#FFD13B" stroke-width="6" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'neon_lightning',
    name: 'Молния',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF9C3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <polygon points="74,78 44,126 68,126 50,174 96,116 70,116" fill="#FFD13B" stroke="#2563EB" stroke-width="3.5" stroke-linejoin="round"/>
      <polygon points="326,78 356,126 332,126 350,174 304,116 330,116" fill="#FFD13B" stroke="#2563EB" stroke-width="3.5" stroke-linejoin="round"/>
      <polygon points="204,34 186,68 202,68 194,98 220,60 202,60" fill="#FF3B5C" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="80" cy="214" r="7" fill="#38BDF8"/>
      <circle cx="320" cy="214" r="7" fill="#38BDF8"/>
    </svg>`,
  },
  {
    id: 'firebird',
    name: 'Жар-птица',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFEDD5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M40 124 C56 68, 128 64, 166 108" fill="none" stroke="#FF3B5C" stroke-width="11" stroke-linecap="round"/>
      <path d="M52 136 C68 86, 128 84, 158 118" fill="none" stroke="#FF7A1A" stroke-width="9" stroke-linecap="round"/>
      <path d="M64 148 C78 104, 128 102, 152 128" fill="none" stroke="#FFD13B" stroke-width="7" stroke-linecap="round"/>
      <path d="M360 124 C344 68, 272 64, 234 108" fill="none" stroke="#FF3B5C" stroke-width="11" stroke-linecap="round"/>
      <path d="M348 136 C332 86, 272 84, 242 118" fill="none" stroke="#FF7A1A" stroke-width="9" stroke-linecap="round"/>
      <path d="M336 148 C322 104, 272 102, 248 128" fill="none" stroke="#FFD13B" stroke-width="7" stroke-linecap="round"/>
      <circle cx="200" cy="64" r="10" fill="#FFD13B" stroke="#FF3B5C" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'koala_cute',
    name: 'Коала',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#F1F5F9',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <ellipse cx="200" cy="176" rx="18" ry="24" fill="#334155"/>
      <ellipse cx="195" cy="168" rx="5" ry="7" fill="#FFFFFF" opacity="0.45"/>
      <ellipse cx="82" cy="212" rx="38" ry="24" fill="#FB7185" opacity="0.52"/>
      <ellipse cx="318" cy="212" rx="38" ry="24" fill="#FB7185" opacity="0.52"/>
      <path d="M56 122 C74 90, 126 88, 160 112" fill="none" stroke="#94A3B8" stroke-width="10" stroke-linecap="round"/>
      <path d="M344 122 C326 90, 274 88, 240 112" fill="none" stroke="#94A3B8" stroke-width="10" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'lion_king',
    name: 'Львёнок',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFEDD5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M126 76 L152 46 L174 68 L200 34 L226 68 L248 46 L274 76" fill="none" stroke="#FF7A1A" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
      <ellipse cx="80" cy="208" rx="40" ry="26" fill="#FBBF24" opacity="0.55"/>
      <ellipse cx="320" cy="208" rx="40" ry="26" fill="#FBBF24" opacity="0.55"/>
      <polygon points="184,174 216,174 200,196" fill="#9A3412"/>
      <g stroke="#78350F" stroke-width="3.5" stroke-linecap="round">
        <line x1="142" y1="204" x2="72" y2="196"/><line x1="142" y1="216" x2="70" y2="220"/>
        <line x1="258" y1="204" x2="328" y2="196"/><line x1="258" y1="216" x2="330" y2="220"/>
      </g>
    </svg>`,
  },
  {
    id: 'deer_fawn',
    name: 'Оленёнок',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF3C7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M158 92 C146 60, 128 44, 114 38 M142 64 L154 46" fill="none" stroke="#B45309" stroke-width="6" stroke-linecap="round"/>
      <path d="M242 92 C254 60, 272 44, 286 38 M258 64 L246 46" fill="none" stroke="#B45309" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="82" cy="208" rx="42" ry="26" fill="#F59E0B" opacity="0.52"/>
      <ellipse cx="318" cy="208" rx="42" ry="26" fill="#F59E0B" opacity="0.52"/>
      <g fill="#FFFFFF" opacity="0.92">
        <circle cx="64" cy="198" r="5"/><circle cx="84" cy="206" r="4"/><circle cx="72" cy="220" r="4.5"/>
        <circle cx="336" cy="198" r="5"/><circle cx="316" cy="206" r="4"/><circle cx="328" cy="220" r="4.5"/>
      </g>
      <ellipse cx="200" cy="182" rx="14" ry="10" fill="#1E293B"/>
    </svg>`,
  },
  {
    id: 'penguin_aqua',
    name: 'Пингвинчик',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0F2FE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M56 116 C86 82, 134 86, 166 112" fill="none" stroke="#1E293B" stroke-width="11" stroke-linecap="round"/>
      <path d="M344 116 C314 82, 266 86, 234 112" fill="none" stroke="#1E293B" stroke-width="11" stroke-linecap="round"/>
      <polygon points="184,174 216,174 200,202" fill="#FF9F1C" stroke="#B45309" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="78" cy="214" rx="34" ry="20" fill="#FF5CA8" opacity="0.52"/>
      <ellipse cx="322" cy="214" rx="34" ry="20" fill="#FF5CA8" opacity="0.52"/>
      <circle cx="200" cy="64" r="9" fill="#38BDF8"/>
    </svg>`,
  },
  {
    id: 'crab_beach',
    name: 'Крабик',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFE4E6',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <circle cx="78" cy="212" r="22" fill="#FF3B5C" opacity="0.72"/>
      <circle cx="322" cy="212" r="22" fill="#FF3B5C" opacity="0.72"/>
      <path d="M138 72 C122 50, 146 36, 160 54 C146 56, 146 66, 158 68" fill="none" stroke="#FF3B5C" stroke-width="8" stroke-linecap="round"/>
      <path d="M262 72 C278 50, 254 36, 240 54 C254 56, 254 66, 242 68" fill="none" stroke="#FF3B5C" stroke-width="8" stroke-linecap="round"/>
      <circle cx="100" cy="112" r="7" fill="#38BDF8" opacity="0.7"/>
      <circle cx="300" cy="112" r="7" fill="#38BDF8" opacity="0.7"/>
    </svg>`,
  },
  {
    id: 'butterfly_sunset',
    name: 'Монарх',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFEDD5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M174 128 C162 84, 108 42, 42 36 C16 42, 12 88, 34 114 C16 130, 18 164, 46 176 C36 206, 56 244, 102 246 C134 246, 152 214, 148 192 C110 202, 68 184, 66 146 C64 112, 106 88, 152 110 Z" fill="#FF7A1A" fill-opacity="0.86" stroke="#1E293B" stroke-width="4"/>
      <path d="M226 128 C238 84, 292 42, 358 36 C384 42, 388 88, 366 114 C384 130, 382 164, 354 176 C364 206, 344 244, 298 246 C266 246, 248 214, 252 192 C290 202, 332 184, 334 146 C336 112, 294 88, 248 110 Z" fill="#FF7A1A" fill-opacity="0.86" stroke="#1E293B" stroke-width="4"/>
      <circle cx="54" cy="64" r="5" fill="#FFFFFF"/>
      <circle cx="346" cy="64" r="5" fill="#FFFFFF"/>
      <circle cx="200" cy="86" r="10" fill="#FFD13B" stroke="#1E293B" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'butterfly_emerald',
    name: 'Изумруд',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#D1FAE5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M174 128 C162 84, 108 42, 42 36 C16 42, 12 88, 34 114 C16 130, 18 164, 46 176 C36 206, 56 244, 102 246 C134 246, 152 214, 148 192 C110 202, 68 184, 66 146 C64 112, 106 88, 152 110 Z" fill="#10C97A" fill-opacity="0.84" stroke="#065F46" stroke-width="4"/>
      <path d="M226 128 C238 84, 292 42, 358 36 C384 42, 388 88, 366 114 C384 130, 382 164, 354 176 C364 206, 344 244, 298 246 C266 246, 248 214, 252 192 C290 202, 332 184, 334 146 C336 112, 294 88, 248 110 Z" fill="#10C97A" fill-opacity="0.84" stroke="#065F46" stroke-width="4"/>
      <circle cx="72" cy="70" r="6" fill="#FFFFFF"/>
      <circle cx="328" cy="70" r="6" fill="#FFFFFF"/>
      <circle cx="200" cy="86" r="10" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'elf_forest',
    name: 'Лесной эльф',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#ECFCCB',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M46 132 Q104 72 174 102" fill="none" stroke="#15803D" stroke-width="6" stroke-linecap="round"/>
      <path d="M354 132 Q296 72 226 102" fill="none" stroke="#15803D" stroke-width="6" stroke-linecap="round"/>
      <g fill="#4ADE80" stroke="#15803D" stroke-width="2">
        <ellipse cx="78" cy="100" rx="16" ry="7" transform="rotate(-24 78 100)"/>
        <ellipse cx="122" cy="86" rx="16" ry="7" transform="rotate(-12 122 86)"/>
        <ellipse cx="322" cy="100" rx="16" ry="7" transform="rotate(24 322 100)"/>
        <ellipse cx="278" cy="86" rx="16" ry="7" transform="rotate(12 278 86)"/>
      </g>
      <circle cx="200" cy="64" r="9" fill="#FFD13B" stroke="#15803D" stroke-width="2.5"/>
      <circle cx="78" cy="212" r="6" fill="#4ADE80"/>
      <circle cx="322" cy="212" r="6" fill="#4ADE80"/>
    </svg>`,
  },
  {
    id: 'alien_cute',
    name: 'Инопланетянин',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#ECFCCB',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <line x1="164" y1="88" x2="146" y2="38" stroke="#22C55E" stroke-width="6" stroke-linecap="round"/>
      <line x1="236" y1="88" x2="254" y2="38" stroke="#22C55E" stroke-width="6" stroke-linecap="round"/>
      <circle cx="146" cy="36" r="10" fill="#4ADE80" stroke="#15803D" stroke-width="3"/>
      <circle cx="254" cy="36" r="10" fill="#4ADE80" stroke="#15803D" stroke-width="3"/>
      <ellipse cx="78" cy="214" rx="34" ry="20" fill="#4ADE80" opacity="0.62"/>
      <ellipse cx="322" cy="214" rx="34" ry="20" fill="#4ADE80" opacity="0.62"/>
      <ellipse cx="78" cy="214" rx="22" ry="8" fill="#8B5CF6"/>
      <ellipse cx="322" cy="214" rx="22" ry="8" fill="#8B5CF6"/>
    </svg>`,
  },
  {
    id: 'knight_crown',
    name: 'Рыцарь',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E2E8F0',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M132 82 L144 38 L174 60 L200 28 L226 60 L256 38 L268 82 Z" fill="#94A3B8" stroke="#334155" stroke-width="4" stroke-linejoin="round"/>
      <path d="M46 116 L94 92 L162 114" fill="none" stroke="#2563EB" stroke-width="9" stroke-linecap="round"/>
      <path d="M354 116 L306 92 L238 114" fill="none" stroke="#2563EB" stroke-width="9" stroke-linecap="round"/>
      <polygon points="78,196 96,196 96,216 78,232 60,216 60,196" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5"/>
      <polygon points="322,196 340,196 340,216 322,232 304,216 304,196" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'cupcake_sweet',
    name: 'Сластёна',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FCE7F3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M58 214 L98 214 L92 238 L64 238 Z" fill="#FBBF24"/>
      <path d="M54 214 C52 198 68 190 78 190 C88 190 104 198 102 214 Z" fill="#FF5CA8"/>
      <circle cx="78" cy="184" r="5" fill="#FF3B5C"/>
      <path d="M302 214 L342 214 L336 238 L308 238 Z" fill="#FBBF24"/>
      <path d="M298 214 C296 198 312 190 322 190 C332 190 348 198 346 214 Z" fill="#38BDF8"/>
      <circle cx="322" cy="184" r="5" fill="#FF3B5C"/>
      <circle cx="152" cy="70" r="5" fill="#FF5CA8"/><circle cx="200" cy="60" r="6" fill="#FFD13B"/><circle cx="248" cy="70" r="5" fill="#38BDF8"/>
    </svg>`,
  },
  {
    id: 'heart_queen',
    name: 'Сердечки',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFE4E6',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M200 76 C200 76 176 58 176 44 C176 35 184 30 191 32 C196 33 198 36 200 40 C202 36 204 33 209 32 C216 30 224 35 224 44 C224 58 200 76 200 76 Z" fill="#FF3B5C" stroke="#FFFFFF" stroke-width="2.5"/>
      <path d="M78 232 C78 232 54 214 54 200 C54 191 62 186 69 188 C74 189 76 192 78 196 C80 192 82 189 87 188 C94 186 102 191 102 200 C102 214 78 232 78 232 Z" fill="#FF5CA8"/>
      <path d="M322 232 C322 232 298 214 298 200 C298 191 306 186 313 188 C318 189 320 192 322 196 C324 192 326 189 331 188 C338 186 346 191 346 200 C346 214 322 232 322 232 Z" fill="#FF5CA8"/>
      <circle cx="64" cy="112" r="7" fill="#FF3B5C"/><circle cx="336" cy="112" r="7" fill="#FF3B5C"/>
    </svg>`,
  },
  {
    id: 'ocean_shell',
    name: 'Жемчужина',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#CFFAFE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M200 84 L170 50 A34 34 0 0 1 230 50 Z" fill="#38BDF8" stroke="#FFFFFF" stroke-width="3"/>
      <path d="M78 228 L56 204 A24 24 0 0 1 100 204 Z" fill="#A855F7" stroke="#FFFFFF" stroke-width="2.5"/>
      <path d="M322 228 L300 204 A24 24 0 0 1 344 204 Z" fill="#A855F7" stroke="#FFFFFF" stroke-width="2.5"/>
      <g fill="#FFFFFF" stroke="#BAE6FD" stroke-width="2">
        <circle cx="144" cy="82" r="5"/><circle cx="164" cy="76" r="5"/>
        <circle cx="236" cy="76" r="5"/><circle cx="256" cy="82" r="5"/>
      </g>
    </svg>`,
  },
  {
    id: 'autumn_leaves',
    name: 'Листопад',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFEDD5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <g fill="#FF7A1A" stroke="#9A3412" stroke-width="2.5">
        <ellipse cx="64" cy="108" rx="18" ry="9" transform="rotate(-32 64 108)"/>
        <ellipse cx="336" cy="108" rx="18" ry="9" transform="rotate(32 336 108)"/>
        <ellipse cx="78" cy="214" rx="18" ry="9" transform="rotate(24 78 214)" fill="#FFD13B"/>
        <ellipse cx="322" cy="214" rx="18" ry="9" transform="rotate(-24 322 214)" fill="#FFD13B"/>
      </g>
      <circle cx="200" cy="64" r="9" fill="#FF3B5C"/>
    </svg>`,
  },
  {
    id: 'spring_tulips',
    name: 'Тюльпаны',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#DCFCE7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M62 214 C62 192, 94 192, 94 214 Q78 232 62 214 Z" fill="#FF3B5C"/>
      <line x1="78" y1="224" x2="78" y2="246" stroke="#15803D" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M306 214 C306 192, 338 192, 338 214 Q322 232 306 214 Z" fill="#FF3B5C"/>
      <line x1="322" y1="224" x2="322" y2="246" stroke="#15803D" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M186 68 C186 48, 214 48, 214 68 Q200 84 186 68 Z" fill="#FFD13B"/>
      <ellipse cx="64" cy="112" rx="14" ry="7" transform="rotate(-24 64 112)" fill="#22C55E"/>
      <ellipse cx="336" cy="112" rx="14" ry="7" transform="rotate(24 336 112)" fill="#22C55E"/>
    </svg>`,
  },
  {
    id: 'music_disco',
    name: 'Диско',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#F3E8FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M64 228 L64 198 L92 190 L92 220" fill="none" stroke="#8B5CF6" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="58" cy="230" r="7" fill="#FF5CA8"/>
      <circle cx="86" cy="222" r="7" fill="#FF5CA8"/>
      <path d="M310 228 L310 198 L338 190 L338 220" fill="none" stroke="#06B6D4" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="304" cy="230" r="7" fill="#FFD13B"/>
      <circle cx="332" cy="222" r="7" fill="#FFD13B"/>
      <circle cx="200" cy="60" r="16" fill="#CBD5E1" stroke="#475569" stroke-width="3"/>
      <line x1="186" y1="60" x2="214" y2="60" stroke="#475569" stroke-width="2"/>
      <line x1="200" y1="46" x2="200" y2="74" stroke="#475569" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'racing_car',
    name: 'Гонщик',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEE2E2',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M36 120 L146 98 M44 134 L142 114" stroke="#FF3B5C" stroke-width="9" stroke-linecap="round"/>
      <path d="M364 120 L254 98 M356 134 L258 114" stroke="#FF3B5C" stroke-width="9" stroke-linecap="round"/>
      <g fill="#1E293B">
        <rect x="60" y="200" width="12" height="12"/><rect x="84" y="200" width="12" height="12"/>
        <rect x="72" y="212" width="12" height="12"/>
        <rect x="304" y="200" width="12" height="12"/><rect x="328" y="200" width="12" height="12"/>
        <rect x="316" y="212" width="12" height="12"/>
      </g>
      <circle cx="200" cy="64" r="14" fill="#FFD13B" stroke="#1E293B" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'bee_honey',
    name: 'Соты',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF3C7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <g fill="#FFD13B" fill-opacity="0.78" stroke="#D97706" stroke-width="3">
        <polygon points="74,190 90,199 90,217 74,226 58,217 58,199"/>
        <polygon points="104,207 120,216 120,234 104,243 88,234 88,216"/>
        <polygon points="326,190 342,199 342,217 326,226 310,217 310,199"/>
        <polygon points="296,207 312,216 312,234 296,243 280,234 280,216"/>
      </g>
      <circle cx="200" cy="66" r="10" fill="#FF9F1C"/>
    </svg>`,
  },
  {
    id: 'wizard_stars',
    name: 'Звездочёт',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0E7FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M56 122 C74 78, 128 78, 162 108" fill="none" stroke="#4F46E5" stroke-width="8" stroke-linecap="round"/>
      <path d="M344 122 C326 78, 272 78, 238 108" fill="none" stroke="#4F46E5" stroke-width="8" stroke-linecap="round"/>
      <path d="M210 38 C186 40 172 60 176 80 C180 96 200 102 220 92 C200 90 190 72 196 56 Z" fill="#FDE047"/>
      <circle cx="78" cy="212" r="8" fill="#FFD13B"/>
      <circle cx="322" cy="212" r="8" fill="#FFD13B"/>
      <circle cx="98" cy="226" r="4" fill="#38BDF8"/>
      <circle cx="302" cy="226" r="4" fill="#38BDF8"/>
    </svg>`,
  },
  {
    id: 'giraffe_spots',
    name: 'Жирафик',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF3C7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <line x1="168" y1="84" x2="156" y2="46" stroke="#D97706" stroke-width="7" stroke-linecap="round"/>
      <line x1="232" y1="84" x2="244" y2="46" stroke="#D97706" stroke-width="7" stroke-linecap="round"/>
      <circle cx="156" cy="44" r="9" fill="#92400E"/>
      <circle cx="244" cy="44" r="9" fill="#92400E"/>
      <g fill="#B45309" opacity="0.72">
        <ellipse cx="64" cy="202" rx="14" ry="10"/><ellipse cx="92" cy="218" rx="12" ry="9"/><ellipse cx="70" cy="228" rx="9" ry="7"/>
        <ellipse cx="336" cy="202" rx="14" ry="10"/><ellipse cx="308" cy="218" rx="12" ry="9"/><ellipse cx="330" cy="228" rx="9" ry="7"/>
      </g>
    </svg>`,
  },
  {
    id: 'zebra_stripes',
    name: 'Зебра-радуга',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#F1F5F9',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <g stroke-width="8" stroke-linecap="round" opacity="0.86">
        <line x1="42" y1="104" x2="90" y2="118" stroke="#8B5CF6"/>
        <line x1="36" y1="126" x2="88" y2="136" stroke="#FF5CA8"/>
        <line x1="358" y1="104" x2="310" y2="118" stroke="#8B5CF6"/>
        <line x1="364" y1="126" x2="312" y2="136" stroke="#FF5CA8"/>
        <line x1="46" y1="198" x2="96" y2="208" stroke="#38BDF8"/>
        <line x1="52" y1="220" x2="100" y2="226" stroke="#10C97A"/>
        <line x1="354" y1="198" x2="304" y2="208" stroke="#38BDF8"/>
        <line x1="348" y1="220" x2="300" y2="226" stroke="#10C97A"/>
      </g>
    </svg>`,
  },
  {
    id: 'confetti_party',
    name: 'Карнавал',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF9C3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M52 106 Q72 86 92 106 Q112 126 132 106" fill="none" stroke="#FF3B5C" stroke-width="6" stroke-linecap="round"/>
      <path d="M348 106 Q328 86 308 106 Q288 126 268 106" fill="none" stroke="#38BDF8" stroke-width="6" stroke-linecap="round"/>
      <circle cx="66" cy="204" r="7" fill="#FF3B5C"/><circle cx="90" cy="222" r="6" fill="#FFD13B"/>
      <circle cx="106" cy="198" r="5" fill="#10C97A"/><circle cx="334" cy="204" r="7" fill="#8B5CF6"/>
      <circle cx="310" cy="222" r="6" fill="#FFD13B"/><circle cx="294" cy="198" r="5" fill="#FF5CA8"/>
      <polygon points="190,66 200,44 210,66" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'cherry_sweet',
    name: 'Вишенки',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFE4E6',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M64 218 Q76 186 90 180 Q96 198 94 218" fill="none" stroke="#15803D" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="62" cy="222" r="13" fill="#FF3B5C" stroke="#9F1239" stroke-width="2.5"/>
      <circle cx="94" cy="222" r="13" fill="#FF3B5C" stroke="#9F1239" stroke-width="2.5"/>
      <path d="M306 218 Q318 186 332 180 Q338 198 336 218" fill="none" stroke="#15803D" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="304" cy="222" r="13" fill="#FF3B5C" stroke="#9F1239" stroke-width="2.5"/>
      <circle cx="336" cy="222" r="13" fill="#FF3B5C" stroke="#9F1239" stroke-width="2.5"/>
      <circle cx="200" cy="64" r="9" fill="#FF3B5C"/>
    </svg>`,
  },
  {
    id: 'bunny_spring',
    name: 'Кролик',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FCE7F3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <ellipse cx="164" cy="54" rx="14" ry="30" transform="rotate(-12 164 54)" fill="#FFFFFF" stroke="#F472B6" stroke-width="3"/>
      <ellipse cx="236" cy="54" rx="14" ry="30" transform="rotate(12 236 54)" fill="#FFFFFF" stroke="#F472B6" stroke-width="3"/>
      <ellipse cx="80" cy="212" rx="40" ry="24" fill="#FBCFE8" opacity="0.72"/>
      <ellipse cx="320" cy="212" rx="40" ry="24" fill="#FBCFE8" opacity="0.72"/>
      <polygon points="188,176 212,176 200,192" fill="#FF5CA8"/>
    </svg>`,
  },
  {
    id: 'cloud_rainbow',
    name: 'Облачка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0F2FE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <g fill="#FFFFFF" stroke="#38BDF8" stroke-width="3">
        <circle cx="62" cy="214" r="16"/><circle cx="82" cy="206" r="18"/><circle cx="102" cy="214" r="15"/>
        <circle cx="298" cy="214" r="15"/><circle cx="318" cy="206" r="18"/><circle cx="338" cy="214" r="16"/>
      </g>
      <path d="M142 74 A58 58 0 0 1 258 74" fill="none" stroke="#FF5CA8" stroke-width="8" stroke-linecap="round"/>
      <path d="M154 74 A46 46 0 0 1 246 74" fill="none" stroke="#FFD13B" stroke-width="8" stroke-linecap="round"/>
      <path d="M166 74 A34 34 0 0 1 234 74" fill="none" stroke="#38BDF8" stroke-width="8" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'diamond_glam',
    name: 'Кристаллы',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#EFF6FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <polygon points="200,34 218,58 200,82 182,58" fill="#38BDF8" stroke="#FFFFFF" stroke-width="3"/>
      <polygon points="78,194 94,212 78,230 62,212" fill="#A855F7" stroke="#FFFFFF" stroke-width="2.5"/>
      <polygon points="322,194 338,212 322,230 306,212" fill="#A855F7" stroke="#FFFFFF" stroke-width="2.5"/>
      <circle cx="66" cy="110" r="6" fill="#BAE6FD"/><circle cx="334" cy="110" r="6" fill="#BAE6FD"/>
    </svg>`,
  },
  {
    id: 'panda_bamboo',
    name: 'Бамбук',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#DCFCE7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <line x1="62" y1="184" x2="62" y2="244" stroke="#15803D" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="80" cy="204" rx="14" ry="6" transform="rotate(-20 80 204)" fill="#22C55E"/>
      <line x1="338" y1="184" x2="338" y2="244" stroke="#15803D" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="320" cy="204" rx="14" ry="6" transform="rotate(20 320 204)" fill="#22C55E"/>
      <ellipse cx="200" cy="64" rx="22" ry="8" fill="#22C55E" stroke="#15803D" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'cat_neon',
    name: 'Неон-киска',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#F3E8FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M52 126 L80 94 L162 114" fill="none" stroke="#EC4899" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M348 126 L320 94 L238 114" fill="none" stroke="#06B6D4" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="132" y1="204" x2="54" y2="192" stroke="#EC4899" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="132" y1="220" x2="54" y2="224" stroke="#06B6D4" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="268" y1="204" x2="346" y2="192" stroke="#EC4899" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="268" y1="220" x2="346" y2="224" stroke="#06B6D4" stroke-width="4.5" stroke-linecap="round"/>
      <polygon points="188,176 212,176 200,194" fill="#EC4899"/>
    </svg>`,
  },
  {
    id: 'fox_winter',
    name: 'Зимний узор',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0F2FE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M46 122 C74 86, 130 86, 162 112" fill="none" stroke="#0284C7" stroke-width="9" stroke-linecap="round"/>
      <path d="M354 122 C326 86, 270 86, 238 112" fill="none" stroke="#0284C7" stroke-width="9" stroke-linecap="round"/>
      <g fill="#FFFFFF" stroke="#38BDF8" stroke-width="2">
        <circle cx="78" cy="212" r="10"/><circle cx="322" cy="212" r="10"/><circle cx="200" cy="64" r="11"/>
      </g>
    </svg>`,
  },
  {
    id: 'sunny_daisy',
    name: 'Ромашки',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF9C3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <g transform="translate(76,212)">
        <circle cx="0" cy="-14" r="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="13" cy="-4" r="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="8" cy="11" r="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="-8" cy="11" r="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="-13" cy="-4" r="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="0" cy="0" r="8" fill="#FFD13B"/>
      </g>
      <g transform="translate(324,212)">
        <circle cx="0" cy="-14" r="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="13" cy="-4" r="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="8" cy="11" r="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="-8" cy="11" r="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="-13" cy="-4" r="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="0" cy="0" r="8" fill="#FFD13B"/>
      </g>
      <circle cx="200" cy="66" r="10" fill="#FFD13B" stroke="#FFFFFF" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'butterfly_pink_gold',
    name: 'Розовый блеск',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FCE7F3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M174 128 C162 84, 108 42, 42 36 C16 42, 12 88, 34 114 C16 130, 18 164, 46 176 C36 206, 56 244, 102 246 C134 246, 152 214, 148 192 C110 202, 68 184, 66 146 C64 112, 106 88, 152 110 Z" fill="#FF5CA8" fill-opacity="0.82" stroke="#F59E0B" stroke-width="4"/>
      <path d="M226 128 C238 84, 292 42, 358 36 C384 42, 388 88, 366 114 C384 130, 382 164, 354 176 C364 206, 344 244, 298 246 C266 246, 248 214, 252 192 C290 202, 332 184, 334 146 C336 112, 294 88, 248 110 Z" fill="#FF5CA8" fill-opacity="0.82" stroke="#F59E0B" stroke-width="4"/>
      <circle cx="200" cy="86" r="9" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'galaxy_planet',
    name: 'Планеты',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0E7FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <circle cx="76" cy="212" r="18" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2.5"/>
      <ellipse cx="76" cy="212" rx="34" ry="8" transform="rotate(-18 76 212)" fill="none" stroke="#FFD13B" stroke-width="4"/>
      <circle cx="324" cy="212" r="18" fill="#A855F7" stroke="#FFFFFF" stroke-width="2.5"/>
      <ellipse cx="324" cy="212" rx="34" ry="8" transform="rotate(18 324 212)" fill="none" stroke="#FF5CA8" stroke-width="4"/>
      <circle cx="200" cy="64" r="12" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'lucky_clover',
    name: 'Удача',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#DCFCE7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <g fill="#10C97A" stroke="#065F46" stroke-width="2.5">
        <circle cx="68" cy="204" r="10"/><circle cx="86" cy="204" r="10"/><circle cx="68" cy="222" r="10"/><circle cx="86" cy="222" r="10"/>
        <circle cx="314" cy="204" r="10"/><circle cx="332" cy="204" r="10"/><circle cx="314" cy="222" r="10"/><circle cx="332" cy="222" r="10"/>
      </g>
      <circle cx="200" cy="64" r="10" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'magic_swirls',
    name: 'Узоры феи',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#F3E8FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M52 128 C34 94, 72 68, 104 88 C126 102, 114 128, 92 120" fill="none" stroke="#A855F7" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M348 128 C366 94, 328 68, 296 88 C274 102, 286 128, 308 120" fill="none" stroke="#A855F7" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M64 226 C46 210, 68 186, 92 204 C106 216, 90 234, 76 224" fill="none" stroke="#EC4899" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M336 226 C354 210, 332 186, 308 204 C294 216, 310 234, 324 224" fill="none" stroke="#EC4899" stroke-width="5.5" stroke-linecap="round"/>
      <circle cx="200" cy="66" r="8" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'teddy_aqua',
    name: 'Мишка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF3C7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <ellipse cx="200" cy="184" rx="22" ry="15" fill="#78350F"/>
      <ellipse cx="82" cy="212" rx="40" ry="26" fill="#F59E0B" opacity="0.52"/>
      <ellipse cx="318" cy="212" rx="40" ry="26" fill="#F59E0B" opacity="0.52"/>
      <circle cx="72" cy="108" r="14" fill="#D9945E" opacity="0.72"/>
      <circle cx="328" cy="108" r="14" fill="#D9945E" opacity="0.72"/>
    </svg>`,
  },
  {
    id: 'rainbow_cheeks',
    name: 'Щёчки-радуги',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF9C3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <g fill="none" stroke-width="6" stroke-linecap="round">
        <path d="M50 222 A30 30 0 0 1 110 222" stroke="#FF3B5C"/>
        <path d="M58 222 A22 22 0 0 1 102 222" stroke="#FFD13B"/>
        <path d="M66 222 A14 14 0 0 1 94 222" stroke="#38BDF8"/>
        <path d="M290 222 A30 30 0 0 1 350 222" stroke="#FF3B5C"/>
        <path d="M298 222 A22 22 0 0 1 342 222" stroke="#FFD13B"/>
        <path d="M306 222 A14 14 0 0 1 334 222" stroke="#38BDF8"/>
      </g>
      <circle cx="200" cy="64" r="9" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'royal_gold_mask',
    name: 'Королева',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF9C3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M138 78 L148 42 L176 62 L200 26 L224 62 L252 42 L262 78 Z" fill="#FFD13B" stroke="#B45309" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="200" cy="56" r="7" fill="#FF3B5C"/>
      <path d="M48 122 Q104 88 162 114" fill="none" stroke="#F59E0B" stroke-width="7" stroke-linecap="round"/>
      <path d="M352 122 Q296 88 238 114" fill="none" stroke="#F59E0B" stroke-width="7" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'aqua_dolphin_splash',
    name: 'Брызги',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#E0F2FE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <g fill="#38BDF8" opacity="0.82">
        <circle cx="66" cy="204" r="10"/><circle cx="92" cy="218" r="8"/><circle cx="72" cy="232" r="6"/>
        <circle cx="334" cy="204" r="10"/><circle cx="308" cy="218" r="8"/><circle cx="328" cy="232" r="6"/>
        <circle cx="58" cy="110" r="8"/><circle cx="342" cy="110" r="8"/>
        <circle cx="200" cy="64" r="10"/>
      </g>
    </svg>`,
  },
  {
    id: 'candy_hearts',
    name: 'Леденцы',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FCE7F3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <circle cx="74" cy="210" r="16" fill="#FF5CA8" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="102" cy="224" r="12" fill="#38BDF8" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="326" cy="210" r="16" fill="#FF5CA8" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="298" cy="224" r="12" fill="#FFD13B" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="200" cy="64" r="11" fill="#10C97A" stroke="#FFFFFF" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'feather_indian',
    name: 'Пёрышки',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFEDD5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <ellipse cx="64" cy="112" rx="34" ry="12" transform="rotate(-30 64 112)" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2.5"/>
      <ellipse cx="336" cy="112" rx="34" ry="12" transform="rotate(30 336 112)" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2.5"/>
      <ellipse cx="74" cy="214" rx="28" ry="10" transform="rotate(20 74 214)" fill="#FF5CA8"/>
      <ellipse cx="326" cy="214" rx="28" ry="10" transform="rotate(-20 326 214)" fill="#FF5CA8"/>
      <circle cx="200" cy="64" r="8" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'aurora_glow',
    name: 'Сияние',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#CCFBF1',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M38 118 Q108 68 176 96 Q200 106 224 96 Q292 68 362 118" fill="none" stroke="#10C97A" stroke-width="11" stroke-linecap="round" opacity="0.65"/>
      <path d="M52 132 Q112 88 176 110 Q200 118 224 110 Q288 88 348 132" fill="none" stroke="#A855F7" stroke-width="8" stroke-linecap="round" opacity="0.62"/>
      <circle cx="78" cy="212" r="7" fill="#FFFFFF"/><circle cx="322" cy="212" r="7" fill="#FFFFFF"/>
    </svg>`,
  },
  {
    id: 'cat_spots',
    name: 'Леопард',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF3C7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <g fill="none" stroke="#92400E" stroke-width="4.5">
        <circle cx="68" cy="202" r="9"/><circle cx="92" cy="220" r="8"/><circle cx="64" cy="228" r="7"/>
        <circle cx="332" cy="202" r="9"/><circle cx="308" cy="220" r="8"/><circle cx="336" cy="228" r="7"/>
        <circle cx="74" cy="108" r="8"/><circle cx="326" cy="108" r="8"/>
      </g>
      <polygon points="186,174 214,174 200,192" fill="#92400E"/>
    </svg>`,
  },
  {
    id: 'butterfly_violet',
    name: 'Фиалка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#F3E8FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M174 128 C162 84, 108 42, 42 36 C16 42, 12 88, 34 114 C16 130, 18 164, 46 176 C36 206, 56 244, 102 246 C134 246, 152 214, 148 192 C110 202, 68 184, 66 146 C64 112, 106 88, 152 110 Z" fill="#8B5CF6" fill-opacity="0.82" stroke="#4C1D95" stroke-width="4"/>
      <path d="M226 128 C238 84, 292 42, 358 36 C384 42, 388 88, 366 114 C384 130, 382 164, 354 176 C364 206, 344 244, 298 246 C266 246, 248 214, 252 192 C290 202, 332 184, 334 146 C336 112, 294 88, 248 110 Z" fill="#8B5CF6" fill-opacity="0.82" stroke="#4C1D95" stroke-width="4"/>
      <circle cx="200" cy="86" r="10" fill="#DDD6FE" stroke="#4C1D95" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'sun_moon_magic',
    name: 'День и Ночь',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF9C3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <circle cx="78" cy="212" r="18" fill="#FFD13B" stroke="#D97706" stroke-width="3"/>
      <path d="M332 192 C312 194 300 212 304 228 C308 242 324 246 340 236 C322 234 316 218 320 204 Z" fill="#6366F1"/>
      <circle cx="200" cy="64" r="9" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'music_butterfly',
    name: 'Мелодия',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#EDE9FE',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M46 120 Q106 82 162 114" fill="none" stroke="#8B5CF6" stroke-width="7" stroke-linecap="round"/>
      <path d="M354 120 Q294 82 238 114" fill="none" stroke="#8B5CF6" stroke-width="7" stroke-linecap="round"/>
      <circle cx="72" cy="216" r="10" fill="#FF5CA8"/>
      <line x1="80" y1="216" x2="80" y2="188" stroke="#FF5CA8" stroke-width="5" stroke-linecap="round"/>
      <circle cx="328" cy="216" r="10" fill="#38BDF8"/>
      <line x1="336" y1="216" x2="336" y2="188" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'icecream_aqua',
    name: 'Пломбир',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FCE7F3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <polygon points="66,214 90,214 78,244" fill="#FBBF24"/>
      <circle cx="78" cy="204" r="14" fill="#FF5CA8"/>
      <polygon points="310,214 334,214 322,244" fill="#FBBF24"/>
      <circle cx="322" cy="204" r="14" fill="#38BDF8"/>
      <circle cx="200" cy="64" r="10" fill="#FF5CA8"/>
    </svg>`,
  },
  {
    id: 'freckles_cute',
    name: 'Веснушки',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FFEDD5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <ellipse cx="82" cy="212" rx="44" ry="24" fill="#FB7185" opacity="0.52"/>
      <ellipse cx="318" cy="212" rx="44" ry="24" fill="#FB7185" opacity="0.52"/>
      <g fill="#B45309" opacity="0.82">
        <circle cx="68" cy="204" r="3"/><circle cx="84" cy="210" r="3.5"/><circle cx="74" cy="222" r="3"/><circle cx="96" cy="202" r="2.8"/>
        <circle cx="152" cy="196" r="3"/><circle cx="168" cy="192" r="2.8"/><circle cx="232" cy="192" r="2.8"/><circle cx="248" cy="196" r="3"/>
        <circle cx="332" cy="204" r="3"/><circle cx="316" cy="210" r="3.5"/><circle cx="326" cy="222" r="3"/><circle cx="304" cy="202" r="2.8"/>
      </g>
    </svg>`,
  },
  {
    id: 'rainbow_sparkles',
    name: 'Блёстки',
    aspectRatio: 1.25,
    baseWidthRatio: 0.86,
    previewBg: '#FEF9C3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320">
      <path d="M78 190 Q82 208 100 212 Q82 216 78 234 Q74 216 56 212 Q74 208 78 190 Z" fill="#FFD13B" stroke="#FFFFFF" stroke-width="2"/>
      <path d="M322 190 Q326 208 344 212 Q326 216 322 234 Q318 216 300 212 Q318 208 322 190 Z" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2"/>
      <path d="M200 44 Q205 64 224 68 Q205 72 200 92 Q195 72 176 68 Q195 64 200 44 Z" fill="#FF5CA8" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="64" cy="112" r="6" fill="#A855F7"/><circle cx="336" cy="112" r="6" fill="#10C97A"/>
    </svg>`,
  },
];

export function faceArtMaskToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
