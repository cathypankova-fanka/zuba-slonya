import React from 'react';
import { CharacterItem } from '../data/characters';
import { emotionUrl, hasEmotion } from '../data/emotionAssets';
import { Reaction } from '../data/reactions';
import { hasReactionAnim, reactionAnimUrl } from '../data/reactionAssets';

interface ReactionHeroProps {
  character: CharacterItem;
  reaction: Reaction;
  /** меняется при каждой новой реакции, чтобы анимация началась заново */
  runKey: number | string;
  /** путь к анимации жевания, когда reaction.emotion === 'eat' */
  eatSrc?: string;
  className?: string;
  /** летящие смайлики поверх (в маленькой аватарке отключаем) */
  showFx?: boolean;
}

/**
 * Герой, который «играет» реакцию: картинка эмоции (или жевание) + смешное
 * движение + летящие смайлики. Заполняет родителя целиком.
 */
export const ReactionHero: React.FC<ReactionHeroProps> = ({
  character,
  reaction,
  runKey,
  eatSrc,
  className = '',
  showFx = true,
}) => {
  const isEat = reaction.emotion === 'eat';
  const videoSrc =
    reaction.anim && hasReactionAnim(character.id, reaction.anim)
      ? reactionAnimUrl(character.id, reaction.anim)
      : null;
  const src = videoSrc ?? (isEat
    ? eatSrc ?? character.imageSrc
    : hasEmotion(character.id, reaction.emotion)
    ? emotionUrl(character.id, reaction.emotion)
    : character.imageSrc);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} key={runKey}>
      <img
        src={src}
        alt=""
        draggable={false}
        className={`w-full h-full object-cover object-top pointer-events-none select-none ${
          isEat || videoSrc ? '' : `r-${reaction.motion}`
        }`}
      />
      {showFx && !videoSrc && reaction.fx.map((e, i) => (
        <span
          key={i}
          className="r-fx text-3xl sm:text-4xl"
          style={
            {
              left: `${18 + i * 28}%`,
              animationDelay: `${i * 0.45}s`,
              '--dx': `${(i - 1) * 14}%`,
            } as React.CSSProperties
          }
        >
          {e}
        </span>
      ))}
    </div>
  );
};
