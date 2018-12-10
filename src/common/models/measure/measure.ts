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

import { BaseImmutable, Property } from "immutable-class";
import { $, ApplyExpression, AttributeInfo, CountDistinctExpression, deduplicateSort, Expression, QuantileExpression, RefExpression } from "plywood";
import { formatFnFactory } from "../../utils/formatter/formatter";
import { makeTitle, makeUrlSafeName, verifyUrlSafeName } from "../../utils/general/general";
import { DataSeries } from "../data-series/data-series";
import { MeasureOrGroupVisitor } from "./measure-group";

export interface MeasureValue {
  name: string;
  title?: string;
  units?: string;
  formula?: string;
  format?: string;
  transformation?: string;
  description?: string;
  lowerIsBetter?: boolean;
}

export interface MeasureJS {
  name: string;
  title?: string;
  units?: string;
  formula?: string;
  format?: string;
  transformation?: string;
  description?: string;
  lowerIsBetter?: boolean;
}

export class Measure extends BaseImmutable<MeasureValue, MeasureJS> {
  static DEFAULT_FORMAT = "0,0.0 a";

  static isMeasure(candidate: any): candidate is Measure {
    return candidate instanceof Measure;
  }

  static getReferences(ex: Expression): string[] {
    let references: string[] = [];
    ex.forEach((sub: Expression) => {
      if (sub instanceof RefExpression && sub.name !== "main") {
        references = references.concat(sub.name);
      }
    });
    return deduplicateSort(references);
  }

  /**
   * Look for all instances of countDistinct($blah) and return the blahs
   * @param ex
   * @returns {string[]}
   */
  static getCountDistinctReferences(ex: Expression): string[] {
    let references: string[] = [];
    ex.forEach((ex: Expression) => {
      if (ex instanceof CountDistinctExpression) {
        references = references.concat(this.getReferences(ex));
      }
    });
    return deduplicateSort(references);
  }

  static measuresFromAttributeInfo(attribute: AttributeInfo): Measure[] {
    const { name, nativeType } = attribute;
    const $main = $("main");
    const ref = $(name);

    if (nativeType) {
      if (nativeType === "hyperUnique" || nativeType === "thetaSketch") {
        return [
          new Measure({
            name: makeUrlSafeName(name),
            formula: $main.countDistinct(ref).toString()
          })
        ];
      } else if (nativeType === "approximateHistogram") {
        return [
          new Measure({
            name: makeUrlSafeName(name + "_p98"),
            formula: $main.quantile(ref, 0.98).toString()
          })
        ];
      }
    }

    let expression: Expression = $main.sum(ref);
    const makerAction = attribute.maker;
    if (makerAction) {
      switch (makerAction.op) {
        case "min":
          expression = $main.min(ref);
          break;

        case "max":
          expression = $main.max(ref);
          break;

        // default: // sum, count
      }
    }

    return [new Measure({
      name: makeUrlSafeName(name),
      formula: expression.toString()
    })];
  }

  static fromJS(parameters: MeasureJS): Measure {
    // Back compat
    if (!parameters.formula) {
      let parameterExpression = (parameters as any).expression;
      parameters.formula = (typeof parameterExpression === "string" ? parameterExpression : $("main").sum($(parameters.name)).toString());
    }
    if (parameters.transformation) {
      console.warn("Transformations are no longer supported for measures. This functionality is covered by SeriesDefinition.");
      return null;
    }

    return new Measure(BaseImmutable.jsToValue(Measure.PROPERTIES, parameters));
  }

  static PROPERTIES: Property[] = [
    { name: "name", validate: verifyUrlSafeName },
    { name: "title", defaultValue: null },
    { name: "units", defaultValue: null },
    { name: "lowerIsBetter", defaultValue: false },
    { name: "formula" },
    { name: "description", defaultValue: undefined },
    { name: "format", defaultValue: Measure.DEFAULT_FORMAT }
  ];

  public name: string;
  public title: string;
  public description?: string;
  public units: string;
  public formula: string;
  public expression: Expression;
  public format: string;
  public formatFn: (n: number) => string;
  public lowerIsBetter: boolean;
  public readonly type = "measure";

  constructor(parameters: MeasureValue) {
    super(parameters);

    this.title = this.title || makeTitle(this.name);
    this.expression = Expression.parse(this.formula);
    this.formatFn = formatFnFactory(this.getFormat());
  }

  accept<R>(visitor: MeasureOrGroupVisitor<R>): R {
    return visitor.visitMeasure(this);
  }

  equals(other: any): boolean {
    return this === other || Measure.isMeasure(other) && super.equals(other);
  }

  public getTitleWithUnits(): string {
    if (this.units) {
      return `${this.title} (${this.units})`;
    } else {
      return this.title;
    }
  }

  public isApproximate(): boolean {
    // Expression.some is bugged
    let isApproximate = false;
    this.expression.forEach((exp: Expression) => {
      if (exp instanceof CountDistinctExpression || exp instanceof QuantileExpression) {
        isApproximate = true;
      }
    });
    return isApproximate;
  }

  // Default getter from ImmutableValue
  public getFormat: () => string;

  public toApplyExpression(nestingLevel: number): ApplyExpression {
    return new DataSeries({ measure: this }).toExpression(nestingLevel);
  }
}

BaseImmutable.finalize(Measure);
