// ============================================
// 戰鬥狀態管理
// ============================================

import { create } from 'zustand';
import type { CombatState, CombatCharacter, CombatAction, CombatRewards } from '@/types';
import { MAX_COMBAT_TURNS } from '@/config/constants';

interface CombatStore {
  // 戰鬥狀態
  combatState: CombatState | null;
  initCombat: (playerTeam: CombatCharacter[], enemyTeam: CombatCharacter[]) => void;

  // 戰鬥流程控制
  isAnimating: boolean;
  currentAction: CombatAction | null;
  setAnimating: (animating: boolean) => void;
  setCurrentAction: (action: CombatAction | null) => void;

  // 戰鬥操作
  addAction: (action: CombatAction) => void;
  nextTurn: () => void;
  updateCharacterHp: (team: 'player' | 'enemy', characterId: string, hp: number) => void;
  updateCharacterEnergy: (team: 'player' | 'enemy', characterId: string, energy: number) => void;
  removeDeadCharacter: (team: 'player' | 'enemy', characterId: string) => void;

  // 戰鬥結束
  endCombat: (winner: 'player' | 'enemy', rewards?: CombatRewards) => void;

  // 重置戰鬥
  resetCombat: () => void;
}

export const useCombatStore = create<CombatStore>((set) => ({
  // 初始狀態
  combatState: null,
  isAnimating: false,
  currentAction: null,

  // 初始化戰鬥
  initCombat: (playerTeam, enemyTeam) =>
    set({
      combatState: {
        turn: 1,
        maxTurns: MAX_COMBAT_TURNS,
        playerTeam: playerTeam.map((c) => ({
          ...c,
          currentHp: c.finalStats.hp,
          currentEnergy: 0,
        })),
        enemyTeam: enemyTeam.map((c) => ({
          ...c,
          currentHp: c.finalStats.hp,
          currentEnergy: 0,
        })),
        actionLog: [],
        isFinished: false,
      },
      isAnimating: false,
      currentAction: null,
    }),

  // 動畫控制
  setAnimating: (animating) => set({ isAnimating: animating }),
  setCurrentAction: (action) => set({ currentAction: action }),

  // 添加戰鬥行動記錄
  addAction: (action) =>
    set((state) => {
      if (!state.combatState) return state;
      return {
        combatState: {
          ...state.combatState,
          actionLog: [...state.combatState.actionLog, action],
        },
      };
    }),

  // 下一回合
  nextTurn: () =>
    set((state) => {
      if (!state.combatState) return state;
      const newTurn = state.combatState.turn + 1;

      // 檢查是否達到最大回合數
      if (newTurn > state.combatState.maxTurns) {
        return {
          combatState: {
            ...state.combatState,
            isFinished: true,
            winner: 'enemy', // 超時算敵人勝利
          },
        };
      }

      return {
        combatState: {
          ...state.combatState,
          turn: newTurn,
        },
      };
    }),

  // 更新角色血量
  updateCharacterHp: (team, characterId, hp) =>
    set((state) => {
      if (!state.combatState) return state;
      const teamKey = team === 'player' ? 'playerTeam' : 'enemyTeam';

      return {
        combatState: {
          ...state.combatState,
          [teamKey]: state.combatState[teamKey].map((c) =>
            c.id === characterId ? { ...c, currentHp: Math.max(0, hp) } : c
          ),
        },
      };
    }),

  // 更新角色能量
  updateCharacterEnergy: (team, characterId, energy) =>
    set((state) => {
      if (!state.combatState) return state;
      const teamKey = team === 'player' ? 'playerTeam' : 'enemyTeam';

      return {
        combatState: {
          ...state.combatState,
          [teamKey]: state.combatState[teamKey].map((c) =>
            c.id === characterId ? { ...c, currentEnergy: Math.min(c.maxEnergy, energy) } : c
          ),
        },
      };
    }),

  // 移除死亡角色
  removeDeadCharacter: (team, characterId) =>
    set((state) => {
      if (!state.combatState) return state;
      const teamKey = team === 'player' ? 'playerTeam' : 'enemyTeam';

      const updatedTeam = state.combatState[teamKey].filter((c) => c.id !== characterId);

      // 檢查是否有隊伍全滅
      let isFinished = state.combatState.isFinished;
      let winner = state.combatState.winner;

      if (updatedTeam.length === 0) {
        isFinished = true;
        winner = team === 'player' ? 'enemy' : 'player';
      }

      return {
        combatState: {
          ...state.combatState,
          [teamKey]: updatedTeam,
          isFinished,
          winner,
        },
      };
    }),

  // 結束戰鬥
  endCombat: (winner, rewards) =>
    set((state) => {
      if (!state.combatState) return state;
      return {
        combatState: {
          ...state.combatState,
          isFinished: true,
          winner,
          rewards,
        },
      };
    }),

  // 重置戰鬥
  resetCombat: () =>
    set({
      combatState: null,
      isAnimating: false,
      currentAction: null,
    }),
}));
