import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Form } from '@/components/ui/form';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  LogOut,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from 'lucide-react';
import {
  getGetCurrentUserQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetLeadsQueryKey,
  getGetSearchHistoryQueryKey,
  useGetDashboardSummary,
  useGetLeads,
  useGetSearchHistory,
  useLogout,
  useSearchBusinesses,
  type BusinessSearchInput,
  type Lead,
  type SearchResult,
  type SessionUser,
} from '@workspace/api-client-react';
import { AutocompleteField } from '@/components/AutocompleteField';
import { SetupNotice } from '@/components/SetupNotice';

const PAGE_SIZE = 8;

// Dashboard ke stats hamesha backend ke real response se aate hain.
function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: typeof UsersRound;
  tone: 'violet' | 'green' | 'amber';
}) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-top"><span>{label}</span><i><Icon size={17} /></i></div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-note">{note}</span>
      <span className="stat-decoration" aria-hidden="true" />
    </article>
  );
}

// Search result ko counts aur actual saved leads mein seedha dikhate hain.
function SearchOutcome({ result }: { result: SearchResult }) {
  return (
    <section className="outcome-card page-enter" aria-live="polite" data-testid="search-result">
      <div className="outcome-heading">
        <span className="outcome-icon"><Sparkles size={17} /></span>
        <div><p className="eyebrow">SEARCH COMPLETE</p><h2>Here’s what we found</h2></div>
      </div>
      <div className="outcome-metrics">
        <div><strong>{result.totalProcessed}</strong><span>businesses checked</span></div>
        <div><strong>{result.websiteListed}</strong><span>with website listed</span></div>
        <div><strong>{result.newLeads}</strong><span>new leads saved</span></div>
        <div><strong>{result.duplicates}</strong><span>already in your list</span></div>
      </div>
      <p className="outcome-footnote"><Check size={14} /> Search results are saved to your workspace. No sample or placeholder leads are shown.</p>
    </section>
  );
}

// Lead card location, contact aur source ko ek scan mein rakhta hai.
function LeadRow({ lead }: { lead: Lead }) {
  const initials = lead.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const date = new Date(lead.createdAt);
  const dateText = Number.isNaN(date.getTime()) ? 'Recently added' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  return (
    <article className="lead-row" data-testid={`row-lead-${lead.id}`}>
      <div className="lead-identity">
        <span className="lead-avatar">{initials || <Building2 size={17} />}</span>
        <div className="lead-name-block">
          <strong>{lead.name}</strong>
          <span>{lead.category || 'Local business'}</span>
        </div>
      </div>
      <div className="lead-location">
        <MapPin size={15} />
        <span title={lead.address}>{lead.address || lead.searchLocation}</span>
      </div>
      <div className="lead-signals">
        {lead.rating !== null && lead.rating !== undefined ? (
          <span className="rating-signal"><Star size={14} fill="currentColor" /> {lead.rating.toFixed(1)}{lead.reviewCount !== null && lead.reviewCount !== undefined && <small>({lead.reviewCount})</small>}</span>
        ) : <span className="no-rating">No rating</span>}
      </div>
      <div className="lead-contact">
        {lead.phone ? <a href={`tel:${lead.phone}`} data-testid={`link-phone-${lead.id}`}><Phone size={14} />{lead.phone}</a> : <span className="no-rating">No phone listed</span>}
      </div>
      <div className="lead-website">
        <span className="website-badge"><span /> Not listed</span>
        <small>{dateText}</small>
      </div>
      {lead.googleMapsUrl && (
        <a className="lead-map-link" href={lead.googleMapsUrl} target="_blank" rel="noreferrer" aria-label={`Open ${lead.name} in Google Maps`} data-testid={`link-maps-${lead.id}`}>
          <ExternalLink size={16} />
        </a>
      )}
    </article>
  );
}

// Main sales workspace search, stats aur MongoDB-backed lead list ko jodta hai.
export default function DashboardPage({ user }: { user: SessionUser }) {
  const queryClient = useQueryClient();
  const searchForm = useForm<BusinessSearchInput>({ defaultValues: { location: '', category: '' } });
  const location = useWatch({ control: searchForm.control, name: 'location' });
  const category = useWatch({ control: searchForm.control, name: 'category' });
  const [leadFilter, setLeadFilter] = useState('');
  const [page, setPage] = useState(1);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const summary = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey(), retry: 1 },
  });
  const historyParams = useMemo(() => ({ limit: 5 }), []);
  const history = useGetSearchHistory(historyParams, {
    query: { queryKey: getGetSearchHistoryQueryKey(historyParams), retry: 1 },
  });
  const leadsParams = useMemo(
    () => ({ query: leadFilter.trim() || undefined, page, pageSize: PAGE_SIZE }),
    [leadFilter, page],
  );
  const leads = useGetLeads(leadsParams, {
    query: { queryKey: getGetLeadsQueryKey(leadsParams), retry: 1 },
  });
  const search = useSearchBusinesses();
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const savedLeads = leads.data?.items ?? [];
  const maxPage = Math.max(1, Math.ceil((leads.data?.total ?? 0) / PAGE_SIZE));

  // Search ke baad lead list, history aur summary ko dobara load karte hain.
  const submitSearch = (values: BusinessSearchInput) => {
    const cleanLocation = values.location.trim();
    const cleanCategory = values.category.trim();
    if (cleanLocation.length < 2 || cleanCategory.length < 2) {
      setSearchError('Add a location and business type with at least 2 characters each.');
      return;
    }
    setSearchError('');
    search.mutate(
      { data: { location: cleanLocation, category: cleanCategory } },
      {
        onSuccess: (result) => {
          setSearchResult(result);
          setPage(1);
          void queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetSearchHistoryQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
        onError: () => setSearchError('Search couldn’t finish. Check the setup checklist and try again.'),
      },
    );
  };

  // Session logout ke baad purane workspace data cache mein nahi rehta.
  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation('/login');
      },
      onError: () => setSearchError('Sign out failed. Please try again.'),
    });
  };

  const latest = summary.data?.latestSearch;
  const avatarLetters = user.email.slice(0, 1).toUpperCase();

  return (
    <div className="dashboard-shell app-frame">
      <aside className="sidebar">
        <div className="brand-lockup brand-lockup-light">
          <span className="brand-symbol"><span /><span /><span /></span><span>webwin</span>
        </div>
        <div className="sidebar-caption">WORKSPACE</div>
        <div className="sidebar-nav">
          <a href="#overview" className="sidebar-link sidebar-link-active" data-testid="link-lead-finder"><span className="nav-glyph"><Search size={17} /></span><span>Lead finder</span><span className="nav-active-dot" /></a>
          <a href="#saved-leads" className="sidebar-link" data-testid="link-saved-leads"><span className="nav-glyph"><Building2 size={17} /></span><span>Saved leads</span></a>
          <a href="#search-activity" className="sidebar-link" data-testid="link-search-activity"><span className="nav-glyph"><Clock3 size={17} /></span><span>Search activity</span></a>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="note-star"><Sparkles size={15} /></span><p>Small business.<br /><b>Big opportunity.</b></p></div>
          <div className="sidebar-user">
            <span className="user-avatar">{avatarLetters}</span>
            <span className="sidebar-user-copy"><b>{user.email}</b><small>{user.role === 'admin' ? 'Workspace admin' : 'Sales member'}</small></span>
            <button type="button" className="logout-button" aria-label="Sign out" data-testid="button-logout" disabled={logout.isPending} onClick={handleLogout}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <main className="dashboard-main" id="overview">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span>/</span><b>Lead finder</b></div>
          <div className="topbar-right">
            <span className="secure-label"><ShieldCheck size={15} /> Private workspace</span>
            <span className="topbar-avatar">{avatarLetters}</span>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row page-enter">
            <div>
              <p className="eyebrow">YOUR LOCAL DISCOVERY DESK</p>
              <h1>Good to see you<span className="period-mark">.</span></h1>
              <p className="welcome-copy">Find promising local businesses in a few thoughtful clicks.</p>
            </div>
            <div className="date-pill"><Sparkles size={14} /> Live workspace</div>
          </section>

          <section className="stats-grid page-enter stagger-1" aria-label="Search statistics">
            {summary.isLoading ? (
              <>
                {[0, 1, 2].map((index) => <div className="stat-card stat-skeleton" key={index}><span className="skeleton skeleton-line short" /><span className="skeleton skeleton-number" /><span className="skeleton skeleton-line" /></div>)}
              </>
            ) : summary.isError ? (
              <div className="query-error stats-error" role="alert">
                <span>Statistics couldn’t load.</span><button type="button" className="text-action" onClick={() => void summary.refetch()}>Try again</button>
              </div>
            ) : (
              <>
                <StatCard label="Saved leads" value={summary.data?.totalLeads ?? 0} note="Businesses saved to your list" icon={UsersRound} tone="violet" />
                <StatCard label="Searches today" value={summary.data?.searchesToday ?? 0} note="Discovery runs so far today" icon={Search} tone="green" />
                <StatCard
                  label="Latest search"
                  value={latest ? latest.newLeads : '—'}
                  note={latest ? `${latest.category} · ${latest.location}` : 'No searches yet'}
                  icon={Clock3}
                  tone="amber"
                />
              </>
            )}
          </section>

          <section className="search-card page-enter stagger-2" aria-labelledby="search-heading">
            <div className="search-card-heading">
              <div className="search-title-icon"><Search size={19} /></div>
              <div><p className="eyebrow">GOOGLE PLACES DISCOVERY</p><h2 id="search-heading">Find local businesses</h2><p>Choose a place and a business type to get started.</p></div>
            </div>
            <Form {...searchForm}>
            <form className="business-search-form" onSubmit={searchForm.handleSubmit(submitSearch)}>
              <AutocompleteField kind="location" label="Where?" placeholder="Try Austin, TX" value={location} onChange={(value) => searchForm.setValue('location', value, { shouldDirty: true })} />
              <span className="search-join" aria-hidden="true">in</span>
              <AutocompleteField kind="category" label="What kind of business?" placeholder="Try independent cafés" value={category} onChange={(value) => searchForm.setValue('category', value, { shouldDirty: true })} />
              <button className="button-primary search-submit" type="submit" disabled={search.isPending} data-testid="button-search-businesses">
                {search.isPending ? <><span className="mini-spinner spinner-light" /> Searching</> : <>Find businesses <ArrowRight size={16} /></>}
              </button>
            </form>
            </Form>
            {searchError && <p className="form-alert search-alert" role="alert" data-testid="status-search-error">{searchError}</p>}
            <div className="search-footnote"><Sparkles size={14} /><span>Search results are based on Google Places listings and saved to your team workspace.</span></div>
          </section>

          <div className="discovery-note page-enter stagger-2">
            <span className="note-icon"><i /></span>
            <p><b>A useful signal, not a certainty.</b> “No website listed” means Google Places didn’t provide a website for this business. It does <b>not</b> prove the business has no website.</p>
          </div>

          {search.isPending && (
            <section className="search-progress" role="status" aria-live="polite" data-testid="status-search-loading">
              <span className="progress-orbit"><span /></span><div><b>Looking around {location || 'your area'}…</b><span>Checking Google Places listings and saving eligible leads.</span></div>
            </section>
          )}
          {searchResult && <SearchOutcome result={searchResult} />}

          <section className="lower-grid page-enter stagger-3">
            <div className="panel leads-panel" id="saved-leads">
              <div className="panel-heading">
                <div><p className="eyebrow">YOUR PROSPECT LIST</p><h2>Saved leads <span className="count-chip">{leads.data?.total ?? (leads.isLoading ? '…' : 0)}</span></h2></div>
                <div className="lead-filter-wrap"><Search size={15} /><input aria-label="Filter saved leads" data-testid="input-filter-leads" placeholder="Filter leads" value={leadFilter} onChange={(event) => { setLeadFilter(event.target.value); setPage(1); }} /><button aria-label="Clear lead filter" type="button" data-testid="button-clear-filter" onClick={() => { setLeadFilter(''); setPage(1); }} disabled={!leadFilter}><span>×</span></button></div>
              </div>
              {leads.isLoading ? (
                <div className="lead-skeleton-list" aria-label="Loading saved leads">{[0, 1, 2].map((row) => <div className="lead-skeleton" key={row}><span className="skeleton skeleton-avatar" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line short" /></div>)}</div>
              ) : leads.isError ? (
                <div className="empty-state compact-empty" role="alert"><span className="empty-icon"><Building2 size={20} /></span><b>Your lead list is taking a break.</b><p>Check your MongoDB setup or connection, then retry.</p><button type="button" className="button-secondary" onClick={() => void leads.refetch()}>Retry loading leads</button></div>
              ) : savedLeads.length ? (
                <>
                  <div className="lead-column-head"><span>BUSINESS</span><span>LOCATION</span><span>RATING</span><span>CONTACT</span><span>WEBSITE SIGNAL</span><span /></div>
                  <div className="lead-list">{savedLeads.map((lead) => <LeadRow key={lead.id} lead={lead} />)}</div>
                  <div className="pagination">
                    <span>Showing <b>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, leads.data?.total ?? 0)}</b> of <b>{leads.data?.total ?? 0}</b></span>
                    <div><button type="button" aria-label="Previous page" data-testid="button-page-previous" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={17} /></button><span>Page {page} of {maxPage}</span><button type="button" aria-label="Next page" data-testid="button-page-next" disabled={page >= maxPage} onClick={() => setPage((current) => Math.min(maxPage, current + 1))}><ChevronRight size={17} /></button></div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <span className="empty-illustration"><span className="empty-window"><Building2 size={24} /><i><ArrowDownRight size={14} /></i></span></span>
                  <b>{leadFilter ? 'No matching leads found' : 'Your list starts with a search'}</b>
                  <p>{leadFilter ? 'Try another name, category, or place.' : 'Search a location and business type above. Real results that meet the criteria will appear here.'}</p>
                  {leadFilter && <button type="button" className="button-secondary" onClick={() => setLeadFilter('')}>Clear filter</button>}
                </div>
              )}
            </div>

            <div className="panel activity-panel" id="search-activity">
              <div className="panel-heading activity-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Search history</h2></div><span className="activity-clock"><Clock3 size={17} /></span></div>
              {history.isLoading ? (
                <div className="history-skeleton" aria-label="Loading search history">{[0, 1, 2].map((row) => <div key={row}><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line short" /></div>)}</div>
              ) : history.isError ? (
                <div className="history-error" role="alert"><p>Search history couldn’t load.</p><button className="text-action" type="button" onClick={() => void history.refetch()}>Retry</button></div>
              ) : (history.data?.items?.length ?? 0) > 0 ? (
                <div className="history-list">
                  {history.data?.items.map((item, index) => {
                    const searchedAt = new Date(item.searchedAt);
                    const when = Number.isNaN(searchedAt.getTime()) ? 'Recent' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(searchedAt);
                    return (
                      <article className="history-item" key={item.id} data-testid={`history-item-${item.id}`}>
                        <span className={`history-index${index === 0 ? ' index-current' : ''}`}>{String(index + 1).padStart(2, '0')}</span>
                        <div className="history-copy"><strong>{item.category}</strong><span><MapPin size={12} />{item.location}</span><small>{when}</small></div>
                        <div className="history-total"><b>{item.newLeads}</b><small>new</small></div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="history-empty"><span><Clock3 size={20} /></span><b>No searches yet</b><p>Every search you run will show up here.</p></div>
              )}
              <div className="activity-footer"><span className="activity-footer-dot" /> Search history is kept with your saved leads.</div>
            </div>
          </section>

          <section className="setup-section page-enter stagger-3">
            <SetupNotice />
          </section>
          <footer className="dashboard-footer"><span>WebWin <i>·</i> Sales discovery, made simple.</span><span><ArrowUpRight size={13} /> Just the essentials, by design.</span></footer>
        </div>
      </main>
    </div>
  );
}