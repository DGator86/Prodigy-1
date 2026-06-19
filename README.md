## Prodigy Score System

### Workout Structure

Workouts are modeled with `segments` — an array of `WorkoutSegment` objects. Each segment has a `type` (ForTime, AMRAP, EMOM, MaxLoad, MaxReps, Rest), optional `rounds`, `repScheme` (e.g. [21,15,9] for Fran), `durationSeconds` (for AMRAP), and a `movements` list with per-movement prescriptions including separate male/female loads.

The flat `movements` array on `Workout` is retained for backward compatibility with the UI.

### Score Structure

Each workout result produces:
- **outputScore** (0–1000): Power output normalized logarithmically
- **capacityScore** (0–1000): Work density × duration bonus
- **skillScore** (0–1000): Skill-weighted movement complexity
- **progressionScore** (0–1000): Improvement vs. personal history (500 = neutral)
- **prodigyScore** (0–1000): Weighted composite = output×40% + capacity×30% + skill×20% + progression×10%

### Scoring Limitations

- Physics values are approximations (metabolic cost models, not instrumented measurement)
- Bodyweight movements use fraction estimates (e.g. push-up = 65% BW)
- Machine calories use 25% mechanical efficiency assumption
- Running uses a metabolic cost of 3.5 J/kg/m (not pure mechanical work)
- Progression score requires history — returns 500 (neutral) for first attempt

### Next Steps

- [ ] Real user accounts with persistent storage (Supabase)
- [ ] Segment-aware score entry UI (per-segment result input)
- [ ] Movement scaling library (scaled → RX progression paths)
- [ ] Leaderboard / social comparison
- [ ] Wearable integration for heart rate / power data

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
