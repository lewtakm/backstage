/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BackstageTheme } from '@backstage/theme';
import {
  makeStyles,
  Typography,
  useTheme,
  IconButton,
} from '@material-ui/core';
// Material-table is not using the standard icons available in in material-ui. https://github.com/mbrn/material-table/issues/51
import AddBox from '@material-ui/icons/AddBox';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import MTable, {
  Column,
  MaterialTableProps,
  MTableHeader,
  MTableToolbar,
  Options,
} from 'material-table';
import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { CheckboxTreeProps } from '../CheckboxTree/CheckboxTree';
import { SelectProps } from '../Select/Select';
import { Filter, Filters, SelectedFilters, Without } from './Filters';

const tableIcons = {
  Add: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <AddBox {...props} ref={ref} />
  )),
  Check: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Check {...props} ref={ref} />
  )),
  Clear: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Clear {...props} ref={ref} />
  )),
  Delete: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <DeleteOutline {...props} ref={ref} />
  )),
  DetailPanel: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <ChevronRight {...props} ref={ref} />
  )),
  Edit: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Edit {...props} ref={ref} />
  )),
  Export: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <SaveAlt {...props} ref={ref} />
  )),
  Filter: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <FilterList {...props} ref={ref} />
  )),
  FirstPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <FirstPage {...props} ref={ref} />
  )),
  LastPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <LastPage {...props} ref={ref} />
  )),
  NextPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <ChevronRight {...props} ref={ref} />
  )),
  PreviousPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <ChevronLeft {...props} ref={ref} />
  )),
  ResetSearch: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Clear {...props} ref={ref} />
  )),
  Search: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Search {...props} ref={ref} />
  )),
  SortArrow: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <ArrowUpward {...props} ref={ref} />
  )),
  ThirdStateCheck: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Remove {...props} ref={ref} />
  )),
  ViewColumn: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <ViewColumn {...props} ref={ref} />
  )),
};

// TODO: Material table might already have such a function internally that we can use?
function extractValueByField(data: any, field: string): any | undefined {
  const path = field.split('.');
  let value = data[path[0]];

  for (let i = 1; i < path.length; ++i) {
    if (value === undefined) {
      return value;
    }

    const f = path[i];
    value = value[f];
  }

  return value;
}

const useHeaderStyles = makeStyles<BackstageTheme>(theme => ({
  header: {
    padding: theme.spacing(1, 2, 1, 2.5),
    borderTop: `1px solid ${theme.palette.grey.A100}`,
    borderBottom: `1px solid ${theme.palette.grey.A100}`,
    color: theme.palette.textSubtle,
    fontWeight: theme.typography.fontWeightBold,
    position: 'static',
    wordBreak: 'normal',
  },
}));

const useToolbarStyles = makeStyles<BackstageTheme>(theme => ({
  root: {
    padding: theme.spacing(3, 0, 2.5, 2.5),
  },
  title: {
    '& > h6': {
      fontWeight: 'bold',
    },
  },
  searchField: {
    paddingRight: theme.spacing(2),
  },
}));

const useFilterStyles = makeStyles<BackstageTheme>(() => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    whiteSpace: 'nowrap',
  },
}));

const useTableStyles = makeStyles<BackstageTheme>(() => ({
  root: {
    display: 'flex',
    alignItems: 'start',
  },
}));

function convertColumns<T extends object>(
  columns: TableColumn<T>[],
  theme: BackstageTheme,
): TableColumn<T>[] {
  return columns.map(column => {
    const headerStyle: React.CSSProperties = {};
    const cellStyle: React.CSSProperties =
      typeof column.cellStyle === 'object' ? column.cellStyle : {};

    if (column.highlight) {
      headerStyle.color = theme.palette.textContrast;
      cellStyle.fontWeight = theme.typography.fontWeightBold;
    }

    return {
      ...column,
      headerStyle,
      cellStyle,
    };
  });
}

export interface TableColumn<T extends object = {}> extends Column<T> {
  highlight?: boolean;
  width?: string;
}

export type TableFilter = {
  column: string;
  type: 'select' | 'multiple-select' | 'checkbox-tree';
};

export interface TableProps<T extends object = {}>
  extends MaterialTableProps<T> {
  columns: TableColumn<T>[];
  subtitle?: string;
  filters?: TableFilter[];
}

export function Table<T extends object = {}>({
  columns,
  options,
  title,
  subtitle,
  filters,
  ...props
}: TableProps<T>) {
  const headerClasses = useHeaderStyles();
  const toolbarClasses = useToolbarStyles();
  const tableClasses = useTableStyles();
  const filtersClasses = useFilterStyles();

  const { data, ...propsWithoutData } = props;

  const theme = useTheme<BackstageTheme>();

  const [filtersOpen, toggleFilters] = useState(false);
  const [selectedFiltersLength, setSelectedFiltersLength] = useState(0);
  const [tableData, setTableData] = useState(data as any[]);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>();

  const MTColumns = convertColumns(columns, theme);

  const defaultOptions: Options<T> = {
    headerStyle: {
      textTransform: 'uppercase',
    },
  };

  const getFieldByTitle = useCallback(
    (titleValue: string | keyof T) =>
      columns.find(el => el.title === titleValue)?.field,
    [columns],
  );

  useEffect(() => {
    if (!selectedFilters) {
      setTableData(data as any[]);
      return;
    }

    const selectedFiltersArray = Object.values(selectedFilters);
    if (selectedFiltersArray.flat().length) {
      const newData = (data as any[]).filter(
        el =>
          !!Object.entries(selectedFilters)
            .filter(([, value]) => !!value.length)
            .every(([key, filterValue]) => {
              const fieldValue = extractValueByField(
                el,
                getFieldByTitle(key) as string,
              );

              if (Array.isArray(fieldValue) && Array.isArray(filterValue)) {
                return fieldValue.some(v => filterValue.includes(v));
              } else if (Array.isArray(fieldValue)) {
                return fieldValue.includes(filterValue);
              } else if (Array.isArray(filterValue)) {
                return filterValue.includes(fieldValue);
              }

              return fieldValue === filterValue;
            }),
      );
      setTableData(newData);
    } else {
      setTableData(data as any[]);
    }
    setSelectedFiltersLength(selectedFiltersArray.flat().length);
  }, [data, selectedFilters, getFieldByTitle]);

  const constructFilters = (
    filterConfig: TableFilter[],
    dataValue: any[],
  ): Filter[] => {
    const extractDistinctValues = (field: string | keyof T): Set<any> => {
      const distinctValues = new Set<any>();
      const addValue = (value: any) => {
        if (value !== undefined && value !== null) {
          distinctValues.add(value);
        }
      };

      dataValue.forEach(el => {
        const value = extractValueByField(el, getFieldByTitle(field) as string);

        if (Array.isArray(value)) {
          (value as []).forEach(addValue);
        } else {
          addValue(value);
        }
      });

      return distinctValues;
    };

    const constructCheckboxTree = (
      filter: TableFilter,
    ): Without<CheckboxTreeProps, 'onChange'> => ({
      label: filter.column,
      subCategories: [...extractDistinctValues(filter.column)].map(v => ({
        label: v,
        options: [],
      })),
    });

    const constructSelect = (
      filter: TableFilter,
    ): Without<SelectProps, 'onChange'> => {
      return {
        placeholder: 'All results',
        label: filter.column,
        multiple: filter.type === 'multiple-select',
        items: [...extractDistinctValues(filter.column)].map(value => ({
          label: value,
          value,
        })),
      };
    };

    return filterConfig.map(filter => ({
      type: filter.type,
      element:
        filter.type === 'checkbox-tree'
          ? constructCheckboxTree(filter)
          : constructSelect(filter),
    }));
  };

  return (
    <div className={tableClasses.root}>
      {filtersOpen && filters?.length && (
        <Filters
          filters={constructFilters(filters, data as any[])}
          onChangeFilters={setSelectedFilters}
        />
      )}
      <MTable<T>
        components={{
          Header: headerProps => (
            <MTableHeader classes={headerClasses} {...headerProps} />
          ),
          Toolbar: toolbarProps =>
            filters?.length ? (
              <div className={filtersClasses.root}>
                <div className={filtersClasses.root}>
                  <IconButton
                    onClick={() => toggleFilters(el => !el)}
                    aria-label="filter list"
                  >
                    <FilterList />
                  </IconButton>
                  <Typography className={filtersClasses.title}>
                    Filters ({selectedFiltersLength})
                  </Typography>
                </div>
                <MTableToolbar classes={toolbarClasses} {...toolbarProps} />
              </div>
            ) : (
              <MTableToolbar classes={toolbarClasses} {...toolbarProps} />
            ),
        }}
        options={{ ...defaultOptions, ...options }}
        columns={MTColumns}
        icons={tableIcons}
        title={
          <>
            <Typography variant="h5">{title}</Typography>
            {subtitle && (
              <Typography color="textSecondary" variant="body1">
                {subtitle}
              </Typography>
            )}
          </>
        }
        data={tableData}
        style={{ width: '100%' }}
        {...propsWithoutData}
      />
    </div>
  );
}
