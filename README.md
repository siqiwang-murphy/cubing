# Cube Club

Cube Club is a static 3×3 algorithm trainer with an interactive beginner tutorial.

## Run locally

Serve this folder over HTTP rather than opening `index.html` directly, so Supabase authentication can use a valid site origin. For example, with Python installed:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Configure accounts

Account creation uses Supabase email/password authentication and a unique username profile. Signed-in users' algorithm learning statuses and custom algorithms are synced to their account.

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql). If you already set up accounts, run the updated script again to add the progress table.
3. Copy the project URL and its **publishable key** into `supabase-config.js`. The publishable key is intended for browser use; never put a `service_role` key in this site.
4. In Supabase Authentication settings, enable email/password sign-in and email confirmations. Add redirect patterns such as `http://localhost:8000/**` and `https://your-site.example/**` to the allowed redirect URLs.
5. Deploy the static files to HTTPS. The account dialog will explain when Supabase configuration is missing.

The profile and progress tables are protected by row-level security. Supabase Auth handles passwords and email verification; this site never stores passwords itself. Learning statuses continue to be saved in the browser when signed out.