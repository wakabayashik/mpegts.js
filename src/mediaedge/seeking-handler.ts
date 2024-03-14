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

    private pausedOnSeek: boolean;
    // private pausedPosition: number;
    // private pausedAt: number;
    // private pausedTotalMs: number;
    public isLive: boolean;

    public constructor(config: any, media_element: HTMLMediaElement, on_unbuffered_seek: (milliseconds: number) => void) {
        super(config, media_element, on_unbuffered_seek, 'MediaedgeSeekingHandler');
        // console.debug(this.TAG, 'constructor', config);
        // this.e.onPlay = this._onPlay.bind(this);
        // this.e.onPause = this._onPause.bind(this);
        // this._media_element.addEventListener('play', this.e.onPlay);
        // this._media_element.addEventListener('pause', this.e.onPause);
        this.pausedOnSeek = false;
        // this.pausedPosition = NaN;
        // this.pausedAt = NaN;
        // this.pausedTotalMs = 0;
    }

    public override destroy(): void {
        this._media_element.removeEventListener('pause', this.e.onPause);
        this._media_element.removeEventListener('play', this.e.onPlay);
        super.destroy();
    }

    protected override _onMediaSeeking(e: Event): void {
        if (this.isLive) {
            return super._onMediaSeeking(e);
        }
        if (this._request_set_current_time) {
            this._request_set_current_time = false;
            if (!this.pausedOnSeek) {
                setTimeout(() => this._media_element.play(), 500);
            }
            return;
        }
        this.pausedOnSeek = this._media_element.paused;
        super._onMediaSeeking(e);
    }

    // protected override _isPositionBuffered(seconds: number): boolean {
    //     if (this.isLive) {
    //         return super._isPositionBuffered(seconds);
    //     }
    //     return false;
    // }

    // private _onPlay(event) {
    //     if (this.isLive) return;
    //     if (isNaN(this.pausedAt)) return;
    //     const pausedMs = SeekingHandler._getClockTime() - this.pausedAt;
    //     this.pausedOnSeek = false;
    //     this.pausedTotalMs += pausedMs;
    //     this.pausedAt = NaN;
    //     console.debug(this.TAG, '_onPlay', this._media_element.paused, this.pausedPosition, pausedMs);
    // }

    // private _onPause(event) {
    //     if (this.isLive) return;
    //     this.pausedPosition = this._media_element.currentTime;
    //     this.pausedAt = SeekingHandler._getClockTime();
    //     console.debug(this.TAG, '_onPause', this._media_element.paused, this.pausedPosition);
    // }

}

export default MediaedgeSeekingHandler;
