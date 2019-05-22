import * as React from 'react';
import {Option, some, none} from "fp-ts/lib/Option"

enum Player {
    P1 = 1,
    P2 = 2,
    NoOne = 0
}

interface Cell {
    player: Player
}

interface Props {
    edgeSize: number
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

export default class SpotContainer extends React.Component<Props> {
    state: {
        board: Cell[][],
        highlightedX: Option<number>,
        highlightedY: Option<number>
    }
    constructor(props: Props) {
        super(props)
        let board: Cell[][] = []
        for (let i=0; i<props.edgeSize; i++) {
            let row: Cell[] = []
            for (let j=0; j<props.edgeSize; j++) {
                row.push({player: Player.NoOne})
            }
            board.push(row)
        }
        this.state = {
            board,
            highlightedX: none,
            highlightedY: none
        }
    }
    render() {
		const self = this
        return (
            <div>
                <table cellPadding="5"><tbody>
                    {this.state.board.map((row, y) => (
                        <tr key={y}>
                            {row.map((cell, x) => {
								const color = getColor(cell.player, self.state.highlightedX.getOrElse(-1) == x && self.state.highlightedY.getOrElse(-1) == y)
								return <td key={`${x},${y}`} style={({height: "60px", width: "60px", border: "1px solid black", backgroundColor: color})}></td>
                            })}
                        </tr>
                    ))}
                </tbody></table>
            </div>
        )
    }
}

/*
div(contents=VNodeContents(
    table(props=Map("cellpadding" -> "5"), contents=tbody(contents=
      VNodeContents(model.board.map(row => tr(
        VNodeContents(row.map(c => {
          val color = c.owner match {
            case NoOwner => "white"
            case P1 => if (model.highlighted.isDefined && model.highlighted.get == c) "#128ced" else "#0c5a99"
            case P2 => if (model.highlighted.isDefined && model.highlighted.get == c) "#d41a3e" else "#8c1129"
          }
          val events: Map[String, js.Any] = c.owner match {
            case NoOwner => {
              if (model.highlighted.isDefined && model.turn == model.highlighted.get.owner) Map("click" -> (() => Move(this)(model)(c)))
              else Map.empty
            }
            case P1 => {
              if (model.turn == P1) Map("click" -> (() => Highlight(this)(model)(c)))
              else Map.empty
            }
            case P2 => {
              Map.empty
            }
          }
          td(
            events=events,
            style=Map("height" -> "60px", "width" -> "60px", "border" -> "1px solid black", "background-color" -> color)
          ): VNodeContents[_]
        }))
      ): VNodeContents[_]))
    )),
    span(contents=(if (model.turn == P1) "P1" else "P2")),
    script(props=Map("src" -> "spot_rust.js")),
    script(props=Map("src" -> "spot-caller.js"))
  ))
  */