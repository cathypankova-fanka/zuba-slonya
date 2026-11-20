import React, { useEffect, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { REACTIONS, Reaction } from '../data/reactions';
import { ReactionHero } from './ReactionHero';

/** Забавные повторяющиеся реакции аватарки: смотрит на себя, удивляется, радуется и т.д. */
const IDLE_IDS = [
  'look_down',
  'wow_zoom',
  'yum_jump',
  'proud_chest',
  'thinking',
  'shy_blush',
  'giggle_roll',
  'tickled',
  'sneaky',
  'bigeyes',
  'wave',
  'flex',
];

interface IdleAvatarProps {
  character: CharacterItem;
  /** пауза между реакциями, мс */
  restMs?: number;
  /** длительность реакции, мс */
  actMs?: number;
}

export const IdleAvatar: React.FC<IdleAvatarProps> = ({ character, restMs = 1400, actMs = 2600 }) => {
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    let last = '';
    let timer: number;
    const rest = () => {
      setReaction(null);
      timer = window.setTimeout(act, restMs);
    };
    const act = () => {
      const pool = IDLE_IDS.filter((id) => id !== last && REACTIONS[id]);
      const id = pool[Math.floor(Math.random() * pool.length)];
      last = id;
      setReaction(REACTIONS[id]);
      setRun((n) => n + 1);
      timer = window.setTimeout(rest, actMs);
    };
    timer = window.setTimeout(act, 900);
    return () => window.clearTimeout(timer);
  }, [character.id, restMs, actMs]);

  return reaction ? (
    <ReactionHero character={character} reaction={reaction} runKey={`${character.id}-${run}`} showFx={false} />
  ) : (
    <img
      src={character.imageSrc}
      alt=""
      draggable={false}
      className="w-full h-full object-cover object-top pointer-events-none select-none animate-hero-breathe"
    />
  );
};
