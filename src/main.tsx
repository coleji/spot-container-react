import { createRoot } from 'react-dom/client'

import SpotContainer, { PlayMode } from './SpotContainer';

type BindgenAsFunction = (fileName: string) => Promise<BindgenAsContainer>
type BindgenAsContainer = {
	calc_next_move: (board_string: string) => string,
	invert_player: (player_string: string) => string,
	new_board: (edge_size: number) => string
}

declare const wasm_bindgen: BindgenAsFunction & BindgenAsContainer;

wasm_bindgen("./spot_rust_bg.wasm").then(() => {
	createRoot(document.getElementById('root')!).render(<SpotContainer edgeSize={6} playMode={PlayMode.SP} />);
});


export function getWasmBindgen() {
	return wasm_bindgen;
}
