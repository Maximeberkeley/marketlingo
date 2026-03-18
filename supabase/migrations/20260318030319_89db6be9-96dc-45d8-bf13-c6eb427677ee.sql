
-- Schedule news push notifications 30 minutes after each news refresh
SELECT cron.schedule(
  'news-notifications-morning',
  '30 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://wahrcgvzarcgmktjleyr.supabase.co/functions/v1/scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaHJjZ3Z6YXJjZ21rdGpsZXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDQwMzIsImV4cCI6MjA4NzcyMDAzMn0.hsP02puQxnqJwO1bdxorU3VoBLKhv3CwS_H7o_AQNH0"}'::jsonb,
    body := '{"job": {"type": "news_update"}}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'news-notifications-evening',
  '30 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://wahrcgvzarcgmktjleyr.supabase.co/functions/v1/scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaHJjZ3Z6YXJjZ21rdGpsZXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDQwMzIsImV4cCI6MjA4NzcyMDAzMn0.hsP02puQxnqJwO1bdxorU3VoBLKhv3CwS_H7o_AQNH0"}'::jsonb,
    body := '{"job": {"type": "news_update"}}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule daily reminder notifications at 9 AM UTC
SELECT cron.schedule(
  'daily-reminder-notifications',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://wahrcgvzarcgmktjleyr.supabase.co/functions/v1/scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaHJjZ3Z6YXJjZ21rdGpsZXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDQwMzIsImV4cCI6MjA4NzcyMDAzMn0.hsP02puQxnqJwO1bdxorU3VoBLKhv3CwS_H7o_AQNH0"}'::jsonb,
    body := '{"job": {"type": "daily_reminder"}}'::jsonb
  ) AS request_id;
  $$
);
