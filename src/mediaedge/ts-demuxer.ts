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

class MediaedgeTSDemuxer extends TSDemuxer {

    public constructor(probe_data: any, config: any, duration: number) {
        super(probe_data, config, 'MediaedgeTSDemuxer');
        // console.debug(this.TAG, 'constructor', probe_data, config, duration);
        if (!isNaN(duration) && isFinite(duration)) {
            this.duration_ = duration;
            this.media_info_.duration = duration;
        }
    }

}

export default MediaedgeTSDemuxer;
