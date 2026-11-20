import React from 'react';
import { CharacterItem } from '../data/characters';
import { PlayMode } from '../data/kitchenData';
import { MilkshakeMission } from './MilkshakeMission';
import { PancakesMission } from './PancakesMission';
import { CookiesMission } from './CookiesMission';
import { PopcornMission } from './PopcornMission';
import { SkewersMission } from './SkewersMission';
import { PicnicMission } from './PicnicMission';
import { BedtimeMission } from './BedtimeMission';
import { DoctorMission } from './DoctorMission';
import { GardenMission } from './GardenMission';
import { LaundryMission } from './LaundryMission';

/** Маршрутизатор новых мини-игр. */
export const PlayRouter: React.FC<{ mode: PlayMode; character: CharacterItem; soundEnabled: boolean }> = ({ mode, character, soundEnabled }) => {
  const p = { character, soundEnabled };
  switch (mode) {
    case 'milkshake': return <MilkshakeMission {...p} />;
    case 'pancakes': return <PancakesMission {...p} />;
    case 'cookies': return <CookiesMission {...p} />;
    case 'popcorn': return <PopcornMission {...p} />;
    case 'skewers': return <SkewersMission {...p} />;
    case 'picnic': return <PicnicMission {...p} />;
    case 'bedtime': return <BedtimeMission {...p} />;
    case 'doctor': return <DoctorMission {...p} />;
    case 'garden': return <GardenMission {...p} />;
    case 'laundry': return <LaundryMission {...p} />;
    default: return null;
  }
};
