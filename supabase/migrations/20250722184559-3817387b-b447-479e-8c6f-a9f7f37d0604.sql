-- Enable required extensions for cron jobs
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule weekly COT data refresh every Friday at 5:30 PM ET (22:30 UTC)
select
  cron.schedule(
    'weekly-cot-refresh',
    '30 22 * * 5', -- Every Friday at 22:30 UTC (5:30 PM ET)
    $$
    select
      net.http_post(
          url:='https://lqhlmlnwixkummobkoiy.supabase.co/functions/v1/cot-refresh',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxaGxtbG53aXhrdW1tb2Jrb2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDMzNjEsImV4cCI6MjA2ODc3OTM2MX0.gps27-E_4Zak2LSWUtZucdxu4_skhlJd8XlDPLHzrxs"}'::jsonb,
          body:='{"trigger": "cron", "timestamp": "'||now()||'"}'::jsonb
      ) as request_id;
    $$
  );