# eShop Price Watch

A self-hosted Nintendo eShop price tracker that pushes alerts straight to your iPhone (or any device). Watch games across **41 regions**, set a threshold per entry, get pinged the moment a price drops.

- 🆓 **Free forever** on Vercel Hobby + Upstash free tier + GitHub Actions
- 📲 **Real iOS push notifications** via VAPID web push (no App Store, no Apple Dev account)
- 🌎 **Multi-region** — track the same game in US/JP/HK/GB/etc. with separate thresholds
- 💱 **USD conversion** alongside native currency
- ⏱ **Hourly price checks** via GitHub Actions (edit the cron to go faster/slower)

---

## Quick start

### 1. Click to deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbrian-santos%2Feshop-tracker&integration-ids=oac_V3R1GIpkoJorr6fqyiwdhl17&project-name=eshop-tracker&repository-name=eshop-tracker)

> ⚠️ After forking this repo, edit the button URL in your README to point at your fork. The integration ID above is for Upstash Redis — Vercel will prompt you to install and provision it with one click.

Vercel will:

- Fork/clone this repo into your GitHub account
- Install the Upstash Redis integration (free tier: 10k commands/day)
- Auto-wire `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars

### 2. Generate your VAPID keys (one visit)

VAPID keys are your app's push-notification identity. After your first Vercel deploy succeeds, visit:

```
https://your-app.vercel.app/api/vapid-gen
```

It generates a fresh keypair and shows it to you **once**. Copy all three values (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) and paste into Vercel env vars in step 3. The endpoint refuses to run a second time once keys are configured, so you can't accidentally wipe them.

> Prefer the classic way? `npx web-push generate-vapid-keys` works too.

### 3. Add env vars in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Name                          | Value                              |
| ----------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`| Your public key from step 2        |
| `VAPID_PRIVATE_KEY`           | Your private key from step 2       |
| `VAPID_SUBJECT`               | `mailto:youremail@example.com`     |
| `CRON_SECRET`                 | Any random string, e.g. output of `openssl rand -hex 32` |

Then redeploy (Vercel → **Deployments → … → Redeploy**).

### 4. Wire up GitHub Actions

In your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**. Add two secrets:

| Name          | Value                                                    |
| ------------- | -------------------------------------------------------- |
| `APP_URL`     | Your Vercel URL, e.g. `https://eshop-tracker.vercel.app` |
| `CRON_SECRET` | Same random string you set in Vercel                     |

The workflow at `.github/workflows/check-prices.yml` runs every hour. To change cadence, edit the `cron:` line — any cron expression ≥ 5 min works on GitHub's free tier.

You can also trigger it manually from **Actions → Check eShop prices → Run workflow** to test.

### 5. Install on your iPhone

1. Open your Vercel URL in **Safari on iOS 16.4 or newer**.
2. Tap the <kbd>Share</kbd> button → <kbd>Add to Home Screen</kbd>.
3. Open the app from your home screen (not Safari — iOS only allows push in standalone mode).
4. Tap **Enable alerts** and allow notifications when prompted.
5. Paste a Nintendo eShop URL or NSUID, pick a region, set a threshold, and you're watching.

---

## Finding NSUIDs

When you paste a Nintendo eShop URL (e.g., from eshop-prices.com, dekudeals.com, or a Nintendo store page), the 14-digit NSUID is extracted automatically and probed across all 41 regions. You'll see which regions carry the game plus their current prices, and pick one (or more — each region is a separate watchlist entry).

If a URL doesn't contain the NSUID in its path, paste the NSUID directly — it's the 14-digit number starting with `7`.

---

## Architecture

```
┌──────────────┐  hourly cron  ┌─────────────────────────┐
│ GitHub       │───────────────►│ Vercel: /api/check-prices│
│ Actions      │  Bearer token  │  fetches Nintendo API   │
└──────────────┘                │  checks thresholds      │
                                │  sends web push         │
                                └───────────┬─────────────┘
                                            │ APNs
                                            ▼
                                   ┌─────────────────┐
                                   │ Your iPhone PWA │
                                   └─────────────────┘

        Data: Upstash Redis (watchlist, subscriptions, alert state, rate cache)
        Exchange rates: open.er-api.com (free, cached 24h)
```

- **Frontend**: Next.js 14 App Router, Tailwind, React Server/Client Components
- **Scheduler**: GitHub Actions (Vercel Hobby cron is daily-max — not great for flash sales)
- **Storage**: Upstash Redis via `@upstash/redis`
- **Push**: `web-push` library with VAPID, auto-cleans expired subscriptions

---

## Customizing

- **Check frequency**: edit the `cron:` expression in `.github/workflows/check-prices.yml`.
- **Add a region**: add an entry to `lib/regions.ts` + `lib/types.ts`. Nintendo's API accepts any valid ISO alpha-2 country code.
- **Change alert logic**: `app/api/check-prices/route.ts`. The current rule: alert once when price ≤ threshold, stay quiet until price rises above threshold *or* drops further.
- **Tweak the aesthetic**: CSS variables live in `tailwind.config.ts` and `app/globals.css`.

---

## Local development

```bash
cp .env.example .env.local
# Fill in your dev Upstash + VAPID keys
npm install
npm run dev
```

Visit `http://localhost:3000`. Note: iOS push requires HTTPS + home-screen install, so you can only test push on a real deployed URL.

---

## License

MIT — do what you want.
