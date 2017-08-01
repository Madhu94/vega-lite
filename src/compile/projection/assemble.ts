import {VgProjection} from '../../vega.schema';
import {FacetModel} from '../facet';
import {Model, ModelWithField} from '../model';
import {UnitModel} from '../unit';

export function assembleProjections(model: Model): VgProjection[] {
  if (model instanceof UnitModel || model instanceof FacetModel) {
    return [assembleProjection(model)];
  } else {
    return model.children.reduce((projections, child) => {
      return projections.concat(assembleProjections(child));
    }, []);
  }
}

export function assembleProjection(model: ModelWithField): VgProjection {
  const component = model.component.projection[0];
  return {
    name: component.name,
    fit: {
      signal: `data('${component.data}')`
    },
    size: {
      signal: `'${[component.size.toString()]}'`
    },
    ...component.projection
  };
}
