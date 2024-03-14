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

import FetchStreamLoader from '../io/fetch-stream-loader.js';
import {RuntimeException, IllegalStateException, InvalidArgumentException} from '../utils/exception.js';
import IOController from '../io/io-controller.js';
import MediaedgeFetchStreamLoader from './fetch-stream-loader.js';
import MediaedgeIoSeekHandler from './io-seek-handler.js';

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
        // console.debug(this.TAG, 'constructor', dataSource, config, extraData);
        this._onHeaderArrival = null;
    }

    get onHeaderArrival() {
        return this._onHeaderArrival ?? (() => {});
    }

    set onHeaderArrival(value) {
        this._onHeaderArrival = value;
    }

    /*override*/ _selectSeekHandler() {
        this._seekHandler = new MediaedgeIoSeekHandler(this._config);
    }

    /*override*/ _selectLoader() {
        if (FetchStreamLoader.isSupported()) {
            this._loaderClass = MediaedgeFetchStreamLoader;
        } else {
            throw new RuntimeException('Your browser doesn\'t support xhr with arraybuffer responseType!');
        }
    }

    /*override*/ _createLoader() {
        this._loader = new this._loaderClass(this._seekHandler, this._config);
        if (this._loader.needStashBuffer === false) {
            this._enableStash = false;
        }
        this._loader.onContentLengthKnown = this._onContentLengthKnown.bind(this);
        this._loader.onURLRedirect = this._onURLRedirect.bind(this);
        this._loader.onDataArrival = this._onLoaderChunkArrival.bind(this);
        this._loader.onComplete = this._onLoaderComplete.bind(this);
        this._loader.onError = this._onLoaderError.bind(this);
        if (this._loader instanceof MediaedgeFetchStreamLoader) {
            this._loader.onHeaderArrival = (...args) => this.onHeaderArrival(...args);
        }
    }

}

export default MediaedgeIOController;
