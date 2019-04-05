/*
 * Copyright 2015-2016 Imply Data, Inc.
 * Copyright 2017-2018 Allegro.pl
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

import { HeatmapRect } from "@vx/heatmap";
import { scaleLinear } from "@vx/scale";
import { Dataset, Datum } from "plywood";
import * as React from "react";
import { SPLIT } from "../../config/constants";
import { MousePosition } from "../../utils/mouse-position/mouse-position";
import { HeatMapRectangle } from "./heatmap-rectangle";

const white = "#fff";
const orange = "#ff5a00";

// utils
const max = (data: any, value = (d: any) => d) => Math.max(...data.map(value));

// accessors
const bins = (d: Datum) => (d[SPLIT] as Dataset).data;

export interface RectangleData {
  xLabel: string;
  yLabel: string;
  datum: Datum;
}

interface Props {
  dataset: Datum[];
  tileSize?: number;
  measureName: string;
  leftLabelName: string;
  topLabelName: string;
  mouseHoverCoordinates?: MousePosition;
  onHover?: (data: RectangleData) => void;
  onHoverStop?: () => void;
}

export class HeatMapRectangles extends React.Component<Props> {
  private rect: SVGRectElement | null = null;
  private subscription: { unsubscribe(): void } = { unsubscribe() {} };

  componentDidMount() {
    const {
      onHoverStop = () => {},
      onHover = () => {},
      leftLabelName,
      topLabelName
    } = this.props;

    const {
      dataset,
      xScale,
      yScale,
      count
    } = this.setup();

    this.subscription = this.props.mouseHoverCoordinates.onChange(({ x, y }) => {
      if (!this.rect) {
        return;
      }
      const { top, bottom, left, right } = this.rect.getBoundingClientRect();

      if ((y < top || y > bottom) || (x < left || x > right)) {
        onHoverStop();
        return;
      }

      const xPosition = Math.floor(xScale.invert(x - left));
      const yPosition = Math.floor(yScale.invert(y - top));

      const hoveredBins = dataset[yPosition];
      const hoveredBin = bins(hoveredBins)[xPosition];

      onHover({
        datum: hoveredBin,
        xLabel: hoveredBins[leftLabelName] as string,
        yLabel: hoveredBin[topLabelName] as string
      });
    });
  }

  private setup() {
    const { tileSize = 25, dataset, measureName } = this.props;
    const count = (d: Datum) => d[measureName];

    const colorMax = max(dataset, d => max(bins(d), count));
    const bucketSizeMax = max(dataset, d => bins(d).length);
    const dataLength = dataset.length;

    const width = bucketSizeMax * tileSize;
    const height = dataLength * tileSize;

    // scales
    const xScale = scaleLinear({
      domain: [0, bucketSizeMax]
    });
    xScale.range([0, width]);

    const yScale = scaleLinear({
      domain: [dataLength, 0]
    });
    yScale.range([height, 0]);

    const rectColorScale = scaleLinear({
      range: [white, orange],
      domain: [0, colorMax]
    });

    return {
      width,
      height,
      count,
      dataset,
      xScale,
      yScale,
      rectColorScale,
      tileSize
    };
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    const {
      width,
      height,
      count,
      dataset,
      xScale,
      yScale,
      rectColorScale,
      tileSize
    } = this.setup();

    return (
      <div>
        <svg width={width} height={height}>
          <rect ref={rect => this.rect = rect} x={0} y={0} width={width} height={height} fill={white} />
            <HeatmapRect
              bins={bins}
              count={count}
              data={dataset}
              xScale={xScale}
              yScale={yScale}
              colorScale={rectColorScale}
              binWidth={tileSize}
              binHeight={tileSize}
              gap={2}
            >
              {(heatmap: any) => {
                return heatmap.map((bins: any) => {
                  return bins.map((bin: any) => {
                    return (
                      <HeatMapRectangle key={`heatmap-rect-${bin.row}-${bin.column}`} bin={bin} />
                    );
                  });
                });
              }}
            </HeatmapRect>
        </svg>
      </div>
    );
  }
}
