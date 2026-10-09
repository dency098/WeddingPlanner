import { useContext } from 'react';
import { ComparisonContext } from './comparison-context';

export function useVenueComparison() {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error('useVenueComparison must be used within ComparisonProvider.');
  return context;
}
