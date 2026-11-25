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
  const selectedPerDomain = Math.ceil(expectedComplete / (interview * attendance));
  const selected = domain === 'regional'
    ? regions.map(() => selectedPerDomain)
    : allocate(selectedPerDomain, regions.map(region => region.population));

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
  return { rows, totals };
}
