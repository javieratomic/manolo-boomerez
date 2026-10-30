// Ejecuta los tests en Node 18+ (opcional): node tests/run-node.mjs
import { run } from './runner.js';
import './sim.test.js';
import './expansion.test.js';
import './empire.test.js';
import './synergies.test.js';
import './construction.test.js';
import './local-events.test.js';
import './marketing.test.js';
import './online.test.js';
import './navigation.test.js';
import './operations.test.js';
import './portfolio.test.js';
import './stress.test.js';
import './divestment.test.js';
import './opportunities.test.js';
import './opening-stress.test.js';
import './europe-review.test.js';

const { failures } = await run((line) => console.log(line));
process.exit(failures.length ? 1 : 0);
