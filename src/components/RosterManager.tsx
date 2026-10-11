import { useState } from 'react';
import type { Player } from '@/types';
import { Plus, Trash2, UserPlus, X } from 'lucide-react';

interface RosterManagerProps {
  players: Player[];
  onAddPlayer: (name: string, number: number | null) => void;
  onRemovePlayer: (playerId: string) => void;
  onRenamePlayer: (playerId: string, name: string) => void;
}

export default function RosterManager({
  players,
  onAddPlayer,
  onRemovePlayer,
  onRenamePlayer,
}: RosterManagerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const num = number.trim() ? parseInt(number, 10) : null;
    onAddPlayer(name.trim(), num && !isNaN(num) ? num : null);
    setName('');
    setNumber('');
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-slate-800">Roster</span>
          <span className="text-sm text-slate-400">({players.length} players)</span>
        </div>
        <span className="text-slate-400 text-sm">{open ? 'Close' : 'Manage'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-200 p-4 space-y-3">
          {/* Add player form */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Player name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input
              type="number"
              placeholder="#"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-16 rounded-lg border border-slate-300 px-2 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              onClick={handleAdd}
              className="rounded-lg bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700 transition-colors flex items-center gap-1 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* Player list */}
          {players.length > 0 && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 group"
                >
                  {player.number != null && (
                    <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {player.number}
                    </div>
                  )}
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => onRenamePlayer(player.id, e.target.value)}
                    className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none border-b border-transparent focus:border-emerald-400"
                  />
                  <button
                    onClick={() => onRemovePlayer(player.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Remove player"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
