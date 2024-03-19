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

class MediaedgeIoSeekHandler {

    constructor(config) {
        this.config = config;
    }

    getConfig(baseUrl, range) {
        let url = new URL(baseUrl);
        let headers = {};

        if (url.searchParams.has('option')) {
            const params = new URLSearchParams(url.searchParams.get('option'));
            this._setParams(range, params);
            url.searchParams.set('option', '?' + params);
        } else {
            this._setParams(range, url.searchParams);
        }
        // console.debug('MediaedgeSeekHandler', 'getConfig', baseUrl, range, url.href, headers);
        // range.from = 0;
        return {url:url.href, headers};
    }

    removeURLParameters(seekedURL) {
        return seekedURL;
    }

    _setParams(range, params) {
        if (range.from !== 0) {
            params.set('starttime', '' + (Math.max(0, range.from - 1000) / 1000));
        }
        if (!params.has('burst')) {
            params.set('burst', '10000/3000');
            //params.set('burst', '5000/3000');
        }
    }

}

export default MediaedgeIoSeekHandler;
