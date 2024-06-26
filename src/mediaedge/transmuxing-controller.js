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

import Log from '../utils/logger.js';
import TSDemuxer from '../demux/ts-demuxer';
import DemuxErrors from '../demux/demux-errors.js';
import MP4Remuxer from '../remux/mp4-remuxer.js';
import TransmuxingController from '../core/transmuxing-controller.js';
import TransmuxingEvents from '../core/transmuxing-events';
import {LoaderErrors} from '../io/loader.js';
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
        this.mediaInfoDone = false;
    }

    /*override*/ _loadSegment(segmentIndex, optionalFrom, playspeed) {
        this.mediaInfoDone = false;
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
        ioctl.open(optionalFrom, playspeed);
    }

    /*override*/ seek({milliseconds = 0, playspeed = 1.0} = {}) {
        const targetSegmentIndex = this._searchSegmentIndexContains(milliseconds);
        // const targetSegmentInfo = this._mediaInfo?.segments[targetSegmentIndex];
        this._internalAbort();
        if (this._remuxer) {
            this._remuxer.seek(milliseconds);
            this._remuxer.insertDiscontinuity();
        }
        if (this._demuxer) { // re-create demuxer to purge data held in the demuxer (pes_slice_queues_, video_track_.samples, audio_track_.samples)
            this._demuxer.destroy();
            this._demuxer = null;
        }
        this._loadSegment(targetSegmentIndex, milliseconds, playspeed);
        this._pendingResolveSeekPoint = milliseconds;
        this._enableStatisticsReporter();
    }

    /*override*/ _setupTSDemuxerRemuxer(probeData) {
        const demuxer = this._demuxer = new MediaedgeTSDemuxer(probeData, this._config, +this.duration);

        if (!this._remuxer) {
            this._remuxer = new MP4Remuxer(this._config);
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

        if (this.position !== null) {
            demuxer.onDataAvailable = (audioTrack, videoTrack) => {
                this._remuxer._dtsBaseInited = false;
                this._remuxer._calculateDtsBase(audioTrack, videoTrack);
                this._remuxer._dtsBase -= this.position;
                this._remuxer.remux(audioTrack, videoTrack);
                // this._remuxer.bindDataSource(this._demuxer);
                demuxer.onDataAvailable = this._remuxer.remux.bind(this._remuxer);
            };
            demuxer.onTrackMetadata = (type, metadata) => {
                if (type === 'audio') this._remuxer.insertDiscontinuity();
                this._remuxer._onTrackMetadataReceived(type, metadata);
            }
        } else {
            this._remuxer.bindDataSource(this._demuxer); // live
        }
        this._demuxer.bindDataSource(this._ioctl);

        this._remuxer.onInitSegment = this._onRemuxerInitSegmentArrival.bind(this);
        this._remuxer.onMediaSegment = this._onRemuxerMediaSegmentArrival.bind(this);
    }

    /*override*/ _onMediaInfo(mediaInfo) {
        this.mediaInfoDone = true;
        return super._onMediaInfo(mediaInfo);
    }

    /*override*/ _onIOComplete(extraData) {
        if (this.mediaInfoDone) {
            super._onIOComplete(extraData);
        } else {
            const info = {code:-1, msg:'Reached the end of stream before available seek point!'};
            this._onIOException(LoaderErrors.UNRECOVERABLE_EARLY_EOF, info);
        }
    }

    _onDataArrival(chunks, byte_start) {
        if (!this._demuxer) {
            const probeData = TSDemuxer.probe(chunks);
            if (probeData.match) {
                // Hit as MPEG-TS
                this._setupTSDemuxerRemuxer(probeData);
            } else if (!probeData.needMoreData) {
                // Both probing as FLV / MPEG-TS failed, report error
                Log.e(this.TAG, 'Non MPEG-TS/FLV, Unsupported media type!');
                Promise.resolve().then(() => {
                    this._internalAbort();
                });
                this._emitter.emit(TransmuxingEvents.DEMUX_ERROR, DemuxErrors.FORMAT_UNSUPPORTED, 'Non MPEG-TS/FLV, Unsupported media type!');
                return 0;
            } else {
                return 0; // needMoreData
            }
        }
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
            const adjust = (this._config?.mediaedgeSeekAdjust ?? 1000) || 0;
            if (this.position + adjust + 500 < this._pendingResolveSeekPoint) {
                this._pendingResolveSeekPoint = this.position; // failed to seek to the specified position
            } else {
                this._pendingResolveSeekPoint = Math.max(this.position, this._pendingResolveSeekPoint);
            }
        }
    }

}

export default MediaedgeTransmuxingController;
