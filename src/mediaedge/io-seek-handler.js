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
        return {url:url.href, headers};
    }

    removeURLParameters(seekedURL) {
        return seekedURL;
    }

    _setParams(range, params) {
        if (params.has('startdatetime')) {
            let startdatetime = params.get('startdatetime');
            if (startdatetime === 'now') {
                return;
            }
            if (range.from !== 0) {
                const dt = this._getDate(startdatetime);
                if (!isNaN(dt.getTime())) {
                    dt.setTime(dt.getTime() + range.from);
                    if (!isNaN(dt.getTime())) {
                        params.set('startdatetime', dt.toISOString().replace(/[\-\:]/g, '')); // ISO8601 basic string
                    }
                }
            }
        } else {
            if (range.from !== 0) {
                const adjust = (this.config?.mediaedgeSeekAdjust ?? 1000) || 0;
                params.set('starttime', '' + (Math.max(0, range.from - adjust) / 1000)); // [sec]
            }
            if (!params.has('burst')) {
                const burst = this.config?.mediaedgeBurst ?? '10000/3000';
                if (burst) params.set('burst', burst);
            }
        }
        const playspeed = +range.playspeed;
        if (!playspeed || playspeed === 1.0) {
            params.delete('playspeed'); // normal playspeed
        } else {
            params.set('playspeed', '' + playspeed);
        }
    }

    _getDate(str) {
        let dt = new Date(str);
        if (isNaN(dt.getTime()) && typeof str === 'string') {
            const mr = str.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}(?:\.\d+)?)(Z|([\+\-])(\d{2})(\d{2}))?/i); // ISO8601 basic format
            if (mr) {
                if (!mr[7]) {
                    dt = new Date(`${mr[1]}-${mr[2]}-${mr[3]}T${mr[4]}:${mr[5]}:${mr[6]}`);
                } else if (mr[7].toLowerCase() === 'z') {
                    dt = new Date(`${mr[1]}-${mr[2]}-${mr[3]}T${mr[4]}:${mr[5]}:${mr[6]}${mr[7]}`);
                } else {
                    dt = new Date(`${mr[1]}-${mr[2]}-${mr[3]}T${mr[4]}:${mr[5]}:${mr[6]}${mr[8]}${mr[9]}:${mr[10]}`);
                }
            }
        }
        return dt;
    }

}

export default MediaedgeIoSeekHandler;
