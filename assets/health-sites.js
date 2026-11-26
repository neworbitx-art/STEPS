// Representative geocoded locations for the demonstration. Each record keeps its original source.
// OpenStreetMap coordinates were checked against the corresponding Mapcarta feature page.
const fieldHealthSites = [
  ['metropolitana', 'Puesto de Salud Aldea Llano de Ánimas', 'Amatitlán', -90.60043, 14.45818, 'https://www.openstreetmap.org/way/987738713', 1],
  ['metropolitana', 'Centro de Salud Zona 1', 'Guatemala', -90.51075, 14.63402, 'https://www.openstreetmap.org/node/5045648976', 1],
  ['metropolitana', 'Centro de Salud Santa Elena', 'Guatemala', -90.47147, 14.66552, 'https://www.openstreetmap.org/way/117683083', 1],
  ['metropolitana', 'Centro de Salud de Villa Nueva', 'Villa Nueva', -90.58757, 14.52571, 'https://www.openstreetmap.org/node/7058767497', 1],
  ['norte', 'Puesto de Salud Aldea Santa Cecilinda', 'San Juan Chamelco', -90.28723, 15.42675, 'https://www.openstreetmap.org/node/5564997328', 16],
  ['norte', 'Puesto de Salud La Ceiba', 'Rabinal', -90.54308, 15.10556, 'https://www.openstreetmap.org/way/847826672', 15],
  ['nororiente', 'Puesto de Salud de Chanmagua', 'Esquipulas', -(89 + 11/60 + 55.47/3600), 14 + 37/60 + 30.35/3600, 'https://sistemas.segeplan.gob.gt/share/SCHE%24SINIP/PLANOS_DISENOS/337342-XYOMFGCWYT.pdf', 20],
  ['nororiente', 'Centro de Salud de Livingston', 'Livingston', -88.74834, 15.82767, 'https://www.openstreetmap.org/node/3223652853', 18],
  ['suroriente', 'Puesto de Salud Aldea Horcones', 'Santa Catarina Mita', -(89 + 48/60 + 7/3600), 14 + 25/60 + 28/3600, 'https://sistemas.segeplan.gob.gt/share/SCHE%24SINIP/IMPACTO_AMBIENTAL/330479-AHURADNIWB.pdf', 22],
  ['suroriente', 'Centro de Salud Santa Rosa de Lima', 'Santa Rosa de Lima', -90.29453, 14.38951, 'https://www.openstreetmap.org/way/1058924596', 6],
  ['central', 'Puesto de Salud en Santa Lucía Cotzumalguapa', 'Santa Lucía Cotzumalguapa', -91.13582, 14.18198, 'https://www.openstreetmap.org/way/441666839', 5],
  ['suroccidente', 'Centro de Salud Olintepeque', 'Olintepeque', -91.5142497, 14.8863805, 'https://gt.near-place.com/centro-de-salud-olintepeque-olintepeque', 9],
  ['suroccidente', 'Centro de Salud de Aldea Justo Rufino Barrios', 'Olintepeque', -91.5389493, 14.87836, 'https://gt.near-place.com/centro-de-salud-aldea-justo-rufino-barrios-olintepeque', 9],
  ['suroccidente', 'Puesto de Salud de Cajolá', 'Cajolá', -91.61324, 14.92385, 'https://www.openstreetmap.org/node/4456709975', 9],
  ['suroccidente', 'Puesto de Salud en Retalhuleu', '', -91.79569, 14.42709, 'https://www.openstreetmap.org/way/675248518', 11],
  ['noroccidente', 'Puesto de Salud en San Juan Ixcoy', 'San Juan Ixcoy', -91.47637, 15.63809, 'https://www.openstreetmap.org/way/704458893', 13],
  ['peten', 'Puesto de Salud Cooperativa Tecún Umán', '', -89.94206, 16.55292, 'https://www.openstreetmap.org/node/4673824089', 17],
  ['peten', 'Puesto de Salud Santa Teresa', '', -89.84544, 16.58568, 'https://www.openstreetmap.org/node/4680561090', 17],
  ['peten', 'Puesto de Salud San Valentín', '', -89.87464, 16.6241, 'https://www.openstreetmap.org/node/4673823489', 17],
];
