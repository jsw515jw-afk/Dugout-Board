import { useState, useCallback } from 'react';
import type { Player, PositionCode } from '@/types';
import { ALL_POSITIONS, POSITION_COLORS, POSITION_LABELS } from '@/types';

interface BaseballFieldProps {
  players: Player[];
  positions: Record<string, PositionCode | null>;
  battingOrder: string[];
  onDropPlayer: (playerId: string, position: PositionCode) => void;
  onRemovePlayer: (playerId: string) => void;
  draggedPlayerId: string | null;
  setDraggedPlayerId: (id: string | null) => void;
}

// All coordinates share a single 200x180 viewBox.
// The container matches this aspect ratio so nothing stretches.
interface FieldSpot {
  position: PositionCode;
  x: number;
  y: number;
}

// Field landmarks — collinear so foul lines pass through bases.
const HOME = { x: 100, y: 160 };
const B1 = { x: 140, y: 128 };
const B2 = { x: 100, y: 92 };
const B3 = { x: 60, y: 128 };
const MOUND = { x: 100, y: 127 }; // center of the infield diamond
const FOUL_L = { x: 12, y: 90 };  // on the line HOME → 3B → foul pole
const FOUL_R = { x: 188, y: 90 }; // on the line HOME → 1B → foul pole

// Player positions:
//   C  — directly on home plate
//   P  — on the mound (center of infield)
//   1B — directly on first base
//   3B — directly on third base
//   2B — between 1st and 2nd base
//   SS — between 2nd and 3rd base
//   LF/CF/RF — in the outfield, inside the foul arc
const FIELD_SPOTS: FieldSpot[] = [
  { position: 'C', x: 100, y: 160 },
  { position: 'P', x: 100, y: 127 },
  { position: '1B', x: 140, y: 128 },
  { position: '2B', x: 120, y: 110 },
  { position: '3B', x: 60, y: 128 },
  { position: 'SS', x: 80, y: 110 },
  { position: 'LF', x: 40, y: 62 },
  { position: 'CF', x: 100, y: 48 },
  { position: 'RF', x: 160, y: 62 },
];

const VB_W = 200;
const VB_H = 180;

export default function BaseballField({
  players,
  positions,
  battingOrder,
  onDropPlayer,
  onRemovePlayer,
  setDraggedPlayerId,
}: BaseballFieldProps) {
  const [hoverPosition, setHoverPosition] = useState<PositionCode | null>(null);

  const playerById = useCallback(
    (id: string) => players.find((p) => p.id === id),
    [players]
  );

  const getBattingOrder = (playerId: string) => {
    const idx = battingOrder.indexOf(playerId);
    return idx >= 0 ? idx + 1 : null;
  };

  const handleDragOver = (e: React.DragEvent, position: PositionCode) => {
    e.preventDefault();
    e.stopPropagation();
    setHoverPosition(position);
  };

  const handleDrop = (e: React.DragEvent, position: PositionCode) => {
    e.preventDefault();
    e.stopPropagation();
    const playerId = e.dataTransfer.getData('text/plain');
    if (playerId) {
      onDropPlayer(playerId, position);
    }
    setHoverPosition(null);
    setDraggedPlayerId(null);
  };

  const toPctX = (x: number) => (x / VB_W) * 100;
  const toPctY = (y: number) => (y / VB_H) * 100;

  // Infield dirt — a generous rounded shape around the diamond
  const dirtPath = `M ${HOME.x},${HOME.y + 6}
    L ${B1.x + 10},${B1.y + 4}
    Q ${B2.x + 6},${B2.y - 12} ${B2.x},${B2.y - 10}
    Q ${B2.x - 6},${B2.y - 12} ${B3.x - 10},${B3.y + 4}
    Z`;

  return (
    <div className="relative w-full">
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-xl"
        style={{ aspectRatio: `${VB_W} / ${VB_H}`, background: '#0a2a14' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setHoverPosition(null);
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient id="grassGrad" cx="50%" cy="35%" r="75%">
              <stop offset="0%" stopColor="#3a9d52" />
              <stop offset="50%" stopColor="#237a36" />
              <stop offset="100%" stopColor="#103f1c" />
            </radialGradient>
            <radialGradient id="dirtGrad" cx="50%" cy="55%" r="55%">
              <stop offset="0%" stopColor="#d4986b" />
              <stop offset="100%" stopColor="#9c6028" />
            </radialGradient>
            <pattern
              id="mowStripes"
              x="0" y="0" width="200" height="14"
              patternUnits="userSpaceOnUse"
            >
              <rect width="200" height="7" fill="rgba(255,255,255,0.07)" />
              <rect y="7" width="200" height="7" fill="rgba(0,0,0,0.06)" />
            </pattern>
            <clipPath id="fieldClipPath">
              <path
                d={`M ${HOME.x},${HOME.y}
                    L ${FOUL_L.x},${FOUL_L.y}
                    A 120 120 0 0 1 ${FOUL_R.x},${FOUL_R.y}
                    Z`}
              />
            </clipPath>
          </defs>

          {/* Grass field */}
          <path
            d={`M ${HOME.x},${HOME.y}
                L ${FOUL_L.x},${FOUL_L.y}
                A 120 120 0 0 1 ${FOUL_R.x},${FOUL_R.y}
                Z`}
            fill="url(#grassGrad)"
          />

          {/* Mowing stripes */}
          <g clipPath="url(#fieldClipPath)">
            <rect x="0" y="0" width="200" height="180" fill="url(#mowStripes)" />
          </g>

          {/* Warning track */}
          <path
            d={`M ${FOUL_L.x},${FOUL_L.y} A 120 120 0 0 1 ${FOUL_R.x},${FOUL_R.y}`}
            fill="none" stroke="#c8865a" strokeWidth="7" opacity="0.3"
          />

          {/* Outfield wall */}
          <path
            d={`M ${FOUL_L.x},${FOUL_L.y} A 120 120 0 0 1 ${FOUL_R.x},${FOUL_R.y}`}
            fill="none" stroke="#0a3515" strokeWidth="2.5" opacity="0.5"
          />

          {/* Foul lines — from home through 3B/1B to the foul poles */}
          <line
            x1={HOME.x} y1={HOME.y} x2={FOUL_L.x} y2={FOUL_L.y}
            stroke="#fff" strokeWidth="0.9" opacity="0.8"
          />
          <line
            x1={HOME.x} y1={HOME.y} x2={FOUL_R.x} y2={FOUL_R.y}
            stroke="#fff" strokeWidth="0.9" opacity="0.8"
          />

          {/* Infield dirt */}
          <path d={dirtPath} fill="url(#dirtGrad)" opacity="0.95" />

          {/* Base path diamond */}
          <path
            d={`M ${HOME.x},${HOME.y} L ${B1.x},${B1.y} L ${B2.x},${B2.y} L ${B3.x},${B3.y} Z`}
            fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.9"
          />

          {/* Pitcher's mound — at center of infield */}
          <ellipse cx={MOUND.x} cy={MOUND.y} rx="11" ry="8" fill="#b87340" opacity="0.95" />
          <ellipse cx={MOUND.x} cy={MOUND.y} rx="11" ry="8" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
          <rect x={MOUND.x - 2.5} y={MOUND.y - 1.5} width="5" height="3" fill="#fff" opacity="0.9" rx="0.3" />

          {/* Bases */}
          <rect x={B1.x - 3} y={B1.y - 3} width="6" height="6" fill="#fff" opacity="0.95" rx="0.6" />
          <rect x={B2.x - 3} y={B2.y - 3} width="6" height="6" fill="#fff" opacity="0.95" rx="0.6" />
          <rect x={B3.x - 3} y={B3.y - 3} width="6" height="6" fill="#fff" opacity="0.95" rx="0.6" />

          {/* Home plate — pentagon */}
          <polygon
            points={`${HOME.x},${HOME.y - 4} ${HOME.x - 5},${HOME.y + 2} ${HOME.x - 5},${HOME.y + 6} ${HOME.x + 5},${HOME.y + 6} ${HOME.x + 5},${HOME.y + 2}`}
            fill="#fff" opacity="0.95"
          />

          {/* Batter's boxes */}
          <rect x={HOME.x - 12} y={HOME.y - 2} width="9" height="15" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
          <rect x={HOME.x + 3} y={HOME.y - 2} width="9" height="15" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        </svg>

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, transparent 50%, rgba(0,0,0,0.35) 100%)',
          }}
        />

        {/* Position drop zones */}
        {FIELD_SPOTS.map((spot) => {
          const assignedPlayerId = Object.entries(positions).find(
            ([, pos]) => pos === spot.position
          )?.[0];
          const assignedPlayer = assignedPlayerId ? playerById(assignedPlayerId) : null;
          const battingOrderNum = assignedPlayerId ? getBattingOrder(assignedPlayerId) : null;
          const isHover = hoverPosition === spot.position;
          const posColor = POSITION_COLORS[spot.position];

          return (
            <div
              key={spot.position}
              className="absolute z-10"
              style={{
                left: `${toPctX(spot.x)}%`,
                top: `${toPctY(spot.y)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onDragOver={(e) => handleDragOver(e, spot.position)}
              onDragLeave={() => setHoverPosition(null)}
              onDrop={(e) => handleDrop(e, spot.position)}
            >
              {assignedPlayer ? (
                <div
                  className="flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing group"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', assignedPlayer.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedPlayerId(assignedPlayer.id);
                  }}
                  onDragEnd={() => setDraggedPlayerId(null)}
                  onClick={() => onRemovePlayer(assignedPlayer.id)}
                  title={`Drag to reposition, click to remove from ${POSITION_LABELS[spot.position]}`}
                >
                  <div
                    className="flex items-center justify-center rounded-full ring-2 ring-white/90 transition-all group-hover:scale-110 group-hover:ring-4 relative"
                    style={{
                      backgroundColor: posColor,
                      width: 56, height: 56,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                    }}
                  >
                    {battingOrderNum != null && (
                      <span
                        className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-white text-slate-900 font-extrabold shadow-md"
                        style={{ width: 18, height: 18, fontSize: 10 }}
                      >
                        {battingOrderNum}
                      </span>
                    )}
                    <span className="text-white font-bold text-[11px] drop-shadow text-center leading-tight px-1">
                      {assignedPlayer.name.split(' ').slice(-1)[0]}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={[
                    'flex flex-col items-center justify-center rounded-full border-2 border-dashed transition-all',
                    isHover ? 'scale-125 bg-white/25' : 'bg-black/25',
                  ].join(' ')}
                  style={{
                    borderColor: isHover ? posColor : 'rgba(255,255,255,0.55)',
                    width: 44, height: 44,
                  }}
                >
                  <span
                    className="font-bold text-xs"
                    style={{ color: isHover ? '#fff' : 'rgba(255,255,255,0.9)' }}
                  >
                    {spot.position}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Position legend */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/65 backdrop-blur-md px-2 py-1.5 flex flex-wrap gap-1.5 justify-center z-20">
          {ALL_POSITIONS.map((pos) => {
            const isAssigned = Object.values(positions).includes(pos);
            return (
              <div key={pos} className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-full transition-opacity"
                  style={{
                    backgroundColor: POSITION_COLORS[pos],
                    opacity: isAssigned ? 1 : 0.35,
                  }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    opacity: isAssigned ? 1 : 0.5,
                  }}
                >
                  {pos}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
