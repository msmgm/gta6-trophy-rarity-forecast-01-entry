import * as fs from 'node:fs';
import * as path from 'node:path';

function logit(p: number): number {
  const clamped = Math.max(0.001, Math.min(99.999, p));
  const prob = clamped / 100;
  return Math.log(prob / (1 - prob));
}

function invLogit(l: number): number {
  const prob = 1 / (1 + Math.exp(-l));
  return Math.max(0, Math.min(100, prob * 100));
}

const Z_LEVELS = [-1.645, -0.674, 0.0, 0.674, 1.645];

function main() {
  const inputDir = process.env.MAKEFUN_INPUT_DIR || '/input';
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.in')).sort();

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const raw = fs.readFileSync(inputPath, 'utf8');
    const data = JSON.parse(raw);

    const horizonMinutes = data.horizon_minutes;
    const horizonDays = horizonMinutes / (24 * 60);
    const trophies = data.trophies;
    const history = data.history || [];

    const distinctPlayers = Array.from(new Set(history.map((h: any) => h.players_tracked)));
    const isFlat = distinctPlayers.length <= 1;

    const lastRead = history.length > 0 ? history[history.length - 1] : null;
    const lastPlayers = lastRead ? lastRead.players_tracked : 638;

    let forecastPlayers: number;
    let power: number;

    if (isFlat) {
      // First-refresh scale: forecast players about 6 times last players
      forecastPlayers = lastPlayers * 6.0;
      power = 1.6;
    } else {
      // Estimate player growth and power from observed refresh jumps
      const firstRead = history[0];
      const playerGrowthRatio = Math.max(1.0, lastPlayers / (firstRead.players_tracked || firstRead.players || lastPlayers));
      forecastPlayers = lastPlayers * Math.max(1.1, playerGrowthRatio);
      power = 1.6;
    }

    const newPlayers = Math.max(0, forecastPlayers - lastPlayers);
    const results: any[] = [];

    for (let i = 0; i < trophies.length; i++) {
      const trophy = trophies[i];
      let lastRate = 50;
      if (lastRead && lastRead.rates && lastRead.rates[i] !== undefined && lastRead.rates[i] !== null) {
        lastRate = lastRead.rates[i];
      }

      const is100 = lastRate >= 99.9;
      let medianRate: number;

      if (is100) {
        medianRate = 100.0;
      } else {
        const lastRateFrac = Math.max(0.0001, Math.min(1.0, lastRate / 100));
        const oldEarners = lastRateFrac * lastPlayers;
        const newPlayerEarnChance = Math.pow(lastRateFrac, power);
        const newEarners = newPlayers * newPlayerEarnChance;
        medianRate = ((oldEarners + newEarners) / forecastPlayers) * 100;
        medianRate = Math.max(0.01, Math.min(100, medianRate));
      }

      const medianLogit = logit(medianRate);

      // Spread combining random walk, refresh uncertainty, and model uncertainty (~0.4 to 0.5 logit units)
      const rwSpread = 0.2 * Math.sqrt(horizonDays);
      const refreshUncertainty = isFlat ? 0.35 : 0.2;
      const modelUncertainty = 0.2;
      const totalSpread = Math.sqrt(rwSpread * rwSpread + refreshUncertainty * refreshUncertainty + modelUncertainty * modelUncertainty);

      let q: number[];
      if (is100) {
        // Keep quantiles very close to 100, perfectly anchored at 100 for the upper bound
        q = [99.7, 99.85, 99.9, 99.95, 100.0];
      } else {
        q = Z_LEVELS.map(z => {
          const lVal = medianLogit + z * totalSpread;
          return invLogit(lVal);
        });
      }

      for (let j = 1; j < q.length; j++) {
        if (q[j] < q[j - 1]) {
          q[j] = q[j - 1];
        }
      }

      q = q.map(val => Number(Math.max(0, Math.min(100, val)).toFixed(4)));

      results.push({
        id: trophy.id,
        q: q
      });
    }

    const outputObj = { trophies: results };
    const outPath = path.join(outputDir, `${data.id}.out`);
    fs.writeFileSync(outPath, JSON.stringify(outputObj), 'utf8');
  }
}

main();

