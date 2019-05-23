import * as React from 'react';
import { Option, some, none } from "fp-ts/lib/Option"

declare const wasm_bindgen: any;

wasm_bindgen("./spot_rust_bg.wasm")

enum Player {
	P1 = 1,
	P2 = 2,
	NoOne = 0
}

function invertPlayer(p: Player): Player {
	switch(p){
	case Player.P1:
		return Player.P2
	case Player.P2:
		return Player.P1
	case Player.NoOne:
		return Player.NoOne
	}
}

export enum PlayMode {
	SP,
	MP
}

interface Props {
	edgeSize: number,
	playMode: PlayMode
}

function getColor(player: Player, isHighlighted: boolean) {
	switch (player) {
		case Player.NoOne:
			return "white";
		case Player.P1:
			return isHighlighted ? "#128ced" : "#0c5a99";
		case Player.P2:
			return isHighlighted ? "#d41a3e" : "#8c1129";
	}
}

function playerForStartingBoard(edgeSize: number, row: number, col: number) {
	const topLeft = Player.P1
	const topRight = Player.P2
	if (row == 0) {
		if (col == 0) return topLeft
		else if (col == edgeSize-1) return topRight
		else return Player.NoOne
	} else if (row == edgeSize-1) {
		if (col == 0) return topRight
		else if (col == edgeSize-1) return topLeft
		else return Player.NoOne
	} else return Player.NoOne
}

const WHO_GOES_FIRST = Player.P1

const hi = wasm_bindgen.hello_world("jon")
console.log(hi)

export default class SpotContainer extends React.Component<Props> {
	state: {
		board: Player[][],
		highlightedRow: Option<number>,
		highlightedCol: Option<number>,
		turn: Player
	}
	constructor(props: Props) {
		super(props)
		let board: Player[][] = []
		for (let i = 0; i < props.edgeSize; i++) {
			let row: Player[] = []
			for (let j = 0; j < props.edgeSize; j++) {
				row.push(playerForStartingBoard(props.edgeSize, i, j))
			}
			board.push(row)
		}
		console.log(board)
		this.state = {
			board,
			highlightedRow: none,
			highlightedCol: none,
			turn: WHO_GOES_FIRST
		}
	}
	highlight(row: number, col: number) {
		console.log("highlight!")
		this.setState({
			...this.state,
			highlightedRow: some(row),
			highlightedCol: some(col)
		})
	}
	unhighlight() {
		console.log("unhighlight!")
		this.setState({
			...this.state,
			highlightedRow: none,
			highlightedCol: none
		})
	}
	callAI() {
		
	}
	take(takeRow: number, takeCol: number) {
		// First take the one square...
		const afterTake = this.state.board.map((cols, row) => cols.map((p, col) => {
			if (row == takeRow && col == takeCol) return this.state.turn
			else return this.state.board[row][col]
		}))
		// then wololo its neighbors
		const afterWololo = SpotContainer.doWololo(afterTake, takeRow, takeCol)
		this.setState({
			...this.state,
			board: afterWololo,
			turn: invertPlayer(this.state.turn),
			highlightedRow: none,
			highlightedCol: none
		})
	}
	jump(jumpRow: number, jumpCol: number) {
		// First take the one square...
		const afterJump = this.state.board.map((cols, row) => cols.map((p, col) => {
			if (row == jumpRow && col == jumpCol) return this.state.turn
			else if (row == this.state.highlightedRow.getOrElse(null) && col == this.state.highlightedCol.getOrElse(null)) return Player.NoOne
			else return this.state.board[row][col]
		}))
		// then wololo its neighbors
		const afterWololo = SpotContainer.doWololo(afterJump, jumpRow, jumpCol)
		this.setState({
			...this.state,
			board: afterWololo,
			turn: invertPlayer(this.state.turn),
			highlightedRow: none,
			highlightedCol: none
		})
	}
	// Given a board and a square that was just moved into, convert all the squares around it to its color
	static doWololo(start: Player[][], startRow: number, startCol: number): Player[][] {
		const movedPlayer = start[startRow][startCol]
		return start.map((cols, row) => cols.map((p, col)  => {
			if (Math.abs(row - startRow) <= 1 && Math.abs(col - startCol) <= 1 && start[row][col] == invertPlayer(movedPlayer)) return movedPlayer;
			else return start[row][col]
		}))
	}
	static inTakeRange(fromRow: number, fromCol: number, toRow: number, toCol: number) {
		const rowDelta = Math.abs(toRow - fromRow)
		const colDelta = Math.abs(toCol - fromCol)
		return rowDelta <= 1 && colDelta <= 1
	}
	static inJumpRange(fromRow: number, fromCol: number, toRow: number, toCol: number) {
		const rowDelta = Math.abs(toRow - fromRow)
		const colDelta = Math.abs(toCol - fromCol)
		return (
			(rowDelta == 2 && colDelta <= 2) || 
			(colDelta == 2 && rowDelta <= 2)
		)
	}
	getOnClick(row: number, col: number): () => void {
		// single player: no clicking on opp's turn
		if (this.props.playMode == PlayMode.SP && this.state.turn == Player.P2) return () => {}

		const self = this
		enum OwnerRole {
			Me = "Me",
			Opp = "Opp",
			NoOne = "NoOne"
		}
		
		const realOwner = this.state.board[row][col]
		
		const owner = (function() {
			if (realOwner == Player.NoOne) return OwnerRole.NoOne
			else if (realOwner == self.state.turn) return OwnerRole.Me
			else return OwnerRole.Opp
		}());
		console.log(realOwner + " -> " + owner)

		switch (owner) {
		case OwnerRole.Opp:
			return () => {
				console.log("opp owns that...")
			};
		case OwnerRole.Me:
			if (this.state.highlightedRow.getOrElse(null) == row && this.state.highlightedCol.getOrElse(null) == col) return () => this.unhighlight()
			else return () => {
				console.log("clicked row=" + row + "  col=" + col)
				this.highlight(row, col)
			}
		case OwnerRole.NoOne:
			return () => {
				if (this.state.highlightedRow.isNone() || this.state.highlightedCol.isNone()) return;
				else {
					const highlightedRow = this.state.highlightedRow.getOrElse(null);
					const highlightedCol = this.state.highlightedCol.getOrElse(null)
					if (SpotContainer.inTakeRange(highlightedRow, highlightedCol, row, col)) {
						console.log("can take!")
						this.take(row, col)
					} else if (SpotContainer.inJumpRange(highlightedRow, highlightedCol, row, col)) {
						console.log("can jump!")
						this.jump(row, col)
					} else {
						console.log("cant move there....")
					}
				}
			}
		}
	}
	render() {
		this.callAI()
		const self = this
		const rows = this.state.board.map((cols, row) => (
			<tr key={row}>
				{cols.map((cell, col) => {
					const color = getColor(cell, self.state.highlightedRow.getOrElse(-1) == row && self.state.highlightedCol.getOrElse(-1) == col)
					return (<td
						key={`${col},${row}`}
						style={({ height: "60px", width: "60px", border: "1px solid black", backgroundColor: color })}
						onClick={this.getOnClick(row, col)}
					></td>);
				})}
			</tr>
		));

		return (
			<div>
				<table cellPadding="5"><tbody>
					{rows}
				</tbody></table>
			</div>
		)
	}
}