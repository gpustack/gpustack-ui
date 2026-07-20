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
  const audioRequestSequence = useRef(0);
  const activeCaptchaId = useRef('');

  const refresh = async () => {
    const sequence = ++requestSequence.current;
    activeCaptchaId.current = '';
    ++audioRequestSequence.current;
    // A challenge is single-use. Never leave an old token available while a
    // replacement is loading or after that replacement fails.
    setCaptcha({ ...EMPTY, loading: true });
    try {
      const { captcha_id, image } = await fetchCaptcha();
      if (sequence !== requestSequence.current) {
        return false;
      }
      activeCaptchaId.current = captcha_id;
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
    const captchaId = activeCaptchaId.current;
    if (!captchaId) {
      return false;
    }
    const sequence = ++audioRequestSequence.current;
    setCaptcha((current) =>
      current.captchaId === captchaId
        ? {
            ...current,
            audioLoading: true,
            audioError: false
          }
        : current
    );
    try {
      const { audio } = await fetchCaptchaAudio(captchaId);
      if (
        sequence !== audioRequestSequence.current ||
        activeCaptchaId.current !== captchaId
      ) {
        return false;
      }
      setCaptcha((current) =>
        current.captchaId === captchaId
          ? {
              ...current,
              audio,
              audioLoading: false,
              audioError: false
            }
          : current
      );
      return true;
    } catch {
      if (
        sequence === audioRequestSequence.current &&
        activeCaptchaId.current === captchaId
      ) {
        setCaptcha((current) =>
          current.captchaId === captchaId
            ? {
                ...current,
                audio: '',
                audioLoading: false,
                audioError: true
              }
            : current
        );
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
