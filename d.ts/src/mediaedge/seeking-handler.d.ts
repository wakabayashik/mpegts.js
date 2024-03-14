import SeekingHandler from "../player/seeking-handler";
declare class MediaedgeSeekingHandler extends SeekingHandler {
    private pausedOnSeek;
    isLive: boolean;
    constructor(config: any, media_element: HTMLMediaElement, on_unbuffered_seek: (milliseconds: number) => void);
    destroy(): void;
    protected _onMediaSeeking(e: Event): void;
}
export default MediaedgeSeekingHandler;
