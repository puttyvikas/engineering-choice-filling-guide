# IIT Choice Dashboard Guide

This dashboard helps explore IIT choices for a male SC candidate using JoSAA 2025 Round 6 opening and closing rank data.

## Data Source

The dashboard uses:

- Source workbook: `IIT colleges.xlsx`
- Processed data: `data/iit_only_analysis.json`
- Rows included: IIT colleges only
- Seat type/category: `SC`
- Gender rows: `Gender-Neutral`

It does not use NIT, IIIT, or other institute rows.

## How To Use

1. Open the dashboard:
   `/versions/v1/`

2. Enter the candidate's SC rank in `Candidate SC Rank`.
   The dashboard recalculates margins and chance labels immediately.

3. Choose a priority mode:
   - `College first`: prioritizes IIT reputation more than branch.
   - `Branch first`: prioritizes CSE, AI/Data, Math/Computing, Electronics, and Electrical more strongly.
   - `Safety first`: prioritizes choices with larger cutoff cushion.

4. Use filters:
   - `Chance`: show only likely, good chance, borderline, or reach choices.
   - `Branch`: focus on a branch group such as Electrical, CSE, Design, Civil, etc.
   - `College`: show choices from one IIT.
   - `Search`: search by college or course name.
   - `BTech only`: hide BS, dual-degree science, architecture, and other non-BTech rows.

5. Use `Add` to place options into the `Selected Choices` list for comparison.
   This does not change the source data or spreadsheet.

## What Each Table Means

### Top Realistic Options

This table shows choices where:

`Closing Rank >= Candidate SC Rank`

These are the options that would have been available based on the previous year's Round 6 closing rank, after applying your filters.

Important: this is not a guarantee for 2026. JoSAA cutoffs can move each year.

### Worthwhile Reaches

This table shows choices where:

`Closing Rank < Candidate SC Rank`

These missed the previous year's cutoff, but may still be worth placing above realistic options in the JoSAA preference list. There is usually no downside to listing aspirational choices above safer choices, because JoSAA checks choices from top to bottom.

### Selected Choices

This is a temporary comparison list. Use it to collect choices you are considering.

The selected list is only inside the browser session. Refreshing the page may clear it.

### Branch Mix

This shows the number of visible realistic options by branch group after applying the current filters.

It helps answer questions like:

- Are there many realistic Electrical options?
- Are most realistic options science branches?
- Does BTech-only filtering remove too many choices?

## Column Glossary

### College

The IIT name.

Example: `IIT Delhi`, `IIT Bombay`, `IIT Kharagpur`.

### Course

The academic program name.

Example: `Electrical Engineering (B.Tech)`, `Chemistry (BS)`, `Design (B.Tech)`.

### Branch

A simplified branch group created for easier filtering.

Examples:

- `CSE`
- `AI / Data`
- `Math / Computing`
- `Electronics`
- `Electrical`
- `Mechanical / Manufacturing`
- `Science - Chemistry`
- `Science - Physics`
- `Design`
- `Civil`

### Opening Rank

The first rank at which the program was allotted in the selected category/gender data.

Lower opening rank usually means higher demand, but opening rank is less important than closing rank for eligibility estimation.

### Closing Rank

The last rank that received the seat in JoSAA 2025 Round 6 for the selected category/gender row.

For this dashboard, closing rank is compared against the entered SC rank.

### Candidate Rank

The rank being used for comparison.

Default value: `1948`.

If you change the rank input, the dashboard recalculates margins and chance labels.

### Margin

Calculated as:

`Closing Rank - Candidate Rank`

Examples:

- Closing Rank `2164`, Candidate Rank `1948`, Margin `+216`
  Means the candidate rank is inside last year's cutoff by 216 ranks.

- Closing Rank `1908`, Candidate Rank `1948`, Margin `-40`
  Means the candidate missed last year's cutoff by 40 ranks.

### Gap

In the reach table, the margin is shown as a gap.

Negative gap means the candidate rank is worse than last year's closing rank.

### Chance

A simple label based on margin:

- `Likely`: margin greater than 600
- `Good chance`: margin from 151 to 600
- `Borderline`: margin from 0 to 150
- `Close reach`: margin from -1 to -300
- `Reach`: margin from -301 to -800
- `High reach`: margin below -800

These labels are only heuristic. They are not official predictions.

### Institute Score

A dashboard scoring value that gives more weight to older or stronger IIT brands.

It is used for sorting, not for official admissions.

### Branch Score

A dashboard scoring value that gives more weight to higher-demand branches like CSE, AI/Data, Math/Computing, Electronics, and Electrical.

It is used for sorting, not for official admissions.

### College First Score

The score used when priority mode is `College first`.

It gives most weight to the IIT brand, then branch, then cutoff safety.

### Branch First Score

The score used when priority mode is `Branch first`.

It gives most weight to branch, then IIT brand, then cutoff safety.

### Score

The active sorting score shown in the table.

It changes depending on the selected priority mode:

- `College first`
- `Branch first`
- `Safety first`

### Recommendation Note

A short explanation created during analysis to help interpret a row.

It may mention whether an option is realistic, aspirational, or useful for a specific strategy.

## Important Counselling Notes

JoSAA choice filling should usually be ordered by true preference, not by probability.

That means:

- Put dream/reach choices above realistic choices.
- Put realistic choices below them.
- Put safe choices below realistic choices.

If a higher preference is not available, JoSAA moves to the next preference. Listing a reach choice above a realistic choice does not reduce the chance of getting the realistic choice.

## Limitations

- The dashboard uses JoSAA 2025 Round 6 data.
- 2026 cutoffs can change due to seats, demand, policy changes, and candidate behavior.
- The scoring system is advisory, not official.
- Branch grouping is simplified for easier filtering.
- Always verify final choices against official JoSAA 2026 data before submitting.
