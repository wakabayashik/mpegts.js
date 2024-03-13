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

import Log from '../utils/logger.js';
import SpeedSampler from '../io/speed-sampler.js';
import {LoaderStatus, LoaderErrors} from '../io/loader.js';
import FetchStreamLoader from '../io/fetch-stream-loader.js';
import MozChunkedLoader from '../io/xhr-moz-chunked-loader.js';
import MSStreamLoader from '../io/xhr-msstream-loader.js';
import RangeLoader from '../io/xhr-range-loader.js';
import WebSocketLoader from '../io/websocket-loader.js';
import RangeSeekHandler from '../io/range-seek-handler.js';
import ParamSeekHandler from '../io/param-seek-handler.js';
import {RuntimeException, IllegalStateException, InvalidArgumentException} from '../utils/exception.js';
import IOController from '../io/io-controller.js';
import MediaedgeFetchStreamLoader from './fetch-stream-loader.js';

/**
 * DataSource: {
 *     url: string,
 *     filesize: number,
 *     cors: boolean,
 *     withCredentials: boolean
 * }
 *
 */

// Manage IO Loaders
class MediaedgeIOController extends IOController {

    constructor(dataSource, config, extraData) {
        super(dataSource, config, extraData);
        this.TAG = 'MediaedgeIOController';
        console.debug(this.TAG, 'constructor', dataSource, config, extraData);
    }

    _selectSeekHandler() {
        let config = this._config;

        if (config.seekType === 'range') {
            this._seekHandler = new RangeSeekHandler(this._config.rangeLoadZeroStart);
        } else if (config.seekType === 'param') {
            let paramStart = config.seekParamStart || 'bstart';
            let paramEnd = config.seekParamEnd || 'bend';

            this._seekHandler = new ParamSeekHandler(paramStart, paramEnd);
        } else if (config.seekType === 'custom') {
            if (typeof config.customSeekHandler !== 'function') {
                throw new InvalidArgumentException('Custom seekType specified in config but invalid customSeekHandler!');
            }
            this._seekHandler = new config.customSeekHandler();
        } else {
            throw new InvalidArgumentException(`Invalid seekType in config: ${config.seekType}`);
        }
    }

    _selectLoader() {
        if (this._config.customLoader != null) {
            this._loaderClass = this._config.customLoader;
        } else if (this._isWebSocketURL) {
            this._loaderClass = WebSocketLoader;
        } else if (FetchStreamLoader.isSupported()) {
            this._loaderClass = MediaedgeFetchStreamLoader;
        } else if (MozChunkedLoader.isSupported()) {
            this._loaderClass = MozChunkedLoader;
        } else if (RangeLoader.isSupported()) {
            this._loaderClass = RangeLoader;
        } else {
            throw new RuntimeException('Your browser doesn\'t support xhr with arraybuffer responseType!');
        }
    }

}

export default MediaedgeIOController;
