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

        if (this.config.mediaedgeWrapQueryOption) {
            const params = new URLSearchParams;
            if (range.from !== 0) {
                params.set('starttime', '' + (range.from / 1000));
            }
            params.set('disconnectOnEndOfStream', '1');
            url.searchParams.set('option', '?' + params);
        } else {
            if (range.from !== 0) {
                url.searchParams.set('starttime', '' + (range / 1000));
            }
            url.searchParams.set('disconnectOnEndOfStream', '1');
        }
        // console.debug('MediaedgeSeekHandler', 'getConfig', baseUrl, range, url.href, headers);
        range.from = 0;
        return {url:url.href, headers};
    }

    removeURLParameters(seekedURL) {
        return seekedURL;
    }

}

export default MediaedgeIoSeekHandler;
