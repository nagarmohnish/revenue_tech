# stackscore-worker

Playwright worker that walks a checkout funnel and returns per-step signals + screenshots. Called by the Next.js app at `/api/stackscore/analyze`.

## API

`POST /walk`

```http
POST /walk
Content-Type: application/json
x-stackscore-secret: <shared secret>

{ "url": "https://example.com", "maxSteps": 6 }
```

Returns a `WalkResponse` — see [`src/types.ts`](src/types.ts).

`GET /health` returns `{ ok: true }`.

## Local dev

```bash
cd worker
npm install
# Playwright needs Chromium on first run:
npx playwright install --with-deps chromium
WORKER_SECRET=dev-secret PORT=8080 npm run dev
```

Then call it:

```bash
curl -X POST http://localhost:8080/walk \
  -H "content-type: application/json" \
  -H "x-stackscore-secret: dev-secret" \
  -d '{"url":"https://linear.app","maxSteps":5}' | jq '.steps | length'
```

## Deploy to Fly.io

```bash
cd worker

# one-time
fly auth login
fly launch --no-deploy   # accept defaults; it will pick up fly.toml + Dockerfile
fly secrets set WORKER_SECRET=$(openssl rand -hex 32)

fly deploy
fly status  # grab the *.fly.dev URL
```

Then in the Next.js app's `.env.local`:

```
STACKSCORE_WORKER_URL=https://<your-app>.fly.dev
STACKSCORE_WORKER_SECRET=<same as WORKER_SECRET>
```

Free-tier notes — the `fly.toml` here defaults to `auto_stop_machines = "stop"` and `min_machines_running = 0` so the VM idles to zero between requests. First request after idle adds ~6-10s of cold-start.

## What it does

For each step:

1. Navigates and waits for `load`.
2. Extracts `StepSignals` (visible CTAs, form fields, prices, payment methods, security badges, iframe presence, etc.) via `page.evaluate`.
3. Classifies the step (`landing` | `pricing` | `plan_detail` | `signup` | `checkout` | `payment` | `success` | `auth_wall` | `unknown`).
4. Takes a 1280×800 JPEG screenshot.
5. Picks the most purchase-intent CTA and clicks it.

Stops when:

- A payment form (card field or Stripe iframe) is reached.
- An external payment domain (paypal.com, checkout.stripe.com, razorpay.com…) is reached.
- An auth wall with no guest-checkout escape is hit.
- A success page is reached.
- The URL loops.
- `maxSteps` (default 6, capped at 8) is hit.
- No purchase-intent CTA remains on the page.

The walker **never fills forms** and **never submits cards**. It only clicks.
