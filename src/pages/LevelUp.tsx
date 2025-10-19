// 升級獎勵選擇頁面
import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useAdventureStore } from '@/stores/adventureStore';
import Button from '@/components/common/Button';
import { generateLevelUpRewards, applyLevelUpReward } from '@/utils/adventureEngine';
import type { LevelUpReward, CharacterCard } from '@/types';

export default function LevelUp() {
  const { setScene, allCharacters, addCharacter } = useGameStore();
  const { adventureTeam, setAdventureTeam, advanceToNextNode, selectedDungeon } = useAdventureStore();
  const [rewards, setRewards] = useState<LevelUpReward[]>([]);
  const [selectedReward, setSelectedReward] = useState<LevelUpReward | null>(null);

  useEffect(() => {
    if (!adventureTeam || !selectedDungeon || !allCharacters) return;

    // 生成三選一的升級獎勵
    const availableRecruits = allCharacters.filter((char: CharacterCard) =>
      selectedDungeon.availableRecruits.includes(char.id)
    );

    const generatedRewards = generateLevelUpRewards(
      adventureTeam,
      availableRecruits,
      selectedDungeon.id
    );

    setRewards(generatedRewards);
  }, [adventureTeam, selectedDungeon, allCharacters]);

  const handleSelectReward = (reward: LevelUpReward) => {
    setSelectedReward(reward);
  };

  const handleConfirmReward = () => {
    if (!selectedReward || !adventureTeam || !allCharacters) return;

    // 應用獎勵
    const updatedTeam = applyLevelUpReward(adventureTeam, selectedReward, allCharacters);

    // 如果是招募新角色，也要加入到擁有角色列表
    if (selectedReward.type === 'recruit' && selectedReward.recruit) {
      addCharacter(selectedReward.recruit);
    }

    // 更新隊伍
    setAdventureTeam(updatedTeam);

    // 繼續冒險
    advanceToNextNode();
    setScene('adventure');
  };

  if (!adventureTeam || rewards.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <p className="text-white text-xl mb-4">載入升級獎勵中...</p>
          <Button onClick={() => setScene('adventure')}>返回冒險</Button>
        </div>
      </div>
    );
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'recruit':
        return '👥';
      case 'skill_upgrade':
        return '⚡';
      case 'stat_boost':
        return '💪';
      default:
        return '✨';
    }
  };

  const getRewardTitle = (reward: LevelUpReward) => {
    switch (reward.type) {
      case 'recruit':
        return `招募 ${reward.recruit?.name}`;
      case 'skill_upgrade':
        const char = adventureTeam.characters.find((c) => c.id === reward.skillUpgrade?.characterId);
        const skillName = reward.skillUpgrade?.skillType === 'normal' ? '普通技能' : '大招';
        return `${char?.name} - ${skillName} 升級`;
      case 'stat_boost':
        const charStat = adventureTeam.characters.find((c) => c.id === reward.statBoost?.characterId);
        return `${charStat?.name} - 屬性強化`;
      default:
        return '未知獎勵';
    }
  };

  const getRewardDescription = (reward: LevelUpReward) => {
    switch (reward.type) {
      case 'recruit':
        return `${reward.recruit?.job} | ${reward.recruit?.element}屬性`;
      case 'skill_upgrade':
        return `技能等級提升至 Lv.${reward.skillUpgrade?.level}`;
      case 'stat_boost':
        const stats = reward.statBoost?.stats;
        const statLines = [];
        if (stats?.hp) statLines.push(`HP +${stats.hp}`);
        if (stats?.atk) statLines.push(`攻擊 +${stats.atk}`);
        if (stats?.def) statLines.push(`防禦 +${stats.def}`);
        if (stats?.res) statLines.push(`魔防 +${stats.res}`);
        return statLines.join(', ');
      default:
        return '';
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
      {/* 固定頂部 */}
      <div className="bg-gray-900 bg-opacity-80 p-3">
        <h1 className="text-2xl font-bold text-white text-center">🎉 升級！</h1>
        <p className="text-purple-300 text-center text-sm">
          隊伍升級至 Lv.{adventureTeam.teamLevel}
        </p>
        <p className="text-gray-400 text-center text-xs mt-1">選擇一項獎勵</p>
      </div>

      {/* 獎勵選擇區域 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {rewards.map((reward) => (
          <div
            key={reward.id}
            onClick={() => handleSelectReward(reward)}
            className={`
              bg-gray-800 rounded-lg p-4 cursor-pointer
              transition-all duration-200 hover:bg-gray-700
              ${selectedReward?.id === reward.id ? 'ring-4 ring-yellow-400' : ''}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="text-4xl">{getRewardIcon(reward.type)}</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  {getRewardTitle(reward)}
                </h3>
                <p className="text-gray-300 text-sm">{getRewardDescription(reward)}</p>

                {reward.type === 'recruit' && reward.recruit && (
                  <div className="mt-2 bg-gray-900 rounded p-2">
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="text-gray-400">
                        HP: <span className="text-green-400">{reward.recruit.baseStats.hp}</span>
                      </div>
                      <div className="text-gray-400">
                        攻擊: <span className="text-red-400">{reward.recruit.baseStats.atk}</span>
                      </div>
                      <div className="text-gray-400">
                        防禦: <span className="text-blue-400">{reward.recruit.baseStats.def}</span>
                      </div>
                      <div className="text-gray-400">
                        速度: <span className="text-yellow-400">{reward.recruit.baseStats.spd}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 固定底部按鈕 */}
      <div className="bg-gray-900 bg-opacity-80 p-3">
        <Button
          variant="success"
          fullWidth
          onClick={handleConfirmReward}
          disabled={!selectedReward}
        >
          {selectedReward ? '確認選擇 →' : '請選擇一項獎勵'}
        </Button>
      </div>
    </div>
  );
}
