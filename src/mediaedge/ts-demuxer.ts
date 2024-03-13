/*
 * Copyright (C) 2021 magicxqq. All Rights Reserved.
 *
 * @author magicxqq <xqq@xqq.im>
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

// import Log from '../utils/logger';
// import DemuxErrors from '../demux/demux-errors';
// import MediaInfo from '../core/media-info';
// import {IllegalStateException} from '../utils/exception';
// import BaseDemuxer from '../demux/base-demuxer';
// import { PAT, PESData, SectionData, SliceQueue, PIDToSliceQueues, PMT, ProgramToPMTMap, StreamType } from '../demux/pat-pmt-pes';
// import { AVCDecoderConfigurationRecord, H264AnnexBParser, H264NaluAVC1, H264NaluPayload, H264NaluType } from '../demux/h264';
// import SPSParser from '../demux/sps-parser';
// import { AACADTSParser, AACFrame, AACLOASParser, AudioSpecificConfig, LOASAACFrame } from '../demux/aac';
// import { MPEG4AudioObjectTypes, MPEG4SamplingFrequencyIndex } from '../demux/mpeg4-audio';
// import { PESPrivateData, PESPrivateDataDescriptor } from '../demux/pes-private-data';
// import { readSCTE35, SCTE35Data } from '../demux/scte35';
// import { H265AnnexBParser, H265NaluHVC1, H265NaluPayload, H265NaluType, HEVCDecoderConfigurationRecord } from '../demux/h265';
// import H265Parser from '../demux/h265-parser';
// import { SMPTE2038Data, smpte2038parse } from '../demux/smpte2038';
// import { MP3Data } from '../demux/mp3';
// import { AC3Config, AC3Frame, AC3Parser, EAC3Config, EAC3Frame, EAC3Parser } from '../demux/ac3';
// import { KLVData, klv_parse } from '../demux/klv';
import TSDemuxer from '../demux/ts-demuxer';

class MediaedgeTSDemuxer extends TSDemuxer {

    public constructor(probe_data: any, config: any) {
        super(probe_data, config, 'MediaedgeTSDemuxer');
        console.debug(this.TAG, 'constructor', probe_data, config);
    }

}

export default MediaedgeTSDemuxer;
