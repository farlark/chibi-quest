// ============================================
// CSV 數據加載器
// ============================================

import Papa from 'papaparse';
import type {
  CharacterCard,
  EventCard,
  Dungeon,
  RandomEvent,
  ElementType,
  JobType,
  BaseStats,
  Skill,
  LeaderSkill,
  EventChoice,
  EventResult,
} from '@/types';
import { DEFAULT_CHARACTER_STATS, DEFAULT_SKILL_MULTIPLIERS } from '@/config/gameConfig';

// CSV 數據緩存
const dataCache = new Map<string, any[]>();

/**
 * 通用 CSV 加載函數
 */
async function loadCSV<T>(path: string, transform: (row: any) => T): Promise<T[]> {
  // 檢查緩存
  if (dataCache.has(path)) {
    return dataCache.get(path)!;
  }

  try {
    const response = await fetch(path);
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data.map(transform);
            dataCache.set(path, data);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error(`Failed to load CSV from ${path}:`, error);
    throw error;
  }
}

/**
 * 加載角色數據
 */
export async function loadCharacters(): Promise<CharacterCard[]> {
  return loadCSV('/data/characters.csv', (row): CharacterCard => {
    const baseStats: BaseStats = {
      hp: parseFloat(row.hp) || DEFAULT_CHARACTER_STATS.hp,
      atk: parseFloat(row.atk) || DEFAULT_CHARACTER_STATS.atk,
      def: parseFloat(row.def) || DEFAULT_CHARACTER_STATS.def,
      res: parseFloat(row.res) || DEFAULT_CHARACTER_STATS.res,
      spd: parseFloat(row.spd) || DEFAULT_CHARACTER_STATS.spd,
      critRate: parseFloat(row.critRate) || DEFAULT_CHARACTER_STATS.critRate,
      critDmg: parseFloat(row.critDmg) || DEFAULT_CHARACTER_STATS.critDmg,
    };

    // 生成基礎技能 (後續可以從技能CSV加載)
    const normalSkill: Skill = {
      id: `${row.id}_normal`,
      name: '普通攻擊',
      description: '基礎攻擊',
      level: 1,
      maxLevel: 3,
      damageType: row.job === 'mage' ? 'magical' : 'physical',
      multiplier: DEFAULT_SKILL_MULTIPLIERS.normal,
      energyCost: 0,
      targetType: 'single',
    };

    const ultimateSkill: Skill = {
      id: `${row.id}_ultimate`,
      name: `${row.name}的絕招`,
      description: '強力的終極技能',
      level: 1,
      maxLevel: 3,
      damageType: row.job === 'mage' ? 'magical' : 'physical',
      multiplier: DEFAULT_SKILL_MULTIPLIERS.ultimate,
      energyCost: 100,
      targetType: row.job === 'mage' ? 'all' : 'single',
    };

    // 生成隊長技 (如果有)
    let leaderSkill: LeaderSkill | undefined;
    if (row.hasLeaderSkill === '1') {
      leaderSkill = {
        id: `${row.id}_leader`,
        name: `${row.name}的領導`,
        description: `隊伍全體${row.element}屬性角色攻擊力+15%`,
        effects: [
          {
            stat: 'atk',
            type: 'percent',
            value: 0.15,
            condition: `element:${row.element}`,
          },
        ],
      };
    }

    return {
      id: row.id,
      name: row.name,
      rarity: parseInt(row.rarity) || 1,
      element: row.element as ElementType,
      job: row.job as JobType,
      baseStats,
      dungeonAffinities: {}, // 後續可擴展
      normalSkill,
      ultimateSkill,
      leaderSkill,
      portrait: `/assets/portraits/${row.id}.png`,
      chibiSprite: `/assets/chibi/${row.id}.png`,
      level: 1,
      exp: 0,
      growthPercent: 0,
    };
  });
}

/**
 * 加載事件卡數據
 */
export async function loadEventCards(): Promise<EventCard[]> {
  return loadCSV('/data/eventCards.csv', (row): EventCard => {
    return {
      id: row.id,
      name: row.name,
      rarity: parseInt(row.rarity) || 1,
      description: row.description,
      effects: [
        {
          type: row.effectType,
          description: row.description,
          value: row.effectValue,
          condition: row.effectCondition,
        },
      ],
      icon: `/assets/event_cards/${row.id}.png`,
    };
  });
}

/**
 * 解析事件選項結果
 */
function parseEventResult(
  resultDesc: string,
  statChange: string,
  storyness: string
): EventResult {
  const result: EventResult = {
    description: resultDesc,
  };

  // 解析數值變化
  if (statChange && statChange.trim()) {
    result.statChanges = statChange.split('|').map((change) => {
      const [target, stat, value] = change.split(':');
      // 驗證所有部分都存在且有效（如果格式不對，可能是描述文字，忽略它）
      if (!target || !stat || !value || isNaN(parseFloat(value))) {
        // 不再警告，因為有些描述文字會被誤放在這個欄位
        return null;
      }
      return {
        characterId: target === 'all' || target === 'random' ? undefined : target,
        stat: stat as keyof BaseStats,
        value: parseFloat(value),
      };
    }).filter((change): change is NonNullable<typeof change> => change !== null);
  }

  // 解析故事性變化
  if (storyness && storyness.trim()) {
    result.storyness = parseInt(storyness);
  }

  return result;
}

/**
 * 加載隨機事件數據
 */
export async function loadRandomEvents(): Promise<RandomEvent[]> {
  return loadCSV('/data/events.csv', (row): RandomEvent => {
    const event: RandomEvent = {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type as 'choice' | 'encounter',
      rarity: parseInt(row.rarity) || 1,
      requireStoryness: row.requireStoryness ? parseInt(row.requireStoryness) : undefined,
    };

    if (event.type === 'choice') {
      const choices: EventChoice[] = [];

      // 解析選項1
      if (row.choice1Text) {
        choices.push({
          id: `${row.id}_choice1`,
          text: row.choice1Text,
          result: parseEventResult(
            row.choice1ResultDesc,
            row.choice1StatChange,
            row.choice1Storyness
          ),
        });
      }

      // 解析選項2
      if (row.choice2Text) {
        choices.push({
          id: `${row.id}_choice2`,
          text: row.choice2Text,
          result: parseEventResult(
            row.choice2ResultDesc,
            row.choice2StatChange,
            row.choice2Storyness
          ),
        });
      }

      // 解析選項3
      if (row.choice3Text) {
        choices.push({
          id: `${row.id}_choice3`,
          text: row.choice3Text,
          result: parseEventResult(
            row.choice3ResultDesc,
            row.choice3StatChange,
            row.choice3Storyness
          ),
        });
      }

      event.choices = choices;
    } else if (event.type === 'encounter') {
      // 遭遇型事件直接有結果
      event.autoResult = parseEventResult(
        row.choice1ResultDesc,
        row.choice1StatChange,
        row.choice1Storyness
      );
    }

    return event;
  });
}

/**
 * 加載地城數據
 */
export async function loadDungeons(): Promise<Dungeon[]> {
  return loadCSV('/data/dungeons.csv', (row): Dungeon => {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      difficulty: parseInt(row.difficulty) || 1,
      recommendedPower: parseInt(row.recommendedPower) || 100,
      environment: row.environment,
      enemyElements: (row.enemyElements || '').split(';').filter(Boolean) as ElementType[],
      availableRecruits: (row.availableRecruits || '').split(';').filter(Boolean),
      numNodes: parseInt(row.numNodes) || 7, // 讀取節點數量，預設7
      rewards: [],
      nodes: [], // 節點會在冒險開始時動態生成
      bosses: [], // Boss 會在冒險系統中動態生成
    };
  });
}

/**
 * 清除所有緩存
 */
export function clearDataCache(): void {
  dataCache.clear();
}

/**
 * 重新加載特定數據
 */
export async function reloadData(type: 'characters' | 'events' | 'eventCards' | 'dungeons') {
  const loaders = {
    characters: loadCharacters,
    events: loadRandomEvents,
    eventCards: loadEventCards,
    dungeons: loadDungeons,
  };

  const loader = loaders[type];
  if (loader) {
    // 清除對應緩存
    dataCache.delete(`/data/${type}.csv`);
    return await loader();
  }
}

// 導出一個便捷的加載所有數據的函數
export async function loadAllGameData() {
  const [characters, events, eventCards, dungeons] = await Promise.all([
    loadCharacters(),
    loadRandomEvents(),
    loadEventCards(),
    loadDungeons(),
  ]);

  return {
    characters,
    events,
    eventCards,
    dungeons,
  };
}
