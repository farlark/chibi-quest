// 角色列表頁面 - 查看所有擁有的角色
import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import Button from '@/components/common/Button';
import Dialog from '@/components/common/Dialog';
import { RARITY_COLORS, ELEMENT_COLORS } from '@/config/constants';
import type { CharacterCard } from '@/types';

export default function CharacterList() {
  const { setScene, ownedCharacters } = useGameStore();
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterCard | null>(null);

  const handleCharacterClick = (char: CharacterCard) => {
    setSelectedCharacter(char);
  };

  const handleCloseDialog = () => {
    setSelectedCharacter(null);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
      {/* 固定頂部 */}
      <div className="bg-gray-900 bg-opacity-80 p-3 shadow-lg">
        <h1 className="text-xl font-bold text-white text-center">角色圖鑑</h1>
        <p className="text-sm text-center text-purple-300">擁有 {ownedCharacters.length} 名角色</p>
      </div>

      {/* 可滾動內容 */}
      <div className="flex-1 overflow-y-auto p-3">
        {ownedCharacters.length === 0 ? (
          <div className="text-center text-white mt-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl">還沒有角色</p>
            <p className="text-sm text-gray-400 mt-2">開始冒險來招募角色吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {ownedCharacters.map((char) => {
              const rarityColor = RARITY_COLORS[char.rarity as keyof typeof RARITY_COLORS];
              const elementColor = ELEMENT_COLORS[char.element];

              return (
                <div
                  key={char.id}
                  onClick={() => handleCharacterClick(char)}
                  className="bg-gray-800 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                  style={{ borderTop: `4px solid ${rarityColor}` }}
                >
                  {/* 職業圖標 */}
                  <div className="text-center text-4xl mb-2">
                    {char.job === 'warrior' && '⚔️'}
                    {char.job === 'mage' && '🔮'}
                    {char.job === 'archer' && '🏹'}
                    {char.job === 'tank' && '🛡️'}
                    {char.job === 'healer' && '💚'}
                    {char.job === 'assassin' && '🗡️'}
                  </div>

                  {/* 角色名稱 */}
                  <p className="text-white text-sm font-bold text-center truncate mb-1">
                    {char.name}
                  </p>

                  {/* 等級 */}
                  <div className="text-center mb-2">
                    <span className="text-yellow-400 font-bold text-lg">Lv.{char.level}</span>
                  </div>

                  {/* 屬性和星級 */}
                  <div className="flex justify-center gap-1">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: elementColor + '40', color: elementColor }}
                    >
                      {char.element[0].toUpperCase()}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-yellow-400">
                      {'★'.repeat(char.rarity)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 固定底部 */}
      <div className="bg-gray-900 bg-opacity-80 p-3">
        <Button variant="secondary" fullWidth onClick={() => setScene('main_menu')}>
          返回主選單
        </Button>
      </div>

      {/* 角色詳情 Dialog */}
      {selectedCharacter && (
        <Dialog
          isOpen={true}
          onClose={handleCloseDialog}
          title={selectedCharacter.name}
          variant="info"
          confirmText="關閉"
          showCancel={false}
        >
          <div className="space-y-3">
            {/* 基本資訊 */}
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                {selectedCharacter.job === 'warrior' && '⚔️'}
                {selectedCharacter.job === 'mage' && '🔮'}
                {selectedCharacter.job === 'archer' && '🏹'}
                {selectedCharacter.job === 'tank' && '🛡️'}
                {selectedCharacter.job === 'healer' && '💚'}
                {selectedCharacter.job === 'assassin' && '🗡️'}
              </div>
              <div>
                <p className="text-lg font-bold text-white">{selectedCharacter.name}</p>
                <div className="flex gap-2 mt-1">
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor:
                        ELEMENT_COLORS[selectedCharacter.element] + '40',
                      color: ELEMENT_COLORS[selectedCharacter.element],
                    }}
                  >
                    {selectedCharacter.element}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-700 text-yellow-400">
                    {'★'.repeat(selectedCharacter.rarity)}
                  </span>
                </div>
              </div>
            </div>

            {/* 等級和經驗 */}
            <div className="bg-gray-800 rounded p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">等級</span>
                <span className="text-lg font-bold text-yellow-400">
                  Lv.{selectedCharacter.level}
                </span>
              </div>
              <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full"
                  style={{
                    width: `${(selectedCharacter.exp / (selectedCharacter.level * 100)) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                EXP: {selectedCharacter.exp} / {selectedCharacter.level * 100}
              </p>
            </div>

            {/* 基礎屬性 */}
            <div className="bg-gray-800 rounded p-3">
              <h3 className="text-sm font-bold text-white mb-2">基礎屬性</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">生命值</span>
                  <span className="text-green-400 font-bold">
                    {Math.floor(selectedCharacter.baseStats.hp)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">攻擊力</span>
                  <span className="text-red-400 font-bold">
                    {Math.floor(selectedCharacter.baseStats.atk)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">防禦力</span>
                  <span className="text-blue-400 font-bold">
                    {Math.floor(selectedCharacter.baseStats.def)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">魔防</span>
                  <span className="text-purple-400 font-bold">
                    {Math.floor(selectedCharacter.baseStats.res)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">速度</span>
                  <span className="text-yellow-400 font-bold">
                    {Math.floor(selectedCharacter.baseStats.spd)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">暴擊率</span>
                  <span className="text-orange-400 font-bold">
                    {(selectedCharacter.baseStats.critRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 技能 */}
            <div className="bg-gray-800 rounded p-3">
              <h3 className="text-sm font-bold text-white mb-2">技能</h3>
              <div className="space-y-2">
                {/* 普通技能 */}
                <div className="bg-gray-700 rounded p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-blue-400">
                      {selectedCharacter.normalSkill.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      Lv.{selectedCharacter.normalSkill.level}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {selectedCharacter.normalSkill.description}
                  </p>
                  <p className="text-xs text-purple-400 mt-1">
                    倍率: {selectedCharacter.normalSkill.multiplier.toFixed(1)}x
                  </p>
                </div>

                {/* 終極技能 */}
                <div className="bg-gray-700 rounded p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-purple-400">
                      {selectedCharacter.ultimateSkill.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      Lv.{selectedCharacter.ultimateSkill.level}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {selectedCharacter.ultimateSkill.description}
                  </p>
                  <p className="text-xs text-purple-400 mt-1">
                    倍率: {selectedCharacter.ultimateSkill.multiplier.toFixed(1)}x | 能量:
                    {selectedCharacter.ultimateSkill.energyCost}
                  </p>
                </div>
              </div>
            </div>

            {/* 隊長技 */}
            {selectedCharacter.leaderSkill && (
              <div className="bg-gray-800 rounded p-3">
                <h3 className="text-sm font-bold text-white mb-2">隊長技</h3>
                <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded p-2">
                  <p className="text-sm font-bold text-yellow-400">
                    {selectedCharacter.leaderSkill.name}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    {selectedCharacter.leaderSkill.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
