import { useState, useEffect, useCallback, useRef } from 'react';
import type { Player, PositionCode, InningData } from '@/types';
import { ALL_POSITIONS } from '@/types';
import { supabase } from '@/lib/supabase';
import BaseballField from '@/components/BaseballField';
import BenchArea from '@/components/BenchArea';
import LineupTable from '@/components/LineupTable';
import RosterManager from '@/components/RosterManager';
import ShareImageModal from '@/components/ShareImageModal';
import { Save, Share2, Plus, Trophy, Copy, Check, Trash2 } from 'lucide-react';

const MAX_INNINGS = 7;

function createEmptyInning(): InningData {
  return { battingOrder: [], positions: {} };
}

function createEmptyInnings(count: number): InningData[] {
  return Array.from({ length: count }, () => createEmptyInning());
}

export default function App() {
  const [teamName, setTeamName] = useState('My Team');
  const [players, setPlayers] = useState<Player[]>([]);
  const [innings, setInnings] = useState<InningData[]>(createEmptyInnings(1));
  const [currentInning, setCurrentInning] = useState(0);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [shareOpen, setShareOpen] = useState(false);
  const [lineupId, setLineupId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const loadedRef = useRef(false);

  // Load existing lineup from Supabase on mount
  // Supports ?lineup=ID for shared links (read-only view)
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const sharedId = params.get('lineup');

      let query = supabase.from('lineups').select('*');
      if (sharedId) {
        query = query.eq('id', sharedId);
        setViewOnly(true);
      } else {
        query = query.order('updated_at', { ascending: false }).limit(1);
      }
      const { data } = await query.maybeSingle();

      if (data) {
        setLineupId(data.id);
        setTeamName(data.name || 'My Team');
        const savedInnings = data.innings as InningData[];
        if (Array.isArray(savedInnings) && savedInnings.length > 0) {
          setInnings(savedInnings);
        }
        const { data: playerData } = await supabase
          .from('players')
          .select('*')
          .eq('lineup_id', data.id)
          .order('created_at', { ascending: true });
        if (playerData) {
          setPlayers(
            playerData.map((p: { id: string; name: string; number: number | null }) => ({
              id: p.id,
              name: p.name,
              number: p.number,
            }))
          );
        }
      }
      setLoaded(true);
    })();
  }, []);

  const currentInningData = innings[currentInning] ?? createEmptyInning();

  const updateInning = useCallback(
    (index: number, updater: (data: InningData) => InningData) => {
      setInnings((prev) => {
        const next = [...prev];
        next[index] = updater(next[index] ?? createEmptyInning());
        return next;
      });
      setSaveStatus('idle');
    },
    []
  );

  // --- Player management ---
  const addPlayer = useCallback(
    (name: string, number: number | null) => {
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name,
        number,
      };
      setPlayers((prev) => [...prev, newPlayer]);
      setSaveStatus('idle');
    },
    []
  );

  const removePlayer = useCallback(
    (playerId: string) => {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
      setInnings((prev) =>
        prev.map((inning) => ({
          battingOrder: inning.battingOrder.filter((id) => id !== playerId),
          positions: Object.fromEntries(
            Object.entries(inning.positions).filter(([id]) => id !== playerId)
          ),
        }))
      );
      setSaveStatus('idle');
    },
    []
  );

  const renamePlayer = useCallback((playerId: string, name: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, name } : p))
    );
    setSaveStatus('idle');
  }, []);

  // --- Position assignment (swaps if target position is occupied) ---
  const assignPosition = useCallback(
    (playerId: string, position: PositionCode) => {
      updateInning(currentInning, (data) => {
        const newPositions = { ...data.positions };
        const oldPosition = newPositions[playerId] ?? null;
        // Find whoever is already at the target position
        const swappedId = Object.entries(newPositions).find(
          ([id, pos]) => pos === position && id !== playerId
        )?.[0];
        if (swappedId) {
          // Swap: send the displaced player to the dragged player's old spot
          if (oldPosition) {
            newPositions[swappedId] = oldPosition;
          } else {
            delete newPositions[swappedId];
          }
        }
        newPositions[playerId] = position;
        return { ...data, positions: newPositions };
      });
    },
    [currentInning, updateInning]
  );

  const removeFromPosition = useCallback(
    (playerId: string) => {
      updateInning(currentInning, (data) => {
        const newPositions = { ...data.positions };
        delete newPositions[playerId];
        return { ...data, positions: newPositions };
      });
    },
    [currentInning, updateInning]
  );

  const setBattingOrder = useCallback(
    (newOrder: string[]) => {
      updateInning(currentInning, (data) => ({
        ...data,
        battingOrder: newOrder,
      }));
    },
    [currentInning, updateInning]
  );

  const benchPlayer = useCallback(
    (playerId: string) => {
      updateInning(currentInning, (data) => {
        const newPositions = { ...data.positions };
        delete newPositions[playerId];
        const newOrder = data.battingOrder.includes(playerId)
          ? data.battingOrder.filter((id) => id !== playerId)
          : data.battingOrder;
        return { battingOrder: newOrder, positions: newPositions };
      });
    },
    [currentInning, updateInning]
  );

  // --- Innings management ---
  const addInning = useCallback(() => {
    if (innings.length >= MAX_INNINGS) return;
    // Copy previous inning's batting order as starting point
    const prev = innings[innings.length - 1];
    setInnings((prevInnings) => [
      ...prevInnings,
      {
        battingOrder: prev ? [...prev.battingOrder] : [],
        positions: {},
      },
    ]);
    setCurrentInning(innings.length);
    setSaveStatus('idle');
  }, [innings]);

  const deleteInning = useCallback(() => {
    if (innings.length <= 1) return;
    const newInnings = innings.filter((_, i) => i !== currentInning);
    setInnings(newInnings);
    setCurrentInning((prev) => Math.max(0, Math.min(prev, newInnings.length - 1)));
    setSaveStatus('idle');
  }, [innings, currentInning]);

  const duplicateInning = useCallback(() => {
    if (innings.length >= MAX_INNINGS) return;
    const current = innings[currentInning];
    setInnings((prev) => [
      ...prev,
      current
        ? { battingOrder: [...current.battingOrder], positions: { ...current.positions } }
        : createEmptyInning(),
    ]);
    setCurrentInning(innings.length);
    setSaveStatus('idle');
  }, [innings, currentInning]);

  // --- Save ---
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (lineupId) {
        await supabase
          .from('lineups')
          .update({ name: teamName, innings, updated_at: new Date().toISOString() })
          .eq('id', lineupId);
        // Sync players - simple approach: delete all and reinsert
        await supabase.from('players').delete().eq('lineup_id', lineupId);
        if (players.length > 0) {
          await supabase.from('players').insert(
            players.map((p) => ({
              id: p.id,
              lineup_id: lineupId,
              name: p.name,
              number: p.number,
            }))
          );
        }
      } else {
        const { data, error } = await supabase
          .from('lineups')
          .insert({ name: teamName, innings })
          .select()
          .single();
        if (data) {
          setLineupId(data.id);
          if (players.length > 0) {
            await supabase.from('players').insert(
              players.map((p) => ({
                id: p.id,
                lineup_id: data.id,
                name: p.name,
                number: p.number,
              }))
            );
          }
        }
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } finally {
      setSaving(false);
    }
  }, [lineupId, teamName, innings, players]);

  // --- Derived data ---
  const assignedPlayerIds = new Set(
    Object.keys(currentInningData.positions)
  );
  const benchPlayers = players.filter(
    (p) => !currentInningData.positions[p.id] || currentInningData.positions[p.id] === null
  );
  const unassignedPlayers = players.filter((p) => !assignedPlayerIds.has(p.id));

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-emerald-500 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-400">Loading lineup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900 shadow-md">
        <div className="max-w-7xl mx-auto px-3 py-1.5 flex items-center gap-2 flex-nowrap">
          <div className="flex items-center gap-1.5 mr-auto shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-md">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-white font-bold text-sm leading-tight hidden sm:block">
              Lineup Planner
            </h1>
          </div>

          <input
            type="text"
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              setSaveStatus('idle');
            }}
            readOnly={viewOnly}
            className="bg-slate-800 text-white rounded-md px-2 py-1 text-xs font-semibold border border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 w-24 sm:w-40 shrink-0"
            placeholder="Team name"
          />

          {!viewOnly && (
            <button
              onClick={duplicateInning}
              disabled={innings.length >= MAX_INNINGS}
              className="rounded-md bg-slate-700 text-white px-2 py-1 hover:bg-slate-600 transition-colors flex items-center gap-1 text-xs font-semibold disabled:opacity-40 shrink-0"
              title="Copy current inning to a new one"
            >
              <Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Copy Inning</span>
            </button>
          )}

          <button
            onClick={() => setShareOpen(true)}
            className="rounded-md bg-blue-600 text-white px-2 py-1 hover:bg-blue-700 transition-colors flex items-center gap-1 text-xs font-semibold shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Share</span>
          </button>

          {!viewOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-emerald-600 text-white px-3 py-1 hover:bg-emerald-700 transition-colors flex items-center gap-1 text-xs font-bold disabled:opacity-50 shrink-0"
            >
              {saving ? (
                <>Saving...</>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4" /> Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save
                </>
              )}
            </button>
          )}
        </div>

        {/* Inning tabs */}
        <div className="max-w-7xl mx-auto px-3 pb-1.5 flex items-center gap-1.5 overflow-x-auto">
          {innings.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentInning(i)}
              className={[
                'px-3 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap',
                i === currentInning
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white',
              ].join(' ')}
            >
              Inning {i + 1}
            </button>
          ))}
          {!viewOnly && innings.length < MAX_INNINGS && (
            <button
              onClick={addInning}
              className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-0.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
          {!viewOnly && innings.length > 1 && (
            <button
              onClick={deleteInning}
              className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-red-400 hover:bg-red-600 hover:text-white transition-all flex items-center gap-0.5 whitespace-nowrap"
              title="Delete current inning"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_5fr] gap-4">
          {/* Left: Lineup table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg">
                Batting Order — Inning {currentInning + 1}
              </h2>
              <span className="text-sm text-slate-400">
                {currentInningData.battingOrder.length} batters
              </span>
            </div>
            <LineupTable
              battingOrder={currentInningData.battingOrder}
              players={players}
              positions={currentInningData.positions}
              onReorder={setBattingOrder}
              onDropToPosition={assignPosition}
              onRemoveFromPosition={removeFromPosition}
              draggedPlayerId={draggedPlayerId}
              setDraggedPlayerId={setDraggedPlayerId}
              viewOnly={viewOnly}
            />
            {!viewOnly && (
              <RosterManager
                players={players}
                onAddPlayer={addPlayer}
                onRemovePlayer={removePlayer}
                onRenamePlayer={renamePlayer}
              />
            )}
          </div>

          {/* Right: Field + Bench */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-800 text-lg">
              Field Positions — Inning {currentInning + 1}
            </h2>
            <BaseballField
              players={players}
              positions={currentInningData.positions}
              battingOrder={currentInningData.battingOrder}
              onDropPlayer={assignPosition}
              onRemovePlayer={removeFromPosition}
              draggedPlayerId={draggedPlayerId}
              setDraggedPlayerId={setDraggedPlayerId}
            />
            <BenchArea
              benchPlayers={benchPlayers}
              battingOrder={currentInningData.battingOrder}
              onDropPlayer={benchPlayer}
              draggedPlayerId={draggedPlayerId}
              setDraggedPlayerId={setDraggedPlayerId}
            />
          </div>
        </div>

        {/* Position status bar */}
        <div className="mt-4 rounded-xl bg-white border border-slate-200 p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-600 mr-2">Positions:</span>
            {ALL_POSITIONS.map((pos) => {
              const assignedId = Object.entries(currentInningData.positions).find(
                ([, p]) => p === pos
              )?.[0];
              const assignedPlayer = assignedId
                ? players.find((p) => p.id === assignedId)
                : null;
              return (
                <div
                  key={pos}
                  className={[
                    'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold',
                    assignedPlayer
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-400',
                  ].join(' ')}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: assignedPlayer
                        ? '#16a34a'
                        : '#cbd5e1',
                    }}
                  />
                  {pos}
                  {assignedPlayer && (
                    <span className="text-slate-500">
                      — {assignedPlayer.name.split(' ').slice(-1)[0]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <ShareImageModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        teamName={teamName}
        innings={innings}
        players={players}
        currentInning={currentInning}
        lineupId={lineupId}
        viewOnly={viewOnly}
      />
    </div>
  );
}
