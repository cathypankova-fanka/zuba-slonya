import React from 'react';
import { PatternStampId } from '../data/artTools';

export const StampPreviewIcon: React.FC<{
  stampId: PatternStampId;
  color: string;
  className?: string;
}> = ({ stampId, color, className = 'w-8 h-8' }) => {
  const fill = color === '#FFFFFF' ? '#94A3B8' : color;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {stampId === 'blush' && (
        <ellipse cx="32" cy="32" rx="22" ry="16" fill={fill} opacity="0.72" />
      )}
      {stampId === 'star' && (
        <path
          d="M32 8 L39 24 L56 26 L43 38 L47 55 L32 46 L17 55 L21 38 L8 26 L25 24 Z"
          fill={fill}
        />
      )}
      {stampId === 'heart' && (
        <path
          d="M32 54 C32 54 10 39 10 23 C10 14 17 9 24 9 C28 9 31 12 32 15 C33 12 36 9 40 9 C47 9 54 14 54 23 C54 39 32 54 32 54 Z"
          fill={fill}
        />
      )}
      {stampId === 'flower' && (
        <g>
          <circle cx="32" cy="16" r="9" fill={fill} />
          <circle cx="47" cy="27" r="9" fill={fill} />
          <circle cx="41" cy="45" r="9" fill={fill} />
          <circle cx="23" cy="45" r="9" fill={fill} />
          <circle cx="17" cy="27" r="9" fill={fill} />
          <circle cx="32" cy="32" r="8" fill="#FFD13B" />
        </g>
      )}
      {stampId === 'butterfly' && (
        <g>
          <ellipse cx="20" cy="24" rx="12" ry="9" transform="rotate(-25 20 24)" fill={fill} />
          <ellipse cx="44" cy="24" rx="12" ry="9" transform="rotate(25 44 24)" fill={fill} />
          <ellipse cx="22" cy="41" rx="9" ry="7" transform="rotate(25 22 41)" fill={fill} />
          <ellipse cx="42" cy="41" rx="9" ry="7" transform="rotate(-25 42 41)" fill={fill} />
          <rect x="30" y="18" width="4" height="28" rx="2" fill="#292524" />
        </g>
      )}
      {stampId === 'dots' && (
        <g fill={fill}>
          <circle cx="18" cy="24" r="5" />
          <circle cx="33" cy="18" r="6" />
          <circle cx="46" cy="29" r="4.5" />
          <circle cx="24" cy="42" r="5.5" />
          <circle cx="40" cy="44" r="4.5" />
        </g>
      )}
      {stampId === 'sun' && (
        <g fill={fill} stroke={fill} strokeWidth="4" strokeLinecap="round">
          <circle cx="32" cy="32" r="12" stroke="none" />
          <line x1="32" y1="7" x2="32" y2="15" />
          <line x1="32" y1="49" x2="32" y2="57" />
          <line x1="7" y1="32" x2="15" y2="32" />
          <line x1="49" y1="32" x2="57" y2="32" />
          <line x1="14" y1="14" x2="20" y2="20" />
          <line x1="44" y1="44" x2="50" y2="50" />
          <line x1="50" y1="14" x2="44" y2="20" />
          <line x1="20" y1="44" x2="14" y2="50" />
        </g>
      )}
      {stampId === 'moon' && (
        <path
          d="M40 12 C24 14 14 28 16 42 C18 52 32 56 46 50 C32 48 26 36 30 24 C32 18 36 14 40 12 Z"
          fill={fill}
        />
      )}
      {stampId === 'cloud' && (
        <path
          d="M16 46 L48 46 C54 46 58 41 56 35 C55 30 50 28 46 29 C44 20 36 17 29 20 C24 22 22 26 21 29 C14 29 10 34 10 40 C10 44 13 46 16 46 Z"
          fill={fill}
        />
      )}
      {stampId === 'crown' && (
        <path
          d="M10 48 L8 22 L22 33 L32 14 L42 33 L56 22 L54 48 Z"
          fill={fill}
        />
      )}
      {stampId === 'paw' && (
        <g fill={fill}>
          <ellipse cx="32" cy="40" rx="13" ry="10" />
          <circle cx="17" cy="24" r="5" />
          <circle cx="27" cy="17" r="5" />
          <circle cx="37" cy="17" r="5" />
          <circle cx="47" cy="24" r="5" />
        </g>
      )}
      {stampId === 'lightning' && (
        <path d="M36 8 L18 34 L31 34 L26 56 L46 28 L33 28 Z" fill={fill} />
      )}
      {stampId === 'spiral' && (
        <path
          d="M32 32 C35 32 35 28 32 27 C27 26 24 31 26 36 C28 42 37 43 41 37 C46 30 41 20 32 19 C21 18 14 28 16 39 C19 50 32 54 44 48"
          fill="none"
          stroke={fill}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      )}
      {stampId === 'leaf' && (
        <g>
          <path
            d="M14 48 C14 22 30 12 52 12 C52 34 40 48 14 48 Z"
            fill={fill}
          />
          <line
            x1="18"
            y1="44"
            x2="42"
            y2="20"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
      )}
      {stampId === 'sparkle' && (
        <path
          d="M32 8 Q35 29 56 32 Q35 35 32 56 Q29 35 8 32 Q29 29 32 8 Z"
          fill={fill}
        />
      )}
      {stampId === 'diamond' && (
        <g>
          <polygon points="18,12 46,12 58,28 32,56 6,28" fill={fill} />
          <line x1="8" y1="28" x2="56" y2="28" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.65" />
          <polyline points="20,28 32,54 44,28" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.65" />
        </g>
      )}
      {stampId === 'music' && (
        <g>
          <path
            d="M24 44 L24 16 L48 10 L48 38"
            fill="none"
            stroke={fill}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <ellipse cx="19" cy="46" rx="8" ry="6" transform="rotate(-18 19 46)" fill={fill} />
          <ellipse cx="43" cy="40" rx="8" ry="6" transform="rotate(-18 43 40)" fill={fill} />
        </g>
      )}
      {stampId === 'snow' && (
        <g stroke={fill} strokeWidth="4" strokeLinecap="round">
          <line x1="32" y1="8" x2="32" y2="56" />
          <line x1="11" y1="20" x2="53" y2="44" />
          <line x1="53" y1="20" x2="11" y2="44" />
          <polyline points="26,14 32,20 38,14" fill="none" />
          <polyline points="26,50 32,44 38,50" fill="none" />
        </g>
      )}
      {stampId === 'clover' && (
        <g fill={fill}>
          <circle cx="23" cy="23" r="10" />
          <circle cx="41" cy="23" r="10" />
          <circle cx="23" cy="41" r="10" />
          <circle cx="41" cy="41" r="10" />
          <path d="M32 38 Q34 50 27 56" fill="none" stroke={fill} strokeWidth="4.5" strokeLinecap="round" />
        </g>
      )}
      {stampId === 'apple' && (
        <g>
          <path
            d="M32 20 C20 14, 10 24, 14 40 C17 52, 26 56, 32 52 C38 56, 47 52, 50 40 C54 24, 44 14, 32 20 Z"
            fill={fill}
          />
          <ellipse cx="40" cy="14" rx="7" ry="4" transform="rotate(-28 40 14)" fill="#10C97A" />
        </g>
      )}
      {stampId === 'smile' && (
        <g>
          <circle cx="32" cy="32" r="22" fill={fill} />
          <circle cx="24" cy="27" r="3.2" fill="#1E293B" />
          <circle cx="40" cy="27" r="3.2" fill="#1E293B" />
          <path d="M22 37 Q32 47 42 37" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
      {stampId === 'wave' && (
        <g fill="none" stroke={fill} strokeWidth="5" strokeLinecap="round">
          <path d="M8 24 Q20 14 32 24 Q44 34 56 24" />
          <path d="M8 40 Q20 30 32 40 Q44 50 56 40" />
        </g>
      )}
      {stampId === 'shell' && (
        <g>
          <path d="M32 52 L10 30 A24 24 0 0 1 54 30 Z" fill={fill} />
          <g stroke="#FFFFFF" strokeWidth="2.2" opacity="0.65">
            <line x1="32" y1="48" x2="18" y2="20" />
            <line x1="32" y1="48" x2="32" y2="16" />
            <line x1="32" y1="48" x2="46" y2="20" />
          </g>
        </g>
      )}
      {stampId === 'rainbow_arc' && (
        <g fill="none" strokeWidth="5.5" strokeLinecap="round">
          <path d="M10 44 A22 22 0 0 1 54 44" stroke={fill} />
          <path d="M17 44 A15 15 0 0 1 47 44" stroke="#FFD13B" />
          <path d="M24 44 A8 8 0 0 1 40 44" stroke="#38BDF8" />
        </g>
      )}
      {stampId === 'bow_stamp' && (
        <g fill={fill}>
          <path d="M30 32 L10 16 Q6 32 10 48 Z" />
          <path d="M34 32 L54 16 Q58 32 54 48 Z" />
          <circle cx="32" cy="32" r="7" />
        </g>
      )}
      {stampId === 'swirl' && (
        <path
          d="M32 32 C38 32 38 24 30 24 C22 24 20 36 28 42 C38 48 48 38 46 26 C43 14 26 12 18 22"
          fill="none"
          stroke={fill}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      )}
      {stampId === 'double_heart' && (
        <g fill={fill}>
          <path d="M23 40 C23 40 10 31 10 21 C10 16 14 13 18 14 C20 14 22 16 23 18 C24 16 26 14 28 14 C32 13 36 16 36 21 C36 31 23 40 23 40 Z" />
          <path d="M43 52 C43 52 33 45 33 37 C33 33 36 30 39 31 C41 31 42 33 43 34 C44 33 45 31 47 31 C50 30 53 33 53 37 C53 45 43 52 43 52 Z" />
        </g>
      )}
      {stampId === 'triple_star' && (
        <g fill={fill}>
          <path d="M32 8 L35 16 L44 17 L37 22 L39 30 L32 25 L25 30 L27 22 L20 17 L29 16 Z" />
          <path d="M18 34 L20 40 L26 41 L21 45 L23 51 L18 47 L13 51 L15 45 L10 41 L16 40 Z" />
          <path d="M46 34 L48 40 L54 41 L49 45 L51 51 L46 47 L41 51 L43 45 L38 41 L44 40 Z" />
        </g>
      )}
      {stampId === 'comet' && (
        <g>
          <path d="M36 26 L12 46 M40 32 L20 52" stroke={fill} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M42 10 L45 18 L54 19 L47 24 L49 32 L42 27 L35 32 L37 24 L30 19 L39 18 Z" fill={fill} />
        </g>
      )}
      {stampId === 'planet_stamp' && (
        <g>
          <circle cx="32" cy="32" r="14" fill={fill} />
          <ellipse cx="32" cy="32" rx="26" ry="7" transform="rotate(-18 32 32)" fill="none" stroke={fill} strokeWidth="4" />
        </g>
      )}
      {stampId === 'rocket_stamp' && (
        <g fill={fill}>
          <path d="M32 8 C42 20 44 36 40 48 L24 48 C20 36 22 20 32 8 Z" />
          <polygon points="22,36 12,48 23,46" />
          <polygon points="42,36 52,48 41,46" />
          <circle cx="32" cy="28" r="5" fill="#FFFFFF" />
        </g>
      )}
      {stampId === 'tulip' && (
        <g>
          <path d="M18 14 L26 24 L32 12 L38 24 L46 14 C48 34 38 40 32 40 C26 40 16 34 18 14 Z" fill={fill} />
          <line x1="32" y1="38" x2="32" y2="56" stroke="#15803D" strokeWidth="4.5" strokeLinecap="round" />
        </g>
      )}
      {stampId === 'daisy' && (
        <g>
          <ellipse cx="32" cy="16" rx="5" ry="9" fill={fill} />
          <ellipse cx="32" cy="48" rx="5" ry="9" fill={fill} />
          <ellipse cx="16" cy="32" rx="9" ry="5" fill={fill} />
          <ellipse cx="48" cy="32" rx="9" ry="5" fill={fill} />
          <circle cx="32" cy="32" r="8" fill="#FFD13B" />
        </g>
      )}
      {stampId === 'rose' && (
        <g>
          <circle cx="32" cy="32" r="20" fill={fill} />
          <path d="M32 32 C36 32 36 26 30 26 C24 26 24 36 32 38 C40 40 44 28 36 20" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {stampId === 'cactus' && (
        <path
          d="M32 12 L32 54 M18 28 L18 36 L32 36 M46 24 L46 32 L32 32"
          fill="none"
          stroke={fill}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {stampId === 'mushroom' && (
        <g>
          <rect x="26" y="32" width="12" height="22" rx="4" fill="#FDE68A" />
          <path d="M10 34 A22 22 0 0 1 54 34 Z" fill={fill} />
          <circle cx="24" cy="24" r="3.5" fill="#FFFFFF" />
          <circle cx="39" cy="26" r="3" fill="#FFFFFF" />
        </g>
      )}
      {stampId === 'acorn' && (
        <g>
          <ellipse cx="32" cy="38" rx="14" ry="16" fill={fill} />
          <path d="M14 28 A18 16 0 0 1 50 28 Z" fill="#78350F" />
          <line x1="32" y1="12" x2="36" y2="6" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {stampId === 'cherry_stamp' && (
        <g>
          <path d="M20 42 Q28 20 36 12 Q42 24 44 42" fill="none" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="19" cy="44" r="9" fill={fill} />
          <circle cx="45" cy="44" r="9" fill={fill} />
        </g>
      )}
      {stampId === 'berry' && (
        <g>
          <path d="M32 54 C16 44 12 24 20 18 C26 14 38 14 44 18 C52 24 48 44 32 54 Z" fill={fill} />
          <ellipse cx="32" cy="14" rx="12" ry="5" fill="#10C97A" />
        </g>
      )}
      {stampId === 'lemon' && (
        <g fill={fill}>
          <ellipse cx="32" cy="32" rx="22" ry="14" transform="rotate(-18 32 32)" />
          <circle cx="11" cy="39" r="4" />
          <circle cx="53" cy="25" r="4" />
        </g>
      )}
      {stampId === 'candy' && (
        <g fill={fill}>
          <polygon points="18,32 8,22 8,42" />
          <polygon points="46,32 56,22 56,42" />
          <ellipse cx="32" cy="32" rx="16" ry="12" />
        </g>
      )}
      {stampId === 'lollipop_stamp' && (
        <g>
          <line x1="32" y1="36" x2="32" y2="56" stroke="#94A3B8" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="32" cy="24" r="16" fill={fill} />
          <path d="M32 24 A8 8 0 1 1 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {stampId === 'cupcake_stamp' && (
        <g>
          <polygon points="18,34 46,34 42,54 22,54" fill="#FBBF24" />
          <path d="M14 34 A18 18 0 0 1 50 34 Z" fill={fill} />
          <circle cx="32" cy="13" r="4.5" fill="#FF3B5C" />
        </g>
      )}
      {stampId === 'donut_stamp' && (
        <g>
          <circle cx="32" cy="32" r="22" fill={fill} />
          <circle cx="32" cy="32" r="8" fill="#FFFFFF" />
        </g>
      )}
      {stampId === 'icecream_stamp' && (
        <g>
          <polygon points="20,32 44,32 32,56" fill="#FBBF24" />
          <circle cx="32" cy="24" r="14" fill={fill} />
        </g>
      )}
      {stampId === 'cat_face' && (
        <g>
          <polygon points="14,30 14,12 28,22" fill={fill} />
          <polygon points="50,30 50,12 36,22" fill={fill} />
          <ellipse cx="32" cy="36" rx="20" ry="16" fill={fill} />
          <circle cx="25" cy="34" r="2.5" fill="#FFF" />
          <circle cx="39" cy="34" r="2.5" fill="#FFF" />
        </g>
      )}
      {stampId === 'bunny_face' && (
        <g>
          <ellipse cx="24" cy="20" rx="5.5" ry="14" transform="rotate(-10 24 20)" fill={fill} />
          <ellipse cx="40" cy="20" rx="5.5" ry="14" transform="rotate(10 40 20)" fill={fill} />
          <circle cx="32" cy="40" r="16" fill={fill} />
          <circle cx="26" cy="38" r="2.5" fill="#FFF" />
          <circle cx="38" cy="38" r="2.5" fill="#FFF" />
        </g>
      )}
      {stampId === 'bear_face' && (
        <g>
          <circle cx="17" cy="18" r="8" fill={fill} />
          <circle cx="47" cy="18" r="8" fill={fill} />
          <circle cx="32" cy="36" r="19" fill={fill} />
          <ellipse cx="32" cy="41" rx="8" ry="6" fill="#FFFFFF" />
        </g>
      )}
      {stampId === 'fish_stamp' && (
        <g>
          <polygon points="40,32 56,18 56,46" fill={fill} />
          <ellipse cx="28" cy="32" rx="18" ry="13" fill={fill} />
          <circle cx="19" cy="29" r="2.5" fill="#FFFFFF" />
        </g>
      )}
      {stampId === 'bird' && (
        <g>
          <ellipse cx="28" cy="36" rx="16" ry="12" fill={fill} />
          <circle cx="40" cy="24" r="10" fill={fill} />
          <polygon points="48,22 57,26 48,29" fill="#FF9F1C" />
        </g>
      )}
      {stampId === 'whale_stamp' && (
        <g>
          <ellipse cx="28" cy="36" rx="18" ry="13" fill={fill} />
          <polygon points="42,36 56,22 54,42" fill={fill} />
          <path d="M28 22 Q22 10 16 16 M28 22 Q34 10 40 16" fill="none" stroke={fill} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
      {stampId === 'ladybug_stamp' && (
        <g>
          <circle cx="32" cy="36" r="18" fill={fill} />
          <circle cx="32" cy="16" r="8" fill="#1E293B" />
          <circle cx="24" cy="34" r="3" fill="#1E293B" />
          <circle cx="40" cy="34" r="3" fill="#1E293B" />
        </g>
      )}
      {stampId === 'bee_stamp' && (
        <g>
          <ellipse cx="24" cy="20" rx="7" ry="11" fill="#BAE6FD" />
          <ellipse cx="40" cy="20" rx="7" ry="11" fill="#BAE6FD" />
          <ellipse cx="32" cy="36" rx="18" ry="12" fill={fill} />
          <line x1="27" y1="25" x2="27" y2="47" stroke="#1E293B" strokeWidth="4" />
          <line x1="37" y1="25" x2="37" y2="47" stroke="#1E293B" strokeWidth="4" />
        </g>
      )}
      {stampId === 'snail' && (
        <g>
          <line x1="12" y1="48" x2="52" y2="48" stroke={fill} strokeWidth="7" strokeLinecap="round" />
          <circle cx="28" cy="32" r="15" fill={fill} />
        </g>
      )}
      {stampId === 'feather' && (
        <g>
          <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(-32 32 32)" fill={fill} />
          <line x1="16" y1="42" x2="48" y2="22" stroke="#FFFFFF" strokeWidth="2.5" />
        </g>
      )}
      {stampId === 'wing' && (
        <path d="M12 44 C14 18 32 12 54 16 C44 38 30 48 12 44 Z" fill={fill} />
      )}
      {stampId === 'angel_halo' && (
        <ellipse cx="32" cy="32" rx="22" ry="9" fill="none" stroke={fill} strokeWidth="6" />
      )}
      {stampId === 'balloon_stamp' && (
        <g>
          <ellipse cx="32" cy="26" rx="15" ry="18" fill={fill} />
          <path d="M32 44 Q36 50 28 56" fill="none" stroke={fill} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {stampId === 'flag' && (
        <g>
          <line x1="20" y1="10" x2="20" y2="54" stroke={fill} strokeWidth="4.5" strokeLinecap="round" />
          <polygon points="22,12 52,22 22,34" fill={fill} />
        </g>
      )}
      {stampId === 'anchor' && (
        <g fill="none" stroke={fill} strokeWidth="4.5" strokeLinecap="round">
          <line x1="32" y1="12" x2="32" y2="50" />
          <line x1="20" y1="22" x2="44" y2="22" />
          <path d="M14 38 A18 18 0 0 0 50 38" />
        </g>
      )}
      {stampId === 'boat' && (
        <g fill={fill}>
          <polygon points="32,10 50,36 32,36" />
          <polygon points="10,40 54,40 46,54 18,54" />
        </g>
      )}
      {stampId === 'car_stamp' && (
        <g>
          <path d="M10 40 L16 28 L24 18 L42 18 L48 28 L54 40 Z" fill={fill} />
          <circle cx="20" cy="43" r="6" fill="#1E293B" />
          <circle cx="44" cy="43" r="6" fill="#1E293B" />
        </g>
      )}
      {stampId === 'airplane' && (
        <polygon points="8,32 26,28 34,10 42,10 38,28 56,32 38,36 42,54 34,54 26,36" fill={fill} />
      )}
      {stampId === 'train_stamp' && (
        <g>
          <rect x="12" y="18" width="18" height="24" fill={fill} />
          <rect x="30" y="26" width="24" height="16" fill={fill} />
          <rect x="42" y="16" width="8" height="10" fill={fill} />
          <circle cx="20" cy="46" r="5" fill="#1E293B" />
          <circle cx="36" cy="46" r="5" fill="#1E293B" />
          <circle cx="48" cy="46" r="5" fill="#1E293B" />
        </g>
      )}
      {stampId === 'umbrella' && (
        <g>
          <path d="M10 34 A22 22 0 0 1 54 34 Z" fill={fill} />
          <path d="M32 34 L32 50 A5 5 0 0 1 22 50" fill="none" stroke={fill} strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {stampId === 'raindrop' && (
        <path d="M32 8 C48 28 48 54 32 54 C16 54 16 28 32 8 Z" fill={fill} />
      )}
      {stampId === 'fire' && (
        <g>
          <path d="M32 8 C50 26 50 54 32 54 C14 54 14 26 32 8 Z" fill={fill} />
          <ellipse cx="32" cy="42" rx="7" ry="10" fill="#FFD13B" />
        </g>
      )}
      {stampId === 'gem_oval' && (
        <g>
          <ellipse cx="32" cy="32" rx="16" ry="23" fill={fill} />
          <ellipse cx="32" cy="32" rx="8" ry="13" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.7" />
        </g>
      )}
      {stampId === 'key' && (
        <g fill="none" stroke={fill} strokeWidth="4.5" strokeLinecap="round">
          <circle cx="20" cy="32" r="9" />
          <polyline points="29,32 52,32 52,42" />
          <line x1="42" y1="32" x2="42" y2="40" />
        </g>
      )}
      {stampId === 'bell' && (
        <g fill={fill}>
          <path d="M14 44 C16 18 24 14 32 14 C40 14 48 18 50 44 Z" />
          <circle cx="32" cy="48" r="5" />
        </g>
      )}
      {stampId === 'treble_clef' && (
        <path
          d="M34 52 L34 12 Q46 18 32 30 Q16 40 32 46 Q46 46 40 34"
          fill="none"
          stroke={fill}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      )}
      {stampId === 'paw_double' && (
        <g fill={fill}>
          <ellipse cx="22" cy="24" rx="7" ry="5" />
          <circle cx="15" cy="14" r="2.5" />
          <circle cx="22" cy="12" r="2.5" />
          <circle cx="29" cy="14" r="2.5" />
          <ellipse cx="42" cy="44" rx="7" ry="5" />
          <circle cx="35" cy="34" r="2.5" />
          <circle cx="42" cy="32" r="2.5" />
          <circle cx="49" cy="34" r="2.5" />
        </g>
      )}
      {stampId === 'kiss' && (
        <path d="M10 32 Q22 18 32 26 Q42 18 54 32 Q32 50 10 32 Z" fill={fill} />
      )}
      {stampId === 'wink' && (
        <g>
          <circle cx="32" cy="32" r="22" fill={fill} />
          <circle cx="24" cy="27" r="3.2" fill="#1E293B" />
          <path d="M36 27 Q41 22 46 27" fill="none" stroke="#1E293B" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M22 37 Q32 47 42 37" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
      {stampId === 'confetti_stamp' && (
        <g>
          <circle cx="18" cy="18" r="5" fill={fill} />
          <circle cx="46" cy="20" r="4.5" fill="#FFD13B" />
          <circle cx="32" cy="32" r="5.5" fill="#38BDF8" />
          <circle cx="20" cy="46" r="4.5" fill="#FF5CA8" />
          <circle cx="46" cy="44" r="5" fill="#10C97A" />
        </g>
      )}
    </svg>
  );
};
