// ============================================
// 隨機事件系統
// ============================================

import type {
  RandomEvent,
  EventResult,
  EventChoice,
  Team,
  CombatCharacter,
  Trait,
  BaseStats,
} from '@/types';

/**
 * 應用事件結果到隊伍
 */
export function applyEventResult(team: Team, result: EventResult): Team {
  const updatedTeam = { ...team };

  // 應用數值變化
  if (result.statChanges) {
    result.statChanges.forEach((change) => {
      if (change.characterId) {
        // 特定角色
        const charIndex = updatedTeam.characters.findIndex((c) => c.id === change.characterId);
        if (charIndex !== -1) {
          const char = updatedTeam.characters[charIndex];
          applyStatChange(char, change.stat, change.value);
        }
      } else {
        // 全隊或隨機
        updatedTeam.characters.forEach((char) => {
          applyStatChange(char, change.stat, change.value);
        });
      }
    });
  }

  // 應用故事性變化
  if (result.storyness) {
    updatedTeam.teamStoryness += result.storyness;
    // 同時給隊伍中所有角色增加故事性
    updatedTeam.characters.forEach((char) => {
      char.storyness += result.storyness! / updatedTeam.characters.length;
    });
  }

  // 應用特性/稱號
  if (result.traits) {
    result.traits.forEach((trait) => {
      // 給隨機一個角色添加特性
      const randomIndex = Math.floor(Math.random() * updatedTeam.characters.length);
      const char = updatedTeam.characters[randomIndex];

      // 檢查是否已有該特性
      if (!char.traits.some((t) => t.id === trait.id)) {
        char.traits.push(trait);
      }
    });
  }

  return updatedTeam;
}

/**
 * 應用數值變化到角色
 */
function applyStatChange(character: CombatCharacter, stat: keyof BaseStats, value: number) {
  // 直接修改 finalStats
  character.finalStats[stat] += value;

  // 如果是 HP,同時更新當前 HP
  if (stat === 'hp') {
    character.currentHp += value;
    // 確保 HP 不超過最大值和不低於 1
    character.currentHp = Math.max(1, Math.min(character.currentHp, character.finalStats.hp));
  }

  // 確保數值不會變成負數 (除了 HP 外)
  if (stat !== 'hp') {
    character.finalStats[stat] = Math.max(0, character.finalStats[stat]);
  }
}

/**
 * 檢查事件選項是否可用
 */
export function isChoiceAvailable(choice: EventChoice, team: Team): boolean {
  if (!choice.requirement) return true;

  const { type, value } = choice.requirement;

  switch (type) {
    case 'trait':
      // 檢查隊伍中是否有角色擁有該特性
      return team.characters.some((char) =>
        char.traits.some((trait) => trait.id === value)
      );

    case 'job':
      // 檢查隊伍中是否有該職業
      return team.characters.some((char) => char.job === value);

    case 'element':
      // 檢查隊伍中是否有該屬性
      return team.characters.some((char) => char.element === value);

    case 'storyness':
      // 檢查隊伍故事性是否足夠
      return team.teamStoryness >= (value as number);

    default:
      return true;
  }
}

/**
 * 獲取事件的可用選項
 */
export function getAvailableChoices(event: RandomEvent, team: Team): EventChoice[] {
  if (event.type === 'encounter' || !event.choices) {
    return [];
  }

  return event.choices.filter((choice) => isChoiceAvailable(choice, team));
}

/**
 * 生成事件結果描述
 */
export function generateEventResultDescription(result: EventResult, _team: Team): string {
  let description = result.description;

  // 添加數值變化的詳細描述
  if (result.statChanges && result.statChanges.length > 0) {
    const changes = result.statChanges
      .filter((change) => change.stat && !isNaN(change.value))
      .map((change) => {
        const sign = change.value >= 0 ? '+' : '';
        const statName = getStatName(change.stat);
        return `${statName} ${sign}${change.value}`;
      });
    if (changes.length > 0) {
      description += `\n\n數值變化: ${changes.join(', ')}`;
    }
  }

  // 添加故事性變化
  if (result.storyness) {
    const sign = result.storyness >= 0 ? '+' : '';
    description += `\n故事性 ${sign}${result.storyness}`;
  }

  // 添加特性獲得
  if (result.traits && result.traits.length > 0) {
    const traitNames = result.traits.map((t) => t.name).join(', ');
    description += `\n\n獲得特性: ${traitNames}`;
  }

  return description;
}

/**
 * 獲取屬性中文名稱
 */
function getStatName(stat: keyof BaseStats): string {
  const names: Record<keyof BaseStats, string> = {
    hp: '生命值',
    atk: '攻擊力',
    def: '防禦力',
    res: '魔法防禦',
    spd: '速度',
    critRate: '暴擊率',
    critDmg: '暴擊傷害',
  };
  return names[stat] || stat;
}

/**
 * 生成特性 (用於事件獎勵)
 */
export function generateTrait(
  id: string,
  name: string,
  description: string,
  statModifiers: Array<{ stat: keyof BaseStats; value: number }>
): Trait {
  return {
    id,
    name,
    description,
    statModifiers: statModifiers.map((mod) => ({
      stat: mod.stat,
      type: 'fixed' as const,
      value: mod.value,
    })),
  };
}

/**
 * 預定義的特性列表 (可以從CSV加載)
 */
export const PREDEFINED_TRAITS: Record<string, Trait> = {
  dragonslayer: generateTrait(
    'dragonslayer',
    '屠龍者',
    '擊敗過龍族的勇者',
    [
      { stat: 'atk', value: 15 },
      { stat: 'hp', value: 30 },
    ]
  ),
  berserker: generateTrait(
    'berserker',
    '狂戰士',
    '以生命換取力量',
    [
      { stat: 'atk', value: 20 },
      { stat: 'def', value: -5 },
    ]
  ),
  blessed: generateTrait(
    'blessed',
    '神的祝福',
    '受到神明眷顧',
    [
      { stat: 'hp', value: 40 },
      { stat: 'def', value: 10 },
      { stat: 'res', value: 10 },
    ]
  ),
  speedster: generateTrait(
    'speedster',
    '疾風',
    '快如閃電的身手',
    [
      { stat: 'spd', value: 15 },
      { stat: 'critRate', value: 0.05 },
    ]
  ),
  tank: generateTrait(
    'tank',
    '鐵壁',
    '堅不可摧的防禦',
    [
      { stat: 'hp', value: 50 },
      { stat: 'def', value: 15 },
    ]
  ),
  lucky: generateTrait(
    'lucky',
    '幸運星',
    '受命運眷顧',
    [
      { stat: 'critRate', value: 0.08 },
      { stat: 'critDmg', value: 0.2 },
    ]
  ),
};

/**
 * 隨機獲得一個特性
 */
export function getRandomTrait(): Trait {
  const traits = Object.values(PREDEFINED_TRAITS);
  return traits[Math.floor(Math.random() * traits.length)];
}
