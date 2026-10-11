import { useRef, useState } from 'react';
import type { Player, PositionCode, InningData } from '@/types';
import { ALL_POSITIONS, POSITION_COLORS, POSITION_LABELS } from '@/types';
import { Download, Link2, Check, Loader2, X, Image as ImageIcon } from 'lucide-react';

interface ShareImageModalProps {
  open: boolean;
  onClose: () => void;
  teamName: string;
  innings: InningData[];
  players: Player[];
  currentInning: number;
  lineupId: string | null;
  viewOnly?: boolean;
}

export default function ShareImageModal({
  open,
  onClose,
  teamName,
  innings,
  players,
  lineupId,
  viewOnly = false,
}: ShareImageModalProps) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!open) return null;

  const playerById = (id: string) => players.find((p) => p.id === id);

  const shareUrl = lineupId
    ? `${window.location.origin}${window.location.pathname}?lineup=${lineupId}`
    : window.location.href;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${teamName} Lineup`,
          text: `Check out the lineup for ${teamName}`,
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      copyLink();
    }
  };

  const generateImage = async () => {
    setGenerating(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const inningsWithData = innings.filter(
        (inn) => inn.battingOrder.length > 0
      );
      const numInnings = Math.max(1, inningsWithData.length);

      // Layout: each inning gets a batting table + field side by side
      const INNING_H = 320;
      const PADDING = 30;
      const HEADER_H = 80;
      const FOOTER_H = 40;
      const W = 1200;
      const H = HEADER_H + numInnings * INNING_H + FOOTER_H + PADDING;

      canvas.width = W;
      canvas.height = H;

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // Header bar
      const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
      headerGrad.addColorStop(0, '#064e3b');
      headerGrad.addColorStop(1, '#16a34a');
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, W, HEADER_H);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(teamName, 30, 45);
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#86efac';
      ctx.fillText(`${numInnings} inning${numInnings !== 1 ? 's' : ''} — full game lineup`, 30, 68);
      ctx.fillStyle = '#bbf7d0';
      ctx.font = '14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(new Date().toLocaleDateString(), W - 30, 50);

      const drawInning = (inning: InningData, inningNum: number, yOffset: number) => {
        // Inning label
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Inning ${inningNum}`, 30, yOffset + 25);

        // --- Batting table ---
        const tx = 30;
        const tw = 440;
        const ty = yOffset + 40;

        // Table header
        ctx.fillStyle = '#1e293b';
        ctx.roundRect(tx, ty, tw, 30, 6);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('#', tx + 25, ty + 20);
        ctx.textAlign = 'left';
        ctx.fillText('Batter', tx + 55, ty + 20);
        ctx.textAlign = 'center';
        ctx.fillText('Pos', tx + tw - 30, ty + 20);

        // Rows
        inning.battingOrder.forEach((playerId, i) => {
          const player = playerById(playerId);
          if (!player) return;
          const pos = inning.positions[playerId] ?? null;
          const posColor = pos ? POSITION_COLORS[pos] : '#64748b';
          const rowY = ty + 35 + i * 32;

          // Row bg
          ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#172033';
          ctx.roundRect(tx, rowY, tw, 28, 4);
          ctx.fill();

          // Batting number
          ctx.fillStyle = posColor;
          ctx.beginPath();
          ctx.roundRect(tx + 8, rowY + 4, 24, 20, 5);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(String(i + 1), tx + 20, rowY + 18);

          // Name
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'left';
          const name = player.name;
          ctx.fillText(name.length > 20 ? name.substring(0, 19) + '…' : name, tx + 42, rowY + 18);

          // Position
          ctx.fillStyle = posColor;
          ctx.font = 'bold 13px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(pos ?? '-', tx + tw - 30, rowY + 18);
        });

        // --- Field ---
        const fx = 520;
        const fy = yOffset + 35;
        const fw = 260;
        const fh = 250;

        // Field background
        const fieldGrad = ctx.createRadialGradient(
          fx + fw / 2, fy + fh, 30,
          fx + fw / 2, fy + fh, fw
        );
        fieldGrad.addColorStop(0, '#166534');
        fieldGrad.addColorStop(0.4, '#15803d');
        fieldGrad.addColorStop(0.8, '#16a34a');
        fieldGrad.addColorStop(1, '#22c55e');
        ctx.fillStyle = fieldGrad;
        ctx.beginPath();
        ctx.roundRect(fx, fy, fw, fh, 12);
        ctx.fill();

        // Outfield arc
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(fx + fw / 2, fy + fh * 0.85, fw * 0.46, Math.PI, 0, false);
        ctx.stroke();

        // Infield diamond
        const cx = fx + fw / 2;
        const cy = fy + fh * 0.5;
        const dz = fw * 0.2;
        ctx.fillStyle = 'rgba(180, 83, 9, 0.8)';
        ctx.beginPath();
        ctx.moveTo(cx, cy + dz);
        ctx.lineTo(cx - dz, cy);
        ctx.lineTo(cx, cy - dz);
        ctx.lineTo(cx + dz, cy);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Positions
        const spots: Record<string, [number, number]> = {
          P: [0.5, 0.38], C: [0.5, 0.85],
          '1B': [0.72, 0.55], '2B': [0.62, 0.33],
          '3B': [0.28, 0.55], SS: [0.38, 0.33],
          LF: [0.18, 0.18], CF: [0.50, 0.10], RF: [0.82, 0.18],
        };

        ALL_POSITIONS.forEach((posCode) => {
          const [sx, sy] = spots[posCode];
          const px = fx + fw * sx;
          const py = fy + fh * sy;
          const assignedId = Object.entries(inning.positions).find(
            ([, p]) => p === posCode
          )?.[0];
          const assignedPlayer = assignedId ? playerById(assignedId) : null;
          const posColor = POSITION_COLORS[posCode];

          if (assignedPlayer) {
            ctx.fillStyle = posColor;
            ctx.beginPath();
            ctx.arc(px, py, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            const lastName = assignedPlayer.name.split(' ').slice(-1)[0];
            ctx.fillText(lastName.length > 7 ? lastName.substring(0, 6) + '…' : lastName, px, py + 3);
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.beginPath();
            ctx.arc(px, py, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(posCode, px, py + 3);
          }
        });
      };

      if (inningsWithData.length > 0) {
        inningsWithData.forEach((inning, i) => {
          const inningNum = innings.indexOf(inning) + 1;
          drawInning(inning, inningNum, HEADER_H + PADDING + i * INNING_H);
        });
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No innings with players yet', W / 2, H / 2);
      }

      // Footer
      ctx.fillStyle = '#334155';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Lineup Planner — Youth Baseball`, 30, H - 15);

      // Download
      const link = document.createElement('a');
      link.download = `${teamName.replace(/\s+/g, '_')}_full_lineup.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 bg-slate-800 sticky top-0">
          <h2 className="text-white font-bold text-base">Share Lineup</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Shareable link section */}
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-emerald-600" />
              Shareable Link
            </h3>
            <p className="text-slate-500 text-xs mb-2">
              {viewOnly
                ? 'Share this link so parents can view all innings on their phone.'
                : 'Save your lineup first, then share this link so parents can view all innings on their phone.'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg bg-slate-100 border border-slate-300 px-3 py-2 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-emerald-400 truncate"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyLink}
                className={[
                  'rounded-lg px-3 py-2 font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0',
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-700 text-white hover:bg-slate-600',
                ].join(' ')}
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5" /> Copied!</>
                ) : (
                  <>Copy</>
                )}
              </button>
            </div>
            {!viewOnly && !lineupId && (
              <p className="text-amber-600 text-xs mt-1.5">
                Save your lineup to get a shareable link.
              </p>
            )}
          </div>

          <div className="border-t border-slate-200" />

          {/* Native share button (mobile) */}
          <button
            onClick={nativeShare}
            className="w-full rounded-xl bg-blue-600 text-white font-bold py-2.5 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Link2 className="w-4 h-4" /> Share Link to Messages / Email
          </button>

          <div className="border-t border-slate-200" />

          {/* Download image section */}
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              Download as Image
            </h3>
            <p className="text-slate-500 text-xs mb-2">
              Generates a single image with every inning — batting order and field positions for the full game.
            </p>
            <button
              onClick={generateImage}
              disabled={generating}
              className="w-full rounded-xl bg-emerald-600 text-white font-bold py-2.5 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-4 h-4" /> Download Full Game Image</>
              )}
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
