import { useRef, useState } from 'react';
import { fetchCaptcha, fetchCaptchaAudio } from '../apis';

// captcha_id (the opaque token) and its image travel together, so they live in
// one state object rather than two separate atoms.
type CaptchaState = {
  captchaId: string;
  image: string;
  audio: string;
  loading: boolean;
  audioLoading: boolean;
  error: boolean;
  audioError: boolean;
};

const EMPTY: CaptchaState = {
  captchaId: '',
  image: '',
  audio: '',
  loading: false,
  audioLoading: false,
  error: false,
  audioError: false
};

// Manages the login CAPTCHA challenge. Refresh is an explicit action (mount,
// image click, failed login) rather than an effect-driven fetch, per the
// project's data-fetching convention.
export const useCaptcha = () => {
  const [captcha, setCaptcha] = useState<CaptchaState>(EMPTY);
  const requestSequence = useRef(0);

  const refresh = async () => {
    const sequence = ++requestSequence.current;
    // A challenge is single-use. Never leave an old token available while a
    // replacement is loading or after that replacement fails.
    setCaptcha({ ...EMPTY, loading: true });
    try {
      const { captcha_id, image } = await fetchCaptcha();
      if (sequence !== requestSequence.current) {
        return false;
      }
      setCaptcha({
        captchaId: captcha_id,
        image,
        audio: '',
        loading: false,
        audioLoading: false,
        error: false,
        audioError: false
      });
      return true;
    } catch {
      if (sequence === requestSequence.current) {
        setCaptcha({ ...EMPTY, error: true });
      }
      return false;
    }
  };

  const loadAudio = async () => {
    const sequence = requestSequence.current;
    const captchaId = captcha.captchaId;
    if (!captchaId) {
      return false;
    }
    setCaptcha((current) => ({
      ...current,
      audioLoading: true,
      audioError: false
    }));
    try {
      const { audio } = await fetchCaptchaAudio(captchaId);
      if (sequence !== requestSequence.current) {
        return false;
      }
      setCaptcha((current) => ({
        ...current,
        audio,
        audioLoading: false,
        audioError: false
      }));
      return true;
    } catch {
      if (sequence === requestSequence.current) {
        setCaptcha((current) => ({
          ...current,
          audio: '',
          audioLoading: false,
          audioError: true
        }));
      }
      return false;
    }
  };

  return {
    captchaId: captcha.captchaId,
    image: captcha.image,
    audio: captcha.audio,
    loading: captcha.loading,
    audioLoading: captcha.audioLoading,
    error: captcha.error,
    audioError: captcha.audioError,
    refresh,
    loadAudio
  };
};
