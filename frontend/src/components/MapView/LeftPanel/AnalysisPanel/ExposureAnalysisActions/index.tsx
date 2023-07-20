import React, { useCallback, useState, MouseEvent, useMemo } from 'react';
import {
  Button,
  createStyles,
  Theme,
  Typography,
  withStyles,
  WithStyles,
} from '@material-ui/core';
import { snakeCase } from 'lodash';
import { useSelector } from 'react-redux';
import {
  downloadToFile,
  getExposureAnalysisColumnsToRender,
  getExposureAnalysisTableDataRowsToRender,
} from 'components/MapView/utils';
import { useSafeTranslation } from 'i18n';
import {
  exposureLayerIdSelector,
  getCurrentDefinition,
  TableRow as AnalysisTableRow,
} from 'context/analysisResultStateSlice';
import ReportDialog from 'components/Common/ReportDialog';
import { Column } from 'utils/analysis-utils';
import { ReportsDefinitions } from 'config/utils';
import { getExposureAnalysisCsvData } from 'utils/csv-utils';

function ExposureAnalysisActions({
  analysisButton,
  bottomButton,
  clearAnalysis,
  tableData,
  columns,
}: ExposureAnalysisActionsProps) {
  // only display local names if local language is selected, otherwise display english name
  const { t } = useSafeTranslation();
  const analysisDefinition = useSelector(getCurrentDefinition);
  const exposureLayerId = useSelector(exposureLayerIdSelector);

  const [openReport, setOpenReport] = useState(false);

  const exposureAnalysisColumnsToRender = getExposureAnalysisColumnsToRender(
    columns,
  );
  const exposureAnalysisTableRowsToRender = getExposureAnalysisTableDataRowsToRender(
    columns,
    tableData,
  );
  const exposureAnalysisCsvData = getExposureAnalysisCsvData(
    exposureAnalysisColumnsToRender,
    exposureAnalysisTableRowsToRender,
  );

  const reportConfig = useMemo(() => {
    // We use find here because exposure reports and layers have 1 - 1 sync.
    // TODO Future enhancement if exposure reports are more than one for specific layer
    const foundReportKeyBasedOnLayerId = Object.keys(ReportsDefinitions).find(
      reportDefinitionKey => {
        return (
          ReportsDefinitions[reportDefinitionKey].layerId === exposureLayerId
        );
      },
    );
    return ReportsDefinitions[foundReportKeyBasedOnLayerId as string];
  }, [exposureLayerId]);

  const handleOnDownloadCsv = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      downloadToFile(
        {
          content: exposureAnalysisCsvData,
          isUrl: false,
        },
        `${snakeCase(analysisDefinition?.id)}_${snakeCase(
          analysisDefinition?.legendText,
        )}`,
        'text/csv',
      );
    },
    [analysisDefinition, exposureAnalysisCsvData],
  );

  const handleToggleReport = (toggle: boolean) => {
    return () => {
      setOpenReport(toggle);
    };
  };

  return (
    <>
      <Button className={analysisButton} onClick={clearAnalysis}>
        <Typography variant="body2">{t('Clear Analysis')}</Typography>
      </Button>
      {exposureAnalysisCsvData && (
        <Button className={bottomButton} onClick={handleOnDownloadCsv}>
          <Typography variant="body2">{t('Download as CSV')}</Typography>
        </Button>
      )}
      <Button className={bottomButton} onClick={handleToggleReport(true)}>
        <Typography variant="body2">{t('Create Report')}</Typography>
      </Button>
      <ReportDialog
        open={openReport}
        handleClose={handleToggleReport(false)}
        reportConfig={reportConfig}
        tableData={tableData}
        columns={columns}
      />
    </>
  );
}

const styles = (theme: Theme) =>
  createStyles({
    tableContainer: {
      height: '60vh',
      maxWidth: '90%',
      marginTop: 5,
      zIndex: theme.zIndex.modal + 1,
    },
    tableHead: {
      backgroundColor: '#EBEBEB',
      boxShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.25)',
    },
    tableHeaderText: {
      color: 'black',
      fontWeight: 500,
    },
    tableBodyText: {
      color: 'black',
    },
    innerAnalysisButton: {
      backgroundColor: theme.surfaces?.dark,
    },
    tablePagination: {
      display: 'flex',
      justifyContent: 'center',
      color: 'black',
    },
    select: {
      flex: '1 1 10%',
      maxWidth: '10%',
      marginRight: 0,
    },
    caption: {
      flex: '1 2 30%',
      marginLeft: 0,
    },
    backButton: {
      flex: '1 1 5%',
      maxWidth: '10%',
    },
    nextButton: {
      flex: '1 1 5%',
      maxWidth: '10%',
    },
    spacer: {
      flex: '1 1 5%',
      maxWidth: '5%',
    },
  });

interface ExposureAnalysisActionsProps extends WithStyles<typeof styles> {
  analysisButton?: string;
  bottomButton?: string;
  clearAnalysis: () => void;
  tableData: AnalysisTableRow[];
  columns: Column[];
}

export default withStyles(styles)(ExposureAnalysisActions);
