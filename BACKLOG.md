# Learn Buddy backlog

When you ship something, move it from Pending or Desired to Implemented. Keep this file in sync with the product, not a wish list dump.

## Implemented

- [x] Client-only flow: Home → Subject → Topic (`components/learning-app.tsx`), with sticky header and breadcrumbs
- [x] Grade picker on home; subject cards show completed-topic counts
- [x] Topic list with not-started / in-progress / completed
- [x] Short lesson then quiz then result; try again and next topic
- [x] Question types: multiple choice, true/false, number; explanation after each answer
- [x] Quizzes of up to 10 questions drawn from the topic pool plus extras (`lib/quiz.ts`)
- [x] Extra question banks (`lib/extra-questions.ts`, plus Grade 3 Math in `lib/grade3_math_extra_questions.ts`)
- [x] Progress in localStorage (`hooks/use-progress.ts`): status and best score; completed is never downgraded
- [x] Multi-device progress via a buddy code (no email/password): create or enter a code in the header; `/api/progress` stores and merges scores
- [x] Kid-oriented UI: fonts, subject colors/icons
- [x] Daily challenge UI: seeded 10-question mix per grade (`buildDailyQuiz` in `lib/quiz.ts`), home card, play/retry, first completed score that day locked for XP (retries practice-only)
- [x] Parent/teacher family view (`/family`): lookup-only GET by buddy code, Magi/Yazhini roster, weekly daily-challenge XP (Sun–Sat; 1 XP per correct on first finish that day; current week day rows + sum; past week totals); no PIN. Class roster and signed-in accounts stay later.

### Content

**Grade 3**

- Math: Numbers, Addition, Subtraction, Multiplication, Division, Fractions, Geometry
- Science: Living & Non-Living, Plants, The Five Senses, Weather, States of Matter
- Geography: Land & Water, Continents, Maps & Directions, Countries & Cities

**Grade 7**

- Math: Integers, Fractions, Algebra, Equations, Geometry, Percentages
- Science: Cells, Photosynthesis, Forces & Motion, The Solar System, Matter & Its Changes
- Geography: Continents & Oceans, Climate Zones, Landforms, Maps & Latitude

Each topic has a short lesson and five base questions in `lib/curriculum.ts`.

## Pending

Started in code or implied by the current architecture, not finished.

## Desired

Not started. Not a commitment

- [ ] More grades and subjects
- [ ] Review quiz of questions the child missed
- [ ] Stars, streaks, or other light rewards
- [ ] Read-aloud for lessons and questions
- [ ] PWA / offline use
- [ ] Signed-in accounts
- [ ] Additional languages
