/*
 * Copyright (C) 2016 Bilibili. All Rights Reserved.
 *
 * @author zheng qian <xqq@xqq.im>
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

import EventEmitter from 'events';
import Log from '../utils/logger.js';
import Browser from '../utils/browser.js';
import MediaInfo from '../core/media-info.js';
import FLVDemuxer from '../demux/flv-demuxer.js';
import TSDemuxer from '../demux/ts-demuxer';
import MP4Remuxer from '../remux/mp4-remuxer.js';
import DemuxErrors from '../demux/demux-errors.js';
import MediaedgeIOController from './io-controller.js';
import TransmuxingEvents from '../core/transmuxing-events';
import {LoaderStatus, LoaderErrors} from '../io/loader.js';
import TransmuxingController from '../core/transmuxing-controller.js';
import MediaedgeTSDemuxer from './ts-demuxer';


// Transmuxing (IO, Demuxing, Remuxing) controller, with multipart support
class MediaedgeTransmuxingController extends TransmuxingController {

    constructor(mediaDataSource, config) {
        super(mediaDataSource, config);
        this.TAG = 'MediaedgeTransmuxingController';
        console.debug(this.TAG, 'constructor', mediaDataSource, config);
    }

    _loadSegment(segmentIndex, optionalFrom) {
        this._currentSegmentIndex = segmentIndex;
        let dataSource = this._mediaDataSource.segments[segmentIndex];

        let ioctl = this._ioctl = new MediaedgeIOController(dataSource, this._config, segmentIndex);
        ioctl.onError = this._onIOException.bind(this);
        ioctl.onSeeked = this._onIOSeeked.bind(this);
        ioctl.onComplete = this._onIOComplete.bind(this);
        ioctl.onRedirect = this._onIORedirect.bind(this);
        ioctl.onRecoveredEarlyEof = this._onIORecoveredEarlyEof.bind(this);

        if (optionalFrom) {
            this._demuxer.bindDataSource(this._ioctl);
        } else {
            ioctl.onDataArrival = this._onInitChunkArrival.bind(this);
        }

        ioctl.open(optionalFrom);
    }

    _setupTSDemuxerRemuxer(probeData) {
        let demuxer = this._demuxer = new MediaedgeTSDemuxer(probeData, this._config);

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

        this._remuxer.bindDataSource(this._demuxer);
        this._demuxer.bindDataSource(this._ioctl);

        this._remuxer.onInitSegment = this._onRemuxerInitSegmentArrival.bind(this);
        this._remuxer.onMediaSegment = this._onRemuxerMediaSegmentArrival.bind(this);
    }

}

export default MediaedgeTransmuxingController;
