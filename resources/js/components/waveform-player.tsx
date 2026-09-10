import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WaveformPlayerProps {
    callId: number;
    durationSeconds: number;
    phoneNumber: string;
}

export function WaveformPlayer({ callId, durationSeconds, phoneNumber }: WaveformPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    const streamUrl = `/calls/${callId}/stream`;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const cyclePlaybackRate = () => {
        const rates = [1, 1.25, 1.5, 2];
        const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(next);
        if (audioRef.current) {
            audioRef.current.playbackRate = next;
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="flex items-center gap-3 bg-muted/60 p-2.5 rounded-lg border border-border/70 w-full max-w-md">
            <audio ref={audioRef} src={streamUrl} preload="none" />

            <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full shrink-0 shadow-sm"
                onClick={togglePlay}
            >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>

            <div className="flex-1 flex flex-col gap-1 min-w-0">
                <input
                    type="range"
                    min={0}
                    max={durationSeconds || 1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="h-1.5 w-full cursor-pointer accent-primary rounded-lg bg-secondary"
                />
                <div className="flex justify-between items-center text-[11px] text-muted-foreground font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(durationSeconds)}</span>
                </div>
            </div>

            <Button
                variant="ghost"
                size="sm"
                className="text-xs px-2 h-7 font-mono font-semibold"
                onClick={cyclePlaybackRate}
            >
                {playbackRate}x
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                onClick={toggleMute}
            >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
        </div>
    );
}
