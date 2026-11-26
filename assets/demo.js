const form = document.querySelector('#settings');
const exportButton = document.querySelector('#export');
const nationalButton = document.querySelector('#national');
const grid = document.querySelector('#region-grid');
const format = new Intl.NumberFormat('es-GT');
const modes = {
  portable: 'Sujeto a equipo validado, insumos, personal entrenado y control de calidad.',
  lab: 'Sujeto a personal entrenado, capacidad del laboratorio y logística acordada.',
  off: 'El operativo conserva los pasos 1 y 2. El paso 3 queda fuera del escenario.',
};
let selection = null;
let current = null;

const svgNamespace = 'http://www.w3.org/2000/svg';
const mapLayer = document.querySelector('#map-regions');
const detailMap = createRegionalDetail();
const labelLayer = document.querySelector('#map-labels');
document.querySelector('#map-country').setAttribute('d', mapCountryOutline);
document.querySelector('#map-departments').setAttribute('d', mapDepartmentBorders);
const regionControls = [];

function selectRegion(id) {
  selection = id;
  showResults();
  detailMap.show(id);
}

for (const region of regions) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.region = region.id;
  const label = document.createElement('span');
  label.textContent = region.code;
  const name = document.createElement('strong');
  name.textContent = region.name;
  button.append(label, name);
  button.addEventListener('click', () => selectRegion(region.id));
  grid.append(button);

  const geometry = mapShapes[region.id];
  const area = document.createElementNS(svgNamespace, 'g');
  area.classList.add('map-region');
  area.dataset.region = region.id;
  area.setAttribute('role', 'button');
  area.setAttribute('tabindex', '0');
  area.setAttribute('aria-label', region.name);
  function openRegion() {
    button.focus();
    selectRegion(region.id);
  }
  area.addEventListener('click', openRegion);
  area.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openRegion();
    }
  });
  const fill = document.createElementNS(svgNamespace, 'path');
  fill.setAttribute('class', 'region-fill');
  fill.setAttribute('d', geometry.path);
  const outline = document.createElementNS(svgNamespace, 'path');
  outline.setAttribute('class', 'region-outline');
  outline.setAttribute('d', geometry.outline);
  area.append(fill, outline);
  mapLayer.append(area);

  const marker = document.createElementNS(svgNamespace, 'g');
  marker.setAttribute('class', 'map-marker');
  marker.setAttribute('transform', 'translate(' + geometry.label.join(' ') + ')');
  marker.dataset.region = region.id;
  const halo = document.createElementNS(svgNamespace, 'circle');
  halo.setAttribute('class', 'marker-halo');
  halo.setAttribute('r', '15');
  const disc = document.createElementNS(svgNamespace, 'circle');
  disc.setAttribute('class', 'marker-disc');
  disc.setAttribute('r', '13');
  const caption = document.createElementNS(svgNamespace, 'text');
  caption.textContent = region.code;
  marker.append(halo, disc, caption);
  labelLayer.append(marker);
  regionControls.push(button, area, marker);
}

nationalButton.addEventListener('click', () => selectRegion(null));

function readConfig() {
  const values = form.elements;
  return {
    domain: values.domain.value, mode: values.mode.value, deff: values.deff.valueAsNumber,
    indicator: values.indicator.selectedOptions[0].textContent,
    prevalenceBasis: values.indicator.value === 'conservador' ? 'Supuesto conservador' : 'Supuesto ingresado',
    prevalence: values.prevalence.valueAsNumber / 100, margin: values.margin.valueAsNumber / 100,
    interview: values.interview.valueAsNumber / 100, attendance: values.attendance.valueAsNumber / 100,
    invite: values.invite.disabled ? 0 : values.invite.valueAsNumber / 100,
    capacity: values.capacity.disabled ? 0 : values.capacity.valueAsNumber,
    valid: values.valid.disabled ? 0 : values.valid.valueAsNumber / 100,
  };
}

function refresh() {
  const { indicator, prevalence, mode: modeField } = form.elements;
  const conservative = indicator.value === 'conservador';
  prevalence.readOnly = conservative;
  if (conservative) prevalence.value = 50;
  document.querySelector('#design-note').textContent = conservative
    ? '50 % maximiza la muestra para un mismo error y efecto de diseño. Confianza del 95 %.'
    : 'Ingresa una prevalencia de referencia para este indicador. El cálculo usa un 95 % de confianza y la completitud hasta el paso 2.';
  const reference = document.querySelector('#indicator-reference');
  const match = document.querySelector(`[data-indicator="${indicator.value}"]`);
  reference.hidden = !match;
  reference.textContent = match
    ? match.cells[1].textContent + ' STEPS metropolitano 2015: ' + match.cells[3].textContent + '.'
    : '';
  const mode = modeField.value;
  const disabled = mode === 'off';
  const bioFields = document.querySelector('#bio-fields');
  bioFields.hidden = disabled;
  for (const name of ['invite', 'capacity', 'valid']) form.elements[name].disabled = disabled;
  document.querySelector('#mode-note').textContent = modes[mode];
  const valid = form.checkValidity();
  document.querySelector('#form-error').hidden = valid;
  exportButton.disabled = !valid;
  if (valid) {
    const config = readConfig();
    current = { config, ...buildPlan(config, regions) };
  } else {
    current = null;
  }
  showResults();
}

function showResults() {
  const region = regions.find(item => item.id === selection);
  const row = region ? current?.rows.find(item => item.id === selection) : current?.totals;
  nationalButton.setAttribute('aria-pressed', String(!region));
  for (const control of regionControls) {
    control.setAttribute('aria-pressed', String(control.dataset.region === selection));
  }
  document.querySelector('#result-title').textContent = region?.name ?? 'Total nacional';
  const domainLabel = current?.config.domain === 'regional'
    ? 'Escenario con metas por dominio regional.'
    : 'Dominio nacional. Las metas regionales son operativas.';
  document.querySelector('#summary').textContent = [
    region?.departmentNames.join(', '), row ? domainLabel : 'Escenario pendiente de cálculo.',
  ].filter(Boolean).join(' · ');
  for (const field of ['population', 'gap', 'step1', 'step2', 'step3']) {
    document.querySelector('#result-' + field).textContent = row ? format.format(row[field]) : '—';
  }
  document.querySelector('#result-sample').textContent = row ? format.format(row.selected) : '—';
  for (const step of [1, 2, 3]) {
    const bar = document.querySelector('#bar' + step);
    bar.max = row?.selected || 1;
    bar.value = row?.['step' + step] ?? 0;
  }
  document.querySelector('#bio-detail').textContent = !row ? '' : current.config.mode === 'off'
    ? 'Paso 3 deshabilitado en este escenario.'
    : 'Paso 3 · ' + format.format(row.requested) + ' invitaciones previstas y ' +
      format.format(row.booked) + ' cupos asignados.';
}

function csvCell(value) {
  return '"' + String(value).replaceAll('"', '""') + '"';
}

exportButton.addEventListener('click', () => {
  if (!current) return;
  const { config, rows, totals } = current;
  const headings = [
    'REGION', 'DEPTO', 'DOMINIO', 'FUENTE_POBLACION', 'POBLACION_TOTAL_2018',
    'MUESTRA_SELECCIONAR', 'PASO_1', 'PASO_2', 'INVITACIONES_PASO_3', 'CUPOS_PASO_3',
    'PASO_3_VALIDO', 'BRECHA_CUPOS', 'MODALIDAD_PASO_3', 'PREVALENCIA_PROP',
    'ERROR_ABSOLUTO_PROP', 'DEFF', 'ENTREVISTA_PROP', 'PASO_2_PROP', 'INVITAR_PASO_3_PROP',
    'CAPACIDAD_TOTAL_PASO_3', 'VALIDAS_PASO_3_PROP', 'INDICADOR_DISENO', 'ORIGEN_SUPUESTO_PREVALENCIA',
  ];
  const data = [...rows, { ...totals, name: 'Total nacional', departmentNames: [] }].map(row => [
    row.name, row.departmentNames.join(' | '), config.domain === 'regional' ? '8 regiones' : 'Nacional',
    'INE Guatemala · Censo 2018 · cuadro A4.1', row.population, row.selected, row.step1, row.step2,
    row.requested, row.booked, row.step3, row.gap, form.elements.mode.selectedOptions[0].textContent,
    config.prevalence, config.margin, config.deff, config.interview, config.attendance,
    config.invite, config.capacity, config.valid, config.indicator, config.prevalenceBasis,
  ]);
  const csv = [headings, ...data].map(row => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'territorio-steps-escenario.csv';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', refresh);
form.addEventListener('reset', () => requestAnimationFrame(refresh));
refresh();
detailMap.show(null);

const tableauReference = document.querySelector('#mapa-tableau');

function loadTableauReference() {
  if (!tableauReference.open) return;
  const frame = tableauReference.querySelector('iframe');
  if (!frame.hasAttribute('src')) frame.src = frame.dataset.src;
}

document.querySelector('#open-tableau-map').addEventListener('click', () => {
  tableauReference.open = true;
});
tableauReference.addEventListener('toggle', loadTableauReference);
loadTableauReference();
