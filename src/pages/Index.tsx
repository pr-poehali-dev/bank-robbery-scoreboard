import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RoundData {
  correct: boolean[];
  blitz: boolean[];
  times: number[];
}

interface GameState {
  rounds: RoundData[];
}

const TEAM_NAMES = ['Команда Альфа', 'Команда Бета', 'Команда Гамма'];
const ROUND_COEFFICIENTS = [1, 1, 2, 2, 3];
const PLACE_POINTS = [100, 75, 50];

const Index = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('bankHeist');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      rounds: Array(5).fill(null).map(() => ({
        correct: [false, false, false],
        blitz: [false, false, false],
        times: [0, 0, 0]
      }))
    };
  });

  useEffect(() => {
    localStorage.setItem('bankHeist', JSON.stringify(gameState));
  }, [gameState]);

  const calculatePlacePoints = (roundIndex: number) => {
    const times = gameState.rounds[roundIndex].times;
    const sorted = [...times].map((time, idx) => ({ time, idx }))
      .filter(t => t.time > 0)
      .sort((a, b) => a.time - b.time);
    
    const points = [0, 0, 0];
    sorted.forEach((item, place) => {
      if (place < 3) {
        points[item.idx] = PLACE_POINTS[place];
      }
    });
    return points;
  };

  const calculateRoundScore = (roundIndex: number, teamIndex: number) => {
    const round = gameState.rounds[roundIndex];
    const correct = round.correct[teamIndex] ? 1 : 0;
    const blitz = round.blitz[teamIndex] ? 1 : 0;
    const coefficient = ROUND_COEFFICIENTS[roundIndex];
    const placePoints = calculatePlacePoints(roundIndex);
    
    return correct * coefficient * placePoints[teamIndex] * (blitz || 1);
  };

  const calculateTotalScore = (teamIndex: number) => {
    return gameState.rounds.reduce((sum, _, roundIndex) => {
      return sum + calculateRoundScore(roundIndex, teamIndex);
    }, 0);
  };

  const updateRound = (roundIndex: number, field: keyof RoundData, teamIndex: number, value: any) => {
    setGameState(prev => {
      const newRounds = [...prev.rounds];
      const newRound = { ...newRounds[roundIndex] };
      if (field === 'times') {
        newRound.times = [...newRound.times];
        newRound.times[teamIndex] = value;
      } else {
        newRound[field] = [...newRound[field] as boolean[]];
        (newRound[field] as boolean[])[teamIndex] = value;
      }
      newRounds[roundIndex] = newRound;
      return { rounds: newRounds };
    });
  };

  const resetGame = () => {
    if (confirm('Сбросить все данные игры?')) {
      const newState = {
        rounds: Array(5).fill(null).map(() => ({
          correct: [false, false, false],
          blitz: [false, false, false],
          times: [0, 0, 0]
        }))
      };
      setGameState(newState);
      localStorage.setItem('bankHeist', JSON.stringify(newState));
    }
  };

  const leaderboard = TEAM_NAMES.map((name, idx) => ({
    name,
    score: calculateTotalScore(idx),
    index: idx
  })).sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-[#0A0A0F] cyber-grid p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4 py-8">
          <h1 className="text-5xl md:text-7xl font-black text-[#FF0055] neon-glow-red tracking-wider">
            ОГРАБЛЕНИЕ БАНКА ГИПОТЕЗ
          </h1>
          <p className="text-xl text-[#00F0FF] neon-glow-cyan font-medium">
            СИСТЕМА ПОДСЧЁТА ОЧКОВ
          </p>
        </div>

        <Card className="bg-black/80 border-2 border-[#FF0055] neon-border-red p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-[#FF0055] flex items-center gap-3">
              <Icon name="Trophy" size={32} className="text-[#00F0FF]" />
              РЕЙТИНГ
            </h2>
            <Button 
              onClick={resetGame}
              variant="outline"
              className="border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF]/20"
            >
              <Icon name="RotateCcw" size={18} className="mr-2" />
              Сбросить
            </Button>
          </div>
          <div className="space-y-4">
            {leaderboard.map((team, position) => (
              <div 
                key={team.index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FF0055]/20 to-[#00F0FF]/20 border border-[#00F0FF]/50 rounded-lg hover:scale-105 transition-transform"
              >
                <div className="flex items-center gap-4">
                  <span className={`text-3xl font-black ${
                    position === 0 ? 'text-[#FFD700] neon-glow-red' : 
                    position === 1 ? 'text-[#C0C0C0]' : 
                    'text-[#CD7F32]'
                  }`}>
                    #{position + 1}
                  </span>
                  <span className="text-xl font-bold text-white">{team.name}</span>
                </div>
                <span className="text-4xl font-black text-[#00F0FF] neon-glow-cyan">
                  {team.score}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Tabs defaultValue="round-0" className="w-full">
          <TabsList className="grid grid-cols-5 bg-black/60 border border-[#00F0FF]/50 p-1">
            {[1, 2, 3, 4, 5].map((round, idx) => (
              <TabsTrigger 
                key={idx} 
                value={`round-${idx}`}
                className="data-[state=active]:bg-[#FF0055] data-[state=active]:text-white font-bold"
              >
                РАУНД {round}
              </TabsTrigger>
            ))}
          </TabsList>

          {gameState.rounds.map((round, roundIdx) => (
            <TabsContent key={roundIdx} value={`round-${roundIdx}`}>
              <Card className="bg-black/80 border-2 border-[#00F0FF] neon-border-cyan p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-[#00F0FF]">
                      РАУНД {roundIdx + 1}
                    </h3>
                    <span className="text-lg text-[#FF0055] font-bold">
                      Коэффициент: x{ROUND_COEFFICIENTS[roundIdx]}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TEAM_NAMES.map((teamName, teamIdx) => {
                      const placePoints = calculatePlacePoints(roundIdx);
                      const score = calculateRoundScore(roundIdx, teamIdx);
                      
                      return (
                        <Card key={teamIdx} className="bg-gradient-to-br from-[#FF0055]/10 to-[#00F0FF]/10 border border-[#00F0FF]/30 p-4">
                          <h4 className="text-lg font-bold text-white mb-4">{teamName}</h4>
                          
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`correct-${roundIdx}-${teamIdx}`}
                                checked={round.correct[teamIdx]}
                                onCheckedChange={(checked) => 
                                  updateRound(roundIdx, 'correct', teamIdx, checked)
                                }
                                className="border-[#00F0FF]"
                              />
                              <Label htmlFor={`correct-${roundIdx}-${teamIdx}`} className="text-white">
                                Правильный ответ
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`blitz-${roundIdx}-${teamIdx}`}
                                checked={round.blitz[teamIdx]}
                                onCheckedChange={(checked) => 
                                  updateRound(roundIdx, 'blitz', teamIdx, checked)
                                }
                                className="border-[#FF0055]"
                              />
                              <Label htmlFor={`blitz-${roundIdx}-${teamIdx}`} className="text-white">
                                Блиц-вопрос
                              </Label>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white">Время (сек)</Label>
                              <Input
                                type="number"
                                value={round.times[teamIdx] || ''}
                                onChange={(e) => 
                                  updateRound(roundIdx, 'times', teamIdx, parseFloat(e.target.value) || 0)
                                }
                                className="bg-black/50 border-[#00F0FF] text-white"
                                placeholder="0"
                              />
                              {placePoints[teamIdx] > 0 && (
                                <p className="text-sm text-[#00F0FF]">
                                  Баллы за место: {placePoints[teamIdx]}
                                </p>
                              )}
                            </div>

                            <div className="pt-4 border-t border-[#00F0FF]/30">
                              <p className="text-2xl font-black text-[#FF0055] neon-glow-red">
                                Очков: {score}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="bg-black/80 border-2 border-[#FF0055] neon-border-red p-6">
          <h2 className="text-2xl font-bold text-[#FF0055] mb-4 flex items-center gap-2">
            <Icon name="BookOpen" size={28} className="text-[#00F0FF]" />
            ПРАВИЛА НАЧИСЛЕНИЯ БАЛЛОВ
          </h2>
          <div className="space-y-4 text-white">
            <div className="bg-[#00F0FF]/10 p-4 rounded border border-[#00F0FF]/30">
              <p className="font-mono text-lg">
                <span className="text-[#00F0FF] font-bold">Формула:</span> Правильный ответ × Коэффициент раунда × Место в раунде × Блиц
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-[#00F0FF] font-bold">Коэффициенты раундов:</h3>
                <ul className="space-y-1 pl-4">
                  <li>• Раунды 1-2: x1</li>
                  <li>• Раунды 3-4: x2</li>
                  <li>• Раунд 5: x3</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-[#00F0FF] font-bold">Баллы за место:</h3>
                <ul className="space-y-1 pl-4">
                  <li>• 1 место: 100 баллов</li>
                  <li>• 2 место: 75 баллов</li>
                  <li>• 3 место: 50 баллов</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;