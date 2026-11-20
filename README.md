[![make.fun bounty](https://make.fun/badge/gta6-trophy-rarity-forecast-01)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01?utm_source=makefun&utm_medium=badge&utm_campaign=gta6-trophy-rarity-forecast-01)
[![make.fun rank](https://make.fun/badge/gta6-trophy-rarity-forecast-01/rank.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01/leaderboard?utm_source=makefun&utm_medium=badge&utm_campaign=gta6-trophy-rarity-forecast-01)
[![make.fun reward](https://make.fun/badge/gta6-trophy-rarity-forecast-01/reward.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01?utm_source=makefun&utm_medium=badge&utm_campaign=gta6-trophy-rarity-forecast-01)

# GTA6 Trophy Rarity Forecast

A robust and deterministic forecaster for Grand Theft Auto VI PS5 trophy earn rates on [make.fun](https://make.fun/bounty/gta6-trophy-rarity-forecast-01).

## Approach

Exophase updates trophy earn rates periodically when tracked players jump and trophy rates dilute because newly tracked players hold fewer trophies. This entry models refreshes explicitly in **earners space**:
- **Earner-Space Dilution Model:** Computes old earners from last rate and last players, forecasts target players (~6x growth on flat practice histories), and projects new earners where new-player earn chance scales with last rate raised to the power 1.6. Common trophies stay robust near 100% while rare trophies collapse toward expected dilution (e.g. 1.10% falls to ~0.25%, platinum falls to ~0.13%).
- **Logit-Scale Uncertainty:** Combines random-walk diffusion, refresh-timing uncertainty, and model noise for calibrated logit-scale spread (~0.4 to 0.5 units).
- **Quantile Generation:** Translates medians and spread into five pinball-optimized quantiles using standard normal z-scores (-1.645, -0.674, 0, 0.674, 1.645), clamped between 0 and 100 percent, rounded to 4 decimal places, and guaranteed non-decreasing.
