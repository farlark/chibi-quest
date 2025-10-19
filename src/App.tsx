import { useEffect, useState } from 'react';
import { loadAllGameData } from './utils/csv';
import { useGameStore } from './stores/gameStore';
import Button from './components/common/Button';
import AdventureSelect from './pages/AdventureSelect';
import TeamFormation from './pages/TeamFormation';
import Adventure from './pages/Adventure';
import Combat from './pages/Combat';
import EventPage from './pages/EventPage';
import LevelUp from './pages/LevelUp';
import CharacterList from './pages/CharacterList';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentScene, setScene, setGameData, ownedCharacters, veteranTeams } = useGameStore();

  useEffect(() => {
    loadAllGameData()
      .then((data) => {
        setGameData(data);
        setLoading(false);
        console.log('遊戲數據加載成功:', data);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        console.error('加載遊戲數據失敗:', err);
      });
  }, []);

  // Loading Screen
  if (loading) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-4xl font-bold text-white mb-4">小不點任務</h1>
          <p className="text-xl text-purple-200">Chibi Quest</p>
          <div className="mt-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-white mt-4">正在加載遊戲數據...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center overflow-hidden">
        <div className="text-center bg-gray-900 bg-opacity-80 p-8 rounded-lg">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-white mb-4">加載失敗</h1>
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 btn btn-primary"
          >
            重新加載
          </button>
        </div>
      </div>
    );
  }

  // Main Menu
  if (currentScene === 'main_menu') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
        <div className="w-full h-full max-w-md flex flex-col items-center justify-center p-6 text-white overflow-y-auto">
            <div className="text-6xl mb-8">⚔️</div>
            <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-600">
              小不點任務
            </h1>
            <p className="text-2xl mb-2 text-purple-200">Chibi Quest</p>
            <p className="text-sm text-purple-300 mb-12">Roguelike 養成冒險</p>

            <div className="space-y-4 w-full max-w-xs">
              <Button
                variant="primary"
                fullWidth
                onClick={() => setScene('adventure_select')}
              >
                🗺️ 開始冒險
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => alert('歷戰隊伍功能開發中')}
              >
                👥 歷戰隊伍 ({veteranTeams.length})
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setScene('character_list')}
              >
                📖 角色圖鑑 ({ownedCharacters.length})
              </Button>
            </div>

            {/* 數據統計 */}
            <div className="mt-12 text-sm text-purple-300 space-y-1">
              <p>✨ 擁有 {ownedCharacters.length} 名角色</p>
              <p>👥 {veteranTeams.length} 支歷戰隊伍</p>
            </div>

          <div className="mt-8 text-xs text-purple-400">
            v0.0.1-prototype | 按 F12 查看日誌
          </div>
        </div>
      </div>
    );
  }

  // Route to different scenes
  switch (currentScene) {
    case 'adventure_select':
      return <AdventureSelect />;
    case 'team_formation':
      return <TeamFormation />;
    case 'adventure':
      return <Adventure />;
    case 'combat':
      return <Combat />;
    case 'event':
      return <EventPage />;
    case 'level_up':
      return <LevelUp />;
    case 'character_list':
      return <CharacterList />;
    default:
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <p className="text-white text-xl mb-4">未知場景: {currentScene}</p>
            <Button onClick={() => setScene('main_menu')}>返回主選單</Button>
          </div>
        </div>
      );
  }
}

export default App;
