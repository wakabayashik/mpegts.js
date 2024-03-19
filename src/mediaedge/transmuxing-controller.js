/*
 * Copyright (C) 2024 wakabayashik. All Rights Reserved.
 *
 * @author wakabayashik (https://github.com/wakabayashik)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import TSDemuxer from '../demux/ts-demuxer';
import MP4Remuxer from '../remux/mp4-remuxer.js';
import TransmuxingController from '../core/transmuxing-controller.js';
import MediaedgeTSDemuxer from './ts-demuxer';
import MediaedgeIOController from './io-controller.js';

// Transmuxing (IO, Demuxing, Remuxing) controller, with multipart support
class MediaedgeTransmuxingController extends TransmuxingController {

    constructor(mediaDataSource, config) {
        super(mediaDataSource, config);
        this.TAG = 'MediaedgeTransmuxingController';
        // console.debug(this.TAG, 'constructor', mediaDataSource, config);
        this.position = null;
        this.duration = null;
        this.timeProgressing = false;
    }

    /*override*/ _loadSegment(segmentIndex, optionalFrom) {
        this._currentSegmentIndex = segmentIndex;
        const dataSource = this._mediaDataSource.segments[segmentIndex];

        const ioctl = this._ioctl = new MediaedgeIOController(dataSource, this._config, segmentIndex);
        ioctl.onError = this._onIOException.bind(this);
        ioctl.onSeeked = this._onIOSeeked.bind(this);
        ioctl.onComplete = this._onIOComplete.bind(this);
        ioctl.onRedirect = this._onIORedirect.bind(this);
        ioctl.onRecoveredEarlyEof = this._onIORecoveredEarlyEof.bind(this);
        ioctl.onHeaderArrival = this._onHeaderArrival.bind(this);
        ioctl.onDataArrival = this._onDataArrival.bind(this);
        ioctl.open(optionalFrom);
    }

    /*override*/ seek(milliseconds) {
        // console.debug(this.TAG, 'seek', milliseconds);

        const targetSegmentIndex = this._searchSegmentIndexContains(milliseconds);
        // const targetSegmentInfo = this._mediaInfo?.segments[targetSegmentIndex];
        this._internalAbort();
        if (this._remuxer) {
            this._remuxer.seek(milliseconds);
            this._remuxer.insertDiscontinuity();
        }
        if (false) {
            this._demuxer.resetMediaInfo();
            this._demuxer.timestampBase = this._mediaDataSource.segments[targetSegmentIndex].timestampBase;
        } else if (this._demuxer) { // re-create demuxer to purge data held in the demuxer (pes_slice_queues_, video_track_.samples, audio_track_.samples)
            this._demuxer.destroy();
            this._demuxer = null;
        }
        this._loadSegment(targetSegmentIndex, milliseconds);
        this._pendingResolveSeekPoint = milliseconds;
        if (this._mediaInfo) this._reportSegmentMediaInfo(targetSegmentIndex);
        this._enableStatisticsReporter();
    }

    /*override*/ _setupTSDemuxerRemuxer(probeData) {
        let demuxer = this._demuxer = new MediaedgeTSDemuxer(probeData, this._config, this.duration);
        demuxer.position = this.position;

        if (!this._remuxer) {
            this._remuxer = new MP4Remuxer(this._config);
            this._remuxer._dtsBase = 0;
            this._remuxer._dtsBaseInited = true;
        }

        demuxer.onError = this._onDemuxException.bind(this);
        demuxer.onMediaInfo = this._onMediaInfo.bind(this);
        demuxer.onMetaDataArrived = this._onMetaDataArrived.bind(this);
        demuxer.onTimedID3Metadata = this._onTimedID3Metadata.bind(this);
        demuxer.onSynchronousKLVMetadata = this._onSynchronousKLVMetadata.bind(this);
        demuxer.onAsynchronousKLVMetadata = this._onAsynchronousKLVMetadata.bind(this);
        demuxer.onSMPTE2038Metadata = this._onSMPTE2038Metadata.bind(this);
        demuxer.onSCTE35Metadata = this._onSCTE35Metadata.bind(this);
        demuxer.onPESPrivateDataDescriptor = this._onPESPrivateDataDescriptor.bind(this);
        demuxer.onPESPrivateData = this._onPESPrivateData.bind(this);

        this._remuxer.bindDataSource(this._demuxer);
        this._remuxer.onInitSegment = this._onRemuxerInitSegmentArrival.bind(this);
        this._remuxer.onMediaSegment = this._onRemuxerMediaSegmentArrival.bind(this);
    }

    _onDataArrival(chunks, byte_start) {
        // console.log('_onDataArrival', chunks.byteLength);
        if (!this._demuxer) {
            const probeData = TSDemuxer.probe(chunks);
            if (probeData.match) {
                // Hit as MPEG-TS
                this._setupTSDemuxerRemuxer(probeData);
                //consumed = this._demuxer.parseChunks(data, byteStart);
            } else if (!probeData.needMoreData) {
                // Both probing as FLV / MPEG-TS failed, report error
                Log.e(this.TAG, 'Non MPEG-TS/FLV, Unsupported media type!');
                Promise.resolve().then(() => {
                    this._internalAbort();
                });
                this._emitter.emit(TransmuxingEvents.DEMUX_ERROR, DemuxErrors.FORMAT_UNSUPPORTED, 'Non MPEG-TS/FLV, Unsupported media type!');
                return 0;
            } else {
                console.log('needMoreData');
                return 0; // needMoreData
            }
        }
        this._demuxer.position = this.position; // set playback position in millisecond which was taken from 'mediaedge' type server
        this._demuxer.bindDataSource(this._ioctl); // subsequent data will be sent to demuxer directly.
        return this._demuxer.parseChunks(chunks, byte_start);
    }

    _onHeaderArrival(headers) {
        // headers.forEach((val, key) => console.debug(this.TAG, '_onHeaderArrival', `${key}: ${val}`));
        const server = headers.get('x-mediaedge-server');
        const scale = headers.get('x-mediaedge-scale');
        const speed = headers.get('x-mediaedge-speed');
        const range = headers.get('x-mediaedge-range');
        const mediaRange = headers.get('x-mediaedge-media-range');
        const mediaProps = headers.get('x-mediaedge-media-properties');
        this.position = null;
        this.duration = null;
        this.timeProgressing = false;
        if (typeof range == 'string' && range.slice(0,4) === 'npt=') { // Normal Play Time (RFC2326, RFC7826)
            let mr = range.match(/^npt=([0-9\.]*)\-([0-9\.]*|\s*)(?:;elapse=([0-9\.]+))?$/);
            let mr1 = +mr[1];
            let mr2 = +mr[2];
            let mr3 = +mr[3];
            if (!isNaN(mr1) && isFinite(mr1)) {
                this.position = mr1 * 1000; // to millisec
            }
            if (mr2 == 0 && mr3 && !isNaN(mr3) && isFinite(mr3)) {
                this.timeProgressing = true;
            }
            if (!isNaN(mr2) && isFinite(mr2) && mr2 > 0) {
                this.duration = mr2 * 1000; // to millisec
            } else if (typeof mediaRange == 'string') {
                let mr = mediaRange.match(/^npt=([0-9\.]*)\-([0-9\.]*)$/);
                let mr2 = +mr[2];
                if (!isNaN(mr2) && isFinite(mr2)) {
                    this.duration = mr2 * 1000; // to millisec
                }
            }
        }
        if (this._pendingResolveSeekPoint !== null && this.position !== null) {
            // update seek point with server response
            this._pendingResolveSeekPoint = Math.max(this.position, this._pendingResolveSeekPoint);
        }
    }

}

export default MediaedgeTransmuxingController;
