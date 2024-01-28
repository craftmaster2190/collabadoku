import {WebSocket, WebSocketServer} from 'ws';
import {getSudoku} from 'sudoku-gen';

interface Client {
    ws: WebSocket;
    wsSend: (buf: Buffer) => void;
    name?: string;
    color?: string;
    roomCode?: string;
    room?: Room;
}

const clientMap: Record<number, Client> = {};

interface SudokuCell {
    row: number;
    column: number;
    value: number | "";
    disabled?: boolean;
    selectedByConnectionId?: number | null;
    selectedByName?: string | null;
    selectedByColor?: string | null;
}

type Room = Record<string, SudokuCell>

const roomMap: Record<string, Room> = {};


const sudokuRange = Array(9).fill(null).map((_, r) => r + 1)

function cellLookup({row, column}: { row: number, column: number }) {
    return String(row) + String(column);
}

function getOrCreateRoom(roomCode: string) {
    let room = roomMap[roomCode];
    if (!room) {
        room = roomMap[roomCode] = {}
        const sudokuRaw = getSudoku();
        let index = 0;
        sudokuRange.map((row) => {
            sudokuRange.map((column) => {
                const cellValueString = sudokuRaw.puzzle.charAt(index++)
                room[cellLookup({row, column})] = {
                    row, column,
                    value: cellValueString === "-" ? "" : Number(cellValueString),
                    disabled: cellValueString === "-" ? undefined : true
                }
            })
        })
        console.log("Created a new room:", sudokuRaw, room)
    }
    return room;
}

function getAllClientsExceptMe(myClient: Client) {
    return Object.values(clientMap).filter(client =>
        client !== myClient && client.room === myClient.room)
}

function updates(cells  : SudokuCell[]) : Buffer {
    const cellsArray = cells.map(cell => {
        const {selectedByConnectionId: _, ...sendCell} = cell;
        return sendCell;
    })
    return Buffer.from(JSON.stringify({updates: cellsArray}), 'utf8');
}

function allCells(room: Room) {
    return Object.values(room)
}

function cellsSelectedByMe(room: Room, connectionId: number) {
    return Object.values(room).filter((cell) => cell.selectedByConnectionId === connectionId);
}

function setSelectedCell(roomCell: SudokuCell, connectionId: number, client: Client) {
    roomCell.selectedByConnectionId = connectionId;
    roomCell.selectedByName = client.name
    roomCell.selectedByColor = client.color
}

function unselectCell(cell: SudokuCell) {
     cell.selectedByConnectionId = null;
     cell.selectedByName = null;
     cell.selectedByColor = null;
}

function main() {
    const wss = new WebSocketServer({port: 8080});
    let idCounter = 0;

    wss.on('connection', function connection(ws) {
        const connectionId = idCounter++;
        console.log(connectionId, "connect")
        const client = clientMap[connectionId] = {ws: ws as any} as Client;

        client.wsSend = (buf: Buffer) => {
            console.log(connectionId, "send", buf.toString())
            ws.send(buf)
        }

        ws.on('error', err => console.error(connectionId, err));

        ws.on('message', function message(dataBuffer) {
            const dataString = dataBuffer.toString();
            console.log(connectionId, 'received:', dataString);
            try {
                const dataObj = JSON.parse(dataString);
                for (const key in dataObj) {
                    const dataValue = dataObj[key];
                    if (key === "name") {
                        client.name = dataValue;
                        if (client.room) {
                            const selectedCells = cellsSelectedByMe(client.room, connectionId);
                            if (selectedCells?.length) {
                                selectedCells.forEach(cell => setSelectedCell(cell, connectionId, client))
                                getAllClientsExceptMe(client).forEach(notMeClient =>
                                    notMeClient.wsSend(updates(selectedCells)));
                            }
                        }

                    } else if (key === "roomCode") {
                        client.roomCode = dataValue;
                        if (client.roomCode) {
                            client.room = getOrCreateRoom(client.roomCode)
                            client.wsSend(updates(allCells(client.room)))
                        }
                    } else if (key === "color") {
                        client.color = dataValue;
                        if (client.room) {
                            const selectedCells = cellsSelectedByMe(client.room, connectionId);
                            if (selectedCells?.length) {
                                selectedCells.forEach(cell => setSelectedCell(cell, connectionId, client))
                                getAllClientsExceptMe(client).forEach(notMeClient =>
                                    notMeClient.wsSend(updates(selectedCells)));
                            }
                        }

                    } else if (key === "selected") {
                        if (client.room) {
                            const previouslySelectedCells = cellsSelectedByMe(client.room, connectionId);
                            previouslySelectedCells.forEach(cell => unselectCell(cell))

                            const roomCell = client.room[cellLookup(dataValue)];
                            setSelectedCell(roomCell, connectionId, client);
                            getAllClientsExceptMe(client).forEach(notMeClient =>
                                notMeClient.wsSend(updates([...previouslySelectedCells, roomCell])));
                        }
                    } else if (key === "setValue") {
                        if (client.room) {
                            const roomCell = client.room[cellLookup(dataValue)];
                            roomCell.value = dataValue.value;
                            getAllClientsExceptMe(client).forEach(notMeClient =>
                                notMeClient.wsSend(updates([roomCell])));
                        }
                    } else {
                        console.log(connectionId, "received unknown key", key, dataValue)
                    }
                }
            } catch (err) {
                console.error(connectionId, err)
            }
        });

        // ws.send('something');

        ws.on('close', () => {
            console.log(connectionId, "disconnect");
            if (client.room) {
                const previouslySelectedCells = cellsSelectedByMe(client.room, connectionId);
                previouslySelectedCells.forEach(cell => unselectCell(cell))
                getAllClientsExceptMe(client).forEach(notMeClient =>
                    notMeClient.wsSend(updates(previouslySelectedCells)));
            }

            delete clientMap[connectionId];
        })
    });
}

main();

export default main;
