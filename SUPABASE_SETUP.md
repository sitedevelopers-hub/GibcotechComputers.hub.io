# Product admin setup

The public site can stay on GitHub Pages. Supabase stores product records, uploaded product photos and up to three administrator accounts. The browser uses only the Supabase project URL and public anon/publishable key; never put a secret/service-role key in this repository.

The admin page is sign-in only. It does not create accounts or automatically grant administrator access. Database row-level security protects product changes; hiding the admin page or button is not an access-control measure.

## 1. Configure Supabase

1. The project is `qlbwcmtjyibonwoiunew`; its URL is `https://qlbwcmtjyibonwoiunew.supabase.co`.
2. The public Project URL and anon key are configured in `supabase-config.js`. Never use or publish a secret/service-role key.
3. In **Authentication → URL Configuration**, set the **Site URL** to `https://sitedevelopers-hub.github.io/GibcotechComputers.hub.io/` and allow `https://sitedevelopers-hub.github.io/GibcotechComputers.hub.io/admin.html` as a redirect.
4. Disable public email sign-ups in **Authentication → Providers → Email**. Admin accounts should be created by the trusted project owner, not through a public form.

## 2. Apply the database and storage rules

Run the full `supabase-setup.sql` in the Supabase SQL Editor. It is rerunnable and removes the old trigger that promoted every new Auth user, without deleting existing admins, products, or images. It also keeps product writes and photo uploads restricted by row-level security to approved admins.

After running the updated SQL, inspect `public.admin_users` and remove any account that is not an intended administrator. This is important because accounts automatically promoted by an older version of the setup remain admins until explicitly removed.

## 3. Add an administrator

1. In the Supabase Dashboard, create the user under **Authentication → Users**; do not make the user through a public sign-up page.
2. Copy that user's Auth UUID.
3. In the SQL Editor, grant admin access by running the following statement with the real UUID:

   ```sql
   insert into public.admin_users (user_id)
   values ('AUTH-USER-UUID')
   on conflict (user_id) do nothing;
   ```

The database allows at most three administrator accounts. Only add people you trust. They can then sign in at `https://sitedevelopers-hub.github.io/GibcotechComputers.hub.io/admin.html` using their Supabase email and password. Remove access by deleting their row from `public.admin_users`; deleting the Auth user is also possible but not required to revoke product access.

## 4. Publish and manage products

The `supabase-config.js` values are public by design; database row-level security is what protects changes. Publish `admin.html`, `admin.js`, `supabase-config.js`, `script.js`, and `style.css` to the GitHub Pages repository. After an approved admin signs in, the dashboard lists products and supports add, edit, photo replacement, and delete actions.

The SQL setup seeds the sample products with images served from GitHub Pages. New/replaced photos are stored in the public Supabase `product-images` bucket.

## Troubleshooting

- **SQL Editor says “Success. No rows returned”:** this is normal for setup statements that create tables, policies, triggers, or buckets.
- **Photo uploads fail with “Bucket not found”:** rerun the full `supabase-setup.sql`; it creates the `product-images` bucket and its access rules.
- **Sign-in says the account is not approved:** check that the Auth user's UUID has a row in `public.admin_users`, and rerun the setup SQL if needed.
- **The page still shows sample products:** confirm the latest `supabase-config.js` and scripts are deployed, then check that `supabase-setup.sql` ran against this project.
- **Admin page is not found on the live site:** publish the admin and site files listed above; local files are not deployed automatically.
- **Never publish a secret/service-role key.** If one was shared or pasted in a public place, revoke/rotate it in the Supabase API keys settings immediately.
