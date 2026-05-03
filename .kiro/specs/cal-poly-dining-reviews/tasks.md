# Implementation Plan: Cal Poly Dining Reviews

## Overview

Implement a Next.js 14 (App Router) full-stack web app for Cal Poly students to browse dining restaurants, read and submit item-level reviews, search menus, and report content — all without authentication. The stack is TypeScript + Prisma + SQLite + Tailwind CSS. Tasks are ordered to build a working vertical slice early, then layer in features incrementally.

## Tasks

- [ ] 1. Project setup and database foundation
  - Initialize Next.js 14 app with TypeScript and Tailwind CSS (`npx create-next-app@latest`)
  - Install and configure Prisma with SQLite (`prisma init --datasource-provider sqlite`)
  - Define the full Prisma schema: `Restaurant`, `MenuItem`, `Review`, `Report` models with all fields, relations, and the `@@unique([name, restaurantId])` constraint
  - Run `prisma migrate dev` to create `prisma/dev.db`
  - Install Vitest, fast-check, and `@testing-library/react` for testing
  - Install Nodemailer for email notifications
  - Configure `vitest.config.ts` with jsdom environment and path aliases
  - _Requirements: 7.1, 7.2_

- [ ] 2. Seed data and Prisma client
  - [ ] 2.1 Create `prisma/seed.ts` with Cal Poly dining restaurants and 5–10 menu items each
    - Seed restaurants: 19 Metro Station, Vista Grande, Poly Eats, Pony Espresso, Chumash Dining, Cerro Vista Dining, Subway (on campus), Jamba Juice (on campus)
    - Each restaurant gets 5–10 `MenuItem` records with name and description
    - Wire seed script in `package.json` under `prisma.seed`
    - _Requirements: 1.1, 1.2, 7.2_

  - [ ]* 2.2 Write unit test for seed data integrity
    - Verify all 8 restaurants exist after seeding
    - Verify each restaurant has at least 5 menu items
    - _Requirements: 7.2, 7.3_

- [ ] 3. Core API routes — restaurants and menu items
  - [ ] 3.1 Implement `GET /api/restaurants` route handler
    - Query all restaurants with `_count` of menu items
    - Return `Restaurant[]` with `id`, `name`, `description`, `itemCount`
    - Return 404 JSON on not-found, 500 on DB error
    - _Requirements: 1.1, 7.4_

  - [ ] 3.2 Implement `GET /api/restaurants/[restaurantId]/items` route handler
    - Query all menu items for the restaurant with `_avg` rating and `_count` reviews
    - Return `MenuItem[]` with `averageRating` and `reviewCount` computed fields
    - Return 404 if restaurant not found
    - _Requirements: 1.2, 1.3, 2.3_

  - [ ] 3.3 Implement `POST /api/restaurants/[restaurantId]/items` route handler
    - Validate: `name` non-empty after trim, `restaurantId` references existing restaurant
    - Case-insensitive duplicate check before insert; return 409 with human-readable message if duplicate
    - Insert `MenuItem` with `isUserSubmitted: true`
    - Return created `MenuItem` or `{ error: string }`
    - _Requirements: 9.3, 9.4, 9.5_

  - [ ]* 3.4 Write property test for duplicate menu item rejection (Property 4)
    - **Property 4: Duplicate menu item rejection**
    - **Validates: Requirements 9.5**
    - Generate random item names with case variations using fast-check; assert that submitting the same name (any case) to the same restaurant returns 409, and a different name returns 201
    - Tag: `// Feature: cal-poly-dining-reviews, Property 4: Duplicate menu item rejection`

- [ ] 4. Core API routes — reviews
  - [ ] 4.1 Implement `GET /api/items/[itemId]/reviews` route handler
    - Query all reviews for the item ordered by `createdAt` descending
    - Return `Review[]` with `id`, `rating`, `comment`, `createdAt`, `menuItemId`, `menuItemName`, `restaurantName`
    - Return 404 if item not found
    - _Requirements: 2.1, 2.2, 2.5_

  - [ ] 4.2 Implement `POST /api/items/[itemId]/reviews` route handler
    - Validate: `rating` is integer in [1, 5]; `comment` ≤ 500 chars if provided
    - Return 400 with descriptive error on validation failure
    - Insert review and return created `Review`
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 7.4_

  - [ ]* 4.3 Write property tests for review rating bounds and comment length (Properties 1 & 2)
    - **Property 1: Review rating bounds enforcement**
    - **Validates: Requirements 3.1, 3.5**
    - Generate random integers; assert API accepts iff value is in [1, 5]
    - **Property 2: Comment length enforcement**
    - **Validates: Requirements 3.2, 3.6**
    - Generate random strings; assert API accepts iff length ≤ 500
    - Tag: `// Feature: cal-poly-dining-reviews, Property 1: Review rating bounds enforcement`
    - Tag: `// Feature: cal-poly-dining-reviews, Property 2: Comment length enforcement`

  - [ ]* 4.4 Write property test for review submission round-trip (Property 8)
    - **Property 8: Review submission round-trip**
    - **Validates: Requirements 3.3, 7.1**
    - Generate random valid review payloads; POST then GET reviews; assert returned review contains same rating and comment for the correct item
    - Tag: `// Feature: cal-poly-dining-reviews, Property 8: Review submission round-trip`

  - [ ]* 4.5 Write property test for reviews ordered reverse-chronologically (Property 9)
    - **Property 9: Reviews ordered reverse-chronologically**
    - **Validates: Requirements 2.5**
    - Generate random sets of reviews with varying timestamps; assert returned list is sorted by `createdAt` descending
    - Tag: `// Feature: cal-poly-dining-reviews, Property 9: Reviews ordered reverse-chronologically`

- [ ] 5. Average rating computation and feed API
  - [ ] 5.1 Extract `computeAverageRating(ratings: number[]): number` pure utility function in `lib/ratings.ts`
    - Returns arithmetic mean of the array; returns 0 for empty array
    - _Requirements: 2.3, 3.7_

  - [ ]* 5.2 Write property test for average rating correctness (Property 3)
    - **Property 3: Average rating correctness**
    - **Validates: Requirements 2.3, 3.7**
    - Generate random non-empty arrays of integers in [1, 5]; assert `computeAverageRating` equals arithmetic mean
    - Tag: `// Feature: cal-poly-dining-reviews, Property 3: Average rating correctness`

  - [ ] 5.3 Implement `GET /api/reviews` route handler (community feed)
    - Query 50 most recent reviews across all items, ordered by `createdAt` descending
    - Include `menuItemName` and `restaurantName` in each result
    - _Requirements: 6.1, 6.2_

  - [ ]* 5.4 Write property test for community feed ordering and size invariant (Property 6)
    - **Property 6: Community feed ordering and size invariant**
    - **Validates: Requirements 6.1**
    - Generate random N reviews (0–200); assert feed returns exactly min(N, 50) reviews ordered by `createdAt` descending
    - Tag: `// Feature: cal-poly-dining-reviews, Property 6: Community feed ordering and size invariant`

- [ ] 6. Search API
  - [ ] 6.1 Implement `GET /api/search?q=` route handler
    - Query restaurants and menu items whose names contain `q` (case-insensitive, using Prisma `mode: 'insensitive'` or SQLite `LIKE` with `lower()`)
    - Return `{ restaurants: Restaurant[], menuItems: MenuItem[] }` with average ratings
    - Return empty arrays (not 404) when no results found
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ]* 6.2 Write property test for search case-insensitivity (Property 5)
    - **Property 5: Search case-insensitivity**
    - **Validates: Requirements 5.2**
    - Generate random query strings and seed items; assert items whose names contain the query (any case) appear in results, and others do not
    - Tag: `// Feature: cal-poly-dining-reviews, Property 5: Search case-insensitivity`

- [ ] 7. Report API and email notification
  - [ ] 7.1 Create `lib/email.ts` with `sendReportEmail(report: ReportPayload): Promise<void>`
    - Use Nodemailer with SMTP placeholder config
    - Include in email body: reported content, restaurant name, report reason, submission timestamp
    - Add prominent `// TODO: Replace with real SMTP credentials before production` comment
    - _Requirements: 10.3, 10.5_

  - [ ]* 7.2 Write property test for email notification required fields (Property 10)
    - **Property 10: Email notification contains required fields**
    - **Validates: Requirements 10.5**
    - Generate random report payloads; assert the constructed email body contains reported content, restaurant name, reason, and timestamp
    - Tag: `// Feature: cal-poly-dining-reviews, Property 10: Email notification contains required fields`

  - [ ] 7.3 Implement `POST /api/reports` route handler
    - Validate: `targetType` is `'review' | 'menuItem'`, `targetId` references existing record, `reason` non-empty after trim
    - Persist `Report` to DB first (before email), then call `sendReportEmail`
    - On email failure: keep `emailSent: false`, increment `emailRetries`, retry up to 3 times via `setTimeout` chain
    - Return `{ success: true }` to client regardless of email outcome
    - _Requirements: 10.3, 10.4, 10.6_

  - [ ]* 7.4 Write property test for report persistence regardless of email outcome (Property 7)
    - **Property 7: Report persistence regardless of email outcome**
    - **Validates: Requirements 10.3, 10.6**
    - Generate random report payloads with simulated email failures; assert report is always persisted in DB with all required fields
    - Tag: `// Feature: cal-poly-dining-reviews, Property 7: Report persistence regardless of email outcome`

- [ ] 8. Checkpoint — API layer complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all API routes return correct shapes by running `vitest --run`

- [ ] 9. Shared UI components
  - [ ] 9.1 Create `components/StarRating.tsx` — reusable star display/input (1–5)
    - Supports both read-only display mode and interactive input mode
    - Accessible: keyboard navigable, aria-label on each star
    - _Requirements: 2.2, 3.1, 8.2_

  - [ ]* 9.2 Write unit test for StarRating component
    - Assert correct number of filled stars rendered for each rating 1–5
    - Assert interactive mode fires onChange with correct value
    - _Requirements: 2.2_

  - [ ] 9.3 Create `components/EmptyState.tsx` — reusable "nothing here yet" message
    - Accepts `message` prop; renders accessible, centered placeholder text
    - _Requirements: 1.5, 2.4_

  - [ ] 9.4 Create `components/ReviewCard.tsx`
    - Displays rating (via StarRating), comment, timestamp, and Report button
    - Report button opens `ReportModal` with `targetType: 'review'`
    - _Requirements: 2.2, 10.1_

  - [ ] 9.5 Create `components/ReviewForm.tsx`
    - Star rating selector (StarRating in input mode) + textarea (max 500 chars) + submit button
    - Client-side validation: show descriptive error if rating not selected or comment too long before submission
    - Calls `POST /api/items/[itemId]/reviews`; on success, optimistically appends review to list
    - _Requirements: 3.1, 3.2, 3.5, 3.6_

  - [ ]* 9.6 Write unit test for ReviewForm validation
    - Assert error shown when submitting without a rating
    - Assert error shown when comment exceeds 500 characters
    - _Requirements: 3.5, 3.6_

  - [ ] 9.7 Create `components/AddMenuItemModal.tsx`
    - Modal with item name text input + restaurant dropdown (populated from `GET /api/restaurants`)
    - Submit button disabled until both fields are non-empty
    - On success: close modal, navigate to new item's page
    - On duplicate: display "item already exists" error inline
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 9.8 Write unit test for AddMenuItemModal
    - Assert submit button is disabled when name or restaurant is empty
    - Assert submit button is enabled when both fields are filled
    - _Requirements: 9.3_

  - [ ] 9.9 Create `components/ReportModal.tsx`
    - Modal with reason textarea + submit button
    - Calls `POST /api/reports`; on success, show confirmation message
    - _Requirements: 10.2, 10.4_

  - [ ] 9.10 Create `components/SearchBar.tsx`
    - Controlled input in the root layout nav
    - On submit (Enter or button click), navigates to `/search?q=<value>`
    - _Requirements: 5.1_

  - [ ]* 9.11 Write unit test for SearchBar
    - Assert navigates to correct URL on submit
    - _Requirements: 5.1_

- [ ] 10. Page implementations
  - [ ] 10.1 Implement `app/layout.tsx` — root layout
    - Include `SearchBar` in the nav
    - Apply global Tailwind styles; mobile-first responsive layout
    - _Requirements: 5.1, 8.1, 8.2_

  - [ ] 10.2 Implement `app/page.tsx` — home page
    - Server component: fetch restaurants via Prisma directly
    - Render `RestaurantCard` grid + link to community feed
    - _Requirements: 1.1_

  - [ ] 10.3 Create `components/RestaurantCard.tsx`
    - Displays restaurant name, description, and item count
    - Links to `/restaurants/[restaurantId]`
    - _Requirements: 1.1_

  - [ ] 10.4 Implement `app/restaurants/[restaurantId]/page.tsx` — restaurant page
    - Server component: fetch restaurant + menu items with average ratings
    - Render `MenuItemCard` list + "Add Menu Item" button that opens `AddMenuItemModal`
    - Show `EmptyState` if no menu items
    - _Requirements: 1.2, 1.3, 1.5, 9.1_

  - [ ] 10.5 Create `components/MenuItemCard.tsx`
    - Displays item name, description, average rating (StarRating), review count
    - Links to `/restaurants/[restaurantId]/items/[itemId]`
    - Report button for user-submitted items (`isUserSubmitted: true`)
    - _Requirements: 1.3, 10.1_

  - [ ] 10.6 Implement `app/restaurants/[restaurantId]/items/[itemId]/page.tsx` — menu item page
    - Server component: fetch item details + reviews
    - Render item name, average rating, `ReviewForm`, and `ReviewCard` list (reverse-chron)
    - Show `EmptyState` if no reviews
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.3, 3.4, 3.7_

  - [ ] 10.7 Implement `app/feed/page.tsx` — community feed page
    - Server component: fetch 50 most recent reviews
    - Render `FeedItem` list; show `EmptyState` if no reviews
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ] 10.8 Create `components/FeedItem.tsx`
    - Review card variant showing menu item name, restaurant name, rating, comment, timestamp
    - Links to corresponding menu item page on click
    - _Requirements: 6.2, 6.4_

  - [ ] 10.9 Implement `app/search/page.tsx` — search results page
    - Client component: reads `q` from URL search params, calls `GET /api/search?q=`
    - Renders restaurant results and menu item results in separate sections
    - Show `EmptyState` if no results; handle query shorter than 2 characters per Requirement 5.6
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 11. Responsive design and accessibility pass
  - Apply Tailwind responsive classes (`sm:`, `md:`, `lg:`) across all pages and components to support 320px–1920px widths
  - Add `aria-label`, `role`, and keyboard navigation support to all interactive elements (StarRating, modals, forms)
  - Ensure color contrast meets WCAG 2.1 AA on all text and interactive elements
  - _Requirements: 8.1, 8.2_

- [ ] 12. Checkpoint — UI complete
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify the home page, restaurant page, item page, feed, and search render correctly

- [ ] 13. Kiro project artifacts
  - [ ] 13.1 Create `.kiro/steering/tech-stack.md` steering document
    - Document the tech stack, conventions, and key architectural decisions for Kiro agents
    - _Requirements: (Hackathon judging criteria)_

  - [ ] 13.2 Create a Kiro hook for linting on file save
    - Add a `fileEdited` hook that runs `next lint` on `.ts` and `.tsx` file changes
    - _Requirements: (Hackathon judging criteria)_

- [ ] 14. Final integration and wiring
  - [ ] 14.1 Wire `AddMenuItemModal` into the restaurant page and verify navigation to new item page after submission
    - _Requirements: 9.4, 9.6_

  - [ ] 14.2 Wire `ReportModal` into `ReviewCard` and `MenuItemCard` and verify confirmation message displays
    - _Requirements: 10.1, 10.2, 10.4_

  - [ ] 14.3 Verify optimistic UI: submitting a review appends it to the list immediately and average rating updates
    - _Requirements: 3.4, 3.7_

  - [ ]* 14.4 Write integration tests for key end-to-end flows
    - Create review → fetch reviews → verify average rating updated
    - Submit report → verify DB record → verify email attempted
    - _Requirements: 3.3, 3.7, 10.3_

- [ ] 15. Final checkpoint — Ensure all tests pass
  - Run `vitest --run` and confirm all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery during the hackathon
- Each task references specific requirements for traceability
- Checkpoints at tasks 8, 12, and 15 ensure incremental validation
- Property tests validate universal correctness properties (Properties 1–10 from design.md)
- Unit tests validate specific examples and edge cases
- The email SMTP config is intentionally a placeholder — see the `// TODO` comment in `lib/email.ts`
- Run tests with `npx vitest --run` (not watch mode) to avoid blocking the terminal
