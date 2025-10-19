// 選關頁面 - 優化為固定高度無外層滾動
import { useGameStore } from '@/stores/gameStore';
import { useAdventureStore } from '@/stores/adventureStore';
import Button from '@/components/common/Button';
import { ELEMENT_COLORS } from '@/config/constants';

export default function AdventureSelect() {
  const { allDungeons, setScene } = useGameStore();
  const { setSelectedDungeon } = useAdventureStore();

  const handleSelectDungeon = (dungeon: any) => {
    setSelectedDungeon(dungeon);
    setScene('team_formation');
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
      {/* 固定頂部 */}
      <div className="bg-gray-900 bg-opacity-80 p-3 shadow-lg">
        <h1 className="text-xl font-bold text-white text-center">選擇地城</h1>
        <p className="text-purple-300 text-center text-xs">挑選一個地城開始冒險</p>
      </div>

      {/* 可滾動地城列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {allDungeons.map((dungeon) => (
          <div
            key={dungeon.id}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
          >
            {/* 地城圖片 */}
            <div className="h-32 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-6xl">
              {dungeon.id === 'dungeon_001' ? '🔥' : '❄️'}
            </div>

            {/* 地城資訊 */}
            <div className="p-3">
              <h2 className="text-xl font-bold text-white mb-1">{dungeon.name}</h2>
              <p className="text-gray-300 text-xs mb-3 line-clamp-2">{dungeon.description}</p>

              {/* 屬性 */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-gray-700 px-2 py-1 rounded">
                  <span className="text-gray-400">難度:</span>
                  <span className="text-white ml-1 font-bold">
                    {'⭐'.repeat(dungeon.difficulty)}
                  </span>
                </div>
                <div className="bg-gray-700 px-2 py-1 rounded">
                  <span className="text-gray-400">推薦:</span>
                  <span className="text-yellow-400 ml-1 font-bold text-xs">
                    {dungeon.recommendedPower}
                  </span>
                </div>
              </div>

              {/* 敵人屬性 */}
              <div className="mb-3">
                <p className="text-gray-400 text-xs mb-1">主要敵人:</p>
                <div className="flex gap-1">
                  {dungeon.enemyElements.map((element) => (
                    <span
                      key={element}
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        backgroundColor: ELEMENT_COLORS[element] + '40',
                        color: ELEMENT_COLORS[element],
                      }}
                    >
                      {element}
                    </span>
                  ))}
                </div>
              </div>

              {/* 可招募角色 */}
              <p className="text-gray-400 text-xs mb-3">
                可招募: {dungeon.availableRecruits.length} 名角色
              </p>

              {/* 選擇按鈕 */}
              <Button
                variant="primary"
                fullWidth
                onClick={() => handleSelectDungeon(dungeon)}
              >
                選擇此地城
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 固定底部 */}
      <div className="bg-gray-900 bg-opacity-80 p-3">
        <Button variant="secondary" fullWidth onClick={() => setScene('main_menu')}>
          返回主選單
        </Button>
      </div>
    </div>
  );
}
