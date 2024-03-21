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
import StartupStallJumper from "../player/startup-stall-jumper";

class MediaedgeSeekingHandler extends SeekingHandler {

    private _on_direct_seek: (target: number) => void;
    private _on_pause_transmuxer: () => void;
    private _pausedPosition: number;
    private _startup_stall_jumper?: StartupStallJumper = null;
    private _timer: any;
    public isLive: boolean;

    public constructor(config: any, media_element: HTMLMediaElement,
        on_unbuffered_seek: (milliseconds: number) => void,
        on_direct_seek: (target: number) => void,
        on_pause_transmuxer: () => void
    ) {
        super(config, media_element, on_unbuffered_seek, 'MediaedgeSeekingHandler');
        // console.debug(this.TAG, 'constructor', config);
        this._on_direct_seek = on_direct_seek;
        this._on_pause_transmuxer = on_pause_transmuxer;
        this.e.onPlay = this._onPlay.bind(this);
        this.e.onPause = this._onPause.bind(this);
        this._media_element.addEventListener('play', this.e.onPlay);
        this._media_element.addEventListener('pause', this.e.onPause);
        this._pausedPosition = NaN;
        this._startup_stall_jumper = null;
        this._timer = null;
        this.isLive = false;
    }

    public override destroy(): void {
        clearTimeout(this._timer);
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
            return;
        }
        // else: Prepare for unbuffered seeking
        // Defer the unbuffered seeking since the seeking bar maybe still being draged
        this._seek_request_record_clocktime = SeekingHandler._getClockTime();
        window.setTimeout(this._pollAndApplyUnbufferedSeek.bind(this), 50);
        if (this._media_element.paused) {
            this._pausedPosition = this._media_element.currentTime;
            clearTimeout(this._timer);
            this._timer = setTimeout(() => this._media_element.paused ? this._on_pause_transmuxer() : undefined, 300);
        }
    }

    protected override _isPositionBuffered(seconds: number): boolean {
        if (this.isLive) {
            return super._isPositionBuffered(seconds);
        }
        return false;
    }

    private _onPlay(e: Event) {
        if (this._startup_stall_jumper) this._startup_stall_jumper.destroy();
        this._startup_stall_jumper = new StartupStallJumper(this._media_element, this._on_direct_seek);
        return this._on_unbuffered_seek(this.isLive ? 0 : this._pausedPosition * 1000); // sec to millisec
    }

    private _onPause(e: Event) {
        this._pausedPosition = this._media_element.currentTime;
        return this._on_pause_transmuxer();
    }

}

export default MediaedgeSeekingHandler;
