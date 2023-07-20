import { orderBy, values } from 'lodash';
import { Map } from 'mapbox-gl';
import { TFunction } from 'i18next';
import { Dispatch } from 'redux';
import { LayerDefinitions } from 'config/utils';
import { formatFeatureInfo } from 'utils/server-utils';
import {
  AvailableDates,
  FeatureInfoObject,
  FeatureInfoType,
  LayerType,
  LegendDefinitionItem,
  WMSLayerProps,
} from 'config/types';
import { TableData } from 'context/tableStateSlice';
import { getUrlKey, UrlLayerKey } from 'utils/url-utils';
import { addNotification } from 'context/notificationStateSlice';
import { LocalError } from 'utils/error-utils';
import { Column, quoteAndEscapeCell } from 'utils/analysis-utils';
import { TableRow } from 'context/analysisResultStateSlice';
import { getExtent } from './Layers/raster-utils';

export const getActiveFeatureInfoLayers = (map: Map): WMSLayerProps[] => {
  const matchStr = 'layer-';
  const layerIds =
    map
      .getStyle()
      .layers?.filter(l => l.id.startsWith(matchStr))
      .map(l => l.id.split(matchStr)[1]) ?? [];

  if (layerIds.length === 0) {
    return [];
  }

  const featureInfoLayers = Object.values(LayerDefinitions).filter(
    l => layerIds.includes(l.id) && l.type === 'wms' && l.featureInfoProps,
  );

  if (featureInfoLayers.length === 0) {
    return [];
  }

  return featureInfoLayers as WMSLayerProps[];
};

export const getFeatureInfoParams = (
  map: Map,
  evt: any,
  date: string,
): FeatureInfoType => {
  const { x, y } = evt.point;
  const bbox = getExtent(map);
  const { clientWidth, clientHeight } = map.getContainer();

  const params = {
    bbox,
    x: Math.floor(x),
    y: Math.floor(y),
    width: clientWidth,
    height: clientHeight,
    time: date,
  };

  return params;
};

export const exportDataTableToCSV = (data: TableData) => {
  const { rows } = data;
  return rows.map(r => values(r)).join('\n');
};

export const downloadToFile = (
  source: { content: string; isUrl: boolean },
  filename: string,
  contentType: string,
) => {
  const link = document.createElement('a');
  const fileType = contentType.split('/')[1];

  link.setAttribute(
    'href',
    source.isUrl
      ? source.content
      : URL.createObjectURL(new Blob([source.content], { type: contentType })),
  );
  link.setAttribute('download', `${filename}.${fileType}`);
  link.click();
};

export function getFeatureInfoPropsData(
  featureInfoProps: FeatureInfoObject,
  event: any,
) {
  const keys = Object.keys(featureInfoProps);
  const { properties } = event.features[0];
  const coordinates = event.lngLat;

  return Object.keys(properties)
    .filter(prop => keys.includes(prop))
    .reduce((obj, item) => {
      return {
        ...obj,
        [featureInfoProps[item].dataTitle]: {
          data: formatFeatureInfo(
            properties[item],
            featureInfoProps[item].type,
            featureInfoProps[item].labelMap,
          ),
          coordinates,
        },
      };
    }, {});
}

export const getLegendItemLabel = (
  t: TFunction,
  { label, value }: LegendDefinitionItem,
) => {
  if (typeof label === 'string') {
    return t(label);
  }
  if (label?.text !== undefined) {
    return `${t(label.text)} ${label.value}`;
  }
  if (typeof value === 'number') {
    const roundedValue = Math.round(value);
    return roundedValue === 0
      ? value.toFixed(2)
      : roundedValue.toLocaleString('en-US');
  }
  return t(value);
};

export const generateUniqueTableKey = (activityName: string) => {
  return `${activityName}_${Date.now()}`;
};

export const checkLayerAvailableDatesAndContinueOrRemove = (
  layer: LayerType,
  serverAvailableDates: AvailableDates,
  removeLayerFromUrl: (layerKey: UrlLayerKey, layerId: string) => void,
  dispatch: Dispatch,
) => {
  const { serverLayerName } = layer as any;
  if (serverAvailableDates[serverLayerName]?.length !== 0) {
    return;
  }
  const urlLayerKey = getUrlKey(layer);
  removeLayerFromUrl(urlLayerKey, layer.id);
  dispatch(
    addNotification({
      message: `The layer: ${layer.title} does not have available dates to load`,
      type: 'warning',
    }),
  );
  throw new LocalError('Layer does not have available dates to load'); // Stop code execution
};

/**
 * Filters the active layers in a group based on the activateAll property
 */
const filterActiveGroupedLayers = (
  selectedLayer: LayerType,
  categoryLayer: LayerType,
): boolean | undefined => {
  return (
    (categoryLayer?.group?.activateAll &&
      categoryLayer?.group?.layers.some(
        l => l.id === selectedLayer.id && l.main,
      )) ||
    (!categoryLayer?.group?.activateAll &&
      categoryLayer?.group?.layers.some(l => l.id === selectedLayer.id))
  );
};

/**
 * Filters the active layers in the layers panel
 * based on the selected layers from the app store and the categoryLayers from the app config
 */
export const filterActiveLayers = (
  selectedLayer: LayerType,
  categoryLayer: LayerType,
): boolean | undefined => {
  return (
    selectedLayer.id === categoryLayer.id ||
    filterActiveGroupedLayers(selectedLayer, categoryLayer)
  );
};

const getExposureAnalysisTableCellValue = (
  value: string | number,
  column: Column,
) => {
  if (column.format && typeof value === 'number') {
    return quoteAndEscapeCell(column.format(value));
  }
  return quoteAndEscapeCell(value);
};

export const getExposureAnalysisColumnsToRender = (columns: Column[]) => {
  return columns.reduce(
    (acc: { [key: string]: string | number }, column: Column) => {
      return {
        ...acc,
        [column.id]: column.label,
      };
    },
    {},
  );
};

export const getExposureAnalysisTableDataRowsToRender = (
  columns: Column[],
  tableData: TableRow[],
) => {
  return tableData.map((tableRowData: TableRow) => {
    return columns.reduce(
      (acc: { [key: string]: string | number }, column: Column) => {
        const value = tableRowData[column.id];
        return {
          ...acc,
          [column.id]: getExposureAnalysisTableCellValue(value, column),
        };
      },
      {},
    );
  });
};

export const getExposureAnalysisTableData = (
  tableData: TableRow[],
  sortColumn: Column['id'],
  sortOrder: 'asc' | 'desc',
) => {
  return orderBy(tableData, sortColumn, sortOrder);
};
