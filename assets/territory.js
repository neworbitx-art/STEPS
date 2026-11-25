// INE, Censo 2018, cuadro A4.1. Código, departamento, población total.
const departments = [
  [1, 'Guatemala', 3015081], [2, 'El Progreso', 176632],
  [3, 'Sacatepéquez', 330469], [4, 'Chimaltenango', 615776],
  [5, 'Escuintla', 733181], [6, 'Santa Rosa', 396607],
  [7, 'Sololá', 421583], [8, 'Totonicapán', 418569],
  [9, 'Quetzaltenango', 799101], [10, 'Suchitepéquez', 554695],
  [11, 'Retalhuleu', 326828], [12, 'San Marcos', 1032277],
  [13, 'Huehuetenango', 1170669], [14, 'Quiché', 949261],
  [15, 'Baja Verapaz', 299476], [16, 'Alta Verapaz', 1215038],
  [17, 'Petén', 545600], [18, 'Izabal', 408688],
  [19, 'Zacapa', 245374], [20, 'Chiquimula', 415063],
  [21, 'Jalapa', 342923], [22, 'Jutiapa', 488395],
];

// Regiones de desarrollo según el artículo 3 del Decreto 70-86.
const regions = [
  { id: 'metropolitana', code: 'I', name: 'Metropolitana', departments: [1] },
  { id: 'norte', code: 'II', name: 'Norte', departments: [15, 16] },
  { id: 'nororiente', code: 'III', name: 'Nororiente', departments: [2, 18, 19, 20] },
  { id: 'suroriente', code: 'IV', name: 'Suroriente', departments: [6, 21, 22] },
  { id: 'central', code: 'V', name: 'Central', departments: [3, 4, 5] },
  { id: 'suroccidente', code: 'VI', name: 'Suroccidente', departments: [7, 8, 9, 10, 11, 12] },
  { id: 'noroccidente', code: 'VII', name: 'Noroccidente', departments: [13, 14] },
  { id: 'peten', code: 'VIII', name: 'Petén', departments: [17] },
].map(region => {
  const members = departments.filter(([id]) => region.departments.includes(id));
  return {
    ...region,
    population: members.reduce((total, row) => total + row[2], 0),
    departmentNames: members.map(row => row[1]),
  };
});
