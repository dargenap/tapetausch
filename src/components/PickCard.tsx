import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../lib/format";
import type { Pick } from "../types";
import { PlayerControls } from "./PlayerControls";
import { SaveButton } from "./SaveButton";

type Props = {
  pick: Pick;
  photoUrl?: string;
  showDetailLink?: boolean;
};

export function PickCard({ pick, photoUrl, showDetailLink = false }: Props) {
  const { profile } = useAuth();
  const isOwn = pick.user_id === profile?.id;

  return (
    <article className={isOwn ? "card own" : "card"}>
      <div className="track">
        {pick.artwork_url && (
          <img
            className="artwork"
            src={pick.artwork_url}
            alt=""
            width={72}
            height={72}
          />
        )}
        <div className="track-info">
          {isOwn && <span className="badge">Dein Pick</span>}
          <strong className="track-title">{pick.title}</strong>
          <span className="track-artist">{pick.artist}</span>
          <span className="track-meta">
            von {isOwn ? "dir" : (pick.author?.username ?? "Unbekannt")} ·{" "}
            {formatDate(pick.created_at)}
          </span>
        </div>
      </div>

      <PlayerControls
        trackId={pick.itunes_track_id}
        title={pick.title}
        trackUrl={pick.track_url ?? ""}
      />
      <SaveButton pick={pick} />

      {pick.note && <p className="note">{pick.note}</p>}
      {photoUrl && <img className="photo" src={photoUrl} alt="Foto zum Pick" />}

      {showDetailLink && (
        <Link className="card-link" to={`/pick/${pick.id}`}>
          {/* Die eigene Wertung gibt es schon seit dem Posten. */}
          {isOwn
            ? "Wertungen und Kommentare"
            : "Bewerten und kommentieren"}{" "}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </article>
  );
}
