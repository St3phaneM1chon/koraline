'use client';

/**
 * BlogComments - Threaded comment section for blog posts
 *
 * Fetches comments via GET /api/blog/${slug}/comments
 * Posts new comments via POST /api/blog/${slug}/comments
 * Displays threaded view (parent comments with replies)
 * Uses useTranslations() for i18n
 */

import { useState, useEffect, useCallback, FormEvent } from 'react';
import useTranslations from '@/hooks/useTranslations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlogComment {
  id: string;
  blogPostId: string;
  userId: string;
  userName: string;
  content: string;
  parentId: string | null;
  isApproved: boolean;
  createdAt: string;
}

interface CommentsResponse {
  data: BlogComment[];
  total: number;
}

interface BlogCommentsProps {
  slug: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCommentDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Build a threaded tree from a flat list of comments.
 * Returns top-level comments (parentId === null) with nested replies.
 */
function buildThreads(comments: BlogComment[]): (BlogComment & { replies: BlogComment[] })[] {
  const topLevel: (BlogComment & { replies: BlogComment[] })[] = [];
  const repliesMap = new Map<string, BlogComment[]>();

  for (const c of comments) {
    if (c.parentId) {
      const existing = repliesMap.get(c.parentId) || [];
      existing.push(c);
      repliesMap.set(c.parentId, existing);
    } else {
      topLevel.push({ ...c, replies: [] });
    }
  }

  for (const parent of topLevel) {
    parent.replies = repliesMap.get(parent.id) || [];
  }

  return topLevel;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CommentItem({
  comment,
  replies,
  onReply,
  t,
}: {
  comment: BlogComment;
  replies: BlogComment[];
  onReply: (parentId: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div
      style={{
        marginBottom: '16px',
      }}
    >
      {/* Comment card */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Avatar placeholder */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {comment.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}>
                {comment.userName}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginLeft: '8px',
                }}
              >
                {formatCommentDate(comment.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#475569', margin: 0 }}>
          {comment.content}
        </p>

        <button
          onClick={() => onReply(comment.id)}
          style={{
            marginTop: '10px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 0',
            fontWeight: 500,
          }}
        >
          {t('blog.comments.reply')}
        </button>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div style={{ marginLeft: '32px', marginTop: '12px' }}>
          {replies.map((reply) => (
            <div
              key={reply.id}
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {reply.userName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>
                  {reply.userName}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {formatCommentDate(reply.createdAt)}
                </span>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569', margin: 0 }}>
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BlogComments({ slug }: BlogCommentsProps) {
  const { t } = useTranslations();

  const [comments, setComments] = useState<BlogComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch comments
  // ---------------------------------------------------------------------------

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}/comments`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: CommentsResponse = await res.json();
      setComments(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch blog comments:', err);
      setError(t('blog.comments.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [slug, t]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ---------------------------------------------------------------------------
  // Submit comment
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          ...(replyingTo ? { parentId: replyingTo } : {}),
        }),
      });

      if (res.status === 401) {
        setSubmitMessage(t('blog.comments.loginRequired'));
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      // Success - comment submitted for moderation
      setContent('');
      setReplyingTo(null);
      setSubmitMessage(t('blog.comments.submitted'));

      // Refresh comments list (the new one won't appear until approved)
      await fetchComments();
    } catch (err) {
      console.error('Failed to submit comment:', err);
      setSubmitMessage(t('blog.comments.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Build threaded view
  // ---------------------------------------------------------------------------

  const threads = buildThreads(comments);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <section
      style={{
        maxWidth: '800px',
        margin: '0 auto 48px',
        padding: '0 24px',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '2px solid #e2e8f0',
        }}
      >
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#334155',
            margin: 0,
          }}
        >
          {t('blog.comments.title')}
        </h2>
        <span
          style={{
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            fontSize: '13px',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: '20px',
          }}
        >
          {total}
        </span>
      </div>

      {/* Comments list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
          {t('blog.comments.loading')}
        </div>
      ) : error ? (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 0',
            color: '#ef4444',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      ) : threads.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 0',
            color: '#94a3b8',
            fontSize: '15px',
          }}
        >
          {t('blog.comments.noComments')}
        </div>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          {threads.map((thread) => (
            <CommentItem
              key={thread.id}
              comment={thread}
              replies={thread.replies}
              onReply={(parentId) => setReplyingTo(parentId)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Comment form */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#334155',
            marginBottom: '16px',
            margin: '0 0 16px 0',
          }}
        >
          {replyingTo ? t('blog.comments.replyTo') : t('blog.comments.addComment')}
        </h3>

        {replyingTo && (
          <button
            onClick={() => setReplyingTo(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '13px',
              cursor: 'pointer',
              marginBottom: '12px',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            {t('blog.comments.cancelReply')}
          </button>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="blog-comment-content"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#475569',
                marginBottom: '6px',
              }}
            >
              {t('blog.comments.content')}
            </label>
            <textarea
              id="blog-comment-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('blog.comments.contentPlaceholder')}
              rows={4}
              maxLength={2000}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: 1.6,
                resize: 'vertical',
                fontFamily: 'inherit',
                color: '#334155',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              style={{
                padding: '10px 24px',
                backgroundColor: submitting || !content.trim() ? '#94a3b8' : '#334155',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? t('blog.comments.submitting') : t('blog.comments.submit')}
            </button>

            {submitMessage && (
              <span
                style={{
                  fontSize: '13px',
                  color: submitMessage === t('blog.comments.submitted') ? '#22c55e' : '#f59e0b',
                }}
              >
                {submitMessage}
              </span>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
