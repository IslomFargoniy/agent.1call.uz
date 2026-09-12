import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WaveformPlayerProps {
    callId: number;
    durationSeconds: number;
    phoneNumber: string;
}

export function WaveformPlayer({
    callId,
    durationSeconds,
    phoneNumber,
}: WaveformPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState<number>(durationSeconds || 0);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    const streamUrl = `/calls/${callId}/stream`;

    useEffect(() => {
        if (durationSeconds > 0 && duration === 0) {
            setDuration(durationSeconds);
        }
    }, [durationSeconds]);

    const syncDuration = () => {
        const audio = audioRef.current;
        if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
            setDuration(Math.round(audio.duration));
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current
                .play()
                .then(() => {
                    setIsPlaying(true);
                    syncDuration();
                })
                .catch(() => setIsPlaying(false));
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        setCurrentTime(time);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
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
        const safeSecs = Math.max(0, Math.floor(secs));
        const m = Math.floor(safeSecs / 60)
            .toString()
            .padStart(2, '0');
        const s = (safeSecs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const effectiveDuration =
        duration > 0 ? duration : durationSeconds > 0 ? durationSeconds : 1;

    return (
        <div className="bg-muted/60 border-border/70 flex w-full max-w-md items-center gap-3 rounded-lg border p-2.5">
            <audio
                ref={audioRef}
                src={streamUrl}
                preload="metadata"
                onLoadedMetadata={syncDuration}
                onDurationChange={syncDuration}
                onCanPlay={syncDuration}
                onTimeUpdate={() => {
                    if (audioRef.current) {
                        setCurrentTime(audioRef.current.currentTime);
                        syncDuration();
                    }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                }}
            />

            <Button
                variant="default"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full shadow-sm"
                onClick={togglePlay}
                type="button"
            >
                {isPlaying ? (
                    <Pause className="h-4 w-4" />
                ) : (
                    <Play className="ml-0.5 h-4 w-4" />
                )}
            </Button>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <input
                    type="range"
                    min={0}
                    max={effectiveDuration}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="accent-primary bg-secondary h-1.5 w-full cursor-pointer rounded-lg"
                />
                <div className="text-muted-foreground flex items-center justify-between font-mono text-[11px]">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(effectiveDuration)}</span>
                </div>
            </div>

            <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 font-mono text-xs font-semibold"
                onClick={cyclePlaybackRate}
                type="button"
            >
                {playbackRate}x
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-7 w-7 shrink-0"
                onClick={toggleMute}
                type="button"
            >
                {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5" />
                ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                )}
            </Button>
        </div>
    );
}
