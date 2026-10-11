import { useState, useCallback } from 'react';
import type { Player, PositionCode } from '@/types';
import { POSITION_COLORS, POSITION_LABELS } from '@/types';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';

interface LineupTableProps {
  battingOrder: string[];
  players: Player[];
  positions: Record<string, PositionCode | null>;
  onReorder: (newOrder: string[]) => void;
  onDropToPosition: (playerId: string, position: PositionCode) => void;
  onRemoveFromPosition: (playerId: string) => void;
  draggedPlayerId: string | null;
  setDraggedPlayerId: (id: string | null) => void;
  viewOnly?: boolean;
}

export default function LineupTable({
  battingOrder,
  players,
  positions,
  onReorder,
  onDropToPosition,
  onRemoveFromPosition,
  draggedPlayerId,
  setDraggedPlayerId,
  viewOnly = false,
}: LineupTableProps) {
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const playerById = useCallback(
    (id: string) => players.find((p) => p.id === id),
    [players]
  );

  const movePlayer = (playerId: string, direction: 'up' | 'down') => {
    const idx = battingOrder.indexOf(playerId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= battingOrder.length) return;
    const newOrder = [...battingOrder];
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    onReorder(newOrder);
  };

  // Move a player to a specific batting slot (1-based), swapping with whoever is there.
  const moveToSlot = (playerId: string, targetSlot: number) => {
    const currentIdx = battingOrder.indexOf(playerId);
    if (currentIdx < 0) return;
    const targetIdx = targetSlot - 1;
    if (targetIdx === currentIdx || targetIdx < 0 || targetIdx >= battingOrder.length) return;
    const newOrder = [...battingOrder];
    [newOrder[currentIdx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[currentIdx]];
    onReorder(newOrder);
  };

  const addToOrder = (playerId: string) => {
    if (battingOrder.includes(playerId)) return;
    onReorder([...battingOrder, playerId]);
  };

  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData('text/plain', playerId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPlayerId(playerId);
  };

  const handleDragEnd = () => {
    setDraggedPlayerId(null);
    setDropTargetIndex(null);
  };

  const handleRowDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetIndex(index);
  };

  const handleRowDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;

    const currentIdx = battingOrder.indexOf(draggedId);
    if (currentIdx === index) {
      setDropTargetIndex(null);
      return;
    }

    const newOrder = [...battingOrder];
    if (currentIdx >= 0) {
      newOrder.splice(currentIdx, 1);
    }
    const insertIdx = currentIdx >= 0 && currentIdx < index ? index - 1 : index;
    newOrder.splice(insertIdx, 0, draggedId);
    onReorder(newOrder);
    setDraggedPlayerId(null);
    setDropTargetIndex(null);
  };

  const handleEndDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetIndex(battingOrder.length);
  };

  const handleEndDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;
    if (battingOrder.includes(draggedId)) return;
    onReorder([...battingOrder, draggedId]);
    setDraggedPlayerId(null);
    setDropTargetIndex(null);
  };

  const unassigned = players.filter((p) => !battingOrder.includes(p.id));

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="bg-slate-800 text-white px-3 py-2.5 flex items-center gap-2">
          <span className="font-bold text-sm flex-1">Batting Order</span>
          <span className="text-xs text-slate-400">
            {battingOrder.length} batter{battingOrder.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div onDragOver={handleEndDragOver} onDrop={handleEndDrop}>
          {battingOrder.map((playerId, index) => {
            const player = playerById(playerId);
            if (!player) return null;
            const pos = positions[playerId] ?? null;
            const posColor = pos ? POSITION_COLORS[pos] : '#94a3b8';
            const isDragging = draggedPlayerId === playerId;
            const isDropTarget = dropTargetIndex === index;

            return (
              <div key={playerId}>
                {isDropTarget && (
                  <div className="h-1 bg-emerald-500 mx-2 rounded-full" />
                )}
                <div
                  className={[
                    'flex items-center gap-2 px-2 py-2 border-b border-slate-100 transition-all select-none',
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50',
                    isDragging ? 'opacity-40' : '',
                    viewOnly ? '' : 'hover:bg-emerald-50',
                  ].join(' ')}
                  draggable={!viewOnly}
                  onDragStart={viewOnly ? undefined : (e) => handleDragStart(e, playerId)}
                  onDragEnd={viewOnly ? undefined : handleDragEnd}
                  onDragOver={viewOnly ? undefined : (e) => handleRowDragOver(e, index)}
                  onDrop={viewOnly ? undefined : (e) => handleRowDrop(e, index)}
                >
                  {/* Batting order number */}
                  <div
                    className="flex items-center justify-center rounded-lg font-extrabold text-white text-sm shrink-0 text-center"
                    style={{
                      backgroundColor: posColor,
                      width: 40,
                      height: 36,
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Player name + jersey number */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {player.number != null && (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 shrink-0">
                        #{player.number}
                      </span>
                    )}
                    <span className="font-semibold text-slate-800 truncate text-sm">
                      {player.name}
                    </span>
                  </div>

                  {/* Position label */}
                  {viewOnly ? (
                    <span
                      className="rounded-lg border-2 font-bold text-xs py-1 px-1.5 shrink-0"
                      style={{
                        borderColor: posColor,
                        color: pos ? posColor : '#94a3b8',
                        backgroundColor: pos ? `${posColor}15` : '#f8fafc',
                      }}
                    >
                      {pos ?? '--'}
                    </span>
                  ) : (
                    <select
                      value={pos ?? ''}
                      onChange={(e) => {
                        const newPos = e.target.value as PositionCode;
                        if (newPos) {
                          onDropToPosition(player.id, newPos);
                        } else {
                          onRemoveFromPosition(player.id);
                        }
                      }}
                      className="rounded-lg border-2 font-bold text-xs py-1 px-1.5 cursor-pointer outline-none focus:ring-2 focus:ring-emerald-400 shrink-0"
                      style={{
                        borderColor: posColor,
                        color: pos ? posColor : '#94a3b8',
                        backgroundColor: pos ? `${posColor}15` : '#f8fafc',
                      }}
                    >
                      <option value="">--</option>
                      {Object.entries(POSITION_LABELS).map(([code, label]) => (
                        <option key={code} value={code}>
                          {code} — {label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Up/down buttons */}
                  {!viewOnly && (
                    <div className="flex flex-col shrink-0">
                      <button
                        onClick={() => movePlayer(playerId, 'up')}
                        disabled={index === 0}
                        className="text-slate-400 hover:text-emerald-600 disabled:opacity-20 disabled:cursor-not-allowed p-0.5 rounded transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => movePlayer(playerId, 'down')}
                        disabled={index === battingOrder.length - 1}
                        className="text-slate-400 hover:text-emerald-600 disabled:opacity-20 disabled:cursor-not-allowed p-0.5 rounded transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {!viewOnly && <GripVertical className="w-5 h-5 text-slate-300 shrink-0 cursor-grab active:cursor-grabbing" />}
                </div>
              </div>
            );
          })}

          {dropTargetIndex === battingOrder.length && battingOrder.length > 0 && (
            <div className="h-1 bg-emerald-500 mx-2 rounded-full" />
          )}

          {/* Unassigned players */}
          {!viewOnly && unassigned.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-2 px-2 py-2 border-b border-slate-100 bg-amber-50 select-none hover:bg-amber-100 transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, player.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleEndDragOver}
              onDrop={handleEndDrop}
            >
              <div className="flex items-center justify-center rounded-lg font-bold text-amber-500 bg-amber-100 border-2 border-dashed border-amber-300 shrink-0 w-10 h-9 text-lg">
                ?
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {player.number != null && (
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 shrink-0">
                    #{player.number}
                  </span>
                )}
                <span className="font-semibold text-slate-700 truncate text-sm">
                  {player.name}
                </span>
              </div>
              <button
                onClick={() => addToOrder(player.id)}
                className="rounded-lg bg-amber-500 text-white text-xs font-bold px-2.5 py-1.5 hover:bg-amber-600 transition-colors shrink-0"
              >
                + Add
              </button>
              <GripVertical className="w-5 h-5 text-amber-300 shrink-0" />
            </div>
          ))}

          {battingOrder.length === 0 && unassigned.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No players yet. Add players to your roster below.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
