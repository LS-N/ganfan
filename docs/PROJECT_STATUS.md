# Project Status

## Current Stage

Current stage: MVP 0.0 engineering entry.

The project should not enter full MVP 0.1 business development yet. The immediate goal is to make the app runnable, testable, updateable through EAS Update, and suitable for continuous AI-assisted development.

## Stage Plan

| Stage | Goal | Main Work | Exit Criteria |
|---|---|---|---|
| MVP 0.0 Engineering Entry | Build the mobile engineering baseline | Expo + TypeScript app, Expo Router, page shells, base components, design tokens, CI, EAS config, preview OTA flow | App opens on phone, at least 5 page entries exist, CI runs, preview OTA can update phone |
| MVP 0.1 Diet Logging Loop | Let users record meals and see today's diet state | Home, record, detail, history, profile pages; local/mock data flow; meal record types; today's intake summary | Prototype confirmed, PRD V1 filled, meal can be saved, home state updates, tests pass |
| MVP 0.2 AI Meal Advice | Turn meal data into actionable next-meal advice | Single-meal analysis, next-meal recommendation, AI JSON schema, prompt rules, fallback output | AI advice is specific, safe, parseable, and has fallback when AI fails |
| MVP 0.3 Trends and Review | Help users understand longer-term eating patterns | Weekly trends, diet structure review, behavior recap, history summaries | User can review trends and get non-anxious adjustment suggestions |
| MVP 1.0 Personal Diet Decision System | Complete the record-analysis-advice-review loop | Stable account/data model, production release process, long-term personalization, analytics, reliability | Production-ready mobile product with a sustainable decision loop |

## MVP 0.0 Checklist

- [x] GitHub repository exists.
- [x] Root project structure is cleaned up.
- [x] Expo project files exist.
- [x] TypeScript is configured.
- [x] Expo Router entry exists.
- [x] Base `src/` structure exists.
- [x] Base design tokens exist.
- [x] Base components exist.
- [x] Home page shell is connected.
- [x] Five page entries are connected through `app/`.
- [x] Local lint, typecheck, and test commands pass.
- [x] Expo config is readable.
- [x] `npm start` starts the Expo Metro Bundler locally.
- [ ] Android preview is verified on a device or emulator.
- [x] CI is verified on GitHub.
- [x] EAS preview update is verified locally.
- [x] GitHub Actions EAS preview update is verified on `dev`.
- [x] README contains current run and release commands.

## MVP 0.1 Entry Conditions

Do not begin full MVP 0.1 business development until these are true:

- [ ] Home prototype confirmed.
- [ ] Record page prototype confirmed.
- [ ] Detail page prototype confirmed.
- [ ] History page prototype confirmed.
- [ ] Profile page prototype confirmed.
- [ ] Page flow confirmed.
- [ ] Component usage confirmed.
- [ ] State model confirmed.
- [ ] `03_prd/mvp-0.1/mvp-0.1-prd-v1-coding.md` is filled with final page specs.

Allowed before MVP 0.1 entry:

- Engineering baseline.
- Page shells.
- Base components.
- Mock data.
- Tests and CI.
- EAS Update pipeline.

Not allowed before MVP 0.1 entry:

- Complete diet logging business loop.
- Real AI service integration.
- Real payment.
- Complex user system.
- Native plugin expansion.
- Unconfirmed pages, fields, or components.

## Immediate Next Work

1. Stabilize Android emulator or connect a physical Android device, then verify Android preview.
2. Verify a phone or emulator receives the preview OTA update.

## Key Commands

```powershell
npm install
npm run lint
npm run typecheck
npm test
npm start
npm run eas:update:preview
```

## Manual Configuration Still Needed

- Expo project is linked as `@ls-n/ganfan`.
- GitHub Actions EAS preview update is configured with `EXPO_TOKEN` and verified from `dev`.
- Configure Supabase and OpenAI secrets only when the project reaches the relevant MVP stage.
