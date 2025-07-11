
-- Remove foreign key constraints that reference the deals table
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_related_deal_id_fkey;
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_related_deal_id_fkey;

-- Drop the deals table completely
DROP TABLE IF EXISTS public.deals CASCADE;

-- Remove any triggers related to deals
DROP TRIGGER IF EXISTS update_deals_modified_time_trigger ON public.deals;
DROP FUNCTION IF EXISTS public.update_deals_modified_time();
DROP FUNCTION IF EXISTS public.auto_update_deal_stage();

-- Remove deals from realtime publication
ALTER publication supabase_realtime DROP TABLE IF EXISTS public.deals;

-- Clean up any notifications related to deals
DELETE FROM public.notifications WHERE module_type = 'deals';
