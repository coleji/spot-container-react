import * as React from 'react';
import { render } from 'react-dom';

import SpotContainer, { PlayMode } from './SpotContainer';

render(<SpotContainer edgeSize={7} playMode={PlayMode.SP}/>, document.getElementById('main'));