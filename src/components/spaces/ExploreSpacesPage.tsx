/**
 * ExploreSpacesPage -- Public space discovery with 4 sections[Not Implemented yet]:
 *  1. Trending (by score)
 *  2. Recommended (based on user's spaces)
 *  3. Recently Published
 *  4. Semantic Search
 *
 * Each card shows title, description, tags, views/forks, and a fork button.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, TrendingUp, Sparkles, Clock, ArrowLeft,
  Eye, GitFork, ThumbsUp, ThumbsDown, Loader2, X,
} from 'lucide-react';
import {
  getTrendingSpaces, getNewSpaces, getRecommendedSpaces,
  searchSpacesSemantic, recordSpaceView, type ExploreSpace,
} from '../../lib/explore';
import { voteOnSpace, getUserVote, type VoteValue } from '../../lib/votes';
import { forkSpace } from '../../utils/spaces-store';
import { authManager, AuthRequiredError } from '../../lib/auth';
import { AuthModal } from '../modals/AuthModal';
import { SpacesIcon } from './SpacesIcon';

interface ExploreSpacesPageProps {
  onClose: () => void;
  onOpenSpace?: (spaceId: string) => void;
}

type Section = 'trending' | 'recommended' | 'new';

export function ExploreSpacesPage({ onClose, onOpenSpace }: ExploreSpacesPageProps) {
  const [activeSection, setActiveSection] = useState<Section>('trending');
  const [spaces, setSpaces] = useState<ExploreSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExploreSpace[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [forkingId, setForkingId] = useState<string | null>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load section data ───────────────────────────────────

  const loadSection = useCallback(async (section: Section) => {
    setIsLoading(true);
    setSearchResults(null);
    try {
      let data: ExploreSpace[];
      switch (section) {
        case 'trending':
          data = await getTrendingSpaces(20);
          break;
        case 'recommended':
          data = await getRecommendedSpaces(20);
          break;
        case 'new':
          data = await getNewSpaces(20);
          break;
        default:
          data = [];
      }
      setSpaces(data);
    } catch (err) {
      console.error('[Explore] Failed to load:', err);
      setSpaces([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSection(activeSection);
  }, [activeSection, loadSection]);

  // ── Search ──────────────────────────────────────────────

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchSpacesSemantic(query, 15);
      setSearchResults(results);
    } catch (err) {
      console.error('[Explore] Search failed:', err);
      setSearchResults([]);
    }
    setIsSearching(false);
  }, []);

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(value), 600);
  };

  // ── Actions ─────────────────────────────────────────────

  const requireAuthFor = (action: string, callback: () => void) => {
    if (!authManager.isLoggedIn()) {
      setAuthMessage(`Sign in to ${action}`);
      setShowAuthModal(true);
      return;
    }
    callback();
  };

  const handleFork = async (spaceId: string) => {
    requireAuthFor('fork this space', async () => {
      setForkingId(spaceId);
      try {
        const forked = await forkSpace(spaceId);
        if (forked) {
          onOpenSpace?.(forked.id);
        }
      } catch (err) {
        console.error('[Explore] Fork failed:', err);
      }
      setForkingId(null);
    });
  };

  const handleVote = async (spaceId: string, value: VoteValue) => {
    requireAuthFor('vote on spaces', async () => {
      try {
        await voteOnSpace(spaceId, value);
        // Refresh current view
        if (searchResults) {
          handleSearch(searchQuery);
        } else {
          loadSection(activeSection);
        }
      } catch (err) {
        console.error('[Explore] Vote failed:', err);
      }
    });
  };

  const handleViewSpace = async (space: ExploreSpace) => {
    try {
      await recordSpaceView(space.id);
    } catch {
      // non-critical
    }
    onOpenSpace?.(space.id);
  };

  // ── Render helpers ──────────────────────────────────────

  const displaySpaces = searchResults ?? spaces;

  const sectionTabs: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'trending', label: 'Trending', icon: <TrendingUp size={13} /> },
    { key: 'recommended', label: 'For You', icon: <Sparkles size={13} /> },
    { key: 'new', label: 'New', icon: <Clock size={13} /> },
  ];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-(--bg-primary) text-(--text-primary) font-(--font-sans) relative">
      {/* Header */}
      <div className="flex items-center justify-between px-7 pt-6 pb-4 shrink-0">
        <h2 className="flex items-center gap-2 text-lg font-semibold m-0">
          <SpacesIcon size={18} style={{ opacity: 0.5 }} />
          Explore Spaces
        </h2>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-(--border-subtle) bg-transparent text-(--text-primary) cursor-pointer transition-all duration-150 hover:bg-(--bg-active)" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center gap-2 mx-7 mb-4 px-3 py-2 rounded border border-(--border-subtle) bg-(--bg-secondary)">
        <Search size={14} className="text-(--text-muted) shrink-0" />
        <input
          type="text"
          placeholder="Search spaces semantically..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-(--text-primary) text-xs placeholder:text-(--text-muted)"
        />
        {isSearching && <Loader2 size={14} className="animate-spin text-(--text-muted)" />}
        {searchQuery && (
          <button
            className="bg-transparent border-none text-(--text-muted) cursor-pointer flex p-0.5 hover:text-(--text-primary)"
            onClick={() => { setSearchQuery(''); setSearchResults(null); }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Section Tabs */}
      {!searchResults && (
        <div className="flex gap-1 px-7 mb-4">
          {sectionTabs.map(tab => (
            <button
              key={tab.key}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer border-none transition-all duration-150 ${activeSection === tab.key ? 'bg-(--bg-active) text-(--text-primary) font-semibold' : 'bg-transparent text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-primary)'}`}
              onClick={() => setActiveSection(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search result label */}
      {searchResults && (
        <div className="flex items-center gap-1.5 px-7 mb-3 text-[11px] text-(--text-muted) font-medium">
          <Search size={12} />
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-7 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Loader2 size={24} className="animate-spin text-(--text-muted)" />
            <p className="text-(--text-secondary) text-xs">Loading spaces...</p>
          </div>
        ) : displaySpaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <SpacesIcon size={40} style={{ opacity: 0.12 }} />
            <p className="text-(--text-secondary) text-xs max-w-[320px] leading-relaxed">
              {searchResults
                ? 'No spaces matched your search.'
                : activeSection === 'recommended'
                  ? 'Create some spaces first to get personalized recommendations.'
                  : 'No public spaces available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {displaySpaces.map(space => (
              <div
                key={space.id}
                className="bg-(--bg-secondary) border border-(--border-subtle) rounded-lg p-4 cursor-pointer flex flex-col gap-2.5 relative transition-all duration-150 hover:border-(--border-medium) hover:bg-(--bg-hover)"
                onClick={() => handleViewSpace(space)}
              >
                <h3 className="text-[13px] font-semibold text-(--text-primary) m-0 leading-snug tracking-tight">{space.title}</h3>

                {space.description && (
                  <p className="text-[11px] text-(--text-secondary) leading-snug m-0 line-clamp-2">{space.description}</p>
                )}

                {(space.helps_with || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(space.helps_with || []).slice(0, 4).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-(--bg-active) text-(--text-secondary) font-medium">{tag}</span>
                    ))}
                  </div>
                )}

                {space.forked_from && (
                  <div className="flex items-center gap-1 text-[10px] text-(--text-muted) font-medium">
                    <GitFork size={10} /> Forked
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-(--text-muted) mt-auto pt-2 border-t border-(--border-subtle)">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" title="Views"><Eye size={11} /> {space.stats?.views ?? 0}</span>
                    <span className="flex items-center gap-1" title="Forks"><GitFork size={11} /> {space.stats?.forks ?? 0}</span>
                    <span className="flex items-center gap-1" title="Score">
                      <TrendingUp size={11} /> {(space.stats?.score ?? 0).toFixed(1)}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="bg-transparent border-none text-(--text-muted) cursor-pointer p-1 rounded transition-colors duration-150 hover:bg-(--bg-active) hover:text-(--text-primary)"
                      onClick={() => handleVote(space.id, 1)}
                      title="Upvote"
                    >
                      <ThumbsUp size={12} />
                    </button>
                    <button
                      className="bg-transparent border-none text-(--text-muted) cursor-pointer p-1 rounded transition-colors duration-150 hover:bg-(--bg-active) hover:text-(--text-primary)"
                      onClick={() => handleVote(space.id, -1)}
                      title="Downvote"
                    >
                      <ThumbsDown size={12} />
                    </button>
                    <button
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-(--bg-active) text-(--text-secondary) border-none cursor-pointer transition-all duration-150 hover:bg-(--bg-hover) hover:text-(--text-primary)"
                      onClick={() => handleFork(space.id)}
                      disabled={forkingId === space.id}
                    >
                      {forkingId === space.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <GitFork size={12} />
                      )}
                      Fork
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            loadSection(activeSection);
          }}
          message={authMessage}
        />
      )}
    </div>
  );
}

export default ExploreSpacesPage;
