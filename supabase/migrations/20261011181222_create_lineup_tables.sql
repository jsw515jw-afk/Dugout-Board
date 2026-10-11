/*
# Create lineups and players tables (single-tenant, no auth)

1. New Tables
- `lineups` — stores a named lineup with team info and JSON data per inning
  - `id` (uuid, primary key)
  - `name` (text, lineup/team name)
  - `innings` (jsonb, stores position assignments per inning)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- `players` — stores player roster per lineup
  - `id` (uuid, primary key)
  - `lineup_id` (uuid, foreign key to lineups)
  - `name` (text, player name)
  - `number` (int, jersey number)
  - `created_at` (timestamp)
2. Security
- Enable RLS on both tables.
- Allow anon + authenticated CRUD (single-tenant shared data).
*/

CREATE TABLE IF NOT EXISTS lineups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Team',
  innings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id uuid NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
  name text NOT NULL,
  number integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lineups" ON lineups;
CREATE POLICY "anon_select_lineups" ON lineups FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lineups" ON lineups;
CREATE POLICY "anon_insert_lineups" ON lineups FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lineups" ON lineups;
CREATE POLICY "anon_update_lineups" ON lineups FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lineups" ON lineups;
CREATE POLICY "anon_delete_lineups" ON lineups FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE
  TO anon, authenticated USING (true);