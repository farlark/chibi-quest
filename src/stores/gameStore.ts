// ============================================
// 主遊戲狀態管理
// ============================================

import { create } from 'zustand';
import type {
  GameScene,
  CharacterCard,
  EventCard,
  VeteranTeam,
  GameResources,
  Dungeon,
  RandomEvent,
} from '@/types';
import { INITIAL_RESOURCES } from '@/config/gameConfig';

interface GameStore {
  // 當前場景
  currentScene: GameScene;
  setScene: (scene: GameScene) => void;

  // 遊戲數據
  allCharacters: CharacterCard[];
  allEventCards: EventCard[];
  allDungeons: Dungeon[];
  allEvents: RandomEvent[];
  setGameData: (data: {
    characters: CharacterCard[];
    eventCards: EventCard[];
    dungeons: Dungeon[];
    events: RandomEvent[];
  }) => void;

  // 玩家擁有的資源
  ownedCharacters: CharacterCard[];
  ownedEventCards: EventCard[];
  resources: GameResources;
  addCharacter: (character: CharacterCard) => void;
  addEventCard: (card: EventCard) => void;
  updateResources: (resources: Partial<GameResources>) => void;

  // 歷戰隊伍
  veteranTeams: VeteranTeam[];
  addVeteranTeam: (team: VeteranTeam) => void;
  removeVeteranTeam: (teamId: string) => void;

  // 重置遊戲 (用於測試)
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  currentScene: 'main_menu',
  setScene: (scene) => set({ currentScene: scene }),

  // 遊戲數據
  allCharacters: [],
  allEventCards: [],
  allDungeons: [],
  allEvents: [],
  setGameData: (data) =>
    set({
      allCharacters: data.characters,
      allEventCards: data.eventCards,
      allDungeons: data.dungeons,
      allEvents: data.events,
      // 初始只給玩家3個角色和所有事件卡
      ownedCharacters: data.characters.slice(0, 3).map((c) => ({ ...c })),
      ownedEventCards: data.eventCards.map((e) => ({ ...e })),
    }),

  // 玩家資源
  ownedCharacters: [],
  ownedEventCards: [],
  resources: { ...INITIAL_RESOURCES },
  addCharacter: (character) =>
    set((state) => ({
      ownedCharacters: [...state.ownedCharacters, character],
    })),
  addEventCard: (card) =>
    set((state) => ({
      ownedEventCards: [...state.ownedEventCards, card],
    })),
  updateResources: (resources) =>
    set((state) => ({
      resources: { ...state.resources, ...resources },
    })),

  // 歷戰隊伍
  veteranTeams: [],
  addVeteranTeam: (team) =>
    set((state) => ({
      veteranTeams: [...state.veteranTeams, team],
    })),
  removeVeteranTeam: (teamId) =>
    set((state) => ({
      veteranTeams: state.veteranTeams.filter((t) => t.id !== teamId),
    })),

  // 重置
  resetGame: () =>
    set({
      currentScene: 'main_menu',
      ownedCharacters: [],
      ownedEventCards: [],
      resources: { ...INITIAL_RESOURCES },
      veteranTeams: [],
    }),
}));
