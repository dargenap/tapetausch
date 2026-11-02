import { useEffect } from 'react';
import { Link } from 'react-router';
import { CHANGELOG, markReleaseSeen } from '../lib/changelog';

export default function ChangelogPage() {
  useEffect(() => {
    markReleaseSeen();
  }, []);

  return (
    <main>
      <Link className="back" to="/">
        ← Zurück
      </Link>
      <h1>Was ist neu?</h1>

      {CHANGELOG.map(release => (
        <article key={release.version} className="card release">
          <div className="release-head">
            <strong>v{release.version}</strong>
            <span>{release.title}</span>
            {release.version === __APP_VERSION__ && <span className="badge">aktuell</span>}
          </div>
          {release.date && (
            <span className="muted release-date">{new Date(release.date).toLocaleDateString('de-DE')}</span>
          )}
          <ul>
            {release.changes.map(change => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </article>
      ))}
    </main>
  );
}
