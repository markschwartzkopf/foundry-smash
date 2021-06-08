'use strict';

import { NodeCG } from '../../../../types/server';
import * as nodecgApiContext from './nodecg-api-context';

module.exports = function (nodecg: NodeCG) {
	nodecgApiContext.set(nodecg);
	nodecg.log.info('Code me');
};
