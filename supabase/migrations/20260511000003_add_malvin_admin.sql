-- Grant bytesense_admin to malvinrusli113@gmail.com (Clerk ID: user_3DFZY1cIClUgcPvtKtK8aXJOlYT)
INSERT INTO user_roles (clerk_user_id, role)
VALUES ('user_3DFZY1cIClUgcPvtKtK8aXJOlYT', 'bytesense_admin')
ON CONFLICT (clerk_user_id) DO NOTHING;
