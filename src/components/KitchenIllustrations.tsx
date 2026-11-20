import React from 'react';
import {
  AllGameMode,
  DrinkAddonId,
  DrinkCategoryId,
  IceCreamBaseId,
  IceCreamGarnishId,
  MessType,
  PizzaToppingId,
  SandwichBreadId,
  SandwichFillingId,
  SoupIngredientId,
  WashToolMode,
} from '../data/kitchenData';
import {
  getCakeBaseAssetUrl,
  getCakeCandleAssetUrl,
  getCakeToppingAssetUrl,
  getDrinkCategoryAssetUrl,
  getDrinkExtraAssetUrl,
  getDrinkRecipeAssetUrl,
  getIceCreamBaseAssetUrl,
  getIceCreamFlavorAssetUrl,
  getIceCreamGarnishAssetUrl,
  getIceCreamSyrupAssetUrl,
  getPizzaSauceAssetUrl,
  getPizzaToppingAssetUrl,
  getSandwichBreadAssetUrl,
  getSandwichFillingAssetUrl,
  getSandwichSpreadAssetUrl,
  getSoupBaseAssetUrl,
  getSoupIngredientAssetUrl,
  getWashMessAssetUrl,
  PIZZA_CHEESE_LAYER_PNG,
  PIZZA_DOUGH_PNG,
  SOUP_POT_PNG,
} from '../utils/itemAssets';

export const ModeTabSvg: React.FC<{ mode: AllGameMode; className?: string }> = ({
  mode,
  className = 'w-6 h-6',
}) => {
  switch (mode) {
    case 'face':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <circle cx="24" cy="25" r="17" fill="#FDE68A" stroke="#D97706" strokeWidth="2.5" />
          <circle cx="17" cy="22" r="2.5" fill="#1F2937" />
          <circle cx="31" cy="22" r="2.5" fill="#1F2937" />
          <path d="M17 30 Q24 36 31 30" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="13" cy="26" r="3" fill="#FB7185" opacity="0.8" />
          <circle cx="35" cy="26" r="3" fill="#FB7185" opacity="0.8" />
          <path d="M24 6 L26 11 L31 12 L27 15 L28 20 L24 17 L20 20 L21 15 L17 12 L22 11 Z" fill="#EC4899" />
        </svg>
      );
    case 'tshirt':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path
            d="M15 9 Q24 15 33 9 L42 15 L38 24 L34 21 L34 40 L14 40 L14 21 L10 24 L6 15 Z"
            fill="#38BDF8"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M24 19 L26 24 L31 25 L27 28 L28 33 L24 30 L20 33 L21 28 L17 25 L22 24 Z" fill="#FACC15" />
        </svg>
      );
    case 'wash':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <rect x="8" y="20" width="32" height="19" rx="7" fill="#FDE047" stroke="#D97706" strokeWidth="2.5" />
          <circle cx="16" cy="27" r="2" fill="#CA8A04" opacity="0.6" />
          <circle cx="24" cy="31" r="2" fill="#CA8A04" opacity="0.6" />
          <circle cx="31" cy="26" r="2" fill="#CA8A04" opacity="0.6" />
          <circle cx="16" cy="14" r="6" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="2" />
          <circle cx="29" cy="11" r="7" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
          <circle cx="37" cy="17" r="4" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="2" />
        </svg>
      );
    case 'pizza':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
          <img
            src={PIZZA_DOUGH_PNG}
            alt=""
            draggable={false}
            className="w-[92%] h-[92%] object-contain pointer-events-none select-none"
          />
          <img
            src={getPizzaSauceAssetUrl('tomato')!}
            alt=""
            draggable={false}
            className="absolute w-[74%] h-[74%] object-contain pointer-events-none select-none"
          />
          <img
            src={PIZZA_CHEESE_LAYER_PNG}
            alt=""
            draggable={false}
            className="absolute w-[70%] h-[70%] object-contain pointer-events-none select-none"
          />
          <img
            src={getPizzaToppingAssetUrl('pepperoni')}
            alt=""
            draggable={false}
            className="absolute w-[24%] h-[24%] top-[28%] left-[32%] object-contain pointer-events-none select-none"
          />
          <img
            src={getPizzaToppingAssetUrl('pepperoni')}
            alt=""
            draggable={false}
            className="absolute w-[24%] h-[24%] bottom-[28%] right-[30%] object-contain pointer-events-none select-none"
          />
          <img
            src={getPizzaToppingAssetUrl('basil')}
            alt=""
            draggable={false}
            className="absolute w-[22%] h-[22%] top-[34%] right-[28%] object-contain pointer-events-none select-none"
          />
        </div>
      );
    case 'icecream':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
          <img
            src={getIceCreamBaseAssetUrl('cone')}
            alt=""
            draggable={false}
            className="absolute bottom-[4%] w-[52%] h-[54%] object-contain pointer-events-none select-none"
          />
          <img
            src={getIceCreamFlavorAssetUrl('strawberry')!}
            alt=""
            draggable={false}
            className="absolute top-[24%] w-[54%] h-[44%] object-contain pointer-events-none select-none"
          />
          <img
            src={getIceCreamFlavorAssetUrl('vanilla')!}
            alt=""
            draggable={false}
            className="absolute top-[8%] w-[48%] h-[40%] object-contain pointer-events-none select-none"
          />
          <img
            src={getIceCreamGarnishAssetUrl('cherry')}
            alt=""
            draggable={false}
            className="absolute top-[-2%] w-[28%] h-[28%] object-contain pointer-events-none select-none"
          />
        </div>
      );
    case 'drinks':
      return (
        <img
          src={getDrinkRecipeAssetUrl('cocktail_tropical')!}
          alt=""
          draggable={false}
          aria-hidden="true"
          className={`${className} object-contain pointer-events-none select-none`}
        />
      );
    case 'soup':
      return (
        <img
          src={getSoupBaseAssetUrl('veggie')!}
          alt=""
          draggable={false}
          aria-hidden="true"
          className={`${className} object-contain pointer-events-none select-none`}
        />
      );
    case 'sandwich':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
          <img
            src={getSandwichFillingAssetUrl('lettuce')}
            alt=""
            draggable={false}
            className="absolute bottom-[10%] w-[78%] h-[55%] object-contain pointer-events-none select-none"
          />
          <img
            src={getSandwichBreadAssetUrl('bun')}
            alt=""
            draggable={false}
            className="relative w-[86%] h-[86%] object-contain pointer-events-none select-none"
          />
        </div>
      );
    case 'cake':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
          <img
            src={getCakeBaseAssetUrl('pink')}
            alt=""
            draggable={false}
            className="relative bottom-[-6%] w-[86%] h-[82%] object-contain pointer-events-none select-none"
          />
          <img
            src={getCakeCandleAssetUrl('pink')}
            alt=""
            draggable={false}
            className="absolute top-[0%] w-[20%] h-[48%] object-contain pointer-events-none select-none"
          />
          <img
            src={getCakeToppingAssetUrl('strawberry')}
            alt=""
            draggable={false}
            className="absolute top-[28%] right-[22%] w-[28%] h-[28%] object-contain pointer-events-none select-none"
          />
        </div>
      );
    case 'feed':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <ellipse cx="24" cy="34" rx="18" ry="7" fill="#FFFFFF" stroke="#FDA4AF" strokeWidth="2.5" />
            <ellipse cx="24" cy="34" rx="12" ry="4" fill="#FFF1F2" />
            <path
              d="M35 12 C35 9, 39 9, 39 12 C39 15, 34 19, 34 19 C34 19, 29 15, 29 12 C29 9, 33 9, 33 12 Z"
              fill="#F43F5E"
            />
          </svg>
          <img
            src="/assets/cake/toppings/strawberry.webp"
            alt=""
            draggable={false}
            className="absolute top-[16%] left-[22%] w-[48%] h-[48%] object-contain pointer-events-none select-none"
          />
        </div>
      );
    case 'shadow':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
          <img
            src="/assets/items/accessories/apple_sticker.webp"
            alt=""
            draggable={false}
            className="absolute bottom-[8%] right-[8%] w-[64%] h-[64%] object-contain brightness-0 opacity-75 pointer-events-none select-none"
          />
          <img
            src="/assets/items/accessories/apple_sticker.webp"
            alt=""
            draggable={false}
            className="absolute top-[8%] left-[8%] w-[64%] h-[64%] object-contain pointer-events-none select-none drop-shadow-xs"
          />
        </div>
      );
    case 'bubbles':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <circle cx="20" cy="26" r="14" fill="#BAE6FD" fillOpacity="0.65" stroke="#38BDF8" strokeWidth="2.5" />
          <ellipse cx="15" cy="20" rx="4.5" ry="2.2" transform="rotate(-35 15 20)" fill="#FFFFFF" />
          <circle cx="35" cy="14" r="8" fill="#FBCFE8" fillOpacity="0.7" stroke="#F472B6" strokeWidth="2" />
          <circle cx="32.5" cy="11.5" r="2" fill="#FFFFFF" />
          <circle cx="36" cy="33" r="6.5" fill="#DDD6FE" fillOpacity="0.7" stroke="#A855F7" strokeWidth="2" />
          <circle cx="34" cy="31" r="1.5" fill="#FFFFFF" />
        </svg>
      );
    case 'memory':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
          <div className="absolute left-[10%] top-[14%] w-[56%] h-[70%] -rotate-6 rounded-xl bg-white border-2 border-[#C084FC] shadow-xs flex items-center justify-center p-1">
            <img
              src="/assets/items/accessories/star_sticker.webp"
              alt=""
              draggable={false}
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          </div>
          <div className="absolute right-[10%] bottom-[10%] w-[56%] h-[70%] rotate-6 rounded-xl bg-white border-2 border-[#F472B6] shadow-sm flex items-center justify-center p-1">
            <img
              src="/assets/items/accessories/star_sticker.webp"
              alt=""
              draggable={false}
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          </div>
        </div>
      );
    case 'puzzle':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path
            d="M8 10 H21 V15 C24 15, 24 21, 21 21 V26 H8 Z"
            fill="#A855F7"
            stroke="#7E22CE"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M23 10 H38 V26 H32 C32 23, 27 23, 27 26 H23 V21 C26 21, 26 15, 23 15 Z"
            fill="#FACC15"
            stroke="#CA8A04"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M11 28 H26 V40 H11 Z"
            fill="#38BDF8"
            stroke="#0284C7"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M28 28 H40 V40 H28 Z"
            fill="#FB7185"
            stroke="#E11D48"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'weather':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
          <img
            src="/assets/items/accessories/sun.webp"
            alt=""
            draggable={false}
            className="absolute top-[4%] right-[6%] w-[54%] h-[54%] object-contain pointer-events-none select-none"
          />
          <img
            src="/assets/items/accessories/umbrella_sticker.webp"
            alt=""
            draggable={false}
            className="absolute bottom-[4%] left-[6%] w-[64%] h-[64%] object-contain pointer-events-none select-none drop-shadow-xs"
          />
        </div>
      );
    case 'coloring':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <rect x="8" y="8" width="28" height="32" rx="6" fill="#FFFFFF" stroke="#EC4899" strokeWidth="2.5" />
          <path d="M14 25 C14 18, 22 14, 28 20 C31 24, 29 31, 22 31 C17 31, 14 28, 14 25 Z" fill="#FDE047" stroke="#334155" strokeWidth="2" />
          <circle cx="19" cy="21" r="2" fill="#EF4444" />
          <circle cx="25" cy="22" r="2" fill="#3B82F6" />
          <circle cx="22" cy="27" r="2" fill="#22C55E" />
          <g transform="rotate(28 36 28)">
            <rect x="33" y="14" width="6" height="19" rx="2" fill="#A855F7" stroke="#6B21A8" strokeWidth="1.8" />
            <polygon points="33,14 39,14 36,8" fill="#FDBA74" stroke="#9A3412" strokeWidth="1.5" strokeLinejoin="round" />
            <polygon points="34.7,10.6 37.3,10.6 36,8" fill="#EC4899" />
          </g>
        </svg>
      );
  }
};

export const WashToolSvg: React.FC<{ tool: WashToolMode; className?: string }> = ({
  tool,
  className = 'w-10 h-10',
}) => {
  if (tool === 'soap') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <ellipse cx="34" cy="44" rx="22" ry="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" />
        <rect x="10" y="18" width="42" height="26" rx="13" fill="#F472B6" stroke="#BE185D" strokeWidth="3" transform="rotate(-10 31 31)" />
        <ellipse cx="28" cy="24" rx="13" ry="4.5" fill="#FBCFE8" transform="rotate(-10 28 24)" />
        <path d="M16 33 Q28 29 40 33" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      </svg>
    );
  }
  if (tool === 'sponge') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path
          d="M10 30 C10 20, 22 16, 34 18 C48 20, 56 26, 54 38 C52 48, 38 52, 24 50 C12 48, 8 40, 10 30 Z"
          fill="#FACC15"
          stroke="#CA8A04"
          strokeWidth="3"
        />
        <path d="M12 42 C18 48, 44 50, 52 41 L51 47 C44 55, 18 54, 12 47 Z" fill="#22C55E" opacity="0.85" />
        <circle cx="22" cy="29" r="3" fill="#B45309" opacity="0.55" />
        <circle cx="34" cy="25" r="2.5" fill="#B45309" opacity="0.55" />
        <circle cx="42" cy="33" r="3.2" fill="#B45309" opacity="0.55" />
        <circle cx="28" cy="37" r="2.4" fill="#B45309" opacity="0.55" />
        <circle cx="48" cy="14" r="6" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2.2" />
        <circle cx="16" cy="16" r="5" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="2" />
        <circle cx="32" cy="11" r="4.5" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
        <circle cx="55" cy="25" r="4" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="2" />
      </svg>
    );
  }
  if (tool === 'shower') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M12 10 L26 10 Q34 10 38 18" fill="none" stroke="#64748B" strokeWidth="6" strokeLinecap="round" />
        <path d="M26 22 L48 14 L52 24 L30 32 Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="2.5" strokeLinejoin="round" />
        <g fill="#0EA5E9" stroke="#FFFFFF" strokeWidth="1">
          <path d="M30 37 C32 41, 33 44, 30 46 C27 44, 28 41, 30 37 Z" />
          <path d="M40 34 C42 38, 43 41, 40 43 C37 41, 38 38, 40 34 Z" />
          <path d="M49 30 C51 34, 52 37, 49 39 C46 37, 47 34, 49 30 Z" />
          <path d="M35 48 C37 52, 38 55, 35 57 C32 55, 33 52, 35 48 Z" />
          <path d="M46 44 C48 48, 49 51, 46 53 C43 51, 44 48, 46 44 Z" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Cute Hairdryer */}
      {/* Handle */}
      <rect x="29" y="30" width="11" height="22" rx="5" transform="rotate(14 34 40)" fill="#FB7185" stroke="#BE123C" strokeWidth="2.6" />
      <circle cx="33" cy="40" r="2.6" fill="#FEF08A" />
      {/* Dryer Barrel & Nozzle */}
      <path
        d="M22 14 C14 14, 10 19, 10 24 C10 29, 14 34, 22 34 L38 34 C45 34, 50 29, 50 24 C50 19, 45 14, 38 14 Z"
        fill="#F43F5E"
        stroke="#BE123C"
        strokeWidth="2.6"
      />
      <path d="M10 18 L18 19 L18 29 L10 30 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="2.2" strokeLinejoin="round" />
      {/* Back fan vent */}
      <circle cx="40" cy="24" r="6" fill="#FFE4E6" stroke="#BE123C" strokeWidth="2" />
      <circle cx="40" cy="24" r="2" fill="#BE123C" />
      {/* Glossy highlight */}
      <ellipse cx="28" cy="19" rx="7" ry="2.2" fill="#FDA4AF" opacity="0.85" />
      {/* Warm breeze waves */}
      <path d="M4 18 Q7 15 4 12" fill="none" stroke="#38BDF8" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M3 24 Q7 22 3 20" fill="none" stroke="#F59E0B" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M5 31 Q8 29 5 26" fill="none" stroke="#38BDF8" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
};

export const MessPresetSvg: React.FC<{ messType: MessType; className?: string }> = ({
  messType,
  className = 'w-9 h-9',
}) => {
  const singleUrl = getWashMessAssetUrl(messType);
  if (singleUrl) {
    return (
      <img
        src={singleUrl}
        alt=""
        draggable={false}
        aria-hidden="true"
        className={`${className} object-contain pointer-events-none select-none`}
      />
    );
  }
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
      <img
        src={getWashMessAssetUrl('mud')!}
        alt=""
        draggable={false}
        className="absolute top-[6%] left-[4%] w-[62%] h-[62%] object-contain pointer-events-none select-none"
      />
      <img
        src={getWashMessAssetUrl('jam')!}
        alt=""
        draggable={false}
        className="absolute top-[8%] right-[4%] w-[60%] h-[60%] object-contain pointer-events-none select-none"
      />
      <img
        src={getWashMessAssetUrl('paint')!}
        alt=""
        draggable={false}
        className="absolute bottom-[4%] left-[20%] w-[62%] h-[62%] object-contain pointer-events-none select-none"
      />
    </div>
  );
};

export const PizzaToppingSvgIcon: React.FC<{ id: PizzaToppingId; className?: string }> = ({
  id,
  className = 'w-8 h-8',
}) => (
  <img
    src={getPizzaToppingAssetUrl(id)}
    alt=""
    draggable={false}
    aria-hidden="true"
    className={`${className} object-contain pointer-events-none select-none`}
  />
);

export const IceCreamBaseSvgIcon: React.FC<{ id: IceCreamBaseId; className?: string }> = ({
  id,
  className = 'w-8 h-8',
}) => (
  <img
    src={getIceCreamBaseAssetUrl(id)}
    alt=""
    draggable={false}
    aria-hidden="true"
    className={`${className} object-contain pointer-events-none select-none`}
  />
);

export const IceCreamGarnishSvgIcon: React.FC<{ id: IceCreamGarnishId; className?: string }> = ({
  id,
  className = 'w-7 h-7',
}) => (
  <img
    src={getIceCreamGarnishAssetUrl(id)}
    alt=""
    draggable={false}
    aria-hidden="true"
    className={`${className} object-contain pointer-events-none select-none`}
  />
);

export const DrinkCategorySvgIcon: React.FC<{ id: DrinkCategoryId; className?: string }> = ({
  id,
  className = 'w-7 h-7',
}) => (
  <img
    src={getDrinkCategoryAssetUrl(id)}
    alt=""
    draggable={false}
    aria-hidden="true"
    className={`${className} object-contain pointer-events-none select-none`}
  />
);

export const DrinkAddonSvgIcon: React.FC<{ id: DrinkAddonId; className?: string }> = ({
  id,
  className = 'w-7 h-7',
}) => (
  <img
    src={getDrinkExtraAssetUrl(id)}
    alt=""
    draggable={false}
    aria-hidden="true"
    className={`${className} object-contain pointer-events-none select-none`}
  />
);

export const SoupIngredientSvgIcon: React.FC<{ id: SoupIngredientId; className?: string }> = ({
  id,
  className = 'w-8 h-8',
}) => (
  <img
    src={getSoupIngredientAssetUrl(id)}
    alt=""
    draggable={false}
    aria-hidden="true"
    className={`${className} object-contain pointer-events-none select-none`}
  />
);

export const SandwichBreadSvgIcon: React.FC<{ id: SandwichBreadId; className?: string }> = ({
  id,
  className = 'w-8 h-8',
}) => (
  <img
    src={getSandwichBreadAssetUrl(id)}
    alt=""
    draggable={false}
    aria-hidden="true"
    className={`${className} object-contain pointer-events-none select-none`}
  />
);

export const SandwichFillingSvgIcon: React.FC<{ id: SandwichFillingId; className?: string }> = ({
  id,
  className = 'w-8 h-8',
}) => (
  <img
    src={getSandwichFillingAssetUrl(id)}
    alt=""
    draggable={false}
    aria-hidden="true"
    className={`${className} object-contain pointer-events-none select-none`}
  />
);

// ==================== EXTRA ACTION SVG ICONS ====================

export const WashRefreshSvgIcon: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path
      d="M12 28 C10 21, 18 16, 25 18 C34 14, 42 22, 37 30 C41 36, 32 42, 24 39 C15 43, 8 35, 12 28 Z"
      fill="#854D0E"
      stroke="#573B26"
      strokeWidth="2"
    />
    <circle cx="34" cy="14" r="5" fill="#E11D48" />
    <circle cx="14" cy="15" r="4" fill="#38BDF8" />
    <path
      d="M29 10 A14 14 0 1 1 14 18"
      fill="none"
      stroke="#F59E0B"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <polygon points="33,6 28,15 38,14" fill="#F59E0B" />
  </svg>
);

export const PizzaCheeseSvgIcon: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <img
    src={PIZZA_CHEESE_LAYER_PNG}
    alt=""
    draggable={false}
    aria-hidden="true"
    className={`${className} object-contain pointer-events-none select-none`}
  />
);

export const PizzaOvenSvgIcon: React.FC<{ baked?: boolean; className?: string }> = ({
  baked = false,
  className = 'w-11 h-11',
}) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path d="M6 40 L6 24 A18 18 0 0 1 42 24 L42 40 Z" fill="#C2410C" stroke="#7C2D12" strokeWidth="2.5" />
    <path d="M13 40 L13 27 A11 11 0 0 1 35 27 L35 40 Z" fill={baked ? '#F97316' : '#292524'} />
    <path d="M24 23 C29 29, 29 37, 24 38 C19 37, 19 29, 24 23 Z" fill="#FACC15" />
    <path d="M24 28 C26 32, 26 37, 24 38 C22 37, 22 32, 24 28 Z" fill="#EF4444" />
    <rect x="4" y="38" width="40" height="5" rx="2" fill="#9A3412" />
  </svg>
);

export const PizzaCutterSvgIcon: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <circle cx="17" cy="17" r="11" fill="#E2E8F0" stroke="#475569" strokeWidth="2.5" />
    <circle cx="17" cy="17" r="4" fill="#94A3B8" />
    <path d="M23 23 L40 40" stroke="#EF4444" strokeWidth="7" strokeLinecap="round" />
    <path d="M20 20 L27 27" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const MinusLayerSvgIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <circle cx="20" cy="20" r="15" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2.5" />
    <line x1="12" y1="20" x2="28" y2="20" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const IceCreamSyrupBottleSvgIcon: React.FC<{
  syrupId: string;
  color: string;
  className?: string;
}> = ({ syrupId, className = 'w-11 h-11' }) => {
  const pngUrl = getIceCreamSyrupAssetUrl(syrupId);
  if (pngUrl) {
    return (
      <img
        src={pngUrl}
        alt=""
        draggable={false}
        aria-hidden="true"
        className={`${className} object-contain pointer-events-none select-none`}
      />
    );
  }
  return (
    <svg viewBox="0 0 44 44" className={className} aria-hidden="true">
      <rect x="13" y="13" width="18" height="24" rx="6" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2.2" />
      <polygon points="19,13 25,13 22,5" fill="#CBD5E1" />
      <line x1="10" y1="35" x2="34" y2="10" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
};

export const DrinkFlavorCupSvgIcon: React.FC<{
  flavorId?: string;
  liquidTop: string;
  liquidBottom: string;
  foamColor?: string;
  className?: string;
}> = ({ flavorId, liquidTop, liquidBottom, foamColor, className = 'w-11 h-11' }) => {
  const pngUrl = getDrinkRecipeAssetUrl(flavorId);
  if (pngUrl) {
    return (
      <img
        src={pngUrl}
        alt=""
        draggable={false}
        aria-hidden="true"
        className={`${className} object-contain pointer-events-none select-none`}
      />
    );
  }
  return (
    <svg viewBox="0 0 44 44" className={className} aria-hidden="true">
      <path d="M10 12 L34 12 L30 37 Q22 40 14 37 Z" fill="#F0F9FF" stroke="#94A3B8" strokeWidth="2.2" />
      <path d="M12 18 L32 18 L29 35 Q22 37 15 35 Z" fill={liquidBottom} />
      <ellipse cx="22" cy="18" rx="10" ry="3.5" fill={foamColor || liquidTop} />
      <path d="M26 17 L30 6 L35 5" fill="none" stroke="#FF4D6D" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
};

export const StirSpoonSvgIcon: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg viewBox="0 0 44 44" className={className} aria-hidden="true">
    <path d="M9 22 A13 13 0 1 1 22 35" fill="none" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
    <polygon points="7,17 14,22 6,25" fill="#38BDF8" />
    <rect x="20" y="6" width="5" height="22" rx="2.5" transform="rotate(25 22 17)" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
    <ellipse cx="17" cy="28" rx="6" ry="4" transform="rotate(25 17 28)" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
  </svg>
);

export const SoupPotToggleSvgIcon: React.FC<{ inBowl: boolean; className?: string }> = ({
  inBowl,
  className = 'w-11 h-11',
}) =>
  inBowl ? (
    <svg viewBox="0 0 44 44" className={className} aria-hidden="true">
      <path d="M7 18 Q7 36 22 36 Q37 36 37 18 Z" fill="#FFFFFF" stroke="#64748B" strokeWidth="2.5" />
      <ellipse cx="22" cy="18" rx="15" ry="4.5" fill="#FDE047" stroke="#64748B" strokeWidth="2" />
    </svg>
  ) : (
    <img
      src={SOUP_POT_PNG}
      alt=""
      draggable={false}
      aria-hidden="true"
      className={`${className} object-contain pointer-events-none select-none`}
    />
  );

export const SandwichSpreadSvgIcon: React.FC<{
  spreadId: string;
  color: string;
  className?: string;
}> = ({ spreadId, className = 'w-11 h-11' }) => {
  const pngUrl = getSandwichSpreadAssetUrl(spreadId);
  if (pngUrl) {
    return (
      <img
        src={pngUrl}
        alt=""
        draggable={false}
        aria-hidden="true"
        className={`${className} object-contain pointer-events-none select-none`}
      />
    );
  }
  return (
    <svg viewBox="0 0 44 44" className={className} aria-hidden="true">
      <rect x="11" y="14" width="22" height="22" rx="5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2.2" />
      <line x1="9" y1="35" x2="35" y2="11" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
};

export const SandwichTopBreadSvgIcon: React.FC<{ hasTop: boolean; className?: string }> = ({
  hasTop,
  className = 'w-11 h-11',
}) => (
  <svg viewBox="0 0 44 44" className={className} aria-hidden="true">
    <path
      d="M7 26 C7 12, 37 12, 37 26 Z"
      fill={hasTop ? '#EA580C' : '#FDE68A'}
      stroke="#9A3412"
      strokeWidth="2.5"
    />
    <ellipse cx="16" cy="19" rx="2" ry="1" fill="#FEF3C7" />
    <ellipse cx="23" cy="17" rx="2" ry="1" fill="#FEF3C7" />
    <ellipse cx="29" cy="21" rx="2" ry="1" fill="#FEF3C7" />
    <path d="M9 32 L35 32" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
    <rect x="8" y="34" width="28" height="5" rx="2.5" fill="#D97706" />
  </svg>
);

export const ArtToolSvgIcon: React.FC<{
  tool: 'mask' | 'paint' | 'stamp' | 'sticker' | 'eraser';
  className?: string;
}> = ({ tool, className = 'w-11 h-11' }) => {
  switch (tool) {
    case 'mask':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path
            d="M8 22 C8 14, 18 14, 24 20 C30 14, 40 14, 40 22 C40 31, 32 34, 26 28 L24 26 L22 28 C16 34, 8 31, 8 22 Z"
            fill="#EC4899"
            stroke="#9D174D"
            strokeWidth="2.5"
          />
          <ellipse cx="16" cy="23" rx="4" ry="3" fill="#FFFFFF" />
          <ellipse cx="32" cy="23" rx="4" ry="3" fill="#FFFFFF" />
          <path d="M24 8 L25.5 12 L30 13 L26.5 15.5 L27.5 20 L24 17.5 L20.5 20 L21.5 15.5 L18 13 L22.5 12 Z" fill="#FACC15" />
        </svg>
      );
    case 'paint':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path d="M12 36 L30 10 L36 15 L18 41 Z" fill="#F59E0B" stroke="#92400E" strokeWidth="2.2" />
          <path d="M9 41 C9 34, 15 32, 18 37 C17 42, 12 43, 9 41 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="2" />
          <circle cx="36" cy="34" r="5" fill="#38BDF8" />
          <circle cx="28" cy="39" r="4" fill="#FACC15" />
        </svg>
      );
    case 'stamp':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path d="M24 6 L29 18 L42 19 L32 27 L35 40 L24 33 L13 40 L16 27 L6 19 L19 18 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="11" cy="11" r="3" fill="#EC4899" />
          <circle cx="39" cy="36" r="3.5" fill="#38BDF8" />
        </svg>
      );
    case 'sticker':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <rect x="8" y="8" width="32" height="32" rx="9" fill="#38BDF8" stroke="#0284C7" strokeWidth="2.5" />
          <circle cx="18" cy="21" r="2.8" fill="#FFFFFF" />
          <circle cx="30" cy="21" r="2.8" fill="#FFFFFF" />
          <path d="M17 28 Q24 34 31 28" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          <path d="M28 40 L40 28 L40 35 Q40 40 35 40 Z" fill="#BAE6FD" />
        </svg>
      );
    case 'eraser':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <g transform="rotate(-24 24 24)">
            <rect x="10" y="14" width="28" height="19" rx="5" fill="#FDA4AF" stroke="#E11D48" strokeWidth="2.5" />
            <rect x="24" y="14" width="14" height="19" rx="3" fill="#93C5FD" stroke="#2563EB" strokeWidth="2.5" />
          </g>
          <path d="M8 39 L26 39" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
  }
};


export const PizzaSauceSvgIcon: React.FC<{
  sauceId?: string;
  color: string;
  ringColor: string;
  className?: string;
}> = ({ sauceId, color, ringColor, className = 'w-9 h-9' }) => {
  const pngUrl = getPizzaSauceAssetUrl(sauceId);
  if (pngUrl) {
    return (
      <img
        src={pngUrl}
        alt=""
        draggable={false}
        aria-hidden="true"
        className={`${className} object-contain pointer-events-none select-none`}
      />
    );
  }
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M5 19 Q20 35 35 19 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2.2" />
      <ellipse cx="20" cy="18" rx="14" ry="5" fill={color} stroke={ringColor} strokeWidth="1.5" />
    </svg>
  );
};

export const IceCreamScoopSvgIcon: React.FC<{
  flavorId?: string;
  color: string;
  highlight: string;
  className?: string;
}> = ({ flavorId, color, highlight, className = 'w-9 h-9' }) => {
  const pngUrl = getIceCreamFlavorAssetUrl(flavorId);
  if (pngUrl) {
    return (
      <img
        src={pngUrl}
        alt=""
        draggable={false}
        aria-hidden="true"
        className={`${className} object-contain pointer-events-none select-none`}
      />
    );
  }
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="19" r="14" fill={color} stroke="rgba(0,0,0,0.12)" strokeWidth="1.8" />
      <circle cx="11" cy="28" r="4.8" fill={color} />
      <circle cx="20" cy="29" r="4.8" fill={color} />
      <circle cx="29" cy="28" r="4.8" fill={color} />
      <ellipse cx="14" cy="13" rx="4.5" ry="2.2" transform="rotate(-25 14 13)" fill={highlight} opacity="0.85" />
    </svg>
  );
};

export const SoupBrothSvgIcon: React.FC<{
  brothId?: string;
  color: string;
  rimColor: string;
  className?: string;
}> = ({ brothId, color, rimColor, className = 'w-9 h-9' }) => {
  const pngUrl = getSoupBaseAssetUrl(brothId);
  if (pngUrl) {
    return (
      <img
        src={pngUrl}
        alt=""
        draggable={false}
        aria-hidden="true"
        className={`${className} object-contain pointer-events-none select-none`}
      />
    );
  }
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M5 17 Q20 36 35 17 Z" fill="#FFFFFF" stroke="#64748B" strokeWidth="2.2" />
      <ellipse cx="20" cy="17" rx="14" ry="5" fill={color} stroke={rimColor} strokeWidth="1.8" />
    </svg>
  );
};

export const TShirtColorSvgIcon: React.FC<{
  color: string;
  ringColor: string;
  className?: string;
}> = ({ color, ringColor, className = 'w-11 h-11' }) => {
  const isWhite = color.toUpperCase() === '#FFFFFF';
  const strokeCol = isWhite || ringColor === '#CBD5E1' ? '#94A3B8' : ringColor;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M16 9 L19 9 C20.5 12.5 27.5 12.5 29 9 L32 9 L43 16 L38 25 L34 22.5 L34 40 Q34 42 32 42 L16 42 Q14 42 14 40 L14 22.5 L10 25 L5 16 Z"
        fill={color}
        stroke={strokeCol}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M19 9 C20.5 13 27.5 13 29 9"
        fill="none"
        stroke={strokeCol}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {!isWhite && (
        <path
          d="M18 19 L18 35"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.35"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

export const ColorPencilSvgIcon: React.FC<{
  color: string;
  ringColor: string;
  className?: string;
}> = ({ color, ringColor, className = 'w-10 h-11' }) => {
  const isWhite = color.toUpperCase() === '#FFFFFF';
  const strokeCol = isWhite || ringColor === '#CBD5E1' ? '#94A3B8' : ringColor;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <g transform="rotate(22 24 24)">
        {/* Wooden sharpened cone */}
        <path
          d="M18 15 L24 4 L30 15 Z"
          fill="#FDE68A"
          stroke="#B45309"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Colored lead tip */}
        <path
          d="M21.2 9.2 L24 4 L26.8 9.2 Z"
          fill={color}
          stroke={strokeCol}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Pencil body */}
        <rect
          x="18"
          y="15"
          width="12"
          height="24"
          rx="2"
          fill={color}
          stroke={strokeCol}
          strokeWidth="2"
        />
        {/* Gloss highlight stripe */}
        <line
          x1="21.5"
          y1="17"
          x2="21.5"
          y2="37"
          stroke={isWhite ? '#E2E8F0' : '#FFFFFF'}
          strokeOpacity={isWhite ? 0.9 : 0.45}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Bottom ferrule */}
        <rect
          x="18"
          y="38.5"
          width="12"
          height="4.5"
          rx="1.5"
          fill="#E2E8F0"
          stroke="#64748B"
          strokeWidth="1.6"
        />
      </g>
    </svg>
  );
};


