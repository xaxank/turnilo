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
import { JSXNode } from "../../utils/dom/dom";
import { BodyPortal } from "../body-portal/body-portal";
import { BubbleTitle } from "../bubble-title/bubble-title";
import { Shpitz } from "../shpitz/shpitz";
import "./segment-bubble.scss";

const OFFSET_V = -10;

export interface SegmentBubbleProps {
  left: number;
  top: number;
  title: string;
  content?: JSXNode;
}

export const SegmentBubble: React.SFC<SegmentBubbleProps> = (props: SegmentBubbleProps) => {
  const { left, top, title, content } = props;
  return <BodyPortal left={left} top={top + OFFSET_V}>
    <div className="segment-bubble">
      <div className="text">
        <BubbleTitle title={title} />
        {content ? <div className="content">{content}</div> : null}
      </div>
      <Shpitz direction="up" />
    </div>
  </BodyPortal>;
};
