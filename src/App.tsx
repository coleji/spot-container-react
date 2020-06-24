import * as React from 'react';
import { render } from 'react-dom';

import SpotContainer, { PlayMode } from './SpotContainer';

type BindgenAsFunction = (fileName: string) => Promise<BindgenAsContainer>
type BindgenAsContainer = {
	calc_next_move: (board_string: string) => string,
	invert_player: (player_string: string) => string,
	new_board: (edge_size: number) => string
}

declare const wasm_bindgen: BindgenAsFunction & BindgenAsContainer;

wasm_bindgen("./spot_rust_bg.wasm").then(wasmResult => {
	render(<SpotContainer edgeSize={6} playMode={PlayMode.SP} />, document.getElementById('main'));
});

export function getWasmBindgen() {
	return wasm_bindgen;
}