// ============================================
// 冒險狀態管理
// ============================================

import { create } from 'zustand';
import type {
  Dungeon,
  Team,
  CombatCharacter,
  EventCard,
  CharacterCard,
} from '@/types';
import { MAX_TEAM_SIZE } from '@/config/constants';

interface AdventureStore {
  // 當前選擇的地城
  selectedDungeon: Dungeon | null;
  setSelectedDungeon: (dungeon: Dungeon | null) => void;

  // 冒險隊伍
  adventureTeam: Team | null;
  setAdventureTeam: (team: Team) => void;
  updateTeamLevel: (level: number, exp: number) => void;
  updateTeamStoryness: (storyness: number) => void;
  addCharacterToTeam: (character: CombatCharacter) => void;
  updateCharacterInTeam: (characterId: string, updates: Partial<CombatCharacter>) => void;
  removeCharacterFromTeam: (characterId: string) => void;

  // 冒險進度
  currentNodeIndex: number;
  completedNodes: string[];
  defeatedBoss: boolean;
  advanceToNextNode: () => void;
  setDefeatedBoss: (defeated: boolean) => void;

  // 編隊階段
  selectedCharacters: CharacterCard[];
  selectedEventCards: EventCard[];
  leaderId: string | null;
  characterPositions: Record<string, number>; // characterId -> position (0-5, 0-2前排, 3-5後排)
  toggleCharacterSelection: (character: CharacterCard) => void;
  toggleEventCardSelection: (card: EventCard) => void;
  setLeader: (characterId: string) => void;
  setCharacterPosition: (characterId: string, position: number) => void;
  swapCharacterPositions: (pos1: number, pos2: number) => void;
  canStartAdventure: () => boolean;

  // 重置冒險
  resetAdventure: () => void;
}

// localStorage key
const STORAGE_KEY = 'chibi-quest-adventure';

// 從 localStorage 載入狀態
const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load adventure state:', e);
  }
  return {};
};

// 儲存狀態到 localStorage
const saveState = (state: Partial<AdventureStore>) => {
  try {
    const toSave = {
      selectedCharacters: state.selectedCharacters,
      selectedEventCards: state.selectedEventCards,
      leaderId: state.leaderId,
      characterPositions: state.characterPositions,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save adventure state:', e);
  }
};

const initialState = loadState();

export const useAdventureStore = create<AdventureStore>((set, get) => ({
  // 地城選擇
  selectedDungeon: null,
  setSelectedDungeon: (dungeon) => set({ selectedDungeon: dungeon }),

  // 冒險隊伍
  adventureTeam: null,
  setAdventureTeam: (team) => set({ adventureTeam: team }),
  updateTeamLevel: (level, exp) =>
    set((state) => {
      if (!state.adventureTeam) return state;
      return {
        adventureTeam: {
          ...state.adventureTeam,
          teamLevel: level,
          teamExp: exp,
        },
      };
    }),
  updateTeamStoryness: (storyness) =>
    set((state) => {
      if (!state.adventureTeam) return state;
      return {
        adventureTeam: {
          ...state.adventureTeam,
          teamStoryness: state.adventureTeam.teamStoryness + storyness,
        },
      };
    }),
  addCharacterToTeam: (character) =>
    set((state) => {
      if (!state.adventureTeam || state.adventureTeam.characters.length >= MAX_TEAM_SIZE) {
        return state;
      }
      return {
        adventureTeam: {
          ...state.adventureTeam,
          characters: [...state.adventureTeam.characters, character],
        },
      };
    }),
  updateCharacterInTeam: (characterId, updates) =>
    set((state) => {
      if (!state.adventureTeam) return state;
      return {
        adventureTeam: {
          ...state.adventureTeam,
          characters: state.adventureTeam.characters.map((c) =>
            c.id === characterId ? { ...c, ...updates } : c
          ),
        },
      };
    }),
  removeCharacterFromTeam: (characterId) =>
    set((state) => {
      if (!state.adventureTeam) return state;
      return {
        adventureTeam: {
          ...state.adventureTeam,
          characters: state.adventureTeam.characters.filter((c) => c.id !== characterId),
        },
      };
    }),

  // 冒險進度
  currentNodeIndex: 0,
  completedNodes: [],
  defeatedBoss: false,
  advanceToNextNode: () =>
    set((state) => ({
      currentNodeIndex: state.currentNodeIndex + 1,
      completedNodes: [
        ...state.completedNodes,
        state.selectedDungeon?.nodes[state.currentNodeIndex]?.id || '',
      ],
    })),
  setDefeatedBoss: (defeated) => set({ defeatedBoss: defeated }),

  // 編隊階段
  selectedCharacters: initialState.selectedCharacters || [],
  selectedEventCards: initialState.selectedEventCards || [],
  leaderId: initialState.leaderId || null,
  characterPositions: initialState.characterPositions || {},

  toggleCharacterSelection: (character) =>
    set((state) => {
      const isSelected = state.selectedCharacters.some((c) => c.id === character.id);
      let newState: any;
      if (isSelected) {
        // 移除角色，同時移除其站位資訊
        const newPositions = { ...state.characterPositions };
        delete newPositions[character.id];
        newState = {
          selectedCharacters: state.selectedCharacters.filter((c) => c.id !== character.id),
          leaderId: state.leaderId === character.id ? null : state.leaderId,
          characterPositions: newPositions,
        };
      } else {
        if (state.selectedCharacters.length >= 6) return state; // 最多選6個
        // 新增角色，自動分配下一個空位
        const occupiedPositions = Object.values(state.characterPositions);
        let nextPosition = 0;
        while (occupiedPositions.includes(nextPosition) && nextPosition < 6) {
          nextPosition++;
        }
        newState = {
          selectedCharacters: [...state.selectedCharacters, character],
          characterPositions: { ...state.characterPositions, [character.id]: nextPosition },
        };
      }
      saveState({ ...state, ...newState });
      return newState;
    }),
  toggleEventCardSelection: (card) =>
    set((state) => {
      const isSelected = state.selectedEventCards.some((c) => c.id === card.id);
      let newState;
      if (isSelected) {
        newState = {
          selectedEventCards: state.selectedEventCards.filter((c) => c.id !== card.id),
        };
      } else {
        if (state.selectedEventCards.length >= 6) return state; // 最多選6個
        newState = {
          selectedEventCards: [...state.selectedEventCards, card],
        };
      }
      saveState({ ...state, ...newState });
      return newState;
    }),
  setLeader: (characterId) => {
    set((state) => {
      const newState = { leaderId: characterId };
      saveState({ ...state, ...newState });
      return newState;
    });
  },

  setCharacterPosition: (characterId, position) =>
    set((state) => {
      const newState = {
        characterPositions: { ...state.characterPositions, [characterId]: position },
      };
      saveState({ ...state, ...newState });
      return newState;
    }),

  swapCharacterPositions: (pos1, pos2) =>
    set((state) => {
      // 找到在這兩個位置的角色
      const char1 = Object.entries(state.characterPositions).find(([_, pos]) => pos === pos1)?.[0];
      const char2 = Object.entries(state.characterPositions).find(([_, pos]) => pos === pos2)?.[0];

      const newPositions = { ...state.characterPositions };

      if (char1 && char2) {
        // 兩個位置都有角色，交換
        newPositions[char1] = pos2;
        newPositions[char2] = pos1;
      } else if (char1) {
        // 只有 pos1 有角色，移動到 pos2
        newPositions[char1] = pos2;
      } else if (char2) {
        // 只有 pos2 有角色，移動到 pos1
        newPositions[char2] = pos1;
      }

      const newState = { characterPositions: newPositions };
      saveState({ ...state, ...newState });
      return newState;
    }),

  canStartAdventure: () => {
    const state = get();
    return (
      state.selectedCharacters.length >= 1 &&
      state.selectedCharacters.length <= 6 &&
      state.leaderId !== null &&
      state.selectedDungeon !== null
    );
  },

  // 重置 (不清除選擇的角色和隊長)
  resetAdventure: () =>
    set({
      selectedDungeon: null,
      adventureTeam: null,
      currentNodeIndex: 0,
      completedNodes: [],
      defeatedBoss: false,
      // 保留 selectedCharacters, selectedEventCards, leaderId
    }),
}));
