import { WithStyles, createStyles, withStyles } from '@material-ui/core';
import ChartSection from 'components/MapView/LeftPanel/ChartsPanel/ChartSection';
import { oneYearInMs } from 'components/MapView/LeftPanel/utils';
import {
  AdminLevelType,
  BoundaryLayerProps,
  WMSLayerProps,
  AdminCodeString,
} from 'config/types';
import { getBoundaryLayersByAdminLevel } from 'config/utils';
import { BoundaryLayerData } from 'context/layers/boundary';
import { LayerData } from 'context/layers/layer-data';
import {
  dateRangeSelector,
  layerDataSelector,
} from 'context/mapStateSlice/selectors';
import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import PopupChartWrapper from './PopupChartWrapper';

const styles = () =>
  createStyles({
    chartContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    chartSection: {
      height: '240px',
      width: '400px',
      flexGrow: 1,
    },
  });

const boundaryLayer = getBoundaryLayersByAdminLevel();

const getProperties = (
  layerData: LayerData<BoundaryLayerProps>['data'],
  adminCode: AdminCodeString,
  adminSelectorKey: string,
) => {
  const features = layerData.features.find(
    elem =>
      elem.properties &&
      elem.properties[adminSelectorKey] &&
      elem.properties[adminSelectorKey] === adminCode,
  );

  if (!features) {
    return null;
  }
  return features.properties;
};

interface PopupChartProps extends WithStyles<typeof styles> {
  filteredChartLayers: WMSLayerProps[];
  adminCode: AdminCodeString;
  adminSelectorKey: string;
  adminLevel: AdminLevelType;
}
const PopupAnalysisCharts = ({
  filteredChartLayers,
  adminCode,
  adminSelectorKey,
  adminLevel,
  classes,
}: PopupChartProps) => {
  const dataForCsv = useRef<{ [key: string]: any[] }>({});
  const boundaryLayerData = useSelector(layerDataSelector(boundaryLayer.id)) as
    | LayerData<BoundaryLayerProps>
    | undefined;
  const { data } = boundaryLayerData || {};

  const { startDate: selectedDate } = useSelector(dateRangeSelector);
  const chartEndDate = selectedDate || new Date().getTime();
  const chartStartDate = chartEndDate - oneYearInMs;

  if (filteredChartLayers.length < 1) {
    return null;
  }

  return (
    <PopupChartWrapper>
      {filteredChartLayers.map(filteredChartLayer => (
        <div key={filteredChartLayer.id} className={classes.chartContainer}>
          <div className={classes.chartSection}>
            <ChartSection
              chartLayer={filteredChartLayer}
              adminProperties={getProperties(
                data as BoundaryLayerData,
                adminCode,
                adminSelectorKey,
              )}
              adminLevel={adminLevel}
              startDate={chartStartDate}
              endDate={chartEndDate}
              dataForCsv={dataForCsv}
              chartProps={{
                showDownloadIcons: true,
                iconStyles: { color: 'white' },
              }}
            />
          </div>
        </div>
      ))}
    </PopupChartWrapper>
  );
};

export default withStyles(styles)(PopupAnalysisCharts);
