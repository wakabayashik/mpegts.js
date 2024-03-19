declare class SeekingHandler {
    protected readonly TAG: string;
    private _config;
    protected _media_element: HTMLMediaElement;
    private _always_seek_keyframe;
    protected _on_unbuffered_seek: (milliseconds: number) => void;
    protected _request_set_current_time: boolean;
    protected _seek_request_record_clocktime?: number;
    private _idr_sample_list;
    protected e?: any;
    constructor(config: any, media_element: HTMLMediaElement, on_unbuffered_seek: (milliseconds: number) => void, TAG?: string);
    destroy(): void;
    seek(seconds: number): void;
    directSeek(seconds: number): void;
    appendSyncPoints(syncpoints: any[]): void;
    protected _onMediaSeeking(e: Event): void;
    protected _pollAndApplyUnbufferedSeek(): void;
    protected _isPositionBuffered(seconds: number): boolean;
    private _getNearestKeyframe;
    protected static _getClockTime(): number;
}
export default SeekingHandler;
