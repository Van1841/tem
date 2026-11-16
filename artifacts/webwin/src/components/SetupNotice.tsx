import { Check, Circle, KeyRound, Leaf, Server } from 'lucide-react';
import { useGetSetupStatus, type SetupStatus } from '@workspace/api-client-react';

// Setup ko seedhe checklist mein bataya hai; credentials kabhi form mein nahi maangte.
export function SetupNotice({ compact = false }: { compact?: boolean }) {
  const status = useGetSetupStatus();
  const setup: SetupStatus | undefined = status.data;
  const mongoReady = setup?.mongodbConfigured ?? false;
  const placesReady = setup?.googlePlacesConfigured ?? false;

  return (
    <section className={`setup-notice${compact ? ' setup-notice-compact' : ''}`} aria-labelledby="setup-title">
      <div className="setup-heading">
        <span className="setup-mark"><Server size={17} /></span>
        <div>
          <p className="eyebrow">WORKSPACE SETUP</p>
          <h2 id="setup-title">{mongoReady && placesReady ? 'Your sources are configured' : 'Two small setup steps'}</h2>
        </div>
        {status.isError && <button className="text-action" type="button" data-testid="button-retry-setup-status" onClick={() => void status.refetch()}>Retry</button>}
      </div>
      {status.isLoading ? (
        <div className="setup-loading" aria-label="Loading setup status">
          <span className="skeleton setup-skeleton" /><span className="skeleton setup-skeleton" />
        </div>
      ) : (
        <div className="setup-list">
          <div className={`setup-row${mongoReady ? ' is-ready' : ''}`}>
            <span className="setup-check">{mongoReady ? <Check size={13} /> : <Circle size={13} />}</span>
            <div>
              <strong>Connect MongoDB Atlas</strong>
              <p>{mongoReady ? 'The URI is saved. The database connection is checked when data is requested.' : <>Add your Atlas connection URI to <b>Replit Secrets</b> as <code>MONGODB_URI</code>. Leads and search history will be saved there.</>}</p>
              <details className="setup-guide">
                <summary>View MongoDB setup steps</summary>
                <ol>
                  <li>Create an Atlas cluster and a database user.</li>
                  <li>Allow this app in Atlas Network Access, then copy the Node.js driver URI.</li>
                  <li>Save the URI as <code>MONGODB_URI</code> in Replit Secrets.</li>
                </ol>
              </details>
            </div>
            <Leaf size={16} className="setup-row-icon" />
          </div>
          <div className={`setup-row${placesReady ? ' is-ready' : ''}`}>
            <span className="setup-check">{placesReady ? <Check size={13} /> : <Circle size={13} />}</span>
            <div>
              <strong>Enable Google Places search</strong>
              <p>{placesReady ? 'The key is saved. It is checked when the first Places request runs.' : <>Add the Google Places API key in <b>Replit Secrets</b> as <code>GOOGLE_PLACES_API_KEY</code>. Keep it server-only — never put it in frontend code.</>}</p>
              <details className="setup-guide">
                <summary>View Google Places setup steps</summary>
                <ol>
                  <li>In Google Cloud, enable Places API (New) and configure billing.</li>
                  <li>Create an API key restricted to Places API (New).</li>
                  <li>Save it as <code>GOOGLE_PLACES_API_KEY</code> in Replit Secrets.</li>
                </ol>
              </details>
            </div>
            <KeyRound size={16} className="setup-row-icon" />
          </div>
          {status.isError && <p className="setup-error" role="alert">Setup status could not load. Check your connection and retry.</p>}
        </div>
      )}
    </section>
  );
}