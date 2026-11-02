import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { addComment, deleteComment, fetchComments } from '../lib/comments';
import { formatDate } from '../lib/format';
import type { Comment } from '../types';

type Thread = {
  root: Comment;
  replies: Comment[];
};

// Antworten hängen immer am obersten Kommentar, so gibt es nur eine Einrückungsebene.
// Auf wen genau geantwortet wurde, zeigt das @Name vor dem Text.
function buildThreads(comments: Comment[], byId: Map<string, Comment>): Thread[] {
  const threads = new Map<string, Thread>();

  for (const comment of comments) {
    if (!comment.parent_id) threads.set(comment.id, { root: comment, replies: [] });
  }

  for (const comment of comments) {
    if (!comment.parent_id) continue;
    let root = comment;
    while (root.parent_id && byId.has(root.parent_id)) root = byId.get(root.parent_id)!;
    threads.get(root.id)?.replies.push(comment);
  }

  return [...threads.values()];
}

type FormProps = {
  id: string;
  label: string;
  placeholder: string;
  busy: boolean;
  autoFocus?: boolean;
  onSubmit: (text: string) => Promise<boolean>;
  onCancel?: () => void;
};

function CommentForm({ id, label, placeholder, busy, autoFocus, onSubmit, onCancel }: FormProps) {
  const [text, setText] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    if (await onSubmit(text)) setText('');
  }

  return (
    <form className={onCancel ? 'reply-form' : undefined} onSubmit={handleSubmit}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        value={text}
        onChange={event => setText(event.target.value)}
        maxLength={500}
        rows={onCancel ? 2 : 3}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {onCancel ? (
        <div className="reply-form-actions">
          <button type="button" className="text-button" onClick={onCancel}>
            Abbrechen
          </button>
          <button type="submit" className="primary small" disabled={busy || !text.trim()}>
            Antworten
          </button>
        </div>
      ) : (
        <button type="submit" className="primary block" disabled={busy || !text.trim()}>
          Senden
        </button>
      )}
    </form>
  );
}

type Props = {
  pickId: string;
  posterId: string;
};

export function CommentSection({ pickId, posterId }: Props) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchComments(pickId)
      .then(setComments)
      .catch(err => setError(err.message));
  }, [pickId]);

  // Gibt zurück, ob es geklappt hat, damit das Formular nur dann geleert wird.
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
      setComments(await fetchComments(pickId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Etwas ist schiefgelaufen.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function handleDelete(comment: Comment) {
    const hasReplies = comments.some(other => other.parent_id === comment.id);
    if (hasReplies && !window.confirm('Kommentar löschen? Die Antworten darauf werden mitgelöscht.')) return;
    run(() => deleteComment(comment.id));
  }

  const byId = new Map(comments.map(comment => [comment.id, comment]));
  const threads = buildThreads(comments, byId);

  function renderComment(comment: Comment) {
    const author = comment.author?.username ?? 'Unbekannt';
    const parentAuthor = comment.parent_id ? byId.get(comment.parent_id)?.author?.username : undefined;

    return (
      <>
        <div className="comment-head">
          <span>
            <strong>{author}</strong>
            {comment.user_id === posterId && <span className="badge badge-inline">Pick</span>}
          </span>
          <span className="muted">{formatDate(comment.created_at)}</span>
        </div>
        <p>
          {parentAuthor && <span className="mention">@{parentAuthor} </span>}
          {comment.text}
        </p>
        <div className="comment-actions">
          <button type="button" className="text-button" onClick={() => setReplyTo(comment)} disabled={busy}>
            Antworten
          </button>
          {comment.user_id === profile?.id && (
            <button type="button" className="text-button" onClick={() => handleDelete(comment)} disabled={busy}>
              Löschen
            </button>
          )}
        </div>

        {replyTo?.id === comment.id && (
          <CommentForm
            id={`reply-${comment.id}`}
            label={`Antwort an ${author}`}
            placeholder={`@${author} …`}
            busy={busy}
            autoFocus
            onSubmit={text =>
              run(async () => {
                await addComment(pickId, text, comment.id);
                setReplyTo(null);
              })
            }
            onCancel={() => setReplyTo(null)}
          />
        )}
      </>
    );
  }

  return (
    <section>
      <h2>Kommentare</h2>
      {comments.length === 0 && <p className="muted">Noch keine Kommentare.</p>}

      <ul className="comments">
        {threads.map(({ root, replies }) => (
          <li key={root.id}>
            {renderComment(root)}
            {replies.length > 0 && (
              <ul className="replies">
                {replies.map(reply => (
                  <li key={reply.id}>{renderComment(reply)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <CommentForm
        id="comment"
        label="Zum Pick kommentieren"
        placeholder="Was löst der Song bei dir aus?"
        busy={busy}
        onSubmit={text => run(() => addComment(pickId, text))}
      />
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
