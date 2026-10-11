import type { Player, PositionCode } from '@/types';
import PlayerCard from './PlayerCard';

interface BenchAreaProps {
  benchPlayers: Player[];
  battingOrder: string[];
  onDropPlayer: (playerId: string) => void;
  draggedPlayerId: string | null;
  setDraggedPlayerId: (id: string | null) => void;
}

export default function BenchArea({
  benchPlayers,
  battingOrder,
  onDropPlayer,
  setDraggedPlayerId,
}: BenchAreaProps) {
  return (
    <div
      className="rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 p-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const playerId = e.dataTransfer.getData('text/plain');
        if (playerId) onDropPlayer(playerId);
        setDraggedPlayerId(null);
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-slate-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">BN</span>
        </div>
        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Bench</h3>
        <span className="text-xs text-slate-400 ml-auto">{benchPlayers.length} players</span>
      </div>
      {benchPlayers.length === 0 ? (
        <div className="text-center py-4 text-slate-400 text-sm">
          Drag players here to bench them
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          {benchPlayers.map((player) => {
            const batIdx = battingOrder.indexOf(player.id);
            return (
              <PlayerCard
                key={player.id}
                player={player}
                position="BN"
                battingOrder={batIdx >= 0 ? batIdx + 1 : null}
                compact
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', player.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggedPlayerId(player.id);
                }}
                onDragEnd={() => setDraggedPlayerId(null)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
