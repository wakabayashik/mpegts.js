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

import SeekingHandler from "../player/seeking-handler";

class MediaedgeSeekingHandler extends SeekingHandler {

    private on_pause_transmuxer: () => void;
    // private timer: any;
    private pausedPosition: number;
    // private pausedAt: number;
    // private pausedTotalMs: number;
    public isLive: boolean;

    public constructor(config: any, media_element: HTMLMediaElement,
        on_unbuffered_seek: (milliseconds: number) => void,
        on_pause_transmuxer: () => void
    ) {
        super(config, media_element, on_unbuffered_seek, 'MediaedgeSeekingHandler');
        this.on_pause_transmuxer = on_pause_transmuxer;
        // console.debug(this.TAG, 'constructor', config);
        this.e.onPlay = this._onPlay.bind(this);
        this.e.onPause = this._onPause.bind(this);
        this._media_element.addEventListener('play', this.e.onPlay);
        this._media_element.addEventListener('pause', this.e.onPause);
        // this.timer = null;
        this.pausedPosition = NaN;
        // this.pausedAt = NaN;
        // this.pausedTotalMs = 0;
        // this.timer = setInterval(() => this.monitoring(), 1000);
    }

    public override destroy(): void {
        // clearTimeout(this.timer);
        this._media_element.removeEventListener('pause', this.e.onPause);
        this._media_element.removeEventListener('play', this.e.onPlay);
        super.destroy();
    }

    // protected override _onMediaSeeking(e: Event): void {
    //     if (this.isLive) {
    //         return super._onMediaSeeking(e);
    //     }
    //     if (this._request_set_current_time) {
    //         this._request_set_current_time = false;
    //         return;
    //     }
    //     super._onMediaSeeking(e);
    // }
    protected _onMediaSeeking(e: Event): void {
        console.log(this.TAG, '_onMediaSeeking', this.isLive, this._request_set_current_time, this._media_element.currentTime, this._media_element.paused);
        if (this.isLive) {
            return super._onMediaSeeking(e);
        }
        if (this._request_set_current_time) {
            this._request_set_current_time = false;
            return;
        }
        // else: Prepare for unbuffered seeking
        // Defer the unbuffered seeking since the seeking bar maybe still being draged
        this._seek_request_record_clocktime = SeekingHandler._getClockTime();
        window.setTimeout(this._pollAndApplyUnbufferedSeek.bind(this), 50);
    }

    protected override _isPositionBuffered(seconds: number): boolean {
        if (this.isLive) {
            return super._isPositionBuffered(seconds);
        }
        return false;
    }

    private _onPlay(event) {
        console.debug(this.TAG, '_onPlay', this._media_element.paused, this.pausedPosition);
        return this._on_unbuffered_seek(this.isLive ? 0 : this.pausedPosition * 1000); // sec to millisec
        //return this.on_resume_transmuxer();

        // if (this.isLive) return;
        // if (isNaN(this.pausedAt)) return;
        // const pausedMs = SeekingHandler._getClockTime() - this.pausedAt;
        // this.pausedTotalMs += pausedMs;
        // this.pausedAt = NaN;
        // console.debug(this.TAG, '_onPlay', this._media_element.paused, this.pausedPosition, pausedMs);
    }

    private _onPause(event) {
        this.pausedPosition = this._media_element.currentTime;
        console.debug(this.TAG, '_onPause', this._media_element.paused, this.pausedPosition);
        return this.on_pause_transmuxer();

        // if (this.isLive) return;
        // this.pausedPosition = this._media_element.currentTime;
        // this.pausedAt = SeekingHandler._getClockTime();
        // console.debug(this.TAG, '_onPause', this._media_element.paused, this.pausedPosition);
    }

}

export default MediaedgeSeekingHandler;
