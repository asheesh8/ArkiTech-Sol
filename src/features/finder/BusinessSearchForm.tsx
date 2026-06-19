import { Globe2, LoaderCircle, MapPin, Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '../../components/ui';
import type { FinderSearchInput } from './finderTypes';

interface Props {
  value: FinderSearchInput;
  loading: boolean;
  onChange(value: FinderSearchInput): void;
  onSubmit(): void;
}

export function BusinessSearchForm({ value, loading, onChange, onSubmit }: Props) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return <form className="finder-search" onSubmit={submit}>
    <div className="finder-search-row">
      <label><span>Business type</span><div className="finder-input"><Search size={17} /><input aria-label="Business type" value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })} placeholder="Dentists, roofers, med spas…" /></div></label>
      <label><span>Area</span><div className="finder-input"><MapPin size={17} /><input aria-label="Area" value={value.location} onChange={(event) => onChange({ ...value, location: event.target.value })} placeholder="Baltimore, MD or 21231" /></div></label>
      <Button type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}{loading ? 'Searching…' : 'Search businesses'}</Button>
    </div>
    <div className="finder-website-row"><span>or</span><label><Globe2 size={15} /><input aria-label="Business website" value={value.website} onChange={(event) => onChange({ ...value, website: event.target.value })} placeholder="Paste a specific business website" /></label></div>
  </form>;
}
