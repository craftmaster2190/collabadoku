import {useEffect, useMemo, useState} from "react";
import "./RoomCode.css"

interface RoomCodeProps {
    onRoomCodeSelected: (roomCode: string) => void
}

function RoomCode({onRoomCodeSelected}: RoomCodeProps) {
    const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);

    const [roomCode, setRoomCode] = useState(queryParams.get("roomCode") ?? "")
    useEffect(() => {
        if (roomCode) {
            onRoomCodeSelected(roomCode)
            if (queryParams.get("roomCode") !== roomCode) {
                queryParams.set("roomCode", roomCode);
                // eslint-disable-next-line no-restricted-globals
                history.pushState(null, "", "?" + queryParams.toString());
            }
        }
    }, [queryParams, roomCode, onRoomCodeSelected]);

    return (
        <div className="RoomCode">
            <div>Room Code</div>
            <input type="text" placeholder="Room code" value={roomCode}
                   onChange={event => setRoomCode(event.currentTarget.value)}/>
        </div>
    );
}

export default RoomCode;
