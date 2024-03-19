import SeekingHandler from "../player/seeking-handler";
declare class MediaedgeSeekingHandler extends SeekingHandler {
    private on_pause_transmuxer;
    private pausedPosition;
    isLive: boolean;
    constructor(config: any, media_element: HTMLMediaElement, on_unbuffered_seek: (milliseconds: number) => void, on_pause_transmuxer: () => void);
    destroy(): void;
    protected _onMediaSeeking(e: Event): void;
    protected _isPositionBuffered(seconds: number): boolean;
    private _onPlay;
    private _onPause;
}
export default MediaedgeSeekingHandler;
