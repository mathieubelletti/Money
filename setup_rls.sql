-- LINXO LAB : RÉINITIALISATION COMPLÈTE DU SCHÉMA (FORCE RESET)
-- Ce script supprime et recréé les tables avec les bons types (TEXT pour les IDs)
-- Attention : Cela supprimera les données actuelles dans la base, mais l'application les renverra (migration).

-- 1. Suppression propre (Cascade pour les dépendances)
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS forecasts CASCADE;
DROP TABLE IF EXISTS savings CASCADE;
DROP TABLE IF EXISTS goal CASCADE;
DROP TABLE IF EXISTS app_state CASCADE;

-- 2. Création des tables avec IDs en TEXT (pour supporter les timestamps JS)

CREATE TABLE accounts (
  id text PRIMARY KEY,
  bank text,
  name text,
  balance numeric DEFAULT 0,
  type text,
  color text,
  icon text,
  domain text,
  "accountNumber" text,
  "initialBalance" numeric DEFAULT 0,
  user_id uuid REFERENCES auth.users DEFAULT auth.uid()
);

CREATE TABLE transactions (
  id text PRIMARY KEY,
  name text,
  category text,
  "categoryIcon" text,
  amount numeric DEFAULT 0,
  date text,
  account text,
  color text,
  domain text,
  bg text,
  type text,
  "dateLabel" text,
  user_id uuid REFERENCES auth.users DEFAULT auth.uid()
);

CREATE TABLE categories (
  id text PRIMARY KEY,
  name text,
  icon text,
  spent numeric DEFAULT 0,
  "limit" numeric DEFAULT 0,
  color text,
  bg text,
  type text,
  user_id uuid REFERENCES auth.users DEFAULT auth.uid()
);

CREATE TABLE forecasts (
  id text PRIMARY KEY,
  month text,
  income numeric DEFAULT 0,
  expenses numeric DEFAULT 0,
  "shortMonth" text,
  user_id uuid REFERENCES auth.users DEFAULT auth.uid()
);

CREATE TABLE savings (
  id text PRIMARY KEY,
  name text,
  bank text,
  domain text,
  balance numeric DEFAULT 0,
  rate numeric DEFAULT 0,
  goal numeric DEFAULT 0,
  icon text,
  color text,
  user_id uuid REFERENCES auth.users DEFAULT auth.uid()
);

CREATE TABLE goal (
  id text PRIMARY KEY,
  name text,
  "targetAmount" numeric DEFAULT 0,
  "manualAmount" numeric DEFAULT 0,
  deadline text,
  icon text,
  color text,
  "isManual" boolean DEFAULT true,
  user_id uuid REFERENCES auth.users DEFAULT auth.uid()
);

CREATE TABLE app_state (
  key text,
  value jsonb,
  user_id uuid REFERENCES auth.users DEFAULT auth.uid(),
  PRIMARY KEY (key, user_id)
);

-- 3. Activation de la sécurité (RLS) sur toutes les tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- 4. Création des politiques d'accès (Une règle par table)
CREATE POLICY "RLS_Accounts" ON accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Transactions" ON transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Categories" ON categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Forecasts" ON forecasts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Savings" ON savings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_Goal" ON goal FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "RLS_AppState" ON app_state FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
