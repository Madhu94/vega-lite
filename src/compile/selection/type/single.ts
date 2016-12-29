import {SelectionSpec, SelectionComponent, SelectionNames} from '../../../selection';
import {UnitModel} from '../../unit';
import {SelectionCompiler} from './';
import {defaultValue} from '../';
import {stringValue} from '../../../util';

const singleCompiler:SelectionCompiler = {
  predicate: 'inPointSelection',

  parseUnitSelection: function(model: UnitModel, def: SelectionSpec) {
    return {
      events: defaultValue(def.on, 'click'),
      project: defaultValue(def.project, {fields: ['_id']})
    };
  },

  assembleUnitSignals: function(model: UnitModel, sel: SelectionComponent) {
    let proj = sel.project;
    return [{
      name: sel.name,
      value: {},
      on: [{
        events: sel.events,
        update: '{fields: [' +
          proj.map((p: any) => stringValue(p.field)).join(', ') +
          '], values: [' +
          proj.map((p: any) => 'datum[' + stringValue(p.field) + ']').join(', ') +
          ']}'
      }]
    }];
  },

  tupleExpression: function(model: UnitModel, sel: SelectionComponent) {
    let name = sel.name;
    return 'fields: ' + name + '.fields, values: ' + name + '.values';
  },

  modifyExpression: function(model: UnitModel, sel: SelectionComponent) {
    return sel.name + SelectionNames.TUPLE + ', true';
  },

  assembleUnitMarks: function() { return arguments[arguments.length-1]; }
};

export {singleCompiler as default};
