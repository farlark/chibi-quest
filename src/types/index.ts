// ============================================
// 遊戲核心類型定義
// ============================================

// 戰鬥屬性類型
export type ElementType = 'fire' | 'water' | 'wind' | 'light' | 'dark';

// 職業類型
export type JobType = 'warrior' | 'archer' | 'mage' | 'tank' | 'healer' | 'assassin';

// 地城適性等級
export type DungeonAffinity = 'S' | 'A' | 'C';

// 站位類型
export type PositionType = 'front' | 'back';

// 技能傷害類型
export type DamageType = 'physical' | 'magical';

// ============================================
// 角色相關類型
// ============================================

// 基礎數值
export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  res: number;
  spd: number;
  critRate: number;
  critDmg: number;
}

// 技能定義
export interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  damageType: DamageType;
  multiplier: number; // 技能倍率
  energyCost: number; // 能量消耗
  targetType: 'single' | 'all' | 'random'; // 目標類型
  effects?: SkillEffect[]; // 附加效果
}

// 技能效果
export interface SkillEffect {
  type: 'buff' | 'debuff' | 'heal' | 'damage';
  stat?: keyof BaseStats;
  value: number;
  duration?: number; // 持續回合數
}

// 隊長技
export interface LeaderSkill {
  id: string;
  name: string;
  description: string;
  effects: StatModifier[];
}

// 數值修改器
export interface StatModifier {
  stat: keyof BaseStats | 'all';
  type: 'percent' | 'fixed';
  value: number;
  condition?: string; // 觸發條件描述
}

// 角色卡
export interface CharacterCard {
  id: string;
  name: string;
  rarity: number; // 稀有度 1-5
  element: ElementType;
  job: JobType;
  baseStats: BaseStats;
  dungeonAffinities: Record<string, DungeonAffinity>; // 地城ID -> 適性
  normalSkill: Skill; // 小招
  ultimateSkill: Skill; // 絕招
  leaderSkill?: LeaderSkill; // 隊長技(可選)
  portrait: string; // 立繪圖片路徑
  chibiSprite: string; // Q版小人圖片路徑
  // 養成相關
  level: number;
  exp: number;
  growthPercent: number; // 養成百分比加成
}

// 戰鬥中的角色實例
export interface CombatCharacter extends CharacterCard {
  position: PositionType;
  currentHp: number;
  currentEnergy: number;
  maxEnergy: number;
  finalStats: BaseStats; // 計算後的最終屬性
  activeEffects: ActiveEffect[]; // 當前生效的效果
  storyness: number; // 故事性數值
  traits: Trait[]; // 特性/稱號
}

// 激活的效果
export interface ActiveEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  statModifiers: StatModifier[];
  remainingTurns: number;
}

// 特性/稱號
export interface Trait {
  id: string;
  name: string;
  description: string;
  statModifiers: StatModifier[];
  icon?: string;
}

// ============================================
// 事件卡類型
// ============================================

export interface EventCard {
  id: string;
  name: string;
  description: string;
  rarity: number;
  effects: EventCardEffect[];
  icon: string;
}

export interface EventCardEffect {
  type: 'stat_boost' | 'skill_boost' | 'recruitment_boost' | 'event_rate';
  description: string;
  value: number | string;
  condition?: string;
}

// ============================================
// 隊伍類型
// ============================================

export interface Team {
  id: string;
  name: string;
  characters: CombatCharacter[];
  leaderId: string; // 隊長ID
  eventCards: EventCard[]; // 攜帶的事件卡
  teamLevel: number;
  teamExp: number;
  teamStoryness: number; // 隊伍故事性
}

// 歷戰隊伍
export interface VeteranTeam extends Team {
  createdAt: number; // 時間戳
  dungeonId: string; // 來源地城
  totalPower: number; // 總戰力
  achievements: string[]; // 成就列表
}

// ============================================
// 戰鬥相關類型
// ============================================

export interface CombatState {
  turn: number;
  maxTurns: number;
  playerTeam: CombatCharacter[];
  enemyTeam: CombatCharacter[];
  actionLog: CombatAction[];
  isFinished: boolean;
  winner?: 'player' | 'enemy';
  rewards?: CombatRewards;
}

export interface CombatAction {
  turn: number;
  actorId: string;
  actorName: string;
  actionType: 'attack' | 'skill' | 'ultimate' | 'dead';
  targetId?: string;
  targetName?: string;
  damage?: number;
  isCritical?: boolean;
  effects?: string[];
}

export interface CombatRewards {
  exp: number;
  gold?: number;
  items?: string[];
}

// ============================================
// 冒險相關類型
// ============================================

export interface Dungeon {
  id: string;
  name: string;
  description: string;
  difficulty: number; // 難度等級
  recommendedPower: number; // 推薦戰力
  environment: string; // 環境描述
  enemyElements: ElementType[]; // 主要敵人屬性
  availableRecruits: string[]; // 可招募角色ID列表
  rewards: string[];
  numNodes: number; // 節點數量
  nodes: AdventureNode[]; // 冒險節點
  bosses: Enemy[]; // Boss列表
}

export interface AdventureNode {
  id: string;
  type: 'combat' | 'event' | 'boss' | 'rest';
  enemies?: Enemy[];
  event?: RandomEvent;
}

export interface Enemy {
  id: string;
  name: string;
  element: ElementType;
  level: number;
  stats: BaseStats;
  skills: Skill[];
  isBoss: boolean;
  sprite: string;
}

export interface RandomEvent {
  id: string;
  name: string;
  description: string;
  type: 'choice' | 'encounter'; // 抉擇型 / 遭遇型
  choices?: EventChoice[];
  autoResult?: EventResult; // 遭遇型事件的直接結果
  rarity: number; // 稀有度,影響出現機率
  requireStoryness?: number; // 需要的故事性最低值
}

export interface EventChoice {
  id: string;
  text: string;
  description?: string;
  result: EventResult;
  requirement?: EventRequirement;
}

export interface EventRequirement {
  type: 'trait' | 'job' | 'element' | 'storyness';
  value: string | number;
}

export interface EventResult {
  description: string;
  statChanges?: Array<{
    characterId?: string; // 不指定則全隊
    stat: keyof BaseStats;
    value: number;
  }>;
  storyness?: number; // 故事性變化
  traits?: Trait[]; // 獲得的特性
  recruitCharacter?: string; // 招募角色ID
  gold?: number;
}

// ============================================
// 升級獎勵類型
// ============================================

export interface LevelUpReward {
  id: string;
  type: 'recruit' | 'skill_upgrade' | 'stat_boost';
  recruit?: CharacterCard; // 可招募的角色
  skillUpgrade?: {
    characterId: string;
    skillType: 'normal' | 'ultimate';
    level: number;
  };
  statBoost?: {
    characterId: string;
    stats: Partial<BaseStats>;
  };
}

// ============================================
// 遊戲狀態類型
// ============================================

export interface GameState {
  currentScene: GameScene;
  ownedCharacters: CharacterCard[]; // 擁有的角色卡
  ownedEventCards: EventCard[]; // 擁有的事件卡
  veteranTeams: VeteranTeam[]; // 歷戰隊伍列表
  currentAdventure?: AdventureState; // 當前冒險狀態
  resources: GameResources;
}

export type GameScene =
  | 'main_menu'
  | 'adventure_select'
  | 'team_formation'
  | 'adventure'
  | 'combat'
  | 'level_up'
  | 'event'
  | 'adventure_result'
  | 'veteran_management'
  | 'pve_boss'
  | 'character_list'
  | 'pvp_arena';

export interface AdventureState {
  dungeon: Dungeon;
  team: Team;
  currentNodeIndex: number;
  completedNodes: string[];
  defeatedBoss: boolean;
}

export interface GameResources {
  gold: number;
  gems: number;
  // 其他資源...
}
