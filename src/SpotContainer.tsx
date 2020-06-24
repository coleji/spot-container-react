import * as React from 'react';
import { Option, some, none } from "fp-ts/lib/Option"
import { getWasmBindgen } from './App';

enum Player {
	P1 = 1,
	P2 = 2,
	NoOne = 0
}

const WHO_GOES_FIRST = Player.P1

function parsePlayer(s: string): Player {
	if (s == Player.P1.toString()) return Player.P1;
	else if (s == Player.P2.toString()) return Player.P2;
	else return Player.NoOne;
}

export enum PlayMode {
	SP,
	MP
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

function parseBoard(boardString: string): Player[][] {
	const rows = boardString.split(":")
	return rows.map(row => row.split("").map(parsePlayer))
}

interface Props {
	edgeSize: number,
	playMode: PlayMode
}

type State = {
	board: Player[][],
	highlightedRow: Option<number>,
	highlightedCol: Option<number>,
	turn: Player
}

export default class SpotContainer extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			board: parseBoard(getWasmBindgen().new_board(props.edgeSize)),
			highlightedRow: none,
			highlightedCol: none,
			turn: WHO_GOES_FIRST
		}
	}
	toString() {
		return this.state.board.map(rows => rows.join("")).join(":")
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
		const self = this
		const aiMove = getWasmBindgen().calc_next_move(this.toString())
		const regex = /(\d),(\d)>(\d),(\d)/
		const [dontCare, fromRow, fromCol, toRow, toCol] = regex.exec(aiMove).map(Number)
		const newBoard = (function() {
			if (SpotContainer.inTakeRange(fromRow, fromCol, toRow, toCol)) {
				return SpotContainer.take(self.state.board, fromRow, fromCol, toRow, toCol)
			} else {
				return SpotContainer.jump(self.state.board, fromRow, fromCol, toRow, toCol)
			}
		}());
		this.setState({
			board: newBoard,
			turn: SpotContainer.invertPlayer(this.state.turn),
			highlightedRow: none,
			highlightedCol: none
		})
	}
	static invertPlayer(p: Player): Player {
		return parsePlayer(getWasmBindgen().invert_player(p.toString()));
	}
	static take(board: Player[][], fromRow: number, fromCol: number, takeRow: number, takeCol: number): Player[][] {
		// First take the one square...
		const movingPlayer = board[fromRow][fromCol]
		const afterTake = board.map((cols, row) => cols.map((p, col) => {
			if (row == takeRow && col == takeCol) return movingPlayer
			else return board[row][col]
		}))
		// then wololo its neighbors
		return SpotContainer.doWololo(afterTake, takeRow, takeCol)
	}
	static jump(board: Player[][], fromRow: number, fromCol: number, jumpRow: number, jumpCol: number) {
		// First take the one square...
		const movingPlayer = board[fromRow][fromCol]
		const afterJump = board.map((cols, row) => cols.map((p, col) => {
			if (row == jumpRow && col == jumpCol) return movingPlayer
			else if (row == fromRow && col == fromCol) return Player.NoOne
			else return board[row][col]
		}))
		// then wololo its neighbors
		return SpotContainer.doWololo(afterJump, jumpRow, jumpCol)
	}
	// Given a board and a square that was just moved into, convert all the squares around it to its color
	static doWololo(start: Player[][], startRow: number, startCol: number): Player[][] {
		const movedPlayer = start[startRow][startCol]
		return start.map((cols, row) => cols.map((p, col)  => {
			if (Math.abs(row - startRow) <= 1 && Math.abs(col - startCol) <= 1 && start[row][col] == SpotContainer.invertPlayer(movedPlayer)) return movedPlayer;
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
						this.setState({
							...this.state,
							board: SpotContainer.take(this.state.board, this.state.highlightedRow.getOrElse(null), this.state.highlightedCol.getOrElse(null), row, col),
							turn: SpotContainer.invertPlayer(this.state.turn),
							highlightedRow: none,
							highlightedCol: none
						})
						if (this.props.playMode == PlayMode.SP) window.setTimeout(() => this.callAI(), 200)
					} else if (SpotContainer.inJumpRange(highlightedRow, highlightedCol, row, col)) {
						console.log("can jump!")
						this.setState({
							...this.state,
							board: SpotContainer.jump(this.state.board, this.state.highlightedRow.getOrElse(null), this.state.highlightedCol.getOrElse(null), row, col),
							turn: SpotContainer.invertPlayer(this.state.turn),
							highlightedRow: none,
							highlightedCol: none
						})
						if (this.props.playMode == PlayMode.SP) window.setTimeout(() => this.callAI(), 200)
					} else {
						console.log("cant move there....")
					}
				}
			}
		}
	}
	render() {
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