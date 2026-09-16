# ENTITY RESOLUTION — Replay Scope Lock

Date: 2026-09-13
Status: **LOCKED**

## Rule

Replay builds repeat the quest fixture, not the DSS application.

The `DSS` desktop application is a persistent, reusable Data Surveillance System surface. A Q01 replay must not create a replay-specific DSS app identity, title, registration, or runtime contract.

## Stable DSS identity

```text
AppName: dss
Title:   DSS
HTML:    entity-resolution.html
```

The application remains the same DSS application across development replay builds and future quests.

## Replay identity

Only the development quest instance receives a unique replay identity:

```text
Name = entity_resolution.dev.q01.<DEV_Q01_REPLAY_ID>
```

A new replay ID therefore creates a fresh Q01 quest registration without changing the DSS app identity.

## Runtime responsibility

The replay quest owns its own test fixture lifecycle:

```text
Q01 replay quest
├── quest data
├── shell fixtures used by Q01
├── network/domain fixtures used by Q01
├── mail fixtures used by Q01
└── objective progress
```

DSS remains outside the quest replay lifecycle:

```text
DSS
├── Desktop App
├── OpsRuntime
├── Command Registry
├── Event Bus
├── Session Store
└── shared tools such as Recon
```

## Deployment implication

The replay package may contain the DSS app because the mod package contains all required content, but the package must keep the stable mod/app identity. Installing a newer replay build is not equivalent to uninstalling and reinstalling DSS as a separate application.

When validating a new replay build, replace the development mod package as needed; do not introduce a new DSS app name or replay-specific app identity merely to reset Q01.

## Final invariant

```text
Replay N
   ↓
new Q01 quest instance
   ↓
same DSS application
   ↓
same DSS tool architecture
```

Only the quest repeats. DSS does not.