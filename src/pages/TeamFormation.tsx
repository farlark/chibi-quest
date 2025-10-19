// 編隊頁面 - 優化為豎屏單頁顯示
import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useAdventureStore } from '@/stores/adventureStore';
import Button from '@/components/common/Button';
import Dialog from '@/components/common/Dialog';
import { initializeAdventureTeam, generateAdventureNodes } from '@/utils/adventureEngine';
import { RARITY_COLORS, ELEMENT_COLORS } from '@/config/constants';
import type { CharacterCard } from '@/types';

export default function TeamFormation() {
  const { ownedCharacters, ownedEventCards, setScene } = useGameStore();
  const {
    selectedDungeon,
    selectedCharacters,
    selectedEventCards,
    leaderId,
    characterPositions,
    toggleCharacterSelection,
    toggleEventCardSelection,
    setLeader,
    swapCharacterPositions,
    canStartAdventure,
    setAdventureTeam,
  } = useAdventureStore();

  const [showEventCards, setShowEventCards] = useState(false);
  const [viewingCharacter, setViewingCharacter] = useState<CharacterCard | null>(null);
  const [draggedPosition, setDraggedPosition] = useState<number | null>(null);

  const handleStartAdventure = () => {
    if (!canStartAdventure() || !selectedDungeon) return;

    const team = initializeAdventureTeam(
      selectedCharacters,
      selectedEventCards,
      leaderId!,
      selectedDungeon.id,
      characterPositions
    );

    const nodes = generateAdventureNodes(selectedDungeon, 1);
    const updatedDungeon = { ...selectedDungeon, nodes };

    console.log('=== 開始冒險 ===');
    console.log('地城:', selectedDungeon.name);
    console.log('地城 numNodes 設定:', selectedDungeon.numNodes);
    console.log('生成的節點數:', nodes.length);
    console.log('節點列表:', nodes.map((n, i) => `${i}: ${n.type} (${n.id})`));
    console.log('重置 currentNodeIndex 為 0');

    setAdventureTeam(team);
    useAdventureStore.setState({
      selectedDungeon: updatedDungeon,
      currentNodeIndex: 0, // 重置節點索引
      completedNodes: [], // 清空已完成節點
      defeatedBoss: false, // 重置 Boss 狀態
    });
    setScene('adventure');
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
      {/* 固定頂部 */}
      <div className="bg-gray-900 bg-opacity-80 p-3 shadow-lg">
        <h1 className="text-xl font-bold text-white text-center">組建隊伍</h1>
        {selectedDungeon && (
          <p className="text-yellow-400 text-sm text-center">{selectedDungeon.name}</p>
        )}
      </div>

      {/* 可滾動內容區 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 已選擇角色 - 前排/後排顯示 */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h2 className="text-sm font-bold text-white mb-3">
            隊伍 ({selectedCharacters.length}/6) {leaderId ? '👑' : '⚠️ 請選隊長'}
          </h2>

          {/* 後排 */}
          <div className="mb-3">
            <p className="text-xs text-purple-400 mb-2 flex items-center gap-1">
              <span>🏹</span> 後排（遠程）
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[3, 4, 5].map((position) => {
                const charId = Object.entries(characterPositions).find(([_, pos]) => pos === position)?.[0];
                const char = selectedCharacters.find((c) => c.id === charId);
                const isLeader = leaderId === charId;

                return (
                  <div
                    key={`pos-${position}`}
                    draggable={!!char}
                    onDragStart={(e) => {
                      if (char) {
                        setDraggedPosition(position);
                        e.dataTransfer.effectAllowed = 'move';
                        e.currentTarget.style.cursor = 'grabbing';
                      }
                    }}
                    onDragEnd={(e) => {
                      setDraggedPosition(null);
                      e.currentTarget.style.cursor = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedPosition !== null && draggedPosition !== position) {
                        swapCharacterPositions(draggedPosition, position);
                      }
                      setDraggedPosition(null);
                    }}
                    onClick={() => char && setLeader(char.id)}
                    className={`relative rounded-lg p-2 transition-all select-none ${
                      char ? 'bg-gray-700 cursor-move' : 'bg-gray-700 bg-opacity-30 border-2 border-dashed border-gray-600'
                    } ${isLeader ? 'ring-2 ring-yellow-400' : ''} ${
                      draggedPosition === position ? 'opacity-30 scale-95' : draggedPosition !== null ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                    }`}
                  >
                    {char ? (
                      <>
                        <div className="text-center text-2xl mb-1 pointer-events-none">
                          {char.job === 'warrior' && '⚔️'}
                          {char.job === 'mage' && '🔮'}
                          {char.job === 'archer' && '🏹'}
                          {char.job === 'tank' && '🛡️'}
                          {char.job === 'healer' && '💚'}
                          {char.job === 'assassin' && '🗡️'}
                        </div>
                        <p className="text-white text-xs font-bold text-center truncate pointer-events-none">
                          {char.name}
                        </p>
                        <p className="text-gray-400 text-xs text-center pointer-events-none">Lv.{char.level}</p>
                        {isLeader && (
                          <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 rounded pointer-events-none">
                            👑
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="aspect-square flex items-center justify-center">
                        <span className="text-gray-500 text-2xl">+</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 前排 */}
          <div>
            <p className="text-xs text-red-400 mb-2 flex items-center gap-1">
              <span>⚔️</span> 前排（近戰）
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((position) => {
                const charId = Object.entries(characterPositions).find(([_, pos]) => pos === position)?.[0];
                const char = selectedCharacters.find((c) => c.id === charId);
                const isLeader = leaderId === charId;

                return (
                  <div
                    key={`pos-${position}`}
                    draggable={!!char}
                    onDragStart={(e) => {
                      if (char) {
                        setDraggedPosition(position);
                        e.dataTransfer.effectAllowed = 'move';
                        e.currentTarget.style.cursor = 'grabbing';
                      }
                    }}
                    onDragEnd={(e) => {
                      setDraggedPosition(null);
                      e.currentTarget.style.cursor = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedPosition !== null && draggedPosition !== position) {
                        swapCharacterPositions(draggedPosition, position);
                      }
                      setDraggedPosition(null);
                    }}
                    onClick={() => char && setLeader(char.id)}
                    className={`relative rounded-lg p-2 transition-all select-none ${
                      char ? 'bg-gray-700 cursor-move' : 'bg-gray-700 bg-opacity-30 border-2 border-dashed border-gray-600'
                    } ${isLeader ? 'ring-2 ring-yellow-400' : ''} ${
                      draggedPosition === position ? 'opacity-30 scale-95' : draggedPosition !== null ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                    }`}
                  >
                    {char ? (
                      <>
                        <div className="text-center text-2xl mb-1 pointer-events-none">
                          {char.job === 'warrior' && '⚔️'}
                          {char.job === 'mage' && '🔮'}
                          {char.job === 'archer' && '🏹'}
                          {char.job === 'tank' && '🛡️'}
                          {char.job === 'healer' && '💚'}
                          {char.job === 'assassin' && '🗡️'}
                        </div>
                        <p className="text-white text-xs font-bold text-center truncate pointer-events-none">
                          {char.name}
                        </p>
                        <p className="text-gray-400 text-xs text-center pointer-events-none">Lv.{char.level}</p>
                        {isLeader && (
                          <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 rounded pointer-events-none">
                            👑
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="aspect-square flex items-center justify-center">
                        <span className="text-gray-500 text-2xl">+</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">💡 拖動角色可調整站位</p>
        </div>

        {/* 切換按鈕 */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowEventCards(false)}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              !showEventCards
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            角色 ({ownedCharacters.length})
          </button>
          <button
            onClick={() => setShowEventCards(true)}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              showEventCards
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            事件卡 ({selectedEventCards.length}/6)
          </button>
        </div>

        {/* 角色選擇 */}
        {!showEventCards && (
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="grid grid-cols-3 gap-2">
              {ownedCharacters.map((char) => {
                const isSelected = selectedCharacters.some((c) => c.id === char.id);
                const rarityColor = RARITY_COLORS[char.rarity as keyof typeof RARITY_COLORS];
                const elementColor = ELEMENT_COLORS[char.element];

                return (
                  <div
                    key={char.id}
                    onClick={() => {
                      if (selectedCharacters.length >= 6 && !isSelected) {
                        return;
                      }
                      toggleCharacterSelection(char);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setViewingCharacter(char);
                    }}
                    className={`relative bg-gray-700 rounded-lg p-2 cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-green-400 scale-95' : 'hover:scale-105'
                    }`}
                    style={{ borderTop: `3px solid ${rarityColor}` }}
                  >
                    <div className="text-center text-3xl mb-1">
                      {char.job === 'warrior' && '⚔️'}
                      {char.job === 'mage' && '🔮'}
                      {char.job === 'archer' && '🏹'}
                      {char.job === 'tank' && '🛡️'}
                      {char.job === 'healer' && '💚'}
                      {char.job === 'assassin' && '🗡️'}
                    </div>
                    <p className="text-white text-xs font-bold text-center truncate">
                      {char.name}
                    </p>
                    <div className="flex justify-center gap-1 mt-1">
                      <span
                        className="text-xs px-1 rounded"
                        style={{ backgroundColor: elementColor + '40', color: elementColor }}
                      >
                        {char.element[0].toUpperCase()}
                      </span>
                      <span className="text-xs px-1 rounded bg-gray-600 text-gray-300">
                        Lv{char.level}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                        ✓
                      </div>
                    )}
                    {/* 資訊按鈕 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('查看角色資料:', char);
                        setViewingCharacter(char);
                      }}
                      className="absolute bottom-1 right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded hover:bg-blue-700"
                    >
                      ℹ️
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 事件卡選擇 */}
        {showEventCards && (
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2">
              {ownedEventCards.map((card) => {
                const isSelected = selectedEventCards.some((c) => c.id === card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => toggleEventCardSelection(card)}
                    className={`relative bg-gray-700 rounded-lg p-2 cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-purple-400 scale-95' : 'hover:scale-105'
                    }`}
                  >
                    <div className="text-center text-2xl mb-1">🎴</div>
                    <p className="text-white text-xs font-bold text-center truncate">
                      {card.name}
                    </p>
                    <p className="text-gray-400 text-xs text-center line-clamp-2">
                      {card.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-purple-500 text-white text-xs px-1 rounded">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 固定底部按鈕 */}
      <div className="bg-gray-900 bg-opacity-80 p-3 flex gap-2">
        <Button variant="secondary" onClick={() => setScene('adventure_select')}>
          返回
        </Button>
        <Button
          variant="success"
          fullWidth
          disabled={!canStartAdventure()}
          onClick={handleStartAdventure}
        >
          {!leaderId
            ? '請選隊長'
            : selectedCharacters.length === 0
            ? '請選角色'
            : '開始冒險! 🗡️'}
        </Button>
      </div>

      {/* 角色詳情 Dialog */}
      {viewingCharacter && (
        <Dialog
          isOpen={true}
          onClose={() => setViewingCharacter(null)}
          title={viewingCharacter.name}
          variant="info"
          confirmText="關閉"
          showCancel={false}
        >
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* 基本資訊 */}
            <div className="flex items-center gap-4">
              <div className="text-5xl">
                {viewingCharacter.job === 'warrior' && '⚔️'}
                {viewingCharacter.job === 'mage' && '🔮'}
                {viewingCharacter.job === 'archer' && '🏹'}
                {viewingCharacter.job === 'tank' && '🛡️'}
                {viewingCharacter.job === 'healer' && '💚'}
                {viewingCharacter.job === 'assassin' && '🗡️'}
              </div>
              <div>
                <p className="text-lg font-bold text-white">{viewingCharacter.name}</p>
                <div className="flex gap-2 mt-1">
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: ELEMENT_COLORS[viewingCharacter.element] + '40',
                      color: ELEMENT_COLORS[viewingCharacter.element],
                    }}
                  >
                    {viewingCharacter.element}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-700 text-yellow-400">
                    {'★'.repeat(viewingCharacter.rarity)}
                  </span>
                </div>
              </div>
            </div>

            {/* 等級和經驗 */}
            <div className="bg-gray-800 rounded p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">等級</span>
                <span className="text-lg font-bold text-yellow-400">
                  Lv.{viewingCharacter.level}
                </span>
              </div>
              <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full"
                  style={{
                    width: `${(viewingCharacter.exp / (viewingCharacter.level * 100)) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                EXP: {viewingCharacter.exp} / {viewingCharacter.level * 100}
              </p>
            </div>

            {/* 基礎屬性 */}
            <div className="bg-gray-800 rounded p-3">
              <h3 className="text-sm font-bold text-white mb-2">基礎屬性</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">生命值</span>
                  <span className="text-green-400 font-bold">
                    {viewingCharacter.baseStats?.hp ? Math.floor(viewingCharacter.baseStats.hp) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">攻擊力</span>
                  <span className="text-red-400 font-bold">
                    {viewingCharacter.baseStats?.atk ? Math.floor(viewingCharacter.baseStats.atk) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">防禦力</span>
                  <span className="text-blue-400 font-bold">
                    {viewingCharacter.baseStats?.def ? Math.floor(viewingCharacter.baseStats.def) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">魔防</span>
                  <span className="text-purple-400 font-bold">
                    {viewingCharacter.baseStats?.res ? Math.floor(viewingCharacter.baseStats.res) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">速度</span>
                  <span className="text-yellow-400 font-bold">
                    {viewingCharacter.baseStats?.spd ? Math.floor(viewingCharacter.baseStats.spd) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">暴擊率</span>
                  <span className="text-orange-400 font-bold">
                    {viewingCharacter.baseStats?.critRate ? (viewingCharacter.baseStats.critRate * 100).toFixed(1) + '%' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* 技能 */}
            {(viewingCharacter.normalSkill || viewingCharacter.ultimateSkill) && (
              <div className="bg-gray-800 rounded p-3">
                <h3 className="text-sm font-bold text-white mb-2">技能</h3>
                <div className="space-y-2">
                  {/* 普通技能 */}
                  {viewingCharacter.normalSkill && (
                    <div className="bg-gray-700 rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-blue-400">
                          {viewingCharacter.normalSkill.name || '普通攻擊'}
                        </span>
                        <span className="text-xs text-gray-400">
                          Lv.{viewingCharacter.normalSkill.level || 1}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {viewingCharacter.normalSkill.description || '基礎攻擊'}
                      </p>
                      <p className="text-xs text-purple-400 mt-1">
                        倍率: {viewingCharacter.normalSkill.multiplier ? viewingCharacter.normalSkill.multiplier.toFixed(1) : '1.0'}x
                      </p>
                    </div>
                  )}

                  {/* 終極技能 */}
                  {viewingCharacter.ultimateSkill && (
                    <div className="bg-gray-700 rounded p-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-purple-400">
                          {viewingCharacter.ultimateSkill.name || '終極技能'}
                        </span>
                        <span className="text-xs text-gray-400">
                          Lv.{viewingCharacter.ultimateSkill.level || 1}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {viewingCharacter.ultimateSkill.description || '強力技能'}
                      </p>
                      <p className="text-xs text-purple-400 mt-1">
                        倍率: {viewingCharacter.ultimateSkill.multiplier ? viewingCharacter.ultimateSkill.multiplier.toFixed(1) : '2.0'}x
                        {viewingCharacter.ultimateSkill.energyCost && ` | 能量: ${viewingCharacter.ultimateSkill.energyCost}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 隊長技 */}
            {viewingCharacter.leaderSkill && (
              <div className="bg-gray-800 rounded p-3">
                <h3 className="text-sm font-bold text-white mb-2">隊長技</h3>
                <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded p-2">
                  <p className="text-sm font-bold text-yellow-400">
                    {viewingCharacter.leaderSkill.name}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    {viewingCharacter.leaderSkill.description}
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
