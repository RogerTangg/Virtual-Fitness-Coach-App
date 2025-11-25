/**
 * 音效工具 (Audio Utility)
 * 使用 Web Audio API 產生低延遲的合成音效，不需依賴外部音訊檔案。
 */

// 建立單例 AudioContext
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

/**
 * 播放嗶聲
 * @param duration 持續時間 (秒)
 * @param frequency 頻率 (Hz)
 * @param type 波形類型
 */
export const playTone = (duration = 0.1, frequency = 880, type: OscillatorType = 'sine') => {
  try {
    const ctx = getAudioContext();
    
    // 確保 Context 處於運行狀態 (某些瀏覽器需要使用者互動後才能播放)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // 音量包絡線 (避免爆音)
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

/**
 * 倒數計時短音 (3, 2, 1)
 */
export const playShortBeep = () => {
  playTone(0.1, 1000, 'sine'); // 高頻短音
};

/**
 * 開始/結束長音 (GO / DONE)
 */
export const playLongBeep = () => {
  playTone(0.6, 600, 'square'); // 低頻長音，方形波較有穿透力
};
