import { ExternalLink, MapPin, Phone, Star } from 'lucide-react';
import { Button, EmptyState } from '../../components/ui';
import type { BusinessProfile } from './finderTypes';

export function BusinessResults({ results, selectedId, searched, onSelect }: { results: BusinessProfile[]; selectedId?: string; searched: boolean; onSelect(business: BusinessProfile): void }) {
  if (!results.length) {
    return <div className="finder-empty"><EmptyState title={searched ? 'No businesses found' : 'Search an area to build your first list'} body={searched ? 'Try a broader area, a simpler category, or a specific website.' : 'Real Google Business Profile results will appear here—no sample data.'} /></div>;
  }

  return <div className="business-results" aria-label="Business results">
    <div className="results-head"><span>Business</span><span>Google profile</span><span>Contact</span><span /></div>
    {results.map((business) => <article className={`business-row ${selectedId === business.id ? 'selected' : ''}`} key={business.externalId}>
      <div className="business-main"><strong>{business.name}</strong><span>{business.category || 'Local business'}</span><small><MapPin size={13} />{business.address || business.city || 'Address unavailable'}</small></div>
      <div className="business-rating"><strong><Star size={15} fill="currentColor" />{business.rating?.toFixed(1) ?? '—'}</strong><span>{business.reviewCount.toLocaleString()} reviews</span>{business.googleMapsUrl ? <a href={business.googleMapsUrl} target="_blank" rel="noreferrer">Google profile <ExternalLink size={12} /></a> : null}</div>
      <div className="business-contact"><span><Phone size={13} />{business.phone || 'Phone unavailable'}</span>{business.website ? <a href={business.website} target="_blank" rel="noreferrer">Visit website <ExternalLink size={12} /></a> : <small>Website unavailable</small>}</div>
      <Button variant={selectedId === business.id ? 'secondary' : 'primary'} onClick={() => onSelect(business)} aria-label={`Select ${business.name}`}>{selectedId === business.id ? 'Selected' : 'Onboard'}</Button>
    </article>)}
  </div>;
}
