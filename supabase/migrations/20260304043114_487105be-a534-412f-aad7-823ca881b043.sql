-- Add cron job to refresh news twice daily (8am and 6pm UTC)
SELECT cron.schedule(
  'refresh-market-news-morning',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://wahrcgvzarcgmktjleyr.supabase.co/functions/v1/refresh-market-news',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaHJjZ3Z6YXJjZ21rdGpsZXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDQwMzIsImV4cCI6MjA4NzcyMDAzMn0.hsP02puQxnqJwO1bdxorU3VoBLKhv3CwS_H7o_AQNH0"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'refresh-market-news-evening',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://wahrcgvzarcgmktjleyr.supabase.co/functions/v1/refresh-market-news',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaHJjZ3Z6YXJjZ21rdGpsZXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDQwMzIsImV4cCI6MjA4NzcyMDAzMn0.hsP02puQxnqJwO1bdxorU3VoBLKhv3CwS_H7o_AQNH0"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);