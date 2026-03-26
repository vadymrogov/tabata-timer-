# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── tabata-timer/       # Expo React Native mobile app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Tabata Timer App (`artifacts/tabata-timer`)

### Features
- **Simple Mode**: Set work duration, rest duration, and number of cycles using Apple-style rolling wheel pickers
- **Custom Mode**: Design each interval individually (label, type, duration) with reorderable cards
- **Timer Screen**: Circular progress ring with interval progress + total workout progress bar
- **Sounds**: Countdown beeps (3,2,1), work/rest interval sounds, completion fanfare
- **Haptics**: Interval transitions and button presses
- **Stats**: Round counter, elapsed time, total duration

### Key Files
- `app/(tabs)/index.tsx` — Main timer screen with progress bar, sounds
- `app/(tabs)/settings.tsx` — Simple/Custom mode toggle + Apple wheel pickers
- `app/custom-config.tsx` — Custom interval editor
- `context/TimerContext.tsx` — Timer state, build intervals, tick logic
- `components/CircularProgress.tsx` — Animated SVG ring timer
- `components/WorkoutProgressBar.tsx` — Total workout progress bar
- `components/WheelPicker.tsx` — Apple-style rolling drum wheel picker
- `components/TimerControls.tsx` — Play/pause/skip/reset buttons
- `components/IntervalQueue.tsx` — Horizontal scrolling interval preview
- `components/StatsBar.tsx` — Round / elapsed / total stats
- `hooks/useSounds.ts` — expo-av sound playback
- `assets/sounds/` — Generated WAV audio files (tick, work, rest, complete)
- `constants/colors.ts` — Dark theme colors (orange work, teal rest, amber prepare)

### Packages Used
- expo-av — Audio playback
- expo-haptics — Haptic feedback
- @react-native-async-storage/async-storage — Persistent settings
- react-native-svg — Circular progress ring
- react-native-reanimated — Animations

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for validation and `@workspace/db` for persistence.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen config.
Run codegen: `pnpm --filter @workspace/api-spec run codegen`
