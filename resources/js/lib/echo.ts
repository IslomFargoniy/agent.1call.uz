import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: any;
    }
}

window.Pusher = Pusher;

export function getEcho(): any {
    if (typeof window === "undefined") {
        return null;
    }

    if (!window.Echo) {
        window.Echo = new Echo({
            broadcaster: "reverb",
            key: import.meta.env.VITE_REVERB_APP_KEY || "agent1call-reverb-key",
            wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
            wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8085),
            wssPort: Number(import.meta.env.VITE_REVERB_PORT || 8085),
            forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
            enabledTransports: ["ws", "wss"],
        });
    }

    return window.Echo;
}
