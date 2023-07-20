export function castObjectsArrayToCsv<T extends { [key: string]: any }>(
  objectsArray: T[],
  columnsNames: Partial<Record<keyof T, string>>,
  sep: string = ',',
): string {
  const objectKeys = Object.keys(objectsArray[0]);

  const columns = objectKeys.map(key => columnsNames[key] ?? key);

  return [
    ...(sep === ',' ? [] : [`sep=${sep}`]),
    columns.join(sep),
    ...objectsArray.map(obj => {
      return Object.values(obj).join(sep);
    }),
  ].join('\n');
}

export const getExposureAnalysisCsvData = (
  exposureAnalysisColumnsToRender: { [x: string]: string | number },
  exposureAnalysisTableRowsToRender: { [x: string]: string | number }[],
) => {
  return [exposureAnalysisColumnsToRender, ...exposureAnalysisTableRowsToRender]
    .map(analysisCsvItem => {
      return Object.values(analysisCsvItem);
    })
    .join('\n');
};
