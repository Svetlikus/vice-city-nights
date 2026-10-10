# Vice City Nights — disclosed demo model

**This is a replacement demonstration with virtual credits.** It is not the original game's licensed mathematics, a real-money engine, a certified model or an RTP-equivalent reskin. There is no deposit, redemption, monetary wager or backend connection. The original reference's displayed theoretical RTP does not apply to this build. This demo does not advertise an RTP or volatility figure.

## Observed structure retained

Direct browser inspection of Monster King of Cheese confirmed five reels, three visible rows and five fixed paylines. They are listed below using zero-based rows (0 top, 1 middle, 2 bottom), left to right:

| Line | Rows across five reels |
| --- | --- |
| 1 | 1, 1, 1, 1, 1 |
| 2 | 0, 0, 0, 0, 0 |
| 3 | 2, 2, 2, 2, 2 |
| 4 | 0, 1, 2, 1, 0 |
| 5 | 2, 1, 0, 1, 2 |

Ordinary matches must begin on reel one and continue without interruption. Three, four or five matches pay; only the longest matching run pays on a given line. Simultaneous wins on different lines are added, even if the lines share cells. Amounts below multiply the **total bet**, with no further division by five.

| Demo regular ID / artwork | 3 symbols | 4 symbols | 5 symbols |
| --- | ---: | ---: | ---: |
| kingpin / The Kingpin | 10× | 20× | 40× |
| queen / The Nightclub Queen | 4× | 10× | 20× |
| enforcer / The Enforcer | 4× | 10× | 20× |
| racer / The Street Racer | 2× | 4× | 8× |
| fixer / The Fixer | 2× | 4× | 8× |
| car / Midnight GT | 2× | 4× | 8× |
| cocktail / After Hours | 1× | 2× | 4× |

These seven replacement IDs are our own presentation identifiers; the inaccessible proprietary internal symbol IDs are not claimed to match. The observed payout ladder is retained. Cash coins and VIP scatters are the only functional specials. There are no wilds, free spins, respins, expanding reels, multiplier symbols, bonus purchase or separate bonus round. Nightclub Takeover is an instant VIP celebration.

## Explicit changes and unavailable original mathematics

Original reel strips, frequencies, value weights, feature probabilities, RNG, accounting protocol and certified configurations were unavailable. The finite strips and coin values below are deliberately new demo mathematics. The reference shows an advertised €100,000 instant scatter prize; the replacement instead awards **1,000× the current total bet in virtual credits**. This change avoids representing a money jackpot or claiming an authentic prize model.

The visible original coin help wording did not conclusively establish the starting-position rule. This demo explicitly requires **three or more consecutive cash coins starting on reel one** along a fixed line. It pays the sum of all participating displayed values, each expressed as a multiple of the total bet. Example: at a 2-credit bet, coins marked 2×, 4× and 10× display 4, 8 and 20 credits and pay 32 credits in total. A later coin beyond an intervening ordinary symbol contributes nothing. Qualifying coin wins on multiple lines each pay independently.

## Result generation

`DemoProvider` independently selects one uniformly distributed stop on each finite strip. The three visible rows are the selected stop and the next two stops, wrapping around at the end. Cash coin values are selected independently using the table below. No outcome is rerolled according to balance, bet, spin history, autoplay, turbo mode or elapsed time. No hidden scripted play outcomes exist. In supported browsers the random samples come from the browser's `crypto.getRandomValues`, using rejection sampling to avoid modulo bias when selecting finite stops or weighted tickets; the explicit fallback is `Math.random` for environments without that API. Neither is presented as a certified gambling RNG.

The exact base strip is in `src/engine.ts` as `BASE_STRIP_TEXT`. Its 80 stops use K=Kingpin, Q=Queen, E=Enforcer, R=Racer, F=Fixer, C=Car, D=Cocktail and $=Cash:

```text
D C R Q F D C $ E C D K F R D C Q $ D E C F R D K C Q E $ D F C R D Q C E D F R $ C D K Q F C D E R D C $ Q F D C R E D K C F $ D Q R C E D F K C $ R D E Q F D
```

| Reel, zero-based | Base rotation | VIP insertion index | Total stops |
| --- | ---: | ---: | ---: |
| 0 | 0 | none | 80 |
| 1 | 17 | 9 | 81 |
| 2 | 39 | 31 | 81 |
| 3 | 57 | 61 | 81 |
| 4 | 71 | none | 80 |

Insertion happens after rotating the 80-stop base. Rotation preserves all frequencies. Each middle reel has exactly one VIP stop, so it can show at most one VIP in its three-cell window.

| Symbol | Stops on each outside reel | Stops on each middle reel | Probability in any one fixed outside row | Probability in any one fixed middle row |
| --- | ---: | ---: | ---: | ---: |
| Kingpin | 5 | 5 | 5/80 | 5/81 |
| Queen | 8 | 8 | 8/80 | 8/81 |
| Enforcer | 8 | 8 | 8/80 | 8/81 |
| Racer | 9 | 9 | 9/80 | 9/81 |
| Fixer | 10 | 10 | 10/80 | 10/81 |
| Car | 15 | 15 | 15/80 | 15/81 |
| Cocktail | 18 | 18 | 18/80 | 18/81 |
| Cash | 7 | 7 | 7/80 | 7/81 |
| VIP | 0 | 1 | 0 | 1/81 |

Rows within a reel are correlated through the strip window. Different reels are independent. The VIP trigger requires one visible VIP on each of reels 1, 2 and 3, irrespective of row. For each eligible reel, three of its 81 stops expose VIP, so the demo trigger probability per spin is `(3/81)³ = 1/19,683` (approximately 0.0050805%). This is the replacement probability, not an estimate of the source game.

For any single fixed payline, the chance of cash on its first three positions is `(7/80) × (7/81)² = 343/524,880`, approximately 0.06535%. This includes longer cash runs. The five paylines overlap and are correlated; their combined cash-hit probability is not five times this number. For a regular symbol with `c` stops per strip, a run of at least three on a particular line has probability `(c/80) × (c/81)²`. To get an exact 3-match probability multiply by `(1−c/81)`; for exact four use `(c/80) × (c/81)³ × (1−c/80)`; for five use `(c/80)² × (c/81)³`.

Cash value options use 83 equally likely weighted tickets:

| Value, in total-bet units | Tickets | Probability |
| --- | ---: | ---: |
| 2× | 22 | 22/83 |
| 4× | 20 | 20/83 |
| 6× | 16 | 16/83 |
| 10× | 12 | 12/83 |
| 20× | 8 | 8/83 |
| 50× | 4 | 4/83 |
| 100× | 1 | 1/83 |

## Bets and accounting

The confirmed total-bet ladder is retained in credit units: 0.05, 0.10, 0.20, 0.40, 0.60, 0.80, 1, 2, 4, 6, 8, 10, 20, 40, 60, 80, 100. Initial balance is 1,000 credits. Betting is locked while a round is active. A round debits exactly once before requesting a result, validates dimensions/IDs/coin values/scatter location/bet/payouts, and retains an immutable copy. The UI animates that already-computed result; after the reels stop, settlement credits it exactly once. A failed or invalid provider response refunds the debit and releases the lock. A repeated result ID cannot be credited twice. Amounts round to two decimal places. History retains the last 30 settlements.

## Feature tour and future integration

`createPreviewResult` produces deterministic illustrations identified by `preview-` IDs. The UI labels them as scripted previews and evaluates them at an illustrative 1-credit bet; they perform no debit or settlement and alter no account balance or history. `GameState` rejects preview identifiers as playable outcomes. Celebration labels and timing are presentation choices, not reproduced source thresholds.

| Feature Tour illustration | Scripted presentation value |
| --- | ---: |
| Three consecutive Kingpins on the middle line | 10 credits |
| Five consecutive cash coins, values 2 + 4 + 10 + 20 + 50 | 86 credits |
| Five Kingpins on every row, all five paylines | 200 credits |
| VIP on each middle reel | 1,000 credits |

`ResultProvider.requestSpin(bet)` is the result boundary. Replacing `DemoProvider` for authorised deployment requires the real licensed model, authenticated server authority, validated result contract, idempotent server settlement, compliance review and appropriate certification. Current client accounting is a demonstration; it cannot secure monetary play. The existing strict state evaluator validates this replacement's rules and would need to be aligned with the authorised model before accepting different payouts. No calls are made to the source's protected math endpoint.

## Verification

The meaningful test suite covers every fixed line and ordinary payout length, starting-position rules, interrupted runs, coin sums and rounding, scatter placement, combined payouts, malformed results, declared strip lengths/frequencies, seeded provider repeatability, invalid RNG values, debit/credit locking, duplicate settlement, invalid provider refunds, insufficient credits and preview isolation. Run with the project's `npm test` command.
