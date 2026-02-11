import React, { useEffect, useState } from 'react';
import './WeatherOverlay.css';

interface WeatherOverlayProps {
    type?: 'rain' | 'fog' | 'clear';
}

export const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ type = 'rain' }) => {
    // We can cycle weather or keep it static
    const [weather, setWeather] = useState(type);

    return (
        <div className="weather-overlay-container">
            {/* Cinematic Scanlines (Always on for Spectator Mode) */}
            <div className="scanlines"></div>

            {/* Vignette */}
            <div className="vignette"></div>

            {/* Weather Effects */}
            {weather === 'rain' && (
                <div className="rain-container">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="rain-drop" style={{
                            left: `${Math.random() * 100}%`,
                            animationDuration: `${0.5 + Math.random() * 0.5}s`,
                            animationDelay: `${Math.random()}s`
                        }}></div>
                    ))}
                </div>
            )}

            {weather === 'fog' && (
                <div className="fog-container">
                    <div className="fog-layer one"></div>
                    <div className="fog-layer two"></div>
                </div>
            )}

            {/* Sunbeams (Overlay blend) */}
            <div className="sunbeams"></div>
        </div>
    );
};
