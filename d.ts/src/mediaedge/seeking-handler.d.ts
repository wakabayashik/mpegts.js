import SeekingHandler from "../player/seeking-handler";
declare class MediaedgeSeekingHandler extends SeekingHandler {
    private _on_direct_seek;
    private _on_pause_transmuxer;
    private _startup_stall_jumper?;
    private _seekable;
    private _state;
    private _timer;
    constructor(config: any, media_element: HTMLMediaElement, on_unbuffered_seek: (milliseconds: number) => void, on_direct_seek: (target: number) => void, on_pause_transmuxer: () => void);
    set seekable(value: boolean);
    destroy(): void;
    protected _onMediaSeeking(e: Event): void;
    protected _isPositionBuffered(seconds: number): boolean;
    private _on;
    private _off;
    private _setState;
    private _onSeeked;
    private _onPlay;
    private _onPause;
    private _onRateChange;
}
export default MediaedgeSeekingHandler;
