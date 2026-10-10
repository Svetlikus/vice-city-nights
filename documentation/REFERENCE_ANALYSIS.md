# Reference inspection — Monster King of Cheese

Inspected 10 October 2026 through the user-supplied CDN launch URL, rendering version 1.0.6. The interface explicitly displayed DEMO. This report describes visible behaviour only; no asset/code licence or proprietary mathematics was supplied. No protected endpoints were queried directly, session controls altered, authentication bypassed or source code copied. The original screenshots are documentary evidence only and are never served in the new game.

## Confirmed observations
| Area | Visible evidence |
|---|---|
| Loading | Black page, provider logo, title and horizontal progress indicator. Illustrated entry advertises coin values 1–99× and 100–2000×. Click to enter. |
| Reels | Five columns × three rows. Downward motion, sequential reel stopping, visual settlement. Fifteen visible cells; wooden cabinet and separate rainbow-lit outer rails. |
| Paylines | Five permanently illustrated lines: middle, top, bottom, V (top-middle-bottom-middle-top), inverted V. Rules require matching symbols consecutively from the far-left reel and highest payout per line only. |
| Regular symbols | Cat, bag of coins, berries with coins, carrots, green apples, walnuts, mouse. No playing-card ranks in help. |
| Displayed values | At €1 total bet, payouts for 3/4/5: cat 10/20/40; bag and berries each 4/10/20; carrots/apples/walnuts each 2/4/8; mouse 1/2/4. Values change with selected bet. |
| Cash coins | Numeric bronze/gold coin artwork. Help: three or more align on an active line; only participating coin values pay. Observed numbers include 5.40, 36.20 and 64.20 at €1 bet. The exact distribution and starting-position interpretation are not established by observation. |
| Scatter | Help names Monster Mega Hit as scatter; appears on reels 2,3,4; illustration shows three scatters leading to €100,000.00. No separate free-spin or bonus game described. |
| RTP | Source help states theoretical 96.00%. This is a UI statement; no model or certificate verified. It is not the RTP of Vice City Nights. |
| Bet interface | Minus/plus plus grid: .05,.10,.20,.40,.60,.80,1,2,4,6,8,10,20,40,60,80,100 euros. |
| Spin | Round debits total bet when started. Spacebar documented. Circular button changes to stop control in autoplay. |
| Autoplay | Finite choices 10,25,50,100,500, visible remaining counter and stop. Ten demo autoplay rounds observed. |
| Turbo/sound | Dedicated lightning and speaker controls; help describes on/off. No independent volume sliders documented. |
| Menu | Paytable/rules/help, history, fullscreen documented. Scrollable information overlay, close X. |
| Responsive | Portrait stacks title, compact reels and controls; desktop puts mascot left, reels centre and single bottom bar. |

## Not confirmed
The ten observed demo autoplay rounds did not produce a visible winning combination, so source win animation thresholds, big/mega/epic timing, feature transition, payout counter and actual scatter event cannot be truthfully documented as observed. Sound controls are confirmed visually; audio waveform, soundtrack composition and exact event timing were not captured. No wild, free spins, functional multiplier, VIP pick game or bonus-buy feature was present in the help. Those features are omitted in the reskin.

Source reel strips, weighted symbol frequencies, coin amounts/weights, random selection, scatter odds, backend result schema, internal symbol IDs, recovery behaviour and accounting service remain unavailable. The help image filenames symbols/0.png through6.png establish presentation ordering only, not engine IDs.

## Reskin mapping
| Observed regular order | Reference | New symbol | Total-bet ratios 3 / 4 / 5 |
|---|---|---|---|
|0|Cat|The Kingpin|10 / 20 / 40|
|1|Coin bag|The Nightclub Queen|4 / 10 / 20|
|2|Berries|The Enforcer|4 / 10 / 20|
|3|Carrots|The Street Racer|2 / 4 / 8|
|4|Apples|The Fixer|2 / 4 / 8|
|5|Walnuts|Midnight GT|2 / 4 / 8|
|6|Mouse|After Hours cocktail|1 / 2 / 4|
|Value coin|Cash value|Gold Cash Coin|Sum of participating displayed values|
|Scatter|Monster Mega Hit|VIP Takeover|Replacement demo award: 1000× virtual total bet|

These are new semantic IDs. Adapting to original IDs needs an authorised ID dictionary. Only seven regular symbols are functional. Extra ranks, watch, phone, briefcase, wild and multiplier would change the symbol set; they are not introduced. The Fixer's phone and the Kingpin's watch appear as character details. A VIP nightclub cinematic is an instant-prize celebration, never a new bonus math phase.

## Replacement implementation
See MATH_MODEL.md for explicit demo strips/weights/odds and coin interpretation. Original coin distribution, original fixed scatter prize and source RTP are not reproduced. No source-mathematical-equivalence or commercial certification claim is made. UI celebrations use documented demo thresholds, not inferred source thresholds.

## Evidence inventory
reference/main-desktop.jpg, main-portrait.jpg, loading.jpg, intro.jpg, spinning.jpg, coin-feature.jpg, paytable-scatter.jpg, paylines.jpg, rules.jpg, autoplay.jpg, bets.jpg and help-text.txt. Some frames may show a transient loading/animation state; no unseen bonus footage is implied.

## Public provider context
[Official provider catalogue](https://blacklagoon.games/) distinguishes Monster King of Cheese in its Monster Mega Hit family from the separate King of Cheese title. Its catalogue alone does not disclose title mathematics. Browser help and screenshots above are the primary mechanic evidence.
