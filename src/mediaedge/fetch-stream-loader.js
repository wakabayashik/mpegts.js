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

/* fetch + stream IO loader. Currently working on chrome 43+.
 * fetch provides a better alternative http API to XMLHttpRequest
 *
 * fetch spec   https://fetch.spec.whatwg.org/
 * stream spec  https://streams.spec.whatwg.org/
 */
class MediaedgeFetchStreamLoader extends FetchStreamLoader {

    constructor(seekHandler, config) {
        super(seekHandler, config);
        this.TAG = 'MediaedgeFetchStreamLoader';
        // console.debug(this.TAG, seekHandler, config);
        this._onHeaderArrival = null;
    }

    get onHeaderArrival() {
        return this._onHeaderArrival ?? (() => {});
    }

    set onHeaderArrival(value) {
        this._onHeaderArrival = value;
    }

    /*override*/ _fetchDone(res) {
        this.onHeaderArrival(res.headers);
    }

}

export default MediaedgeFetchStreamLoader;
