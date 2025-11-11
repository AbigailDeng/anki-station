import React, { useState, useEffect } from "react";
import { subwayLines, SubwayLine } from "./data/subwayLines";

const GAME_STAGES = {
  SELECT: "select", // 选择线路
  CONFIG: "config", // 配置阶段
  MEMORIZE: "memorize", // 记忆阶段
  QUIZ: "quiz", // 答题阶段
} as const;

type GameStage = (typeof GAME_STAGES)[keyof typeof GAME_STAGES];

const DEFAULT_MEMORIZE_TIME = 5 * 60 * 1000; // 默认5分钟（毫秒）

interface Result {
  correct: boolean;
  stationName: string;
  userAnswer: string;
  userTransferAnswer: string;
  transfer: string[];
  transferCorrect: boolean;
}

interface PlayerScore {
  correct: number;
  total: number;
}

interface Player {
  id: number;
  name: string;
  score: PlayerScore;
}

function App() {
  const [gameStage, setGameStage] = useState<GameStage>(GAME_STAGES.SELECT);
  const [selectedLine, setSelectedLine] = useState<SubwayLine | null>(null);
  const [memorizeTime, setMemorizeTime] = useState<number>(5); // 记忆时间（分钟）
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_MEMORIZE_TIME);
  const [playerCount, setPlayerCount] = useState<number>(2); // 玩家数量
  const [players, setPlayers] = useState<Player[]>([]); // 玩家列表
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0); // 当前答题的玩家索引
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [userTransferAnswer, setUserTransferAnswer] = useState<string>("");
  const [result, setResult] = useState<Result | null>(null);
  const [answeredStations, setAnsweredStations] = useState<Set<number>>(
    new Set()
  );
  // 跟踪每个玩家对每个站点的答题情况：key为"playerIndex-stationIndex"，value为是否答对
  const [playerStationAnswers, setPlayerStationAnswers] = useState<
    Map<string, boolean>
  >(new Map());

  // 计时器
  useEffect(() => {
    if (gameStage === GAME_STAGES.MEMORIZE && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1000) {
            setGameStage(GAME_STAGES.QUIZ);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStage, timeLeft]);

  // 快速开始（随机选择线路，进入配置）
  const handleQuickStart = () => {
    const randomLine =
      subwayLines[Math.floor(Math.random() * subwayLines.length)];
    setSelectedLine(randomLine);
    setGameStage(GAME_STAGES.CONFIG);
  };

  // 初始化玩家
  const initializePlayers = (count: number) => {
    const newPlayers: Player[] = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `玩家${i + 1}`,
      score: { correct: 0, total: 0 },
    }));
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
  };

  // 立即开始（随机选择线路，直接答题）
  const handleImmediateStart = () => {
    const randomLine =
      subwayLines[Math.floor(Math.random() * subwayLines.length)];
    setSelectedLine(randomLine);
    initializePlayers(playerCount);
    setCurrentStationIndex(0);
    setUserAnswer("");
    setUserTransferAnswer("");
    setResult(null);
    setAnsweredStations(new Set());
    setPlayerStationAnswers(new Map());
    setGameStage(GAME_STAGES.QUIZ);
  };

  // 选择线路
  const handleSelectLine = (line: SubwayLine) => {
    setSelectedLine(line);
    setGameStage(GAME_STAGES.CONFIG);
  };

  // 立即开始答题（跳过记忆阶段）
  const handleStartQuizDirectly = () => {
    initializePlayers(playerCount);
    setCurrentStationIndex(0);
    setUserAnswer("");
    setUserTransferAnswer("");
    setResult(null);
    setAnsweredStations(new Set());
    setPlayerStationAnswers(new Map());
    setGameStage(GAME_STAGES.QUIZ);
  };

  // 开始记忆
  const handleStartMemorize = () => {
    initializePlayers(playerCount);
    const timeInMs = memorizeTime * 60 * 1000;
    setTimeLeft(timeInMs);
    setGameStage(GAME_STAGES.MEMORIZE);
    setCurrentStationIndex(0);
    setUserAnswer("");
    setUserTransferAnswer("");
    setResult(null);
    setAnsweredStations(new Set());
    setPlayerStationAnswers(new Map());
  };

  // 重新开始
  const handleRestart = () => {
    setGameStage(GAME_STAGES.SELECT);
    setSelectedLine(null);
    setTimeLeft(DEFAULT_MEMORIZE_TIME);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setCurrentStationIndex(0);
    setUserAnswer("");
    setUserTransferAnswer("");
    setResult(null);
    setAnsweredStations(new Set());
    setPlayerStationAnswers(new Map());
  };

  // 返回配置
  const handleBackToConfig = () => {
    setGameStage(GAME_STAGES.CONFIG);
  };

  // 格式化时间
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // 提交答案
  const handleSubmitAnswer = () => {
    if (
      !userAnswer.trim() ||
      !userTransferAnswer.trim() ||
      !selectedLine ||
      players.length === 0
    )
      return;

    // 检查当前玩家是否已经答对了当前站点
    const answerKey = `${currentPlayerIndex}-${currentStationIndex}`;
    if (playerStationAnswers.get(answerKey) === true) {
      return; // 已经答对了，不允许重复提交
    }

    const currentStation = selectedLine.stations[currentStationIndex];
    const isStationCorrect = userAnswer.trim() === currentStation.name;

    // 判断换乘线路是否正确
    const userAnswerLower = userTransferAnswer.trim().toLowerCase();
    const userTransferLines =
      userAnswerLower === "无" || userAnswerLower === ""
        ? []
        : userTransferAnswer
            .trim()
            .split(/[，,、\s]+/)
            .map(t =>
              t
                .trim()
                .replace(/号线$/, "")
                .replace(/^线/, "")
                .replace(/^号/, "")
            )
            .filter(t => t.trim() && t !== "无");

    const correctTransferLines = currentStation.transfer.map(t =>
      t.trim().replace(/号线$/, "").replace(/^线/, "").replace(/^号/, "")
    );

    const isTransferCorrect =
      currentStation.transfer.length === 0
        ? userTransferLines.length === 0 ||
          userAnswerLower === "无" ||
          userAnswerLower === ""
        : userTransferLines.length === correctTransferLines.length &&
          userTransferLines.every(line =>
            correctTransferLines.includes(line)
          ) &&
          correctTransferLines.every(line => userTransferLines.includes(line));

    // 站点和换乘都答对才算正确
    const isCorrect = isStationCorrect && isTransferCorrect;

    setResult({
      correct: isCorrect,
      stationName: currentStation.name,
      userAnswer: userAnswer.trim(),
      userTransferAnswer: userTransferAnswer.trim(),
      transfer: currentStation.transfer,
      transferCorrect: isTransferCorrect,
    });

    // 更新当前玩家的得分
    setPlayers(prev =>
      prev.map((player, index) =>
        index === currentPlayerIndex
          ? {
              ...player,
              score: {
                correct: player.score.correct + (isCorrect ? 1 : 0),
                total: player.score.total + 1,
              },
            }
          : player
      )
    );

    // 记录当前玩家对当前站点的答题情况
    setPlayerStationAnswers(prev => {
      const newMap = new Map(prev);
      newMap.set(answerKey, isCorrect);
      return newMap;
    });

    setAnsweredStations(prev => new Set([...prev, currentStationIndex]));
  };

  // 切换到下一个玩家或下一站
  const handleNextPlayer = () => {
    if (selectedLine && result && players.length > 0) {
      // 如果当前玩家答对了，进入下一站
      if (result.correct) {
        if (currentStationIndex < selectedLine.stations.length - 1) {
          setCurrentStationIndex(prev => prev + 1);
          setCurrentPlayerIndex(0); // 重置到第一个玩家
        }
      } else {
        // 如果答错了，切换到下一个玩家
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        setCurrentPlayerIndex(nextPlayerIndex);
      }

      setUserAnswer("");
      setUserTransferAnswer("");
      setResult(null);
    }
  };

  // 上一题
  const handlePrevious = () => {
    if (currentStationIndex > 0) {
      setCurrentStationIndex(prev => prev - 1);
      setUserAnswer("");
      setUserTransferAnswer("");
      setResult(null);
    }
  };

  // 跳转到指定站点
  const handleJumpToStation = (index: number) => {
    setCurrentStationIndex(index);
    setUserAnswer("");
    setUserTransferAnswer("");
    setResult(null);
  };

  // 选择线路界面
  if (gameStage === GAME_STAGES.SELECT) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-5">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-[600px] shadow-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-3">
            地铁站点记忆游戏
          </h1>
          <p className="text-center text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
            选择一条地铁线路开始游戏
          </p>

          {/* 快速开始按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button
              className="flex-1 px-4 py-3 sm:py-4 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl cursor-pointer transition-all duration-300 hover:from-indigo-600 hover:to-purple-700 hover:-translate-y-0.5 hover:shadow-lg"
              onClick={handleQuickStart}
            >
              🎲 快速开始（先记忆）
            </button>
            <button
              className="flex-1 px-4 py-3 sm:py-4 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl cursor-pointer transition-all duration-300 hover:from-green-600 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-lg"
              onClick={handleImmediateStart}
            >
              ⚡ 立即开始（直接答题）
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            {subwayLines.map(line => (
              <button
                key={line.id}
                className="flex justify-between items-center p-4 sm:p-5 border-none rounded-xl bg-gray-50 cursor-pointer transition-all duration-300 text-left hover:bg-gray-100 hover:translate-x-1 active:translate-x-0.5"
                style={{ borderLeft: `5px solid ${line.color}` }}
                onClick={() => handleSelectLine(line)}
              >
                <span className="text-lg sm:text-xl font-bold text-gray-800">
                  {line.name}
                </span>
                <span className="text-xs sm:text-sm text-gray-600">
                  {line.stations.length} 个站点
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 配置界面
  if (gameStage === GAME_STAGES.CONFIG && selectedLine) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-5">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-[600px] shadow-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-3">
            游戏配置
          </h1>

          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl"
                style={{ backgroundColor: selectedLine.color }}
              >
                {selectedLine.name}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {selectedLine.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedLine.stations.length} 个站点
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <label className="block text-base sm:text-lg font-medium text-gray-800 mb-3">
              参与人数
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="10"
                value={playerCount}
                onChange={e => {
                  const value = parseInt(e.target.value) || 1;
                  setPlayerCount(Math.max(1, Math.min(10, value)));
                }}
                className="flex-1 p-3 sm:p-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              <div className="text-sm sm:text-base text-gray-600 min-w-[60px]">
                {playerCount} 人
              </div>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {[2, 3, 4, 5].map(count => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    playerCount === count
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {count}人
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <label className="block text-base sm:text-lg font-medium text-gray-800 mb-3">
              记忆时间（分钟）
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="60"
                value={memorizeTime}
                onChange={e => {
                  const value = parseInt(e.target.value) || 1;
                  setMemorizeTime(Math.max(1, Math.min(60, value)));
                }}
                className="flex-1 p-3 sm:p-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              <div className="text-sm sm:text-base text-gray-600 min-w-[60px]">
                {memorizeTime} 分钟
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {[1, 3, 5, 10, 15].map(min => (
                <button
                  key={min}
                  onClick={() => setMemorizeTime(min)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    memorizeTime === min
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {min}分钟
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                className="flex-1 px-4 py-3 sm:py-4 text-base sm:text-lg border border-gray-300 rounded-xl bg-white text-gray-600 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                onClick={() => {
                  setGameStage(GAME_STAGES.SELECT);
                  setSelectedLine(null);
                }}
              >
                返回选择
              </button>
              <button
                className="flex-1 px-4 py-3 sm:py-4 text-base sm:text-lg border-none rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer transition-all duration-300 font-medium hover:from-indigo-600 hover:to-purple-700 hover:-translate-y-0.5 hover:shadow-lg"
                onClick={handleStartMemorize}
              >
                开始记忆
              </button>
            </div>
            <button
              className="w-full px-4 py-3 sm:py-4 text-base sm:text-lg border-none rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-pointer transition-all duration-300 font-medium hover:from-green-600 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-lg"
              onClick={handleStartQuizDirectly}
            >
              ⚡ 立即开始答题（跳过记忆）
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 记忆阶段 - 地铁路线图样式
  if (gameStage === GAME_STAGES.MEMORIZE && selectedLine) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-5 bg-gray-50">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-[900px] shadow-2xl">
          <div className="text-center mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white">
            <div className="text-3xl sm:text-5xl font-bold font-mono mb-2">
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm sm:text-base opacity-90">剩余记忆时间</p>
          </div>

          <div className="flex justify-between items-center mb-4 sm:mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg"
                style={{ backgroundColor: selectedLine.color }}
              >
                {selectedLine.name}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {selectedLine.name}
              </h2>
            </div>
            <button
              className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-pointer text-xs sm:text-sm transition-all duration-300 hover:bg-gray-50"
              onClick={handleBackToConfig}
            >
              返回配置
            </button>
          </div>

          {/* 地铁路线图样式 */}
          <div className="overflow-auto -mx-4 sm:-mx-6 px-4 sm:px-6 flex h-[100px]">
            <div
              className="flex items-center"
              style={{
                minWidth: `${Math.max(
                  selectedLine.stations.length * 100,
                  600
                )}px`,
              }}
            >
              {selectedLine.stations.map((station, index) => (
                <div key={index} className="flex items-center flex-shrink-0">
                  {/* 站点 */}
                  <div className="flex flex-col items-center relative z-10">
                    {/* 站点圆圈 */}
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white transition-transform hover:scale-110 relative z-20 ${
                        station.transfer.length > 0
                          ? "ring-2 ring-yellow-400"
                          : ""
                      }`}
                      style={{ backgroundColor: selectedLine.color }}
                    >
                      <div className="text-center px-1">
                        <div className="text-[8px] sm:text-[10px] leading-tight font-bold">
                          {station.name}
                        </div>
                      </div>
                    </div>

                    {/* 换乘标识 */}
                    {station.transfer.length > 0 && (
                      <div className="mt-1.5 px-1.5 sm:px-2 py-0.5 bg-yellow-400 rounded-full text-[7px] sm:text-[10px] font-bold text-gray-800 whitespace-nowrap relative z-20 shadow-md">
                        换乘
                      </div>
                    )}
                  </div>

                  {/* 连接线 */}
                  {index < selectedLine.stations.length - 1 && (
                    <div
                      className="h-1 sm:h-1.5 mx-1 sm:mx-3 relative flex-shrink-0 z-0"
                      style={{
                        width: "70px",
                        backgroundColor: selectedLine.color,
                        minWidth: "50px",
                      }}
                    >
                      {/* 连接线上的小点 */}
                      <div className="absolute inset-0 flex items-center justify-between px-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-white"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 站点列表（详细） */}
          <div className="mt-4 sm:mt-6 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {selectedLine.stations.map((station, index) => (
                <div
                  key={index}
                  className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: selectedLine.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                        {index + 1}. {station.name}
                      </div>
                      {station.transfer.length > 0 && (
                        <div className="text-[10px] text-gray-600 mt-0.5">
                          换乘: {station.transfer.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 答题阶段
  if (gameStage === GAME_STAGES.QUIZ && selectedLine && players.length > 0) {
    const progress =
      ((currentStationIndex + 1) / selectedLine.stations.length) * 100;
    const isLastStation =
      currentStationIndex === selectedLine.stations.length - 1;
    const currentPlayer = players[currentPlayerIndex];

    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-5">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-[700px] shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-5 gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg"
                style={{ backgroundColor: selectedLine.color }}
              >
                {selectedLine.name}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                答题阶段
              </h2>
            </div>
          </div>

          {/* 玩家得分统计 */}
          <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-gray-50 rounded-xl">
            <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">
              得分统计
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                    index === currentPlayerIndex && !result
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-gray-800">
                      {player.name}
                    </span>
                    {index === currentPlayerIndex && !result && (
                      <span className="text-[10px] sm:text-xs text-indigo-600 font-bold">
                        答题中
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    答对:{" "}
                    <span className="font-bold text-indigo-600">
                      {player.score.correct}
                    </span>{" "}
                    / 答过:{" "}
                    <span className="font-bold text-gray-800">
                      {player.score.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2 sm:mb-3">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-gray-600 text-xs sm:text-sm mb-4 sm:mb-5">
            第 {currentStationIndex + 1} 站 / 共 {selectedLine.stations.length}{" "}
            站
          </p>

          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="flex flex-col gap-3 sm:gap-4">
              {!result ? (
                <>
                  <div className="text-center mb-2">
                    <p className="text-sm sm:text-base text-gray-600 mb-1">
                      当前答题：
                      <span className="font-bold text-indigo-600">
                        {currentPlayer.name}
                      </span>
                    </p>
                    <p className="text-sm sm:text-base text-gray-800 font-medium">
                      请输入当前站点的名称：
                    </p>
                  </div>

                  <input
                    type="text"
                    className="p-3 sm:p-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl w-full transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === "Enter" && userAnswer.trim()) {
                        document.getElementById("transfer-input")?.focus();
                      }
                    }}
                    placeholder={`${currentPlayer.name} 输入站点名称`}
                    autoFocus
                  />

                  <div className="mt-3">
                    <p className="text-sm sm:text-base text-gray-800 font-medium mb-2">
                      请输入换乘线路（多个线路用逗号或空格分隔，无换乘请输入"无"）：
                    </p>
                    <input
                      id="transfer-input"
                      type="text"
                      className="p-3 sm:p-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl w-full transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      value={userTransferAnswer}
                      onChange={e => setUserTransferAnswer(e.target.value)}
                      onKeyPress={e => {
                        if (
                          e.key === "Enter" &&
                          userAnswer.trim() &&
                          userTransferAnswer.trim()
                        ) {
                          handleSubmitAnswer();
                        }
                      }}
                      placeholder="例如：2号线,3号线 或 无"
                    />
                  </div>

                  <button
                    className="w-full mt-3 px-4 py-3 sm:py-4 text-base sm:text-lg border-none rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer transition-all duration-300 font-medium hover:from-indigo-600 hover:to-purple-700 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || !userTransferAnswer.trim()}
                  >
                    {currentPlayer.name} 提交答案
                  </button>
                </>
              ) : (
                <div
                  className={`p-4 sm:p-5 rounded-xl flex gap-3 sm:gap-4 items-start ${
                    result.correct
                      ? "bg-green-100 border-2 border-green-500"
                      : "bg-red-100 border-2 border-red-500"
                  }`}
                >
                  <div
                    className={`text-2xl sm:text-3xl font-bold flex-shrink-0 ${
                      result.correct ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {result.correct ? "✓" : "✗"}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-base sm:text-lg font-bold mb-2 sm:mb-3 ${
                        result.correct ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {result.correct ? "回答正确！" : "回答错误"}
                    </p>
                    {result.correct ? (
                      <>
                        <p className="text-sm sm:text-base my-1 text-gray-800">
                          正确答案:{" "}
                          <strong className="text-indigo-600">
                            {result.stationName}
                          </strong>
                        </p>
                        {result.transfer.length > 0 ? (
                          <p className="text-sm sm:text-base my-1 text-gray-800">
                            换乘线路:{" "}
                            <strong className="text-indigo-600">
                              {result.transfer.join(", ")}
                            </strong>
                          </p>
                        ) : (
                          <p className="text-sm sm:text-base my-1 text-gray-800">
                            换乘线路:{" "}
                            <strong className="text-indigo-600">无</strong>
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm sm:text-base my-1 text-gray-800">
                          你的答案: {result.userAnswer}
                        </p>
                        <p className="text-sm sm:text-base my-1 text-gray-800">
                          你的换乘答案: {result.userTransferAnswer || "未填写"}
                        </p>
                        {!result.transferCorrect && (
                          <p className="text-xs text-red-600 mt-1">
                            {result.userAnswer === result.stationName
                              ? "站点名称正确，但换乘线路错误"
                              : "换乘线路错误"}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {result && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {result.correct && isLastStation ? (
                  <div className="flex-1 px-4 py-3 sm:py-4 text-base sm:text-lg border-none rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center font-medium">
                    恭喜！已完成所有站点 🎉
                  </div>
                ) : result.correct ? (
                  <button
                    className="flex-1 px-4 py-3 sm:py-4 text-base sm:text-lg border-none rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-pointer transition-all duration-300 font-medium hover:from-green-600 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-md"
                    onClick={handleNextPlayer}
                  >
                    下一站 ✓
                  </button>
                ) : (
                  <button
                    className="flex-1 px-4 py-3 sm:py-4 text-base sm:text-lg border-none rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white cursor-pointer transition-all duration-300 font-medium hover:from-orange-600 hover:to-red-700 hover:-translate-y-0.5 hover:shadow-md"
                    onClick={handleNextPlayer}
                  >
                    下一位玩家（答错了）→
                  </button>
                )}
              </div>
            )}

            <button
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-600 cursor-pointer text-xs sm:text-sm transition-all duration-300 hover:bg-gray-50 w-full"
              onClick={handleRestart}
            >
              重新开始游戏
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
