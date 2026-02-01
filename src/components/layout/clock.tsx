'use client';

import { useState, useEffect } from 'react';

export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="hidden md:flex items-baseline gap-2 text-sm font-medium">
      <span className="text-muted-foreground">
        {time.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric',
            month: 'long', 
        })}
      </span>
      <span className="font-semibold text-foreground text-base tabular-nums">
        {formatTime(time)}
      </span>
    </div>
  );
}
