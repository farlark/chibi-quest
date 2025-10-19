// 戰鬥頁面 - 優化為豎屏單頁顯示
import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useCombatStore } from '@/stores/combatStore';
import { useAdventureStore } from '@/stores/adventureStore';
import Button from '@/components/common/Button';
import {
  executeCombatTurn,
  checkBattleEnd,
  calculateCombatRewards,
} from '@/utils/combat';
import { gainExperience } from '@/utils/adventureEngine';
import type { VeteranTeam } from '@/types';

export default function Combat() {
  const { setScene } = useGameStore();
  const { combatState, resetCombat } = useCombatStore();
  const { adventureTeam, updateTeamLevel, advanceToNextNode } = useAdventureStore();
  const [currentTurn, setCurrentTurn] = useState(1);
  const [log, setLog] = useState<string[]>([]);

  // 自動執行戰鬥 - 更快速
  useEffect(() => {
    if (!combatState || combatState.isFinished) return;

    const timer = setTimeout(() => {
      executeTurn();
    }, 800); // 加快到0.8秒

    return () => clearTimeout(timer);
  }, [currentTurn, combatState]);

  const executeTurn = () => {
    if (!combatState) return;

    const { actions, updatedPlayerTeam, updatedEnemyTeam } = executeCombatTurn(
      combatState.playerTeam,
      combatState.enemyTeam,
      currentTurn
    );

    useCombatStore.setState({
      combatState: {
        ...combatState,
        turn: currentTurn,
        playerTeam: updatedPlayerTeam,
        enemyTeam: updatedEnemyTeam,
        actionLog: [...combatState.actionLog, ...actions],
      },
    });

    // 只保留最近5條日誌
    const newLogs = actions.map((action) => {
      if (action.actionType === 'ultimate') {
        return `🌟 ${action.actorName} 大招! ${action.damage}傷害`;
      }
      return `⚔️ ${action.actorName} → ${action.targetName} ${action.damage}${
        action.isCritical ? '爆擊!' : ''
      }`;
    });
    setLog((prev) => [...prev, ...newLogs].slice(-5));

    const battleCheck = checkBattleEnd(updatedPlayerTeam, updatedEnemyTeam);
    if (battleCheck.isFinished) {
      handleBattleEnd(battleCheck.winner!, updatedEnemyTeam);
    } else {
      setCurrentTurn((t) => t + 1);
    }
  };

  const handleBattleEnd = (winner: 'player' | 'enemy', enemyTeam: any[]) => {
    if (!combatState || !adventureTeam) return;

    useCombatStore.setState({
      combatState: {
        ...combatState,
        isFinished: true,
        winner,
      },
    });

    if (winner === 'player') {
      const rewards = calculateCombatRewards(enemyTeam, currentTurn);
      const expResult = gainExperience(adventureTeam, rewards.exp);

      if (expResult.leveledUp) {
        updateTeamLevel(expResult.newLevel, expResult.newExp);
        setLog((prev) => [...prev, `🎉 升級至 Lv.${expResult.newLevel}!`]);
      }
    }
  };

  if (!combatState) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <p className="text-white text-xl mb-4">戰鬥載入中...</p>
          <Button onClick={() => setScene('adventure')}>返回冒險</Button>
        </div>
      </div>
    );
  }

  const handleContinue = () => {
    if (combatState.winner === 'player') {
      const { selectedDungeon, currentNodeIndex } = useAdventureStore.getState();
      const isLastNode = selectedDungeon && currentNodeIndex >= selectedDungeon.nodes.length - 1;

      console.log('戰鬥勝利後檢查:', {
        currentNodeIndex,
        totalNodes: selectedDungeon?.nodes.length,
        isLastNode,
        currentNodeType: selectedDungeon?.nodes[currentNodeIndex]?.type
      });

      // 如果擊敗了 Boss（最後一個節點），保存為歷戰隊伍
      if (isLastNode && adventureTeam && selectedDungeon) {
        console.log('檢測到通關！保存歷戰隊伍...');
        // 保存所有招募的角色
        const { ownedCharacters } = useGameStore.getState();
        console.log('當前擁有角色數:', ownedCharacters.length);
        console.log('隊伍角色:', adventureTeam.characters.map(c => c.name));

        adventureTeam.characters.forEach((char) => {
          if (!ownedCharacters.some((c) => c.id === char.id)) {
            console.log('新增角色到擁有列表:', char.name);
            // 保存完整的角色對象（CombatCharacter 包含 CharacterCard 的所有欄位）
            useGameStore.getState().addCharacter({
              id: char.id,
              name: char.name,
              job: char.job,
              element: char.element,
              rarity: char.rarity,
              baseStats: char.baseStats,
              dungeonAffinities: char.dungeonAffinities || {},
              normalSkill: char.normalSkill,
              ultimateSkill: char.ultimateSkill,
              leaderSkill: char.leaderSkill,
              portrait: char.portrait || `/assets/portraits/${char.id}.png`,
              chibiSprite: char.chibiSprite || `/assets/chibi/${char.id}.png`,
              level: char.level || 1,
              exp: char.exp || 0,
              growthPercent: char.growthPercent || 0,
            });
          } else {
            console.log('角色已存在:', char.name);
          }
        });

        // 保存為歷戰隊伍
        const veteranTeam: VeteranTeam = {
          id: `veteran_${Date.now()}`,
          name: `${selectedDungeon.name} 征服者`,
          characters: adventureTeam.characters,
          leaderId: adventureTeam.leaderId,
          eventCards: adventureTeam.eventCards || [],
          teamLevel: adventureTeam.teamLevel,
          teamExp: adventureTeam.teamExp || 0,
          teamStoryness: adventureTeam.teamStoryness,
          createdAt: Date.now(),
          dungeonId: selectedDungeon.id,
          totalPower: adventureTeam.characters.reduce((sum, char) =>
            sum + char.finalStats.atk + char.finalStats.hp, 0
          ),
          achievements: [],
        };
        console.log('保存歷戰隊伍:', veteranTeam.name, '角色數:', veteranTeam.characters.length);
        useGameStore.getState().addVeteranTeam(veteranTeam);

        console.log('通關完成，返回主選單');

        // 重置冒險並返回主選單
        useAdventureStore.getState().resetAdventure();
        resetCombat();
        setScene('main_menu');
        return;
      }

      // 普通戰鬥勝利 - 檢查是否升級
      if (adventureTeam && adventureTeam.teamExp >= 100) {
        setScene('level_up');
      } else {
        advanceToNextNode();
        resetCombat();
        setScene('adventure');
      }
    } else {
      // 玩家戰敗 - 保存招募的角色到擁有角色列表
      if (adventureTeam) {
        const { ownedCharacters } = useGameStore.getState();
        adventureTeam.characters.forEach((char) => {
          // 如果角色不在已擁有列表中，加入
          if (!ownedCharacters.some((c) => c.id === char.id)) {
            useGameStore.getState().addCharacter({
              id: char.id,
              name: char.name,
              job: char.job,
              element: char.element,
              rarity: char.rarity,
              baseStats: char.baseStats,
              dungeonAffinities: char.dungeonAffinities || {},
              normalSkill: char.normalSkill,
              ultimateSkill: char.ultimateSkill,
              leaderSkill: char.leaderSkill,
              portrait: char.portrait || `/assets/portraits/${char.id}.png`,
              chibiSprite: char.chibiSprite || `/assets/chibi/${char.id}.png`,
              level: char.level || 1,
              exp: char.exp || 0,
              growthPercent: char.growthPercent || 0,
            });
          }
        });
      }

      useAdventureStore.getState().resetAdventure();
      resetCombat();
      setScene('main_menu');
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex flex-col overflow-hidden">
      {/* 固定頂部 */}
      <div className="bg-gray-900 bg-opacity-80 p-3">
        <h1 className="text-xl font-bold text-white text-center">⚔️ 戰鬥中 ⚔️</h1>
        <p className="text-purple-300 text-center text-sm">回合: {currentTurn}</p>
      </div>

      {/* 戰鬥場地 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* 我方隊伍 - 前排/後排顯示 */}
        <div className="bg-blue-900 bg-opacity-50 rounded-lg p-2">
          <h2 className="text-xs font-bold text-blue-300 mb-1">我方</h2>

          {/* 後排 */}
          {combatState.playerTeam.filter(char => char.position === 'back').length > 0 && (
            <div className="mb-1">
              <p className="text-[10px] text-purple-300 mb-1">後排</p>
              <div className="grid grid-cols-3 gap-1">
                {combatState.playerTeam
                  .filter(char => char.position === 'back')
                  .map((char) => (
                    <div
                      key={char.id}
                      className={`bg-gray-800 rounded p-1.5 ${
                        char.currentHp <= 0 ? 'opacity-30' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-white font-bold text-xs truncate">
                          {char.name}
                        </span>
                      </div>
                      <div className="bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-green-500 h-full transition-all duration-300"
                          style={{
                            width: `${(char.currentHp / char.finalStats.hp) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-[10px] text-gray-400">
                          {Math.floor(char.currentHp)}/{Math.floor(char.finalStats.hp)}
                        </p>
                        <span className="text-[10px] text-purple-400">
                          ⚡{char.currentEnergy}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 前排 */}
          {combatState.playerTeam.filter(char => char.position === 'front').length > 0 && (
            <div>
              <p className="text-[10px] text-red-300 mb-1">前排</p>
              <div className="grid grid-cols-3 gap-1">
                {combatState.playerTeam
                  .filter(char => char.position === 'front')
                  .map((char) => (
                    <div
                      key={char.id}
                      className={`bg-gray-800 rounded p-1.5 ${
                        char.currentHp <= 0 ? 'opacity-30' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-white font-bold text-xs truncate">
                          {char.name}
                        </span>
                      </div>
                      <div className="bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-green-500 h-full transition-all duration-300"
                          style={{
                            width: `${(char.currentHp / char.finalStats.hp) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-[10px] text-gray-400">
                          {Math.floor(char.currentHp)}/{Math.floor(char.finalStats.hp)}
                        </p>
                        <span className="text-[10px] text-purple-400">
                          ⚡{char.currentEnergy}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* 敵方隊伍 */}
        <div className="bg-red-900 bg-opacity-50 rounded-lg p-2">
          <h2 className="text-xs font-bold text-red-300 mb-1">敵方</h2>
          <div className="grid grid-cols-2 gap-1">
            {combatState.enemyTeam.map((char) => (
              <div
                key={char.id}
                className={`bg-gray-800 rounded p-1.5 ${
                  char.currentHp <= 0 ? 'opacity-30' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-white font-bold text-xs truncate">
                    {char.name}
                  </span>
                </div>
                <div className="bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-red-500 h-full transition-all duration-300"
                    style={{
                      width: `${(char.currentHp / char.finalStats.hp) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {Math.floor(char.currentHp)}/{Math.floor(char.finalStats.hp)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 戰鬥日誌 - 簡化 */}
        <div className="bg-gray-800 rounded-lg p-2">
          <h2 className="text-xs font-bold text-white mb-1">戰鬥日誌</h2>
          <div className="space-y-0.5">
            {log.length === 0 ? (
              <p className="text-gray-500 text-[10px] text-center">戰鬥開始...</p>
            ) : (
              log.map((entry, i) => (
                <p key={i} className="text-gray-300 text-[10px]">
                  {entry}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 戰鬥結果 */}
      {combatState.isFinished && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4 text-center">
            {combatState.winner === 'player' ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-400 mb-2">勝利!</h2>
                <p className="text-gray-300 mb-6">成功擊敗了敵人!</p>
                <Button variant="success" onClick={handleContinue} fullWidth>
                  繼續冒險 →
                </Button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-3xl font-bold text-red-400 mb-2">戰敗...</h2>
                <p className="text-gray-300 mb-6">隊伍被擊敗了</p>
                <Button variant="danger" onClick={handleContinue} fullWidth>
                  返回主選單
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
