import { useState, useEffect } from "react";

function TypewriterText({ text, speed = 100, pause = 5000, className = "" }) {
    const [displayed, setDisplayed] = useState("");

    useEffect(() => {
        let typingInterval;
        let restartTimeout;

        const startTyping = () => {
            setDisplayed("");
            let i = 0;
            typingInterval = setInterval(() => {
                i++;
                setDisplayed(text.slice(0, i));
                if (i >= text.length) {
                    clearInterval(typingInterval);
                    restartTimeout = setTimeout(startTyping, pause);
                }
            }, speed);
        };

        startTyping();

        return () => {
            clearInterval(typingInterval);
            clearTimeout(restartTimeout);
        };
    }, [text, speed, pause]);

    return (
        <span className={`inline-block border-r-2 border-current pr-0.5 align-bottom animate-blink ${className}`}>
            {displayed}
        </span>
    );
}

export default TypewriterText;