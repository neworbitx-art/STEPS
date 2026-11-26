const municipalitySources = [
  'https://sig.conred.gob.gt/server/rest/services/Hosted/Limites_municipales/FeatureServer/0/query?where=1%3D1&outFields=cod_dept_1,cod_muni_1,nombre_1&outSR=4326&maxAllowableOffset=0.00015&f=geojson',
  'https://www.geoboundaries.org/data/snapshots/1c423398df24ddf6e730b116567d2181c9782778d0459c3f3b76ca2f9f12b6bc/gbOpen/GTM/ADM2/geoBoundaries-GTM-ADM2_simplified.geojson',
  'https://services2.arcgis.com/IxKjRyYj80RtBCX1/ArcGIS/rest/services/geoBoundaries_GT/FeatureServer/10/query?where=1%3D1&outFields=shapeName&outSR=4326&maxAllowableOffset=0.001&f=geojson',
];
const departmentSource = 'https://www.geoboundaries.org/data/snapshots/1c423398df24ddf6e730b116567d2181c9782778d0459c3f3b76ca2f9f12b6bc/gbOpen/GTM/ADM1/geoBoundaries-GTM-ADM1_simplified.geojson';
const mapName = name => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const cajolaProfile = { name: 'Cajolá', key: '0907', department: 9, region: 'suroccidente' };

const olintepequeProfile = { name: 'Olintepeque', key: '0903', department: 9, region: 'suroccidente' };
const localMunicipalities = [cajolaProfile, olintepequeProfile];
const rmgirHealth = 'https://rmgir.proyectomesoamerica.org/server/rest/services/RMGIR/Guatemala_Sistema_Expuesto_WGS1984/MapServer/2';
const healthsitesSource = 'https://data.humdata.org/dataset/a8d0d34f-88de-41c5-b580-fd208447a381/resource/ef9e97d2-7112-47d9-abbf-d75498e76185/download/guatemala.geojson';

// Geographic and SVG bounds of the existing ADM1 base map, in west/south/east/north order.
const geoExtent = [-92.240248, 13.739445, -88.221502, 17.819456];
const mapExtent = [87.6, 36.2, 472.4, 443.8];
const unitsX = (mapExtent[2] - mapExtent[0]) / (geoExtent[2] - geoExtent[0]);
const unitsY = (mapExtent[3] - mapExtent[1]) / (geoExtent[3] - geoExtent[1]);

function projectMap([longitude, latitude]) {
  return [mapExtent[0] + (longitude - geoExtent[0]) * unitsX,
    mapExtent[1] + (geoExtent[3] - latitude) * unitsY];
}

function mapBounds(points) {
  return points.reduce(([left, top, right, bottom], [x, y]) => [
    Math.min(left, x), Math.min(top, y), Math.max(right, x), Math.max(bottom, y),
  ], [Infinity, Infinity, -Infinity, -Infinity]);
}

function inBounds([x, y], [left, top, right, bottom]) {
  return x >= left && x <= right && y >= top && y <= bottom;
}

function inRings([x, y], rings) {
  let inside = false;
  for (const ring of rings) {
    for (let a = 0, b = ring.length - 1; a < ring.length; b = a++) {
      const [ax, ay] = ring[a];
      const [bx, by] = ring[b];
      if ((ay > y) !== (by > y) && x < ax + (y - ay) * (bx - ax) / (by - ay)) inside = !inside;
    }
  }
  return inside;
}

const drillRegions = Object.entries(mapShapes).map(([id, shape]) => {
  const rings = shape.path.match(/M[^Z]+Z/g).map(path =>
    path.slice(1, -1).trim().split(/\s+/).map(pair => pair.split(',').map(Number)));
  return { id, rings, bounds: mapBounds(rings.flat()) };
});

function boundaryGeometry(geometry) {
  const rings = (geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()).map(
    ring => ring.map(projectMap),
  );
  const bounds = mapBounds(rings.flat());
  const path = rings.map(ring => 'M' + ring.map(point =>
    point.map(value => value.toFixed(2)).join(',')).join(' ') + 'Z').join(' ');
  return { rings, bounds, path };
}

function bestOverlap({ rings, bounds }, candidates) {
  const [left, top, right, bottom] = bounds;
  const nearby = candidates.filter(({ bounds: b }) => left <= b[2] && right >= b[0] && top <= b[3] && bottom >= b[1]);
  if (nearby.length === 1) return nearby[0];
  const samples = [];
  for (let row = 0; row < 9; row++) {
    for (let column = 0; column < 9; column++) {
      const point = [left + (column + .5) * (right - left) / 9, top + (row + .5) * (bottom - top) / 9];
      if (inRings(point, rings)) samples.push(point);
    }
  }
  let best = null;
  let largestOverlap = 0;
  for (const candidate of nearby) {
    const overlap = samples.filter(point => inBounds(point, candidate.bounds) && inRings(point, candidate.rings)).length;
    if (overlap > largestOverlap) {
      largestOverlap = overlap;
      best = candidate;
    }
  }
  return best;
}

async function fetchMapData(urls, read) {
  for (const url of urls) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (response.ok) return read(await response.json());
    } catch {
      // Continue with the next public source if the current source is unavailable.
    }
  }
  throw new Error('Capa no disponible');
}

function readMunicipalities(data) {
  if (data.features?.length < 300 || !data.features?.length) throw new Error('Capa municipal incompleta');
  return data.features.filter(({ properties, geometry }) =>
    (properties?.nombre_1 || properties?.shapeName) && ['Polygon', 'MultiPolygon'].includes(geometry?.type));
}

async function loadMunicipalities() {
  const features = await fetchMapData(municipalitySources, readMunicipalities);
  const departmentBoundaries = features.every(feature => Number(feature.properties.cod_dept_1))
    ? [] : await fetchMapData([departmentSource], data => data.features.flatMap(feature => {
      const name = mapName(feature.properties.shapeName).replace(/^departamento de(l)? /, '');
      const department = departments.find(([, label]) => mapName(label) === name);
      return department ? [{ id: department[0], ...boundaryGeometry(feature.geometry) }] : [];
    })).catch(() => []);
  return features.map(({ geometry, properties }, index) => {
    const shape = boundaryGeometry(geometry);
    const name = properties.nombre_1 || properties.shapeName;
    const department = Number(properties.cod_dept_1) || bestOverlap(shape, departmentBoundaries)?.id || null;
    const region = regions.find(item => item.departments.includes(department))?.id || bestOverlap(shape, drillRegions)?.id;
    const known = localMunicipalities.find(item => (department === item.department || (!department && region === item.region)) &&
      mapName(name) === mapName(item.name));
    const key = known?.key ?? String(properties.cod_muni_1 || properties.shapeID || 'adm2-' + index);
    return { ...shape, name, key, department, region };
  });
}

function facilityRecord(name, longitude, latitude) {
  if (!name || !Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  const match = name.trim().match(/^(Puesto|Centro) de Salud\b/i);
  if (!match) return null;
  return { name, kind: match[1].toLowerCase() === 'puesto' ? 'post' : 'centre', point: projectMap([longitude, latitude]) };
}

async function loadNationalHealthFacilities() {
  const pageSize = 1000;
  const locations = [];
  for (let offset = 0; ; offset += pageSize) {
    const query = new URLSearchParams({
      f: 'json', where: "tipo_serv IN ('PUESTO DE SALUD','CENTRO DE SALUD')",
      outFields: 'OBJECTID,tipo_serv,servicio,municipio', outSR: '4326',
      returnGeometry: 'true', orderByFields: 'OBJECTID', resultOffset: String(offset), resultRecordCount: String(pageSize),
    });
    const page = await fetchMapData([rmgirHealth + '/query?' + query], data => {
      if (!Array.isArray(data.features)) throw new Error('Respuesta del RMGIR sin entidades');
      return data;
    });
    for (const { attributes, geometry } of page.features) {
      const type = mapName(attributes.tipo_serv ?? '');
      const kind = { 'puesto de salud': 'post', 'centro de salud': 'centre' }[type];
      if (!kind || !geometry || !inBounds([geometry.x, geometry.y], geoExtent)) continue;
      const municipality = attributes.municipio?.trim() ?? '';
      const name = attributes.servicio?.trim() || (kind === 'post' ? 'Puesto de salud' : 'Centro de salud');
      locations.push({
        kind, name, municipality, point: projectMap([geometry.x, geometry.y]),
        source: rmgirHealth + '/query?objectIds=' + encodeURIComponent(attributes.OBJECTID) + '&outFields=*&f=html',
      });
    }
    if (page.exceededTransferLimit !== true) break;
  }
  if (!locations.length) throw new Error('RMGIR sin ubicaciones utilizables');
  return locations;
}

async function loadHealthFacilities(bounds) {
  const [left, top, right, bottom] = bounds;
  const longitude = x => geoExtent[0] + (x - mapExtent[0]) / unitsX;
  const latitude = y => geoExtent[3] - (y - mapExtent[1]) / unitsY;
  const box = [latitude(bottom) - .02, longitude(left) - .02, latitude(top) + .02, longitude(right) + .02];
  const query = '[out:json][timeout:14];nwr["name"~"^(Puesto|Centro) de Salud",i](' +
    box.map(number => number.toFixed(5)).join(',') + ');out center;';
  const endpoints = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  try {
    return await fetchMapData(endpoints.map(url => url + '?data=' + encodeURIComponent(query)), data => {
      if (!Array.isArray(data.elements) || data.remark) throw new Error('Extracto incompleto');
      return data.elements.map(item => {
        const location = item.center ?? item;
        const record = facilityRecord(item.tags?.name, location.lon, location.lat);
        return record && { ...record, source: 'https://www.openstreetmap.org/' + item.type + '/' + item.id };
      }).filter(Boolean);
    });
  } catch {
    return fetchMapData([healthsitesSource], data => data.features.filter(item => item.geometry?.type === 'Point')
      .map(item => {
        const record = facilityRecord(item.properties?.name ?? item.properties?.Name, ...item.geometry.coordinates);
        return record && { ...record, source: 'https://data.humdata.org/dataset/guatemala-healthsites' };
      }).filter(Boolean));
  }
}

function mergeFacilities(existing, incoming) {
  const sources = new Set(existing.map(item => item.source));
  for (const site of incoming) {
    const duplicateSource = !site.source.endsWith('guatemala-healthsites') && sources.has(site.source);
    const sameLocation = existing.some(item => item.kind === site.kind &&
      Math.hypot(item.point[0] - site.point[0], item.point[1] - site.point[1]) < .08);
    if (duplicateSource || sameLocation) continue;
    existing.push(site);
    sources.add(site.source);
  }
}

function groupFacilities(facilities, distance) {
  const groups = [];
  for (const record of facilities) {
    const nearby = groups.find(({ point }) =>
      Math.hypot(point[0] - record.point[0], point[1] - record.point[1]) <= distance);
    if (nearby) nearby.records.push(record);
    else groups.push({ point: record.point, records: [record] });
  }
  return groups;
}

function placeCountMarker(point, occupied) {
  const fits = ([x, y]) => x >= 14 && x <= 546 && y >= 14 && y <= 466 &&
    occupied.every(({ point: [otherX, otherY], clearance }) =>
      Math.hypot(x - otherX, y - otherY) >= clearance);
  if (fits(point)) return point;
  for (const radius of [14, 22, 30, 38, 46, 54]) {
    for (let direction = 0; direction < 12; direction++) {
      const angle = direction * Math.PI / 6;
      const candidate = [point[0] + radius * Math.cos(angle), point[1] + radius * Math.sin(angle)];
      if (fits(candidate)) return candidate;
    }
  }
  return point;
}

function createRegionalDetail(returnToCountry) {
  const camera = document.querySelector('#map-camera');
  const territoryTitle = document.querySelector('#territory-title');
  const details = document.querySelector('#region-detail');
  const municipalityLayer = document.querySelector('#map-municipalities');
  const facilityLayer = document.querySelector('#map-facilities');
  const facilityLeaders = document.querySelector('#map-facility-leaders');
  const districtStatus = document.querySelector('#district-status');
  const facilityStatus = document.querySelector('#facility-status');
  const facilityDetail = document.querySelector('#facility-detail');
  const reload = document.querySelector('#reload-layers');
  const mapBack = document.querySelector('#map-back');
  const nationalButton = document.querySelector('#national');
  const departmentControl = document.querySelector('#map-department');
  const municipalityControl = document.querySelector('#map-municipality');
  const mapLegend = document.querySelector('#facility-legend');
  const municipalSites = document.querySelector('#municipal-sites');
  const cajolaCard = document.querySelector('#cajola-profile');
  const coverage = document.querySelector('#map-coverage');
  const markerGuide = document.querySelector('#map-marker-guide');
  const navigation = document.querySelector('#territory-navigation');
  const olintepequeNote = document.querySelector('#olintepeque-note');
  const posts = document.querySelector('#show-posts');
  const centres = document.querySelector('#show-centres');
  const facilityCache = new Map();
  let municipalityPromise;
  let nationalHealthPromise;
  let activeId = null;
  let activeLayer = null;

  function svg(tag, attrs, title) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    if (title) {
      const caption = svg('title', {});
      caption.textContent = title;
      element.append(caption);
    }
    return element;
  }

  function facilityLink(site, municipality = site.municipality, department = site.department) {
    const link = document.createElement('a');
    const name = site.name.replace(/^P\s*\/\s*S\s*/i, 'Puesto de salud ')
      .replace(/^C\s*\/\s*S\s*/i, 'Centro de salud ');
    const departmentName = departments.find(([id]) => id === department)?.[1];
    const query = [...new Set([name, municipality, departmentName, 'Guatemala'].filter(Boolean))].join(' · ');
    link.href = 'https://www.google.com/search?q=' + encodeURIComponent(query);
    link.textContent = site.name;
    link.target = '_blank';
    link.rel = 'noopener';
    return link;
  }

  function describeFacilities(records) {
    const list = document.createElement('ul');
    for (const site of records) {
      const item = document.createElement('li');
      const municipality = activeLayer.municipality?.name || site.municipality;
      item.append(facilityLink(site, municipality, activeLayer.department || site.department));
      if (municipality) {
        const place = document.createElement('span');
        place.textContent = ' · ' + municipality;
        item.append(place);
      }
      list.append(item);
    }
    facilityDetail.replaceChildren(list);
    facilityDetail.hidden = false;
  }

  function districtForSite(site, districts) {
    const byName = site.municipality && districts.find(district =>
      (!site.department || site.department === district.department) &&
      mapName(site.municipality) === mapName(district.name));
    return byName || districts.find(district => (!site.department || site.department === district.department) && district.rings &&
      inBounds(site.point, district.bounds) && inRings(site.point, district.rings));
  }

  function departmentGroups(visible, assignments) {
    const groups = new Map();
    for (const site of visible) {
      const district = assignments.get(site);
      const key = district?.key ?? null;
      if (!groups.has(key)) groups.set(key, {
        point: site.point, records: [], groupName: district?.name ?? 'Sin municipio identificado',
      });
      groups.get(key).records.push(site);
    }
    return groups.values();
  }

  function paintFacilities() {
    facilityLayer.replaceChildren();
    facilityLeaders.replaceChildren();
    if (!activeLayer) return;
    const { visibleSites, scale, offset = [0, 0], municipality, region, department, assignments } = activeLayer;
    markerGuide.textContent = municipality
      ? 'Los puntos identifican sitios de la lista. Los círculos azules indican cuántos sitios cercanos hay en un grupo.'
      : department
        ? 'Cada número corresponde a los establecimientos de un municipio. Los sitios sin municipio identificado se agrupan aparte. La suma coincide con los registros visibles del departamento.'
        : 'Cada número indica cuántos establecimientos hay en ese marcador. Selecciónalo para ver los nombres.';
    const spaceCounts = !region || Boolean(department && !municipality);
    const occupied = region ? [] : Object.values(mapShapes).map(({ label }) => ({ point: label, clearance: 27 }));
    const visible = visibleSites.filter(item => item.kind === 'post' ? posts.checked : centres.checked);
    showFacilityStatus(visible, activeLayer.context);
    const groups = department && !municipality
      ? departmentGroups(visible, assignments)
      : groupFacilities(visible, (municipality ? 28 : 37) / scale);
    for (const { point, records, groupName } of groups) {
      const [record] = records;
      const grouped = records.length > 1;
      const kind = grouped || !municipality ? 'group' : record.kind;
      const label = groupName ? groupName + ' · ' + records.length +
        (records.length === 1 ? ' establecimiento' : ' establecimientos')
        : grouped ? records.length + ' establecimientos cercanos'
          : record.name + (record.municipality ? ' · ' + record.municipality : '');
      let position = point;
      if (spaceCounts) {
        const screenPoint = point.map((value, axis) => value * scale + offset[axis]);
        const placed = placeCountMarker(screenPoint, occupied);
        occupied.push({ point: placed, clearance: 25 });
        if (placed !== screenPoint) {
          position = placed.map((value, axis) => (value - offset[axis]) / scale);
          facilityLeaders.append(svg('line', {
            x1: point[0], y1: point[1], x2: position[0], y2: position[1],
          }));
        }
      }
      const marker = svg('g', {
        class: 'facility-marker ' + kind, transform: 'translate(' + position.join(' ') + ') scale(' + 1 / scale + ')',
        role: 'button', tabindex: '0', 'aria-label': label,
      }, label);
      marker.append(svg('circle', { r: '12', class: 'facility-target' }));
      if (grouped || !municipality) {
        const count = svg('text', { 'aria-hidden': 'true' });
        count.textContent = records.length;
        marker.append(svg('circle', { r: '11' }), count);
      } else {
        const radius = 9;
        marker.append(kind === 'post' ? svg('circle', { r: radius })
          : svg('rect', { x: -radius, y: -radius, width: 2 * radius, height: 2 * radius, transform: 'rotate(45) scale(.9)' }));
        const number = svg('text', { 'aria-hidden': 'true' });
        number.textContent = visibleSites.indexOf(record) + 1;
        marker.append(number);
      }
      const describe = () => describeFacilities(records);
      marker.addEventListener('click', describe);
      marker.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          describe();
        }
      });
      facilityLayer.append(marker);
    }
  }

  function showFacilityStatus(facilities, context) {
    const postCount = facilities.filter(item => item.kind === 'post').length;
    const centreCount = facilities.length - postCount;
    const postLabel = postCount === 1 ? 'puesto' : 'puestos';
    const centreLabel = centreCount === 1 ? 'centro' : 'centros';
    facilityStatus.textContent = `Registros en el mapa: ${postCount} ${postLabel} · ${centreCount} ${centreLabel}. ${context}`;
  }

  function setOptions(control, blankLabel, rows, value) {
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = blankLabel;
    const options = rows.map(([key, name]) => {
      const option = document.createElement('option');
      option.value = String(key);
      option.textContent = name;
      return option;
    });
    control.replaceChildren(blank, ...options);
    control.value = String(value ?? '');
  }

  function zoomTo([left, top, right, bottom]) {
    const scale = Math.min(470 / (right - left), 395 / (bottom - top));
    const offset = [280 - (left + right) / 2 * scale, 240 - (top + bottom) / 2 * scale];
    camera.style.setProperty('--focus-x', offset[0] + 'px');
    camera.style.setProperty('--focus-y', offset[1] + 'px');
    camera.style.setProperty('--focus-scale', scale);
    return { scale, offset };
  }

  function selectMunicipality(key) {
    const layer = activeLayer;
    layer.municipality = layer.districts.find(district => district.key === key)
      ?? localMunicipalities.find(item => item.key === key) ?? null;
    paintTerritory();
  }

  function paintTerritory() {
    const layer = activeLayer;
    const { region, department, municipality, districts, facilities } = layer;
    const candidates = department ? districts.filter(item => item.department === department) : districts;
    const available = [...candidates, ...localMunicipalities.filter(item =>
      item.region === region.id && (!department || item.department === department) &&
      !candidates.some(candidate => candidate.key === item.key))];
    const departmentName = departments.find(([id]) => id === department)?.[1];
    const regionName = regions.find(item => item.id === region.id).name;
    mapBack.textContent = '← ' + (municipality && departmentName ? 'Departamento' : municipality || department ? 'Región' : 'País');
    territoryTitle.textContent = municipality ? municipality.name + ' · ' + (departmentName || regionName)
      : departmentName || regionName;
    setOptions(departmentControl, 'Todos los departamentos',
      departments.filter(([id]) => regions.find(item => item.id === region.id).departments.includes(id)).map(([id, name]) => [id, name]), department);
    setOptions(municipalityControl, 'Todos los municipios', available.map(item => [item.key, item.name])
      .sort((a, b) => a[1].localeCompare(b[1], 'es')), municipality?.key);
    municipalityControl.disabled = !available.length;
    mapLegend.hidden = false;
    municipalSites.hidden = !municipality;
    cajolaCard.hidden = municipality?.key !== cajolaProfile.key;
    olintepequeNote.hidden = municipality?.key !== olintepequeProfile.key;
    facilityDetail.hidden = true;
    municipalityLayer.replaceChildren();

    const selectedShapes = municipality ? (municipality.path ? [municipality] : []) : candidates;
    const fallbackPoints = municipality ? facilities.filter(item =>
      item.municipality && mapName(item.municipality) === mapName(municipality.name)).map(item => item.point) : [];
    const bounds = selectedShapes.length ? mapBounds(selectedShapes.flatMap(item => item.rings.flat()))
      : fallbackPoints.length ? mapBounds(fallbackPoints.flatMap(([x, y]) => [[x - 1, y - 1], [x + 1, y + 1]]))
      : region.bounds;
    Object.assign(layer, zoomTo(bounds));
    camera.dataset.drill = municipality || (department && selectedShapes.length) ? 'true' : 'false';

    for (const district of selectedShapes) {
      const shape = svg('path', { d: district.path, class: 'municipal-boundary' }, district.name);
      if (!municipality) {
        shape.setAttribute('tabindex', '0');
        shape.setAttribute('role', 'button');
        shape.setAttribute('aria-label', 'Ver ' + district.name);
        const open = () => {
          layer.department = district.department;
          selectMunicipality(district.key);
          municipalityControl.focus();
        };
        shape.addEventListener('click', open);
        shape.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
        });
      }
      municipalityLayer.append(shape);
    }
    if (department || municipality) {
      const districtsForAssignment = municipality && !available.includes(municipality)
        ? [...available, municipality] : available;
      layer.assignments = new Map(facilities.map(site => [site, districtForSite(site, districtsForAssignment)]));
    }
    layer.visibleSites = municipality ? facilities.filter(site => layer.assignments.get(site)?.key === municipality.key)
      : department ? facilities.filter(site => site.department === department || layer.assignments.get(site)) : facilities;
    coverage.textContent = municipality ? (municipality.path ? 'Vista municipal · el escenario sigue siendo regional.' : 'Vista municipal · límite cartográfico no disponible. El escenario sigue siendo regional.')
      : department ? 'Vista departamental · el escenario sigue siendo regional.'
      : 'Vista regional · elige un departamento o selecciona un municipio.';
    if (municipality) {
      const list = document.createElement('ol');
      for (const site of layer.visibleSites) {
        const item = document.createElement('li');
        item.append(facilityLink(site, municipality.name, municipality.department || department || site.department));
        list.append(item);
      }
      const heading = document.createElement('h3');
      heading.textContent = 'Sitios en el mapa';
      const empty = document.createElement('p');
      empty.className = 'note';
      empty.textContent = 'La capa disponible aún no tiene sitios georreferenciados para este municipio.';
      municipalSites.replaceChildren(heading, layer.visibleSites.length ? list : empty);
    }
    paintFacilities();
  }

  async function show(id) {
    activeId = id;
    const region = drillRegions.find(item => item.id === id);
    camera.dataset.focused = String(Boolean(region));
    camera.dataset.drill = 'false';
    details.hidden = false;
    navigation.hidden = !region;
    mapBack.hidden = !region;
    mapLegend.hidden = false;
    municipalSites.hidden = true;
    cajolaCard.hidden = true;
    olintepequeNote.hidden = true;
    territoryTitle.textContent = regions.find(item => item.id === id)?.name ?? 'Ocho regiones';
    reload.hidden = true;
    municipalityLayer.replaceChildren();
    facilityLayer.replaceChildren();
    facilityDetail.hidden = true;
    districtStatus.textContent = '';
    facilityStatus.textContent = '';
    const initial = fieldHealthSites.filter(row => !region || row[0] === id).map(([, name, municipality, longitude, latitude, source, department]) =>
      ({ ...facilityRecord(name, longitude, latitude), municipality, source, department }));
    const layer = { region, department: null, municipality: null, districts: [],
      facilities: initial, visibleSites: initial, scale: 1, context: 'Consultando el RMGIR…' };
    activeLayer = layer;
    nationalHealthPromise ??= loadNationalHealthFacilities().catch(() => {
      nationalHealthPromise = null;
      return null;
    });
    const catalog = nationalHealthPromise;
    if (!region) {
      coverage.textContent = 'Vista nacional · selecciona una región para acercarte.';
      paintFacilities();
      const nationalSites = await catalog;
      if (activeLayer !== layer) return;
      if (nationalSites) mergeFacilities(layer.facilities, nationalSites);
      layer.context = nationalSites ? 'RMGIR y registros locales. Cobertura parcial.' : 'Selección local. RMGIR no disponible.';
      reload.hidden = Boolean(nationalSites);
      paintFacilities();
      return;
    }

    districtStatus.textContent = 'Cargando límites municipales…';
    paintTerritory();

    municipalityPromise ??= loadMunicipalities().catch(() => {
      municipalityPromise = null;
      return null;
    });
    if (!facilityCache.has(id)) {
      facilityCache.set(id, catalog.then(locations => locations ??
        loadHealthFacilities(region.bounds)).catch(() => {
        facilityCache.delete(id);
        return null;
      }));
    }

    const facilityPromise = facilityCache.get(id);
    const districts = await municipalityPromise;
    if (activeLayer !== layer) return;
    const local = districts?.filter(item => item.region === id) ?? [];
    layer.districts = local;
    if (layer.municipality) layer.municipality = local.find(item =>
      item.key === layer.municipality.key) ?? layer.municipality;
    districtStatus.textContent = local.length ? '' : 'No se pudieron cargar los límites municipales de esta región.';
    if (!local.length) reload.hidden = false;
    paintTerritory();

    const sites = await facilityPromise;
    if (activeLayer !== layer) return;
    if (!sites) {
      layer.context = 'Selección local. La ampliación en línea no está disponible.';
      paintFacilities();
      reload.hidden = false;
      return;
    }
    const regionalSites = sites.flatMap(site => {
      const district = local.find(item => inBounds(site.point, item.bounds) && inRings(site.point, item.rings));
      if (!district && !(inBounds(site.point, region.bounds) && inRings(site.point, region.rings))) return [];
      return [{ ...site, municipality: district?.name || site.municipality, department: district?.department }];
    });
    mergeFacilities(layer.facilities, regionalSites);
    const nationalSites = await catalog;
    if (activeLayer !== layer) return;
    layer.context = nationalSites ? 'RMGIR y registros locales. Cobertura parcial.' : 'OpenStreetMap y registros locales. Cobertura parcial.';
    layer.awaitingPaint = facilityLayer.contains(document.activeElement);
    if (!layer.awaitingPaint) paintTerritory();
  }

  facilityLayer.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (activeLayer?.awaitingPaint && !facilityLayer.contains(document.activeElement)) {
        activeLayer.awaitingPaint = false;
        paintTerritory();
      }
    });
  });
  departmentControl.addEventListener('change', () => {
    activeLayer.department = Number(departmentControl.value) || null;
    selectMunicipality('');
  });
  municipalityControl.addEventListener('change', () => {
    const district = [...activeLayer.districts, ...localMunicipalities]
      .find(item => item.key === municipalityControl.value);
    if (district) activeLayer.department = district.department;
    selectMunicipality(municipalityControl.value);
  });
  mapBack.addEventListener('click', () => {
    if (activeLayer.municipality) {
      selectMunicipality('');
    } else if (activeLayer.department) {
      activeLayer.department = null;
      paintTerritory();
    } else {
      returnToCountry();
      nationalButton.focus();
    }
  });
  reload.addEventListener('click', () => show(activeId));
  function updateFilters() {
    facilityDetail.hidden = true;
    paintFacilities();
  }
  posts.addEventListener('change', updateFilters);
  centres.addEventListener('change', updateFilters);
  return { show };
}
