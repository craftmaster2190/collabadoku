import React, {useEffect, useState} from "react";
import './Sudoku.css';
import {css, cx} from "@emotion/css";
import {Observable} from "rxjs";


interface SudokuGridHolder {
    grid: SudokuCellDetails[][]
}

interface SudokuCellDetails {
    row: number;
    column: number;
    value?: number | "";
    disabled?: boolean;
    selectedByName?: string;
    selectedByColor?: string;
    invalid?: boolean
}

interface CellUpdate {
    row: number,
    column: number
}

interface CellUpdateWithValue extends CellUpdate {
    value: number | "";
}

type IncomingCellUpdate = CellUpdateWithValue & SudokuCellDetails;

interface SudokuProps {
    myColor: string;
    onValueChanged: (update: CellUpdateWithValue) => void;
    onCellSelected: (update: CellUpdate) => void;
    updatesSubject?: Observable<IncomingCellUpdate[]>
}

const sudokuRange = Array(9).fill(null).map((_, r) => r + 1)

function region(cell: CellUpdate): string {
    return Math.ceil(cell.row / 3) + 'x' + Math.ceil(cell.column / 3)
}

function checkValid(sudokuGrid: SudokuGridHolder) {
    const duplicateMap: Record<string, Array<SudokuCellDetails>> = {};

    sudokuGrid.grid.forEach(row => {
        row.forEach(cell => {
            if (cell.value) {
                for (const listKey of ["Row" + cell.row + "-Value" + cell.value,
                    "Column" + cell.column + "-Value" + cell.value,
                    "Region" + region(cell) + "-Value" + cell.value]) {
                    const duplicateList = (duplicateMap[listKey] = (duplicateMap[listKey] || []));
                    duplicateList.push(cell)
                }
            }
        })
    })

    let changed = false;
    const invalidCells = new Set<SudokuCellDetails>();
    Object.entries(duplicateMap).forEach(([duplicateName, cellList]) => {
        if (cellList.length >= 2) {
            cellList.forEach(cell => {
                console.log("Duplicates found:", duplicateName, cellList)
                if (!cell.invalid) {
                    console.log("Duplicates:", duplicateName, "Set cell invalid", cell)
                    cell.invalid = true
                    changed = true;
                }
                invalidCells.add(cell)
            })
        }
    })

    sudokuGrid.grid.forEach(row => row.forEach(cell => {
        if (!invalidCells.has(cell)) {
            if (cell.invalid) {
                console.log("Invalid cell marked valid", cell)
                cell.invalid = false;
                changed = true;
            }
        }
    }));

    return changed;
}

function Sudoku({myColor, onValueChanged, onCellSelected, updatesSubject}: SudokuProps) {
    const [sudokuGrid, setSudokuGrid] = useState({
        grid: sudokuRange.map(row =>
            sudokuRange.map(column => ({
                row, column,
                value: ""
            }))
        )
    } as SudokuGridHolder)

    useEffect(() => {
        console.log("updatesSubject", updatesSubject)
        const subscription = updatesSubject?.subscribe(updates => {
            console.log("updates", updates)
            updates.forEach(update => {
                const cell = sudokuGrid.grid[update.row - 1][update.column - 1];
                // console.log("cell", cell, "update", update)
                Object.assign(cell, {disabled: null}, update);
            })
            setSudokuGrid({...sudokuGrid});
        })

        return () => {
            console.log("unsubscribe", subscription)
            subscription?.unsubscribe();
        };
    }, [sudokuGrid, updatesSubject]);

    useEffect(() => {
        if (checkValid(sudokuGrid)) {
            console.log("checkValid was true")
            setSudokuGrid({...sudokuGrid})
        }
    }, [sudokuGrid]);

    console.log("Sudoku render")

    return (
        <div className="SudokuGrid">
            {sudokuGrid.grid.map((rowContent, row) => {
                row = row + 1
                return rowContent.map((cellContents, column) => {
                    column = column + 1
                    return <div key={`row-${row}-column-${column}`}
                                className={`row-${row} column-${column} SudokuCell`}>
                        <input type="text"
                               value={cellContents.value} disabled={cellContents.disabled}
                               className={cx("SudokuCellInput", {"SudokuCellInvalid": cellContents.invalid}, css`
                                   background-color: ${cellContents.selectedByColor};

                                   &:focus {
                                       background-color: ${myColor};
                                   }
                               `)}
                               onFocus={() => onCellSelected({row, column})}
                               onInput={event => {
                                   const lastChar = String(event.currentTarget.value).slice(-1)

                                   if (lastChar?.match(/[1-9]/)) {
                                       cellContents.value = Number(lastChar)
                                       setSudokuGrid({...sudokuGrid});
                                       onValueChanged({row, column, value: cellContents.value})
                                   } else if (event.currentTarget.value === "") {
                                       cellContents.value = ""
                                       setSudokuGrid({...sudokuGrid});
                                       onValueChanged({row, column, value: cellContents.value})
                                   } else {
                                       // On cell phones vibrate if input is wrong
                                       navigator?.vibrate?.(200);
                                   }
                               }}/>
                    </div>;
                });
            })}
        </div>
    );
}

export default Sudoku;
