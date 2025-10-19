// 角色卡片組件
import type { CharacterCard as CharacterCardType } from '@/types';
import { RARITY_COLORS, ELEMENT_COLORS } from '@/config/constants';

interface CharacterCardProps {
  character: CharacterCardType;
  selected?: boolean;
  onClick?: () => void;
  showStats?: boolean;
}

export default function CharacterCard({
  character,
  selected = false,
  onClick,
  showStats = true,
}: CharacterCardProps) {
  const rarityColor = RARITY_COLORS[character.rarity as keyof typeof RARITY_COLORS];
  const elementColor = ELEMENT_COLORS[character.element];

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-gray-800 rounded-lg p-3 cursor-pointer
        transition-all duration-200 hover:scale-105
        ${selected ? 'ring-4 ring-yellow-400 scale-105' : ''}
      `}
      style={{ borderTop: `4px solid ${rarityColor}` }}
    >
      {/* 角色頭像 */}
      <div className="w-full aspect-square bg-gray-700 rounded-lg mb-2 flex items-center justify-center text-4xl">
        {/* 臨時使用 emoji 代替圖片 */}
        {character.job === 'warrior' && '⚔️'}
        {character.job === 'mage' && '🔮'}
        {character.job === 'archer' && '🏹'}
        {character.job === 'tank' && '🛡️'}
        {character.job === 'healer' && '💚'}
        {character.job === 'assassin' && '🗡️'}
      </div>

      {/* 角色名稱 */}
      <div className="text-center mb-1">
        <h3 className="text-white font-bold text-sm">{character.name}</h3>
        <p className="text-xs text-gray-400">Lv.{character.level}</p>
      </div>

      {/* 屬性標籤 */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ backgroundColor: elementColor + '40', color: elementColor }}
        >
          {character.element}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
          {character.job}
        </span>
      </div>

      {/* 基礎屬性 */}
      {showStats && (
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
          <div>HP: {character.baseStats.hp}</div>
          <div>ATK: {character.baseStats.atk}</div>
          <div>DEF: {character.baseStats.def}</div>
          <div>SPD: {character.baseStats.spd}</div>
        </div>
      )}

      {/* 隊長技標記 */}
      {character.leaderSkill && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded">
          隊長
        </div>
      )}

      {/* 稀有度星星 */}
      <div className="flex justify-center mt-2 gap-0.5">
        {Array.from({ length: character.rarity }).map((_, i) => (
          <span key={i} className="text-yellow-400 text-xs">
            ⭐
          </span>
        ))}
      </div>
    </div>
  );
}
