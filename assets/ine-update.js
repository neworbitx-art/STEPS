// Official national projections: Cuadro 9 uses two pages per decade.
const ineProjectionPdf = 'https://www.ine.gob.gt/ine/wp-content/uploads/2020/08/01-Metodologia-Nacional.pdf';
const ineProjectionBlocks = [
  { start: 2020, pages: [36, 37] },
  { start: 2030, pages: [38, 39] },
];

function inePdfRows(items) {
  const lines = new Map();
  for (const { str, transform } of items) {
    if (!str?.trim()) continue;
    const [x, y] = transform.slice(4);
    const baseline = Math.round(y);
    if (!lines.has(baseline)) lines.set(baseline, []);
    lines.get(baseline).push({ x, text: str });
  }
  return [...lines.entries()].sort(([a], [b]) => b - a).map(([, cells]) =>
    cells.sort((a, b) => a.x - b.x).map(cell => cell.text.trim()).join(' ')
      .replace(/(\d),\s+(?=\d{3}\b)/g, '$1,').split(/\s+/));
}

function readIneProjectionBlock(pages, start, years) {
  const ineYears = Array.from({ length: 10 }, (_, index) => start + index);
  let totals;
  const ages = new Map();
  for (const rows of pages) {
    const header = rows.findIndex(row => row.length === 11 && row[0] === 'Edad' &&
      ineYears.every((year, index) => row[index + 1] === String(year)));
    if (header < 0) throw new Error('No se encontró el bloque de proyecciones de ' + start + '.');
    for (const [label, ...cells] of rows.slice(header + 1)) {
      const age = /^\d{2}$/.test(label) ? Number(label) : null;
      if (label !== 'Total' && (age === null || age < 18 || age > 69)) continue;
      if (cells.length !== ineYears.length || cells.some(cell => !/^\d{1,3}(?:,\d{3})+$|^\d+$/.test(cell))) continue;
      const values = cells.map(cell => Number(cell.replaceAll(',', '')));
      if (label === 'Total') totals = values;
      else if (ages.has(age)) throw new Error('Hay edades duplicadas en el cuadro.');
      else ages.set(age, values);
    }
  }
  if (!totals || ages.size !== 52) throw new Error('El cuadro está incompleto.');
  return Object.fromEntries(years.map(year => {
    const index = ineYears.indexOf(Number(year));
    const total = totals[index];
    const adults = [...ages.values()].reduce((sum, values) => sum + values[index], 0);
    if (!Number.isSafeInteger(total) || !Number.isSafeInteger(adults) || adults <= 0 || adults >= total) {
      throw new Error('El total y el intervalo de edad no son compatibles.');
    }
    return [year, { total, adults }];
  }));
}

async function extractIneProjectionPdf(data, years) {
  const pdfBase = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/';
  const { getDocument, GlobalWorkerOptions } = await import(pdfBase + 'pdf.min.mjs');
  GlobalWorkerOptions.workerSrc = pdfBase + 'pdf.worker.min.mjs';
  const task = getDocument({ data });
  try {
    const pdf = await task.promise;
    const blocks = await Promise.all(ineProjectionBlocks.map(async ({ start, pages }) => {
      const blockYears = years.filter(year => year >= start && year < start + 10);
      if (!blockYears.length) return {};
      const rows = await Promise.all(pages.map(async number => {
        const page = await pdf.getPage(number);
        return inePdfRows((await page.getTextContent()).items);
      }));
      return readIneProjectionBlock(rows, start, blockYears);
    }));
    const projections = Object.assign({}, ...blocks);
    if (!years.every(year => Object.hasOwn(projections, year))) {
      throw new Error('Faltan años del operativo.');
    }
    return projections;
  } finally {
    await task.destroy();
  }
}

const ineUpdate = document.querySelector('#ine-update');
const ineStatus = document.querySelector('#ine-status');
const inePdfFile = document.querySelector('#ine-file');
const ineSources = document.querySelector('#ine-sources');

async function updateIneSeries(loadPdf, fromFile) {
  ineUpdate.disabled = true;
  inePdfFile.disabled = true;
  ineStatus.textContent = fromFile ? 'Leyendo el cuadro 9 del PDF seleccionado…' : 'Consultando el cuadro 9 en el sitio del INE…';
  try {
    const next = await extractIneProjectionPdf(await loadPdf(), Object.keys(populationProjections));
    const changed = Object.entries(next).some(([year, row]) =>
      row.total !== populationProjections[year].total || row.adults !== populationProjections[year].adults);
    Object.assign(populationProjections, next);
    populationProjectionSource = 'INE Guatemala · Proyecciones nacionales · cuadro 9 · ' +
      (fromFile ? 'PDF cargado por el usuario' : 'PDF consultado en el sitio del INE');
    refresh();
    const checked = fromFile ? 'Cuadro 9 leído del PDF seleccionado' : 'Cuadro 9 consultado en el sitio del INE';
    ineStatus.textContent = checked + '. ' +
      (changed ? 'Se actualizaron las proyecciones nacionales de la sesión.' : 'Las proyecciones coinciden con las cifras de la sesión.');
  } catch {
    ineSources.open = true;
    ineStatus.textContent = fromFile
      ? 'No se pudo leer el cuadro 9. Selecciona el PDF nacional enlazado y verifica tu conexión.'
      : 'No se pudo completar la consulta en línea. Puedes descargar el cuadro 9 y cargar el PDF. Se conservaron las cifras de la sesión.';
  } finally {
    ineUpdate.disabled = false;
    inePdfFile.disabled = false;
  }
}

ineUpdate.addEventListener('click', () => updateIneSeries(async () => {
  const response = await fetch(ineProjectionPdf, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('El INE no respondió con el PDF.');
  return response.arrayBuffer();
}, false));

inePdfFile.addEventListener('change', async () => {
  const [file] = inePdfFile.files;
  if (file) await updateIneSeries(() => file.arrayBuffer(), true);
  inePdfFile.value = '';
});
