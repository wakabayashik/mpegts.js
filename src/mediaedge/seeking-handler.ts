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

enum State {
    unknonwn = 0,
    playing = 1,
    paused = 2,
    seeking = 3,
}

class MediaedgeSeekingHandler extends SeekingHandler {

    private _on_direct_seek: (target: number) => void;
    private _on_pause_transmuxer: () => void;
    private _startup_stall_jumper?: StartupStallJumper = null;
    private _seekable: boolean = false;
    private _state_: State = State.unknonwn;

    public constructor(config: any, media_element: HTMLMediaElement,
        on_unbuffered_seek: (milliseconds: number) => void,
        on_direct_seek: (target: number) => void,
        on_pause_transmuxer: () => void
    ) {
        super(config, media_element, on_unbuffered_seek, 'MediaedgeSeekingHandler');
        // console.debug(this.TAG, 'constructor', config);
        this._on_direct_seek = on_direct_seek;
        this._on_pause_transmuxer = on_pause_transmuxer;
        this.e.onSeeked = this._onSeeked.bind(this);
        this.e.onPlay = this._onPlay.bind(this);
        this.e.onPause = this._onPause.bind(this);
        this.e.onRateChange = this._onRateChange.bind(this);
        this._state_ = this._media_element.paused ? State.paused : State.playing;
    }

    private get _state() {
        return this._state_;
    }

    private set _state(value) {
        // console.log(this.TAG, `update state ${State[this._state_]} -> ${State[value]}`);
        this._state_ = value;
    }

    public set seekable(value: boolean) {
        if (this._seekable !== value) {
            this._seekable = value;
            this._off();
            if (this._seekable) this._on();
        }
    }

    public override destroy(): void {
        this._off();
        this._startup_stall_jumper?.destroy();
        this._startup_stall_jumper = null;
        super.destroy();
    }

    protected override _onMediaSeeking(e: Event): void {
        if (!this._seekable) {
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
        this._state = State.seeking;
    }

    protected override _isPositionBuffered(seconds: number): boolean {
        if (!this._seekable) {
            return super._isPositionBuffered(seconds);
        }
        return false;
    }

    private _on() {
        this._media_element.addEventListener('seeked', this.e.onSeeked);
        this._media_element.addEventListener('play', this.e.onPlay);
        this._media_element.addEventListener('pause', this.e.onPause);
        this._media_element.addEventListener('ratechange', this.e.onRateChange);
    }

    private _off() {
        this._media_element.removeEventListener('ratechange', this.e.onRateChange);
        this._media_element.removeEventListener('pause', this.e.onPause);
        this._media_element.removeEventListener('play', this.e.onPlay);
        this._media_element.removeEventListener('seeked', this.e.onSeeked);
    }

    private _onSeeked(e: Event) {
        if (this._state === State.paused) this._media_element.play();
        this._state = this._media_element.paused ? State.paused : State.playing;
        this._startup_stall_jumper?.destroy();
        this._startup_stall_jumper = new StartupStallJumper(this._media_element, this._on_direct_seek);
        if (this._media_element.paused) this._on_pause_transmuxer();
    }

    private _onPlay(e: Event) {
        if (this._state !== State.paused) return; // skip events while seeking
        this._media_element.pause();
        return this._on_unbuffered_seek(this._media_element.currentTime * 1000); // sec to millisec
    }

    private _onPause(e: Event) {
        if (this._state !== State.playing) return; // skip events while seeking
        this._state = State.paused;
        return this._on_pause_transmuxer();
    }

    private _onRateChange(e: Event) {
        if (this._media_element.paused) return;
        return this._on_unbuffered_seek(this._media_element.currentTime * 1000); // sec to millisec
    }

}

export default MediaedgeSeekingHandler;
