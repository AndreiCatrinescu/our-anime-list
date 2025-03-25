import { useState, useEffect } from "react";
import CountdownToDay from "./Countdown";

interface Props {
    imageFile: Blob;
    title: string;
    releaseDay: string;
    releaseTime: string;
    currentEpisodes: number;
    totalEpisodes: number;
}

function InfoBanner({ imageFile, title, releaseDay, releaseTime, currentEpisodes, totalEpisodes }: Props) {
    const [imageUrl, setImageUrl] = useState('');
    const [urgencyLevel, setUrgencyLevel] = useState<'high' | 'medium' | 'low'>('low');

    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setImageUrl(url);

            return () => URL.revokeObjectURL(url);
        }
    }, [imageFile]);

    useEffect(() => {
        const calculateUrgency = () => {
            const now = new Date();
            const target = new Date();

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const targetDayIndex = days.indexOf(releaseDay);
            const currentDayIndex = now.getDay();

            let daysUntilTarget = targetDayIndex - currentDayIndex;
            if (daysUntilTarget < 0) daysUntilTarget += 7;

            const [hours, minutes] = releaseTime.split(':').map(Number);
            target.setDate(now.getDate() + daysUntilTarget);
            target.setHours(hours, minutes, 0, 0);

            if (daysUntilTarget === 0 && now > target) {
                target.setDate(target.getDate() + 7);
            }

            const hoursUntilRelease = (target.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (hoursUntilRelease <= 24) {
                setUrgencyLevel('high');
            } else if (hoursUntilRelease <= 72) {
                setUrgencyLevel('medium');
            } else {
                setUrgencyLevel('low');
            }
        };

        calculateUrgency();
        const timer = setInterval(calculateUrgency, 1000 * 60);

        return () => clearInterval(timer);
    }, [releaseDay, releaseTime]);

    if (!imageUrl) return <p>No image selected</p>;

    const progress = totalEpisodes > 0 ? (currentEpisodes / totalEpisodes) * 100 : 0;

    const urgencyStyles = {
        high: {
            color: '#ff4444',
            text: '🔥 Coming Soon!',
            border: '2px solid #ff4444'
        },
        medium: {
            color: '#ffbb33',
            text: '⏰ Getting Close',
            border: '2px solid #ffbb33'
        },
        low: {
            color: '#00C851',
            text: '📅 Coming Up',
            border: '2px solid #00C851'
        }
    };

    return (
        <div className="card position-relative" style={{
            width: '200px',
            height: '350px',
            border: urgencyStyles[urgencyLevel].border
        }}>
            <div
                className="card-img-top h-100"
                style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%), url(' + imageUrl + ')',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />
            <div className="card-body position-absolute bottom-0 w-100 text-center">
                <h5 className="card-title text-white mb-3" style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                }}>
                    {title}
                </h5>
                <div className="progress mb-2" style={{ height: '8px' }}>
                    <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${progress}%` }}
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    />
                </div>
                <p className="text-white mb-2" style={{
                    fontSize: '1rem',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                    {currentEpisodes}/{totalEpisodes} Episodes
                </p>
                <div style={{
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    color: urgencyStyles[urgencyLevel].color,
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                }}>
                    {urgencyStyles[urgencyLevel].text}
                </div>
                <div style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                    <CountdownToDay targetDay={releaseDay} targetTime={releaseTime} />
                </div>
            </div>
        </div>
    );
}

export default InfoBanner;