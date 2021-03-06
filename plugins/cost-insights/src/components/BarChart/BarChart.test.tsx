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

import React from 'react';
import { TooltipPayload } from 'recharts';
import { fireEvent } from '@testing-library/react';
import { BarChart, BarChartProps } from './BarChart';
import { BarChartData, ResourceData } from '../../types';
import { createMockEntity } from '../../utils/mockData';
import { resourceSort } from '../../utils/sort';
import { renderInTestApp } from '@backstage/test-utils';
import { TooltipItemProps } from '../Tooltip';
import { costInsightsLightTheme } from '../../utils/styles';

const MockEntities = [...Array(10)].map((_, index) =>
  createMockEntity(() => ({
    id: `test-id-${index + 1}`,
    // grow resource costs linearly for testing
    aggregation: [index * 1000, (index + 1) * 1000],
  })),
);

const MockBarChartData: BarChartData = {
  previousFill: costInsightsLightTheme.palette.yellow,
  currentFill: costInsightsLightTheme.palette.darkBlue,
  previousName: 'Last Period',
  currentName: 'Current Period',
};

const MockResources: ResourceData[] = MockEntities.map(entity => ({
  name: entity.id,
  previous: entity.aggregation[0],
  current: entity.aggregation[1],
}));

const MockTooltipItem = (payload: TooltipPayload): TooltipItemProps => ({
  label: payload.name,
  value: payload.value as string,
  fill: payload.fill as string,
});

const renderWithProps = ({
  responsive = false,
  displayAmount = 6,
  barChartData = MockBarChartData,
  getTooltipItem = MockTooltipItem,
  resources = MockResources,
}: BarChartProps) => {
  return renderInTestApp(
    <BarChart
      responsive={responsive}
      displayAmount={displayAmount}
      barChartData={barChartData}
      getTooltipItem={getTooltipItem}
      resources={resources}
    />,
  );
};

describe('<BarChart />', () => {
  it('Renders without exploding', async () => {
    const rendered = await renderWithProps({} as BarChartProps);
    expect(rendered.getByText('test-id-10')).toBeInTheDocument();
  });

  it('Should display only 6 resources by default, sorted by cost', async () => {
    const rendered = await renderWithProps({} as BarChartProps);

    const sorted = MockResources.sort(resourceSort);

    expect(sorted.length).toBe(10);
    sorted.slice(0, 6).forEach(resource => {
      expect(rendered.getByText(resource.name!)).toBeInTheDocument();
    });
    sorted.slice(6).forEach(resource => {
      expect(rendered.queryByText(resource.name!)).not.toBeInTheDocument();
    });
  });

  describe('Stepper', () => {
    it('should not display stepper if displaying less than 6 resources', async () => {
      const rendered = await renderWithProps({
        resources: MockResources.slice(0, 3),
      } as BarChartProps);
      expect(
        rendered.queryByTestId('bar-chart-stepper'),
      ).not.toBeInTheDocument();
    });

    it('should display stepper if displaying more than 6 resources', async () => {
      const rendered = await renderWithProps({} as BarChartProps);
      expect(rendered.queryByTestId('bar-chart-stepper')).toBeInTheDocument();
    });

    it('should display the next step button if resources are remaining', async () => {
      const rendered = await renderWithProps({} as BarChartProps);
      fireEvent.mouseEnter(rendered.getByTestId('bar-chart-wrapper'));
      expect(
        rendered.queryByTestId('bar-chart-stepper-button-back'),
      ).not.toBeInTheDocument();
      expect(
        rendered.queryByTestId('bar-chart-stepper-button-next'),
      ).toBeInTheDocument();
    });

    it('should display the correct amount of dots for the amount of resources', async () => {
      const rendered = await renderWithProps({} as BarChartProps);
      fireEvent.mouseEnter(rendered.getByTestId('bar-chart-wrapper'));
      expect(rendered.queryAllByTestId('bar-chart-step').length).toEqual(2);
    });

    it('should not display the stepper or stepper buttons when the amount of resources is equal to the displayMax', async () => {
      const MockEqualEntities = [...Array(5)].map(createMockEntity);
      const MockEqualResources = MockEqualEntities.map(entity => ({
        name: entity.id,
        previous: entity.aggregation[0],
        current: entity.aggregation[1],
      }));

      const rendered = await renderWithProps({
        displayAmount: 5,
        resources: MockEqualResources,
      } as BarChartProps);
      expect(
        rendered.queryByTestId('bar-chart-stepper'),
      ).not.toBeInTheDocument();
      expect(
        rendered.queryByTestId('bar-chart-stepper-button-back'),
      ).not.toBeInTheDocument();
      expect(
        rendered.queryByTestId('bar-chart-stepper-button-next'),
      ).not.toBeInTheDocument();
    });

    it('should display the correct resources while scrolling', async () => {
      const rendered = await renderWithProps({
        displayAmount: 7,
      } as BarChartProps);

      const sortedByCost = MockResources.sort(resourceSort);

      sortedByCost.slice(0, 7).forEach(resource => {
        expect(rendered.getByText(resource.name!)).toBeInTheDocument();
      });

      fireEvent.mouseEnter(rendered.getByTestId('bar-chart-wrapper'));
      fireEvent.click(rendered.getByTestId('bar-chart-stepper-button-next'));

      sortedByCost.slice(7, 12).forEach(resource => {
        expect(rendered.getByText(resource.name!)).toBeInTheDocument();
      });
    });

    it('should display the correct amount of dots for a large amount of resources while scrolling', async () => {
      const MockLargeEntities = [...Array(68)].map(createMockEntity);
      const MockLargeResources = MockLargeEntities.map(entity => ({
        name: entity.id,
        previous: entity.aggregation[0],
        current: entity.aggregation[1],
      }));
      const rendered = await renderWithProps({
        resources: MockLargeResources,
      } as BarChartProps);

      fireEvent.mouseEnter(rendered.getByTestId('bar-chart-wrapper'));

      const NextButton = rendered.getByTestId('bar-chart-stepper-button-next');

      [...Array(9)].forEach(() => {
        fireEvent.click(NextButton);
        expect(rendered.queryAllByTestId('bar-chart-step').length).toEqual(10);
      });

      [...Array(2)].forEach(() => {
        fireEvent.click(NextButton);
        expect(rendered.queryAllByTestId('bar-chart-step').length).toEqual(2);
      });
    });
  });
});
