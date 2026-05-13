-- Phase 2 Supabase RLS checklist.
-- Run in Supabase SQL editor after creating the Phase 2 tables from
-- 05_ai-coding/03-phase-2-real-data-and-ai.md.

alter table profiles enable row level security;
alter table meals enable row level security;
alter table analyses enable row level security;
alter table analysis_corrections enable row level security;
alter table feedbacks enable row level security;
alter table body_puzzle_reports enable row level security;
alter table draw_cards enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on profiles for delete using (auth.uid() = id);

create policy "meals_select_own" on meals for select using (auth.uid() = user_id);
create policy "meals_insert_own" on meals for insert with check (auth.uid() = user_id);
create policy "meals_update_own" on meals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meals_delete_own" on meals for delete using (auth.uid() = user_id);

create policy "analyses_select_own" on analyses for select using (auth.uid() = user_id);
create policy "analyses_insert_own" on analyses for insert with check (auth.uid() = user_id);
create policy "analyses_update_own" on analyses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "analyses_delete_own" on analyses for delete using (auth.uid() = user_id);

create policy "corrections_select_own" on analysis_corrections for select using (auth.uid() = user_id);
create policy "corrections_insert_own" on analysis_corrections for insert with check (auth.uid() = user_id);
create policy "corrections_update_own" on analysis_corrections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "corrections_delete_own" on analysis_corrections for delete using (auth.uid() = user_id);

create policy "feedbacks_select_own" on feedbacks for select using (auth.uid() = user_id);
create policy "feedbacks_insert_own" on feedbacks for insert with check (auth.uid() = user_id);
create policy "feedbacks_update_own" on feedbacks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "feedbacks_delete_own" on feedbacks for delete using (auth.uid() = user_id);

create policy "reports_select_own" on body_puzzle_reports for select using (auth.uid() = user_id);
create policy "reports_insert_own" on body_puzzle_reports for insert with check (auth.uid() = user_id);
create policy "reports_update_own" on body_puzzle_reports for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reports_delete_own" on body_puzzle_reports for delete using (auth.uid() = user_id);

create policy "draw_cards_select_own" on draw_cards for select using (auth.uid() = user_id);
create policy "draw_cards_insert_own" on draw_cards for insert with check (auth.uid() = user_id);
create policy "draw_cards_update_own" on draw_cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "draw_cards_delete_own" on draw_cards for delete using (auth.uid() = user_id);

-- Storage bucket policy notes for bucket: meal-photos
-- Object names must be prefixed by the current auth.uid():
--   {user_id}/meals/{meal_id}/before.jpg
--   {user_id}/meals/{meal_id}/after.jpg
-- Configure storage.objects policies in Supabase dashboard:
--   select/insert/update/delete using bucket_id = 'meal-photos'
--   and (storage.foldername(name))[1] = auth.uid()::text
