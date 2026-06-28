export interface CategoriaSugerida {
  label: string;
  years: number[];
}

export const CATEGORIAS_POR_ANIO: CategoriaSugerida[] = [
  { label: 'Pony (nacidos 2019-2022)', years: [2019, 2020, 2021, 2022] },
  { label: 'Preinfantil (nacidos 2017-2018)', years: [2017, 2018] },
  { label: 'Infantil (nacidos 2015-2016)', years: [2015, 2016] },
  { label: 'Prejuvenil (nacidos 2012-2014)', years: [2012, 2013, 2014] },
];

export function sugerirCategoria(anioNacimiento: number): CategoriaSugerida | null {
  return CATEGORIAS_POR_ANIO.find((c) => c.years.includes(anioNacimiento)) ?? null;
}
