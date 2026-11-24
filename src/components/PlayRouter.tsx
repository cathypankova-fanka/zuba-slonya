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
import { PopitGame } from './PopitGame';
import { PhoneGame } from './PhoneGame';
import { TraceGame } from './TraceGame';
import { FaceMission } from './FaceMission';
import { TShirtMission } from './TShirtMission';
import { BathMission } from './BathMission';
import { ShopMission } from './ShopMission';
import { MusicGame } from './MusicGame';
import { HouseMission } from './HouseMission';
import { BirthdayMission } from './BirthdayMission';
import { PastaMission } from './PastaMission';
import { BurgerMission } from './BurgerMission';
import { StrawGame } from './StrawGame';
import { DominoGame } from './DominoGame';
import { MarbleRun } from './MarbleRun';
import { FruitArtMission } from './FruitArtMission';
import { CoinShopGame } from './CoinShopGame';
import { FishingGame } from './FishingGame';
import { LiftGame } from './LiftGame';
import { RainMission } from './RainMission';
import { FriendVisit } from './PlayKit';

/** Старые режимы, переделанные в пошаговые миссии. */
export const REMADE_MODES: string[] = ['face', 'tshirt', 'wash', 'shadow'];

/** Маршрутизатор новых мини-игр. */
export const PlayRouter: React.FC<{ mode: PlayMode | string; character: CharacterItem; soundEnabled: boolean }> = ({ mode, character, soundEnabled }) => {
  const p = { character, soundEnabled };
  switch (mode) {
    case 'milkshake': return <MilkshakeMission {...p} />;
    case 'pancakes': return <PancakesMission {...p} />;
    case 'cookies': return <CookiesMission {...p} />;
    case 'popcorn': return <PopcornMission {...p} />;
    case 'skewers': return <SkewersMission {...p} />;
    case 'picnic': return <PicnicMission {...p} />;
    case 'bedtime': return <FriendVisit exceptId={character.id} soundEnabled={soundEnabled}>{(f, nr) => <BedtimeMission character={f} soundEnabled={soundEnabled} onNewRound={nr} />}</FriendVisit>;
    case 'doctor': return <DoctorMission {...p} />;
    case 'garden': return <GardenMission {...p} />;
    case 'laundry': return <LaundryMission {...p} />;
    case 'popit': return <PopitGame soundEnabled={soundEnabled} />;
    case 'phone': return <PhoneGame {...p} />;
    case 'numbers': return <TraceGame key="n" kind="numbers" soundEnabled={soundEnabled} />;
    case 'letters': return <TraceGame key="l" kind="letters" soundEnabled={soundEnabled} />;
    case 'music': return <MusicGame {...p} />;
    case 'house': return <HouseMission {...p} />;
    case 'birthday': return <BirthdayMission {...p} />;
    case 'pasta': return <PastaMission {...p} />;
    case 'burger': return <BurgerMission {...p} />;
    case 'straws': return <StrawGame {...p} />;
    case 'domino': return <DominoGame {...p} />;
    case 'marble': return <MarbleRun {...p} />;
    case 'fruitart': return <FruitArtMission {...p} />;
    case 'coins': return <CoinShopGame {...p} />;
    case 'fishing': return <FishingGame {...p} />;
    case 'lift': return <LiftGame {...p} />;
    case 'rain': return <RainMission {...p} />;
    case 'shadow': return <ShopMission {...p} />;
    case 'face': return <FaceMission {...p} />;
    case 'tshirt': return <TShirtMission {...p} />;
    case 'wash': return <FriendVisit exceptId={character.id} soundEnabled={soundEnabled}>{(f, nr) => <BathMission character={f} soundEnabled={soundEnabled} onNewRound={nr} />}</FriendVisit>;
    default: return null;
  }
};
