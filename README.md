# Travel OC · 旅行OC

A cozy focus timer where your original character (OC) goes traveling while you work.
Upload your OC, pack a snack, pick a duration, and they come back with a photo, a diary entry, and maybe a souvenir.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

No API keys or accounts are needed. Everything runs locally with mock AI and browser storage.

## Architecture

| Area | Where | Notes |
| --- | --- | --- |
| Routes | `app/` | `/` room, `/create`, `/prepare`, `/journey`, `/return`, `/album`, `/album/[id]` |
| State | `components/GameProvider.tsx`, `lib/hooks/useGame.ts` | React context + `useOC`, `useCurrentJourney`, `useJourneys`, `useNow` |
| Game logic | `lib/game/` | Pure and deterministic. `seed = hash(ocId + startedAt)`, mulberry32 PRNG, one stream per decision |
| Destinations | `lib/game/destinations.ts` | 6 tiers (0 = early return … 5 = rare long trips), each with nature / city / cozy places |
| Timer | `lib/timer/journeyTimer.ts` | Derived from `startedAt` / `expectedEndAt` / `pausedAt`, so it survives refreshes and closed tabs |
| Persistence | `lib/storage/` | `StorageService` interface; `localStorageService` (validated, corruption-tolerant); `supabaseService` stub + `supabase/schema.sql` |
| AI | `lib/ai/` | `AIService` interface; `mockAIService` (canvas cartoon filter, procedural SVG scenes); `httpAIService` adapter for real providers |

### Game rules
- Duration → trip tier (5–20 min nearby, 21–40 neighbourhood, 41–70 across town, 71–120 day trip, 121–180 long journey).
- Food nudges the category by about +20 percentage points (🍙 nature, 🥪 city, 🍪 cozy).
- OC personality (random at creation) slightly favours rare places and colours the diary.
- Ending early is never punished: the trip resolves as `interrupted`, sized by the minutes actually spent.

### Connecting real AI
Set `NEXT_PUBLIC_AI_PROVIDER=http` and `NEXT_PUBLIC_AI_BASE_URL=/api/ai`, then implement `/stylize`, `/image` and `/story`
(see `lib/ai/httpAIService.ts`). `TravelImageInput.ocReferenceImageUrl` is there for reference-conditioned generation
(IP-Adapter / LoRA), so the OC stays recognisable across photos. Return `includesOC: true` from `/image` so the UI
stops pasting the sticker on top.

## Languages / 多语言

English and 简体中文 are built in. The app follows the browser language, and the EN / 中文 toggle on the home and album pages overrides it.

- UI strings: `lib/i18n/messages.ts` (the `zh` object is type-checked against `en`)
- Destinations and souvenirs: `lib/game/destinations.zh.ts` (arrays index-aligned with `destinations.ts`)
- Generic diary lines: `lib/game/diaryPools.ts`
- Diaries are stored as content keys (`TravelEvent.key`), so past trips re-render in whichever language is active.
- The Chinese handwriting font (ZCOOL KuaiLe) loads from Google Fonts at runtime, so only the needed glyph slices download.

## Multiple OCs, P.S. notes and owner chat

- Up to 8 OCs (`MAX_OCS`). One trip at a time; pick who goes on the prepare page. The album filters by OC.
- Every early return ends with a comforting P.S.; full trips may add a reflective one (always for 60+ min). Pools live in `lib/game/diaryPools.ts`.
- After a completed trip of `CHAT_MIN_MINUTES` (60) or more, the OC asks what you were doing. `lib/game/ownerChat.ts` classifies the answer by keywords and picks a reply; swap in an LLM via `AIService.respondToOwner`.
- Images are cut out automatically when the background is plain (`AIService.removeBackground`).
