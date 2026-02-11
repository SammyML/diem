import React, { useRef, useEffect } from 'react';
import './CinematicBackground.css';

interface CinematicBackgroundProps {
    videoUrl?: string;
    overlayType?: 'cyberpunk' | 'clean';
}

export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({
    videoUrl = 'https://cdn.pixabay.com/video/2020/07/03/43743-436365005_large.mp4',
    // Fallback: A free stock video of a cyberpunk-style city or digital connection
    // Note: User can replace this with a local /background.mp4
    overlayType = 'cyberpunk'
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.8; // Slow down slightly for atmosphere
            // Force play
            videoRef.current.play().catch(e => console.error("Video Autoplay Blocked:", e));
        }
    }, []);

    const handleError = (e: any) => {
        console.error("Video Error:", e.currentTarget.error, "Src:", e.currentTarget.currentSrc);
    };

    return (
        <div className="cinematic-background-container">
            {/* HTML5 Video Layer */}
            <video
                ref={videoRef}
                className="cinematic-video"
                autoPlay
                loop
                muted
                playsInline
                onError={handleError}
            >
                {/* Fallback to URL immediately to ensure playback */}
                {videoUrl && <source src={videoUrl} type="video/mp4" />}
                Your browser does not support the video tag.
            </video>

            {/* Overlay Layers */}
            <div className={`overlay-layer ${overlayType}`}>
                <div className="scanlines"></div>
                <div className="vignette"></div>
                {/* Optional: Add a localized radial gradient for text readability */}
                <div className="readability-gradient"></div>
            </div>
        </div>
    );
};
