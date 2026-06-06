# JoSAA Choice Dashboard Guide

This dashboard helps compare IIT, NIT, and IIIT choices for a male SC candidate using JoSAA 2025 Round 6 opening and closing rank data.

## Data Source

- IIT source: `IIT colleges.xlsx`
- NIT source: `NIT colleges.xlsx`
- IIIT source: `III-T Colleges.xlsx`
- Processed data: `analysis_build/combined_choice_analysis.json`
- Seat type/category: `SC`
- Gender rows: `Gender-Neutral`

Female-only supernumerary rows are excluded because the candidate is male.

## Rank Rules

- IIT rows use JEE Advanced SC rank `1948`.
- NIT and IIIT rows use JEE Main SC rank `7316`.
- NIT quota defaults to applicable rows only: `OS` plus `HS` rows for NIT Warangal because the candidate's state of eligibility is Telangana.

## How To Use

1. Open the dashboard locally at `http://localhost:8765/dashboard/`.
2. Adjust `Advanced SC Rank` for IIT calculations.
3. Adjust `Main SC Rank` for NIT and IIIT calculations.
4. Use `Institute Type` to view IIT-only, NIT-only, IIIT-only, or combined options.
5. Use `Quota`, `Cutoff buffer`, `Branch`, `College`, search, `BTech only`, and `5Y dual` filters to narrow the list.
6. Use `Add` to collect options in `Selected Choices`.
7. Reorder selected choices with `Up`, `Down`, or `Move to`.
8. Use `Copy list` or `Download CSV` to export selected choices.

## Tables

### Top Realistic Options

Rows where:

`Closing Rank >= Rank Used`

For IIT rows, `Rank Used` is the Advanced SC rank. For NIT/IIIT rows, `Rank Used` is the Main SC rank.

### Worthwhile Reaches

Rows where:

`Closing Rank < Rank Used`

These missed last year's cutoff but may still be worth listing above realistic choices if the candidate truly prefers them.

### Selected Choices

A browser-side list of choices you add from the tables. It persists in local storage until cleared.

### Branch Mix

Counts visible realistic options by simplified branch group after the current filters.

## Column Glossary

- `College`: Short institute name.
- `Type`: IIT, NIT, or IIIT.
- `Quota`: JoSAA quota row used, such as AI, OS, or applicable HS.
- `Course`: Academic program name.
- `Branch`: Simplified branch group for filtering.
- `Rank`: Candidate rank used for that row.
- `Closing`: Last rank allotted in JoSAA 2025 Round 6 for that row.
- `Margin`: `Closing Rank - Rank Used`; positive means inside last year's cutoff.
- `Cutoff buffer`: Human-readable cushion or gap label.
- `Buffer %`: Heuristic cushion score based on last year's cutoff margin, not an official probability.
- `Score`: Active sorting score based on college-first, branch-first, or safety-first mode.

## Counselling Note

JoSAA choices should usually be ordered by true preference, not just probability. Put dream choices above realistic choices and safe choices below them. JoSAA scans from top to bottom and gives the highest available option.

## Limitations

- Uses JoSAA 2025 Round 6 data.
- 2026 cutoffs can change.
- Scoring is advisory, not official.
- Branch grouping and institute scoring are simplified for decision support.
- Always verify final choices against official JoSAA 2026 data before submitting.
