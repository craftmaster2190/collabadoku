import React, {useEffect, useMemo, useState} from 'react';
import './App.css';
import Sudoku from "./Sudoku";
import RoomCode from "./RoomCode";
import useWindowDimensions from "./useWindowDimensions";
import ColorSelector from "./ColorSelector";
import ReconnectingWebSocket from "reconnecting-websocket";
import debounce from "debounce";
import MyName from "./MyName";
import {Subject} from "rxjs";

// eslint-disable-next-line no-restricted-globals
const hostWithoutPort = location.host.split(':')[0]
console.log("hostWithoutPort", hostWithoutPort)
const webSocket = new ReconnectingWebSocket('ws://' + hostWithoutPort + ':8080');

function webSocketSend(data: object) {
    webSocket.send(JSON.stringify(data))
}

function App() {
    const windowDimensions = useWindowDimensions();
    const shorterDimension = Math.min(windowDimensions.height, windowDimensions.width);
    const sudokuBoardDimension = shorterDimension - 48;

    const [myName, setMyName] = useState("")
    const [myRoomCode, setMyRoomCode] = useState("")
    const [myColor, setMyColor] = useState("")

    const sendUpdatesToServer = debounce(() => {
        const data = {} as any;
        if (myName) {
            data.name = myName;
        }
        if (myRoomCode) {
            data.roomCode = myRoomCode;
        }
        if (myColor) {
            data.color = myColor;
        }
        if (Object.keys(data).length) {
            console.log("ws send:", data)
            webSocketSend(data)
        }
    }, 600);

    useEffect(() => {
        sendUpdatesToServer();
    }, [myName, myRoomCode, myColor, sendUpdatesToServer]);

    useEffect(() => {
        webSocket.onopen = () => {
            sendUpdatesToServer();
        };

        return () => {
            webSocket.onopen = null;
        };
    }, [sendUpdatesToServer])

    const updatesSubject = useMemo(() => new Subject<any>(), [])

    useEffect(() => {
        webSocket.onmessage = async (message) => {
            const dataString = await message.data.text();
            console.log("ws received: ", dataString);
            try {
                const dataObj = JSON.parse(dataString);
                for (const key in dataObj) {
                    const dataValue = dataObj[key];
                    if (key === 'updates') {
                        updatesSubject.next(dataValue)
                    } else {
                        console.log("ws receive unknown key", key, dataValue)
                    }
                }

            } catch (err) {
                console.log("ws receive error", err)
            }
        };

        return () => {
            webSocket.onmessage = null;
        };
    }, [updatesSubject])

    console.log("App render")

    return (
        <div className="WholeScreen">
            <div className="WorkArea">
                <MyName onSetMyName={myName => setMyName(myName)}/>
                <RoomCode onRoomCodeSelected={roomCode => setMyRoomCode(roomCode)}/>
                <ColorSelector onColorSelected={color => setMyColor(color)}/>
            </div>
            <div className="CenterSquare" style={{width: shorterDimension, height: shorterDimension}}>
                <div className="PlayArea" style={{width: sudokuBoardDimension, height: sudokuBoardDimension}}>
                    <Sudoku myColor={myColor}
                            onCellSelected={({row, column}) =>
                                webSocketSend({selected: {row, column}})}
                            onValueChanged={({row, column, value}) =>
                                webSocketSend({setValue: {row, column, value}})}
                            updatesSubject={updatesSubject}/>
                </div>
            </div>
        </div>
    );
}

export default App;
