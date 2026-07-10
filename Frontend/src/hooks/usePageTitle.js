import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | MarketMind AI` : 'MarketMind AI';
  }, [title]);
}