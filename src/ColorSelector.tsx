import "./ColorSelector.css"
import {useEffect, useState} from "react";
import classNames from "classnames";
import {randomElement} from "./randomElement";

interface ColorSelectorProps {
    onColorSelected: (color: string) => void
}

const availableColors = ["lightblue", "lightpink", "lightgreen", "sandybrown", "#fbff51", "#d792ff"];

function ColorSelector({onColorSelected}: ColorSelectorProps) {
    const [selectedColor, setSelectedColor] = useState(
        localStorage.getItem("selectedColor") || randomElement(availableColors));

    useEffect(() => {
        onColorSelected(selectedColor);
        localStorage.setItem("selectedColor", selectedColor)
    }, [selectedColor, onColorSelected])

    return (
        <div className="ColorSelector">
            <div>My Color</div>
            <div className="ColorSelectorColors">
            {availableColors.map(color =>
                <span key={`color-` + color} className={classNames("Color", {"SelectedColor": selectedColor === color})}
                      style={{backgroundColor: color}} onClick={() => setSelectedColor(color)}/>)
            }
            </div>
        </div>
    );
}

export default ColorSelector;
