# Product admin setup

The public site can stay on GitHub Pages. Supabase stores product records, uploaded product photos and the two administrator accounts. The browser uses only the Supabase project URL and public anon/publishable key; never put a service-role key in this repository.

The Supabase project URL/key are configured locally, the SQL setup has been applied, and the Auth Site URL/redirect are configured for `https://sitedevelopers-hub.github.io/GibcotechComputers.hub.io/`. Email signup is enabled and email confirmation is disabled. The project had no registered Auth users at the time it was checked, so register your admin account after the updated admin page is deployed.

**Registration is open and limited to the first two accounts.** Anyone who reaches `admin.html` can claim an unused admin slot, so create your own two accounts before sharing or publishing the admin link. After the two slots are filled, Supabase rejects further registrations.

## 1. Create the Supabase project

1. The project is `qlbwcmtjyibonwoiunew`; its URL is `https://qlbwcmtjyibonwoiunew.supabase.co`. A project name such as `GibcotechComputers` by itself is not a URL.
2. The public Project URL and anon key are already entered in `supabase-config.js`. Never use or publish a secret/service-role key.
3. In **Authentication → URL Configuration**, the **Site URL** is `https://sitedevelopers-hub.github.io/GibcotechComputers.hub.io/` and the allowed admin redirect is `https://sitedevelopers-hub.github.io/GibcotechComputers.hub.io/admin.html`.
4. In **Authentication → Providers → Email**, email/password sign-ups are enabled and **Confirm email** is disabled.

## 2. Create the database and storage rules

The full contents of `supabase-setup.sql` have been applied in this project. It creates the product table, public product reads, admin-only changes, the public image bucket, and the two-admin limit. To apply a future update, run the full script again; it is designed to be rerunnable.

## 3. Register the two admins

1. Publish the updated site files, open `https://sitedevelopers-hub.github.io/GibcotechComputers.hub.io/admin.html`, and use **Register** to create your first account.
2. Register your second account, if needed. The database automatically grants admin access to the first two accounts; a third registration is rejected by the database.
3. Return to the sign-in form and use the same email and password next time.
4. After both accounts are registered, disable new email sign-ups in Supabase Authentication settings. Existing admins can still sign in; disabling sign-ups prevents more registration attempts.

The page uses Supabase email/password authentication; its standard password login requires an email address rather than a separate username or PIN. This project currently requires email confirmation, so confirm the email before signing in, or disable **Confirm email** in Supabase Authentication settings to skip verification. Signup confirmation links redirect to the published `admin.html` page.

If an account was registered **before** the database trigger was installed, rerunning the setup SQL fills any remaining admin slots from existing accounts, up to the two-account limit. No manual UUID lookup is needed.

## 4. Connect the website

The local `supabase-config.js` is already set to this project. These values are public by design; database row-level security is what protects changes.

Commit and push the site files to the GitHub Pages branch. Register both accounts before sharing the public `admin.html` URL. After signing in, the dashboard lists products and provides add, edit, image replacement, and delete actions. Updates and image uploads are visible to all visitors.

## Existing products

The SQL setup seeds the current sample products with their existing images in the repository. Their images continue to be served by GitHub Pages. New/replaced photos are stored in the Supabase public `product-images` bucket.

## Troubleshooting

- **SQL Editor says “Success. No rows returned”:** this is normal for setup statements that create tables, policies, triggers, or buckets.
- **Photo uploads fail with “Bucket not found”:** rerun the full `supabase-setup.sql`; it creates the `product-images` bucket and its access rules.
- **Registration succeeds, but sign-in shows “not approved”:** rerun the full setup SQL; it grants admin access to existing accounts if a slot is available. Then sign in again.
- **Registration says confirmation is required:** confirm the email, or disable email confirmations in the Supabase email provider settings, then sign in.
- **Confirmation email links fail:** use the exact `Site URL` and `Redirect URL` above. The redirect is the published admin page, not the Supabase project name.
- **The page still shows sample products:** confirm the site has the latest `supabase-config.js` and scripts deployed, then check that `supabase-setup.sql` ran against this project.
- **Admin page is not found on the live site:** publish `admin.html`, `admin.js`, `supabase-config.js`, and the updated `script.js` and `style.css` to the GitHub Pages repository. Local files are not deployed automatically.
- **Never publish a secret/service-role key.** If one was shared or pasted into a public place, revoke/rotate it in the Supabase API keys settings immediately.
