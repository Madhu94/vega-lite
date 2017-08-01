import {SHAPE, X, Y} from '../../channel';
import {Config} from '../../config';
import {MAIN} from '../../data';
import {isProjectionFieldDef} from '../../fielddef';
import {GEOSHAPE} from '../../mark';
import {Projection, PROJECTION_PROPERTIES} from '../../projection';
import {contains, every} from '../../util';
import {VgProjection} from '../../vega.schema';
import {Model} from '../model';
import {UnitModel} from '../unit';
import {ProjectionComponent} from './component';

export function parseProjection(model: Model) {
  if (model instanceof UnitModel) {
    model.component.projection = parseUnitProjection(model);
  } else {
    // because parse happens from leaves up (unit specs before layer spec),
    // we can be sure that the above if statement has already occured
    // and therefore we have access to child.component.projection
    // for each of model's children
    model.component.projection = parseNonUnitProjections(model);
  }
}

function parseUnitProjection(model: UnitModel): ProjectionComponent {
  const {projection, markDef, config, encoding} = model;

  // TODO: make sure this actually works for both kinds of lookups,
  // with GeoJSON transform, and with basic projection
    const data = model.requestDataName(MAIN);

    const width = model.getSizeSignalRef('width');
    const height = model.getSizeSignalRef('height');
    const size = [width.signal, height.signal];

    const isGeoshapeMark = markDef && markDef.type === GEOSHAPE;
    const hasImplicitProjection = encoding && [X, Y, SHAPE].some(
      (channel) => isProjectionFieldDef(encoding[channel])
    );
    const inheritedProjection = config.projection;

    if (model.projection || (config.projection && (isGeoshapeMark || hasImplicitProjection))) {
      return new ProjectionComponent(model.getName('projection'), {
        ...(config.projection || {}),
        ...(projection || {}),
      } as Projection, size, data);
  }

  return undefined;
}

function parseNonUnitProjections(model: Model): ProjectionComponent {
  if (model.children.length === 0) {
    return undefined;
  }

  let projection: ProjectionComponent;
  const mergable = every(model.children, (child) => {
    if (child.component.projection && !projection) {
      projection = child.component.projection;
      return true;
    } else if (!child.component.projection) {
      return true;
    } else {
      return every(PROJECTION_PROPERTIES, (prop) => {
        // easily equal or empty
        if (projection.explicit === child.component.projection.explicit ||
          projection.explicit === {} ||
          child.component.projection.explicit === {}) {
          return true;
        }
        // neither has the poperty
        if (!projection.explicit.hasOwnProperty(prop) &&
          !child.component.projection.explicit.hasOwnProperty(prop)) {
          return true;
        }
        // both have property and an equal value for property
        if (projection.explicit.hasOwnProperty(prop) &&
          child.component.projection.explicit.hasOwnProperty(prop) &&
          JSON.stringify(projection[prop]) === JSON.stringify(child[prop])) {
          return true;
        }
        return false;
      });
    }
  });
  if (!projection) {
    return undefined;
  }

  if (mergable) {
    model.children.forEach((child) => {
      child.component.projection.merged = true;
      child.renameProjection(child.component.projection.get('name'), projection.get('name'));
    });
    return projection;
  }

  return undefined;
}
