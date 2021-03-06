import {assert} from 'chai';
import {FacetNode} from '../../../src/compile/data/facet';
import {VgData} from '../../../src/vega.schema';
import {parseFacetModel, parseFacetModelWithScale} from '../../util';

describe('compile/data/facet', function() {
  describe('assemble', () => {
    it('should calculate column distinct if child has an independent discrete scale with step', () => {
      const model = parseFacetModelWithScale({
        '$schema': 'https://vega.github.io/schema/vega-lite/v2.json',
        'description': 'A trellis bar chart showing the US population distribution of age groups and gender in 2000.',
        'data': {'url': 'data/population.json'},
        'facet': {'column': {'field': 'gender', 'type': 'nominal'}},
        'spec': {
          'mark': 'bar',
          'encoding': {
            'y': {
              'aggregate': 'sum', 'field': 'people', 'type': 'quantitative',
              'axis': {'title': 'population'}
            },
            'x': {
              'field': 'age', 'type': 'ordinal',
              'scale': {'rangeStep': 17}
            },
            'color': {
              'field': 'gender', 'type': 'nominal',
              'scale': {'range': ['#EA98D2','#659CCA']}
            }
          }
        },
        'resolve': {
          'x': {'scale': 'independent'}
        },
        'config': {'cell': {'fill': 'yellow'}}
      });

      const node = new FacetNode(model, 'facetName', 'dataName');
      const data = node.assemble();

      assert.deepEqual(data[0], {
        name: 'column',
        source: 'dataName',
        transform:[{
          type: 'aggregate',
          groupby: ['gender'],
          fields: ['age'],
          ops: ['distinct']
        }]
      });
    });

    it('should calculate column and row distinct if child has an independent discrete scale with step and the facet has both row and column', () => {
      const model = parseFacetModelWithScale({
        '$schema': 'https://vega.github.io/schema/vega-lite/v2.json',
        'data': {'values': [
          {'r': 'r1', 'c': 'c1', 'a': 'a1', 'b': 'b1'},
          {'r': 'r1', 'c': 'c1', 'a': 'a2', 'b': 'b2'},
          {'r': 'r2', 'c': 'c2', 'a': 'a1', 'b': 'b1'},
          {'r': 'r3', 'c': 'c2', 'a': 'a3', 'b': 'b2'}
        ]},
        'facet': {
          'row': {'field': 'r', 'type': 'nominal'},
          'column': {'field': 'c', 'type': 'nominal'}
        },
        'spec': {
          'mark': 'rect',
          'encoding': {
            'y': {'field': 'b', 'type': 'nominal'},
            'x': {'field': 'a', 'type': 'nominal'}
          }
        },
        'resolve': {
          'x': {
            'scale': 'independent'
          },
          'y': {
            'scale': 'independent'
          }
        }
      });

      const node = new FacetNode(model, 'facetName', 'dataName');
      const data = node.assemble();

      // crossed data
      assert.deepEqual(data[0], {
        name: 'cross_column_row',
        source: 'dataName',
        transform:[{
          type: 'aggregate',
          groupby: ['c', 'r'],
          fields: ['a', 'b'],
          ops: ['distinct', 'distinct']
        }]
      });

      assert.deepEqual(data[1], {
        name: 'column',
        source: 'cross_column_row',
        transform:[{
          type: 'aggregate',
          groupby: ['c'],
          fields: ['distinct_a'],
          ops: ['max'],
          as: ['distinct_a']
        }]
      });

      assert.deepEqual(data[3], {
        name: 'row',
        source: 'cross_column_row',
        transform:[{
          type: 'aggregate',
          groupby: ['r'],
          fields: ['distinct_b'],
          ops: ['max'],
          as: ['distinct_b']
        }]
      });
    });
  });
});
