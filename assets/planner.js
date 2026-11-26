function allocate(total, weights) {
  const sum = weights.reduce((value, weight) => value + weight, 0);
  if (!sum) return weights.map(() => 0);
  const quotas = weights.map(weight => total * weight / sum);
  const allocation = quotas.map(Math.floor);
  const remaining = total - allocation.reduce((value, count) => value + count, 0);
  const order = quotas.map((quota, index) => ({ index, fraction: quota - allocation[index] }));
  order.sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of order.slice(0, remaining)) allocation[index]++;
  return allocation;
}

function buildPlan(config, regions) {
  const { prevalence, margin, deff, interview, attendance, domain, mode, invite, capacity, valid } = config;
  const expectedComplete = 1.96 ** 2 * prevalence * (1 - prevalence) * deff / margin ** 2;
  const { coverageRate = 0, projectedAdults = 0 } = config;
  const weights = regions.map(region => region.population);
  const coverageTarget = adults => Math.ceil(adults * coverageRate / 100000);
  const selectedFor = target => Math.ceil(Math.max(expectedComplete, target) / (interview * attendance));
  const regionalAdults = domain === 'regional' && coverageRate > 0 ? allocate(projectedAdults, weights) : [];
  const coverageTargets = regionalAdults.map(coverageTarget);
  const nationalTarget = coverageTarget(projectedAdults);
  const selected = domain === 'regional'
    ? regions.map((_, index) => selectedFor(coverageTargets[index] ?? 0))
    : allocate(selectedFor(nationalTarget), weights);

  const interviewed = allocate(Math.round(selected.reduce((sum, n) => sum + n, 0) * interview), selected);
  const measured = allocate(Math.round(interviewed.reduce((sum, n) => sum + n, 0) * attendance), interviewed);
  const requested = allocate(
    mode === 'off' ? 0 : Math.round(measured.reduce((sum, n) => sum + n, 0) * invite),
    measured,
  );
  const totalRequested = requested.reduce((sum, n) => sum + n, 0);
  const booked = allocate(Math.min(totalRequested, capacity), requested);
  const completed = allocate(Math.round(booked.reduce((sum, n) => sum + n, 0) * valid), booked);

  const rows = regions.map((region, i) => ({
    ...region, selected: selected[i], step1: interviewed[i], step2: measured[i],
    requested: requested[i], booked: booked[i], step3: completed[i], gap: requested[i] - booked[i],
  }));
  const fields = ['population', 'selected', 'step1', 'step2', 'requested', 'booked', 'step3', 'gap'];
  const totals = Object.fromEntries(fields.map(field => [
    field, rows.reduce((sum, row) => sum + row[field], 0),
  ]));
  const coverageCompleteTarget = domain === 'regional'
    ? coverageTargets.reduce((sum, target) => sum + target, 0)
    : nationalTarget;
  const exceedsPopulation = coverageRate > 0 && (domain === 'regional'
    ? selected.some((count, index) => count > regionalAdults[index])
    : totals.selected > projectedAdults);
  return { rows, totals, coverageCompleteTarget, exceedsPopulation };
}
