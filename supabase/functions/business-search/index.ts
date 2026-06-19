import { handleOptions, json, requireEnv } from '../_shared/http.ts';
import { requireWorkspaceUser } from '../_shared/clients.ts';

type JsonRecord = Record<string, unknown>;

const stringValue = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const numberValue = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function normalizeBusiness(raw: JsonRecord) {
  const externalId = stringValue(raw.place_id ?? raw.google_id ?? raw.cid ?? raw.query);
  const name = stringValue(raw.name ?? raw.business_name);
  if (!externalId || !name) return null;
  const hours = raw.working_hours ?? raw.hours;
  const reviews = raw.reviews_data ?? raw.reviews_content ?? raw.reviews_list;
  return {
    business: {
      external_id: externalId,
      google_place_id: stringValue(raw.place_id) || null,
      name,
      category: stringValue(raw.type ?? raw.category ?? raw.subtypes),
      address: stringValue(raw.full_address ?? raw.address),
      city: stringValue(raw.city),
      phone: stringValue(raw.phone ?? raw.phone_number),
      email: stringValue(raw.email),
      website: stringValue(raw.site ?? raw.website),
      google_maps_url: stringValue(raw.google_maps_url ?? raw.location_link),
      rating: numberValue(raw.rating),
      review_count: Math.max(0, Math.trunc(numberValue(raw.reviews ?? raw.reviews_count) ?? 0)),
      hours: hours && typeof hours === 'object' && !Array.isArray(hours) ? hours : {},
      raw_profile: raw,
      last_scraped_at: new Date().toISOString(),
    },
    reviews: Array.isArray(reviews) ? reviews : [],
  };
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  let searchRunId: string | null = null;
  try {
    const payload = await request.json();
    const category = stringValue(payload.category);
    const location = stringValue(payload.location);
    const website = stringValue(payload.website);
    const limit = Math.min(50, Math.max(1, Math.trunc(numberValue(payload.limit) ?? 20)));
    if (!website && (!category || !location)) {
      return json({ error: 'Enter both a business type and an area, or paste a website.' }, 400);
    }

    const { user, supabase } = await requireWorkspaceUser(request);
    const { data: run, error: runError } = await supabase.from('search_runs').insert({
      created_by: user.id,
      category,
      location,
      website_query: website,
      status: 'pending',
    }).select('id').single();
    if (runError) throw runError;
    searchRunId = run.id;

    const query = website || `${category} in ${location}`;
    const url = new URL('https://api.app.outscraper.com/maps/search-v3');
    url.searchParams.set('query', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('reviewsLimit', '5');
    url.searchParams.set('language', 'en');
    url.searchParams.set('async', 'false');

    const providerResponse = await fetch(url, {
      headers: { 'X-API-KEY': requireEnv('OUTSCRAPER_API_KEY') },
    });
    const providerResult = await providerResponse.json();
    if (!providerResponse.ok) {
      throw new Error(providerResult?.error ?? providerResult?.message ?? 'Outscraper rejected the search.');
    }

    const rawData = Array.isArray(providerResult?.data) ? providerResult.data.flat(Infinity) : [];
    const normalized = rawData
      .filter((item: unknown): item is JsonRecord => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
      .map(normalizeBusiness)
      .filter(Boolean) as NonNullable<ReturnType<typeof normalizeBusiness>>[];

    const businesses = [];
    for (const [rank, item] of normalized.entries()) {
      const { data: business, error: businessError } = await supabase.from('businesses')
        .upsert(item.business, { onConflict: 'external_id' })
        .select('*')
        .single();
      if (businessError) throw businessError;
      businesses.push({ ...business, recent_reviews: item.reviews });
      await supabase.from('search_results').upsert({ search_run_id: run.id, business_id: business.id, result_rank: rank });

      const reviewRows = item.reviews.map((review: JsonRecord, index: number) => ({
        business_id: business.id,
        provider_review_id: stringValue(review.review_id ?? review.id) || `${business.id}-${index}`,
        author_name: stringValue(review.author_title ?? review.author_name ?? review.author),
        rating: Math.max(0, Math.min(5, Math.trunc(numberValue(review.review_rating ?? review.rating) ?? 0))),
        review_text: stringValue(review.review_text ?? review.text),
        review_date: stringValue(review.review_datetime_utc ?? review.review_date ?? review.datetime) || null,
        owner_response: stringValue(review.owner_answer ?? review.owner_response) || null,
      }));
      if (reviewRows.length) await supabase.from('business_reviews').upsert(reviewRows, { onConflict: 'business_id,provider_review_id' });
    }

    await supabase.from('search_runs').update({
      status: 'complete',
      result_count: businesses.length,
      provider_job_id: stringValue(providerResult?.id) || null,
      completed_at: new Date().toISOString(),
    }).eq('id', run.id);
    return json({ searchRunId: run.id, businesses });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Business search failed.';
    try {
      if (searchRunId) {
        const { supabase } = await requireWorkspaceUser(request);
        await supabase.from('search_runs').update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() }).eq('id', searchRunId);
      }
    } catch { /* preserve the provider error */ }
    return json({ error: message }, message === 'Unauthorized' || message === 'Access denied' ? 401 : 400);
  }
});
