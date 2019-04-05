
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

import * as React from "react";

export class HoveredHeatmapRectangle {
  private callbacks: { [index: string]: { start(): void, end(): void } } = {};
  private lastNotifiedRectangleIndex: string | null = null;

  onRectangleHover(row: number, column: number, callbacks: { start(): void, end(): void }) {
    this.callbacks[`${row}-${column}`] = callbacks;
  }

  setHoveredRectangle(row: number, column: number) {
    this.clearHoveredRectangle();

    this.callbacks[`${row}-${column}`].start();
    this.lastNotifiedRectangleIndex = `${row}-${column}`;
  }

  clearHoveredRectangle() {
    if (this.lastNotifiedRectangleIndex) {
      this.callbacks[this.lastNotifiedRectangleIndex].end();
    }
  }
}

interface Props {
  row?: number;
  column?: number;
  hoveredRectangle: HoveredHeatmapRectangle;
  component(isHovered?: boolean): React.ReactNode;
}

