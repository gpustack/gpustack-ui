import externalLinks from '@/constants/external-links';
import { GithubFilled } from '@ant-design/icons';
import { nsLocal } from '@gpustack/core-ui/utils';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

const REPO = 'gpustack/gpustack';
const CACHE_KEY = 'gpustack:github-stars';
const CACHE_TTL = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT = 4000;

const StarLink = styled.a`
  display: inline-flex;
  align-items: stretch;
  height: 24px;
  border-radius: var(--ant-border-radius);
  border: 1px solid var(--ant-color-border-secondary);
  background-color: var(--ant-color-bg-container);
  color: var(--ant-color-text-secondary);
  font-size: 12px;
  line-height: 1;
  overflow: hidden;
  transition:
    border-color 0.2s,
    color 0.2s;

  &:hover {
    border-color: var(--ant-color-border);
    color: var(--ant-color-text);
  }

  .seg {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
  }

  .seg + .seg {
    border-left: 1px solid var(--ant-color-border-secondary);
    background-color: var(--ant-color-fill-quaternary);
  }

  .anticon {
    font-size: 13px;
  }

  .count {
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    min-width: 1.5em;
    text-align: center;
  }
`;

const formatCount = (n: number): string => {
  if (n >= 1000) {
    const k = n / 1000;
    return k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
};

type CacheEntry = { value: number; time: number };

const readCache = (): CacheEntry | null => {
  try {
    const raw = nsLocal.get(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.value !== 'number' || typeof parsed?.time !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (value: number) => {
  try {
    nsLocal.set(CACHE_KEY, JSON.stringify({ value, time: Date.now() }));
  } catch {
    // ignore quota errors
  }
};

const GithubStar = () => {
  const intl = useIntl();
  const [count, setCount] = useState<number | null>(
    () => readCache()?.value ?? null
  );

  useEffect(() => {
    const cached = readCache();
    const fresh = cached && Date.now() - cached.time < CACHE_TTL;
    if (fresh) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    fetch(`https://api.github.com/repos/${REPO}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || typeof data.stargazers_count !== 'number') return;
        setCount(data.stargazers_count);
        writeCache(data.stargazers_count);
      })
      .catch(() => {
        // offline, blocked, rate-limited — stay hidden if no cache
      })
      .finally(() => clearTimeout(timer));

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return (
    <Tooltip title={intl.formatMessage({ id: 'common.github.star.tooltip' })}>
      <StarLink href={externalLinks.github} target="_blank" rel="noreferrer">
        <span className="seg">
          <GithubFilled />
        </span>
        <span className="seg">
          <span className="count">
            {count != null ? formatCount(count) : 'Star'}
          </span>
        </span>
      </StarLink>
    </Tooltip>
  );
};

export default GithubStar;
