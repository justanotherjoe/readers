# Tests

Two kinds. The jsdom suites are the gate before any push. The Playwright scripts are for looking at a specific change.

## Setup

```
cd tests && npm install
```

Playwright scripts need Chrome at `/usr/bin/google-chrome` and a built test page (see below).

## The jsdom suites, run these before every push

```
node smoke3.js   # core: shelves, book dialog, progress, navigation
node cloud.js    # Supabase sync, sign in and out, state merge
node invite.js   # club invites, codes, friend sharing
node lanes.js    # Discover, recommendations, top picks
node v3.js       # later feature regressions
```

Each prints `ERRS: none` when it passes. Anything else is a failure.

## Test pages

The Playwright scripts load one of two copies of the built app with the Supabase keys stripped, so no script ever touches live data.

```
# /tmp/test_local.html  — blank keys, demo mode, no network
# /tmp/test_cloud.html  — fake keys http://x and k, needs a stubbed window.supabase
```

Build one by copying `../index.html` and blanking the `SB_URL` and `SB_KEY` values.

## Playwright scripts

Each targets one feature: `empty.py` the clubs empty state, `pg.py` page and chapter tracking, `ds.py` shelf deletion, `fold.py` and `ord.py` shelf collapse and reorder, `srch.py` book search, `bell.py` notifications, `theme2.py` the four themes, `mob.py` and `tab.py` breakpoints.

## Still worth adding

A `clubs.js` suite covering the hub at 0, 1, 3 and 8 clubs, signed out, and a club whose book has left the library.
