import TSDemuxer from '../demux/ts-demuxer';
declare class MediaedgeTSDemuxer extends TSDemuxer {
    private _position;
    private _timestampOffset;
    constructor(probe_data: any, config: any, duration: number, position: number);
    protected getPcrBase(data: Uint8Array): number;
    protected getTimestamp(data: Uint8Array, pos: number): number;
}
export default MediaedgeTSDemuxer;
