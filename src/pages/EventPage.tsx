// 事件選擇頁面
import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useAdventureStore } from '@/stores/adventureStore';
import Button from '@/components/common/Button';
import {
  getAvailableChoices,
  applyEventResult,
  generateEventResultDescription,
} from '@/utils/eventSystem';
import type { EventChoice } from '@/types';

export default function EventPage() {
  const { setScene } = useGameStore();
  const { adventureTeam, advanceToNextNode } = useAdventureStore();
  const [selectedChoice, setSelectedChoice] = useState<EventChoice | null>(null);
  const [showResult, setShowResult] = useState(false);

  // 從 store 獲取當前事件 (需要擴展 store)
  const currentEvent = (useAdventureStore.getState() as any).currentEvent;

  if (!currentEvent || !adventureTeam) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <p className="text-white text-xl mb-4">事件載入中...</p>
          <Button onClick={() => setScene('adventure')}>返回冒險</Button>
        </div>
      </div>
    );
  }

  const availableChoices = currentEvent.type === 'choice'
    ? getAvailableChoices(currentEvent, adventureTeam)
    : [];

  const handleSelectChoice = (choice: EventChoice) => {
    setSelectedChoice(choice);
  };

  const handleConfirm = () => {
    if (!selectedChoice && currentEvent.type === 'choice') return;

    // 獲取結果
    const result = currentEvent.type === 'encounter'
      ? currentEvent.autoResult!
      : selectedChoice!.result;

    // 應用結果
    const updatedTeam = applyEventResult(adventureTeam, result);
    useAdventureStore.setState({ adventureTeam: updatedTeam });

    setShowResult(true);
  };

  const handleContinue = () => {
    advanceToNextNode();
    setScene('adventure');
  };

  // 遭遇型事件直接顯示結果
  if (currentEvent.type === 'encounter' && !showResult) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center overflow-hidden">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">📜</div>
            <h1 className="text-3xl font-bold text-white mb-4">{currentEvent.name}</h1>
            <p className="text-gray-300 text-lg mb-6">{currentEvent.description}</p>
            <Button variant="primary" onClick={handleConfirm}>
              繼續
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 顯示結果
  if (showResult) {
    const result = currentEvent.type === 'encounter'
      ? currentEvent.autoResult!
      : selectedChoice!.result;

    const resultDescription = generateEventResultDescription(result, adventureTeam);

    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center overflow-hidden">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-3xl font-bold text-white mb-4">事件結果</h1>
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-gray-300 whitespace-pre-line">{resultDescription}</p>
            </div>
            <Button variant="success" onClick={handleContinue}>
              繼續冒險 →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 選擇型事件
  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {/* 事件標題 */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 text-center">
            <div className="text-6xl mb-4">📜</div>
            <h1 className="text-3xl font-bold text-white mb-4">{currentEvent.name}</h1>
            <p className="text-gray-300 text-lg">{currentEvent.description}</p>
            {currentEvent.requireStoryness && (
              <p className="text-purple-400 text-sm mt-2">
                (需要故事性: {currentEvent.requireStoryness})
              </p>
            )}
          </div>

          {/* 選項 */}
          <div className="space-y-4 mb-6">
            {availableChoices.map((choice) => (
              <div
                key={choice.id}
                onClick={() => handleSelectChoice(choice)}
                className={`
                  bg-gray-800 rounded-lg p-4 cursor-pointer
                  transition-all duration-200 hover:bg-gray-700
                  ${selectedChoice?.id === choice.id ? 'ring-4 ring-yellow-400' : ''}
                `}
              >
                <h3 className="text-xl font-bold text-white mb-2">{choice.text}</h3>
                {choice.description && (
                  <p className="text-gray-400 text-sm">{choice.description}</p>
                )}
                {choice.requirement && (
                  <p className="text-purple-400 text-xs mt-2">
                    需求: {choice.requirement.type} = {choice.requirement.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 確認按鈕 */}
          <div className="text-center">
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={!selectedChoice}
            >
              {selectedChoice ? '確認選擇' : '請選擇一個選項'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
