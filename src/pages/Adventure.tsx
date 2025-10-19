// 冒險主頁面 - 優化為豎屏顯示並自動開始戰鬥
import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useAdventureStore } from '@/stores/adventureStore';
import Button from '@/components/common/Button';
import Dialog from '@/components/common/Dialog';
import { generateNodeEnemies, selectRandomEvent } from '@/utils/adventureEngine';
import { useCombatStore } from '@/stores/combatStore';
import { calculateFinalStats } from '@/utils/calculator';

export default function Adventure() {
  const { setScene, allCharacters, allEvents } = useGameStore();
  const {
    selectedDungeon,
    adventureTeam,
    currentNodeIndex,
    advanceToNextNode,
  } = useAdventureStore();
  const { initCombat } = useCombatStore();

  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);

  const currentNode = selectedDungeon?.nodes[currentNodeIndex];

  // 調試：檢查當前節點狀態
  useEffect(() => {
    if (selectedDungeon && currentNode) {
      console.log('=== 冒險節點狀態 ===');
      console.log('當前節點索引:', currentNodeIndex);
      console.log('總節點數:', selectedDungeon.nodes.length);
      console.log('當前節點類型:', currentNode.type);
      console.log('當前節點ID:', currentNode.id);
      console.log('所有節點:', selectedDungeon.nodes.map((n, i) => `${i}: ${n.type}`));
    }
  }, [currentNodeIndex, selectedDungeon, currentNode]);

  // 自動開始戰鬥或事件
  useEffect(() => {
    if (autoStarted || !currentNode || !selectedDungeon || !adventureTeam) return;

    const timer = setTimeout(() => {
      setAutoStarted(true);
      if (currentNode.type === 'combat' || currentNode.type === 'boss') {
        handleCombatNode();
      } else if (currentNode.type === 'event') {
        handleEventNode();
      } else if (currentNode.type === 'rest') {
        handleRestNode();
      }
    }, 1500); // 1.5秒後自動開始

    return () => clearTimeout(timer);
  }, [currentNode, autoStarted]);

  if (!selectedDungeon || !adventureTeam) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <p className="text-white text-xl mb-4">冒險數據載入中...</p>
          <Button onClick={() => setScene('main_menu')}>返回主選單</Button>
        </div>
      </div>
    );
  }

  const isLastNode = currentNodeIndex >= selectedDungeon.nodes.length - 1;

  // 處理戰鬥節點
  const handleCombatNode = () => {
    if (!currentNode) return;

    const enemies = generateNodeEnemies(
      currentNode.type === 'boss' ? 'boss' : 'combat',
      adventureTeam.teamLevel,
      allCharacters
    );

    const playerTeam = adventureTeam.characters.map((char) => ({
      ...char,
      finalStats: calculateFinalStats(char, adventureTeam, selectedDungeon.id),
    }));

    initCombat(playerTeam, enemies);
    setScene('combat');
  };

  // 處理事件節點
  const handleEventNode = () => {
    const event = selectRandomEvent(allEvents, adventureTeam.teamStoryness);
    if (event) {
      useAdventureStore.setState({ currentEvent: event } as any);
      setScene('event');
    } else {
      advanceToNextNode();
      setAutoStarted(false);
    }
  };

  // 處理休息節點
  const handleRestNode = () => {
    const updatedTeam = {
      ...adventureTeam,
      characters: adventureTeam.characters.map((char) => ({
        ...char,
        currentHp: Math.min(char.currentHp + char.finalStats.hp * 0.3, char.finalStats.hp),
      })),
    };
    useAdventureStore.setState({ adventureTeam: updatedTeam });
    advanceToNextNode();
    setAutoStarted(false);
  };

  const handleQuit = () => {
    useAdventureStore.getState().resetAdventure();
    setScene('main_menu');
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
      {/* 固定頂部 */}
      <div className="bg-gray-900 bg-opacity-80 p-3 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white">{selectedDungeon.name}</h1>
            <p className="text-xs text-gray-300">
              節點: {currentNodeIndex + 1}/{selectedDungeon.nodes.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-yellow-400 font-bold">Lv.{adventureTeam.teamLevel}</p>
            <p className="text-purple-300 text-xs">故事性: {adventureTeam.teamStoryness}</p>
          </div>
        </div>

        {/* 進度條 */}
        <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500"
            style={{
              width: `${((currentNodeIndex + 1) / selectedDungeon.nodes.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* 可滾動內容 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 隊伍狀態 - 緊湊顯示 */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h2 className="text-sm font-bold text-white mb-2">隊伍狀態</h2>
          <div className="grid grid-cols-2 gap-2">
            {adventureTeam.characters.map((char) => (
              <div key={char.id} className="bg-gray-700 rounded-lg p-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">
                    {char.job === 'warrior' && '⚔️'}
                    {char.job === 'mage' && '🔮'}
                    {char.job === 'archer' && '🏹'}
                    {char.job === 'tank' && '🛡️'}
                    {char.job === 'healer' && '💚'}
                    {char.job === 'assassin' && '🗡️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{char.name}</p>
                    <div className="bg-gray-600 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-green-500 h-full transition-all"
                        style={{
                          width: `${(char.currentHp / char.finalStats.hp) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-300">
                  {Math.floor(char.currentHp)}/{Math.floor(char.finalStats.hp)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 當前節點 - 大圖標顯示 */}
        {currentNode && (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            {currentNode.type === 'combat' && (
              <>
                <div className="text-7xl mb-3">⚔️</div>
                <h2 className="text-2xl font-bold text-white mb-2">遭遇戰鬥!</h2>
                <p className="text-gray-300 mb-4">前方出現了敵人</p>
                <p className="text-yellow-400 text-sm animate-pulse">
                  戰鬥即將自動開始...
                </p>
              </>
            )}

            {currentNode.type === 'boss' && (
              <>
                <div className="text-7xl mb-3 animate-bounce">👹</div>
                <h2 className="text-2xl font-bold text-red-400 mb-2">Boss 戰!</h2>
                <p className="text-gray-300 mb-4">最終Boss出現了!</p>
                {isLastNode && (
                  <p className="text-yellow-400 text-sm mb-2">⚠️ 最後的挑戰!</p>
                )}
                <p className="text-yellow-400 text-sm animate-pulse">
                  戰鬥即將自動開始...
                </p>
              </>
            )}

            {currentNode.type === 'event' && (
              <>
                <div className="text-7xl mb-3">📜</div>
                <h2 className="text-2xl font-bold text-white mb-2">隨機事件</h2>
                <p className="text-gray-300 mb-4">發生了特殊的事情...</p>
                <p className="text-purple-400 text-sm animate-pulse">
                  事件即將自動觸發...
                </p>
              </>
            )}

            {currentNode.type === 'rest' && (
              <>
                <div className="text-7xl mb-3">🏕️</div>
                <h2 className="text-2xl font-bold text-white mb-2">休息點</h2>
                <p className="text-gray-300 mb-4">隊伍恢復了體力</p>
                <p className="text-green-400 text-sm">+30% HP</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* 固定底部 */}
      <div className="bg-gray-900 bg-opacity-80 p-3">
        <Button variant="secondary" fullWidth onClick={() => setShowQuitDialog(true)}>
          放棄冒險
        </Button>
      </div>

      {/* 確認對話框 */}
      <Dialog
        isOpen={showQuitDialog}
        onClose={() => setShowQuitDialog(false)}
        onConfirm={handleQuit}
        title="放棄冒險?"
        message="確定要放棄這次冒險嗎?所有進度將會失去!"
        variant="danger"
        confirmText="確定放棄"
        cancelText="繼續冒險"
      />
    </div>
  );
}
