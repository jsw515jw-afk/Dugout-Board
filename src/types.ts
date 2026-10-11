export type PositionCode =
  | 'P'
  | 'C'
  | '1B'
  | '2B'
  | '3B'
  | 'SS'
  | 'LF'
  | 'CF'
  | 'RF'
  | 'BN';

export interface Player {
  id: string;
  name: string;
  number: number | null;
}

export interface PositionAssignment {
  position: PositionCode | null;
}

export interface InningData {
  battingOrder: string[];
  positions: Record<string, PositionCode | null>;
}

export const ALL_POSITIONS: PositionCode[] = [
  'P',
  'C',
  '1B',
  '2B',
  '3B',
  'SS',
  'LF',
  'CF',
  'RF',
];

export const POSITION_LABELS: Record<PositionCode, string> = {
  P: 'Pitcher',
  C: 'Catcher',
  '1B': '1st Base',
  '2B': '2nd Base',
  '3B': '3rd Base',
  SS: 'Shortstop',
  LF: 'Left Field',
  CF: 'Center Field',
  RF: 'Right Field',
  BN: 'Bench',
};

export const POSITION_COLORS: Record<PositionCode, string> = {
  P: '#ef4444',
  C: '#f97316',
  '1B': '#eab308',
  '2B': '#22c55e',
  '3B': '#14b8a6',
  SS: '#3b82f6',
  LF: '#6366f1',
  CF: '#a855f7',
  RF: '#ec4899',
  BN: '#64748b',
};
