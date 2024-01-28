import {useEffect, useState} from "react";

export default function useWindowDimensions() {
    const fetchWindowDimensions = () => ({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const [windowDimensions, setWindowDimensions] = useState(fetchWindowDimensions());

    useEffect(() => {
        window.addEventListener('resize', () => setWindowDimensions(fetchWindowDimensions()));
        return () => window.removeEventListener('resize', () => setWindowDimensions(fetchWindowDimensions()));
    }, []);

    return windowDimensions;
}
