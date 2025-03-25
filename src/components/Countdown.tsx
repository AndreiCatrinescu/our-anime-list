import { useState, useEffect } from "react";

interface Props {
    targetDay: string;
    targetTime: string;
}

function CountdownToDay({ targetDay, targetTime }: Props) {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date();

            // Set the target day
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const targetDayIndex = days.indexOf(targetDay);
            const currentDayIndex = now.getDay();

            // Calculate days until target
            let daysUntilTarget = targetDayIndex - currentDayIndex;
            if (daysUntilTarget < 0) daysUntilTarget += 7;

            // Set the target time
            const [hours, minutes] = targetTime.split(':').map(Number);
            target.setDate(now.getDate() + daysUntilTarget);
            target.setHours(hours, minutes, 0, 0);

            // If we've passed the target time today, add 7 days
            if (daysUntilTarget === 0 && now > target) {
                target.setDate(target.getDate() + 7);
            }

            const difference = target.getTime() - now.getTime();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeLeft('Next episode is out!');
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDay, targetTime]);

    return <span className="text-white">{timeLeft}</span>;
}

export default CountdownToDay;
