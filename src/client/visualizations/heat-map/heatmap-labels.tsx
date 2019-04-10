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

interface Props {
  labels: string[];
  type: "top" | "left";
  hoveredLabel: number;
}

export class HeatmapLabels extends React.Component<Props> {
  render() {
    const { labels, type, hoveredLabel } = this.props;

    return (
      <div className={`${type}-labels`}>
        {labels.map((label, index) => <span key={label} className={hoveredLabel === index ? "heatmap-label-hovered" : ""}><span>{label}</span></span>)}
      </div>
    );
  }
}