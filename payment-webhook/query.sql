SELECT u.id, u.email
FROM users u
JOIN subscriptions s ON s.user_id = u.id
WHERE s.status = 'active'
  AND s.expires_at > now()
  AND NOT EXISTS (
      SELECT 1
      FROM meetings_attendance ma
      WHERE ma.user_id = u.id
        AND ma.date >= current_date - interval '30 days'
  );
