import type { Player, PositionCode } from '@/types';
import { POSITION_COLORS, POSITION_LABELS } from '@/types';

interface PlayerCardProps {
  player: Player;
  position?: PositionCode | null;
  battingOrder?: number | null;
  compact?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  isDragging?: boolean;
}

export default function PlayerCard({
  player,
  position,
  battingOrder,
  compact = false,
  draggable = true,
  onDragStart,
  onDragEnd,
  onTouchStart,
  isDragging = false,
}: PlayerCardProps) {
  const posColor = position ? POSITION_COLORS[position] : '#64748b';

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      className={[
        'relative flex items-center gap-2 rounded-xl bg-white border-2 shadow-sm transition-all',
        compact ? 'px-2 py-1.5' : 'px-3 py-2.5',
        draggable ? 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-emerald-400' : '',
        isDragging ? 'opacity-40 scale-95' : '',
      ].join(' ')}
      style={{ borderColor: position ? posColor : '#e2e8f0', touchAction: 'none' }}
    >
      {battingOrder != null && (
        <div
          className="flex items-center justify-center rounded-lg font-bold text-white shrink-0"
          style={{
            backgroundColor: posColor,
            width: compact ? 24 : 32,
            height: compact ? 24 : 32,
            fontSize: compact ? 13 : 16,
          }}
        >
          {battingOrder}
        </div>
      )}
      {battingOrder == null && player.number != null && (
        <div
          className="flex items-center justify-center rounded-lg font-bold text-white shrink-0"
          style={{
            backgroundColor: '#334155',
            width: compact ? 24 : 32,
            height: compact ? 24 : 32,
            fontSize: compact ? 13 : 16,
          }}
        >
          {player.number}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-slate-800 truncate ${compact ? 'text-sm' : 'text-base'}`}>
          {player.name}
        </div>
        {position && !compact && (
          <div className="text-xs font-medium" style={{ color: posColor }}>
            {POSITION_LABELS[position]}
          </div>
        )}
      </div>
      {position && compact && (
        <div
          className="text-xs font-bold px-1.5 py-0.5 rounded-md text-white shrink-0"
          style={{ backgroundColor: posColor }}
        >
          {position}
        </div>
      )}
    </div>
  );
}
