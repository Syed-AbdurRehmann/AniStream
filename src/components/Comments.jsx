import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiMessageSquare, FiSend, FiTrash2, FiCornerDownRight, FiUser } from 'react-icons/fi'
import './Comments.css'

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api')

async function fetchComments(mediaType, tmdbId, season, episode, page = 1) {
  const params = new URLSearchParams({ page, limit: 50 })
  if (season) params.set('season', season)
  if (episode) params.set('episode', episode)

  const token = localStorage.getItem('cineweb_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const res = await fetch(`${API_BASE}/comments/${mediaType}/${tmdbId}?${params}`, { headers })
  if (!res.ok) throw new Error('Failed to load comments')
  return res.json()
}

async function postComment(mediaType, tmdbId, content, season, episode, parentId) {
  const token = localStorage.getItem('cineweb_token')
  const res = await fetch(`${API_BASE}/comments/${mediaType}/${tmdbId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content, season, episode, parentId }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to post comment')
  }
  return res.json()
}

async function deleteComment(commentId) {
  const token = localStorage.getItem('cineweb_token')
  const res = await fetch(`${API_BASE}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to delete comment')
}

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

function CommentItem({ comment, onDelete, onReply }) {
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleReply = async () => {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    try {
      await onReply(replyText.trim(), comment.id)
      setReplyText('')
      setShowReplyBox(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="comment">
      <div className="comment__avatar">
        {comment.avatar ? (
          <img src={comment.avatar} alt={comment.username} />
        ) : (
          <span>{comment.username[0]?.toUpperCase()}</span>
        )}
      </div>
      <div className="comment__body">
        <div className="comment__header">
          <span className="comment__username">{comment.username}</span>
          <span className="comment__time">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="comment__text">{comment.content}</p>
        <div className="comment__actions">
          <button className="comment__action-btn" onClick={() => setShowReplyBox(!showReplyBox)}>
            <FiCornerDownRight size={13} /> Reply
          </button>
          {comment.isOwner && (
            <button className="comment__action-btn comment__action-btn--delete" onClick={() => onDelete(comment.id)}>
              <FiTrash2 size={13} /> Delete
            </button>
          )}
        </div>

        {showReplyBox && (
          <div className="comment__reply-box">
            <input
              type="text"
              placeholder={`Reply to ${comment.username}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
              maxLength={1000}
            />
            <button className="btn btn-primary btn-sm" onClick={handleReply} disabled={submitting || !replyText.trim()}>
              <FiSend size={13} />
            </button>
          </div>
        )}

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="comment__replies">
            {comment.replies.map(reply => (
              <div key={reply.id} className="comment comment--reply">
                <div className="comment__avatar comment__avatar--sm">
                  {reply.avatar ? (
                    <img src={reply.avatar} alt={reply.username} />
                  ) : (
                    <span>{reply.username[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="comment__body">
                  <div className="comment__header">
                    <span className="comment__username">{reply.username}</span>
                    <span className="comment__time">{timeAgo(reply.createdAt)}</span>
                  </div>
                  <p className="comment__text">{reply.content}</p>
                  {reply.isOwner && (
                    <div className="comment__actions">
                      <button className="comment__action-btn comment__action-btn--delete" onClick={() => onDelete(reply.id)}>
                        <FiTrash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Comments({ mediaType, tmdbId, season, episode }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const [comments, setComments] = useState([])
  const [total, setTotal] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  const loadComments = useCallback(async () => {
    try {
      const data = await fetchComments(mediaType, tmdbId, season, episode)
      setComments(data.comments)
      setTotal(data.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [mediaType, tmdbId, season, episode])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handlePost = async () => {
    if (!newComment.trim() || posting) return
    setPosting(true)
    try {
      const data = await postComment(mediaType, tmdbId, newComment.trim(), season, episode)
      setComments(prev => [data.comment, ...prev])
      setTotal(prev => prev + 1)
      setNewComment('')
    } catch (e) {
      console.error(e)
    } finally {
      setPosting(false)
    }
  }

  const handleReply = async (content, parentId) => {
    const data = await postComment(mediaType, tmdbId, content, season, episode, parentId)
    // Reload to get updated replies
    loadComments()
  }

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId)
      setComments(prev => prev.filter(c => {
        if (c.id === commentId) return false
        // Also filter from replies
        if (c.replies) c.replies = c.replies.filter(r => r.id !== commentId)
        return true
      }))
      setTotal(prev => prev - 1)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="comments-section">
      <h3 className="comments-section__title">
        <FiMessageSquare /> Comments {total > 0 && <span className="comments-section__count">{total}</span>}
      </h3>

      {/* Post new comment */}
      {isAuthenticated ? (
        <div className="comments-section__form">
          <div className="comments-section__form-avatar">
            <span>{user.username[0]?.toUpperCase()}</span>
          </div>
          <div className="comments-section__form-input">
            <textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={1000}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost() }
              }}
            />
            <div className="comments-section__form-footer">
              <span className="comments-section__char-count">{newComment.length}/1000</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={handlePost}
                disabled={posting || !newComment.trim()}
              >
                <FiSend size={14} /> {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="comments-section__login">
          <FiUser size={16} />
          <p>
            <Link to="/login" state={{ from: location.pathname + location.search }}>Log in</Link> to join the discussion
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="comments-section__list">
        {loading ? (
          <div className="comments-section__loading">
            <div className="spinner"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="comments-section__empty">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))
        )}
      </div>
    </div>
  )
}
