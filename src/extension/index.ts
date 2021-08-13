import { NodeCG } from '../../../../types/server';
import * as nodecgApiContext from './nodecg-api-context';

module.exports = function (nodecg: NodeCG) {
	nodecgApiContext.set(nodecg);
  require('./init');
  require('./obs');
  require('./bracket');
  require('./x32');
};
