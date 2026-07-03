import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Award, ArrowRight, ShieldCheck, FileText, ChevronRight, Heart, MessageCircle, Send, ExternalLink, Globe, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const { user, admin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [commentInputs, setCommentInputs] = useState({}); // { certId: 'text' }
  const [expandedComments, setExpandedComments] = useState({}); // { certId: true }

  // Guest Spotlight query
  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featuredCertificates'],
    queryFn: async () => {
      const res = await api.get('/api/certificates?featured=true');
      return res.data;
    },
    enabled: !user,
  });

  // Logged-in Social Feed query (Admin or User)
  const { data: feedData, isLoading: loadingFeed } = useQuery({
    queryKey: ['socialFeed'],
    queryFn: async () => {
      const res = await api.get('/api/certificates');
      return res.data;
    },
    enabled: !!user,
  });

  // Like Mutation
  const likeMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/api/social/like/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Like failed');
    },
  });

  // Comment Mutation
  const commentMutation = useMutation({
    mutationFn: async ({ id, text }) => {
      const res = await api.post(`/api/social/comment/${id}`, { text });
      return res.data;
    },
    onSuccess: (_, variables) => {
      setCommentInputs((prev) => ({ ...prev, [variables.id]: '' }));
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      toast.success('Comment posted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Comment failed');
    },
  });

  const handleLike = (id) => {
    if (!user) {
      toast.error('Please login to like certificate posts');
      return navigate('/login');
    }
    likeMutation.mutate(id);
  };

  const handleCommentSubmit = (e, id) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      return navigate('/login');
    }
    const text = commentInputs[id];
    if (!text || !text.trim()) return;

    commentMutation.mutate({ id, text: text.trim() });
  };

  const toggleComments = (id) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ----------------------------------------------------
  // VIEW: LOGGED-IN SOCIAL FEED
  // ----------------------------------------------------
  if (user) {
    const feed = feedData?.certificates || [];

    return (
      <div className="max-w-xl mx-auto px-4 py-8 min-h-screen relative z-10 space-y-6">
        <div className="absolute top-[5%] left-[-15%] w-[40vw] h-[40vw] bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Feed Header */}
        <div className="flex items-center justify-between border-b border-purple-950/20 pb-4">
          <div>
            <span className="text-[10px] text-indian-gold font-bold tracking-[0.2em] uppercase">Credential Stream</span>
            <h1 className="font-accent text-xl font-bold text-white tracking-wide mt-0.5">Yogyata Social Feed</h1>
          </div>
          <Link
            to="/search"
            className="text-xs bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 px-3.5 py-1.5 rounded-xl border border-purple-900/40 transition-colors"
          >
            Find Peers
          </Link>
        </div>

        {loadingFeed ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : feed.length === 0 ? (
          <div className="glass-panel p-16 rounded-2xl border-purple-950/20 text-center space-y-4">
            <p className="text-gray-500 text-sm">Your feed is empty.</p>
            <p className="text-xs text-gray-600 max-w-xs mx-auto">
              Follow other developers to see their certifications here, or upload your own to populate the vault!
            </p>
            <Link
              to="/search"
              className="inline-flex bg-accent text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              Search Developers
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {feed.map((post) => {
              const isLiked = post.likes?.includes(user._id);
              const belongsToAdmin = !post.uploadedBy;
              
              return (
                <div
                  key={post._id}
                  className="bg-[#12111d]/50 border border-purple-950/40 rounded-2xl overflow-hidden shadow-2xl space-y-4"
                >
                  {/* Card Header (Owner profile detail) */}
                  <div className="p-4 flex items-center justify-between bg-[#08070d]/30 border-b border-purple-950/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-900/40 border border-purple-800/40 overflow-hidden flex items-center justify-center font-bold text-xs text-purple-300">
                        {belongsToAdmin ? (
                          <ShieldCheck className="h-4.5 w-4.5 text-indian-gold" />
                        ) : post.uploadedBy.profilePicture ? (
                          <img
                            src={post.uploadedBy.profilePicture.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || ''}${post.uploadedBy.profilePicture}` : post.uploadedBy.profilePicture}
                            alt={post.uploadedBy.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          post.uploadedBy.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        {belongsToAdmin ? (
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            Administrator <ShieldCheck className="h-3 w-3 text-indian-gold fill-current" />
                          </span>
                        ) : (
                          <Link to={`/profile/${post.uploadedBy._id}`} className="text-xs font-bold text-white hover:text-accent hover:underline transition-colors">
                            {post.uploadedBy.name}
                          </Link>
                        )}
                        <span className="block text-[9px] text-gray-500 uppercase mt-0.5">{post.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Display (Instagram post format) */}
                  <div className="w-full bg-[#08070d] aspect-video relative flex items-center justify-center overflow-hidden border-b border-purple-950/20">
                    {post.fileType === 'pdf' ? (
                      <div className="flex flex-col items-center gap-2 text-purple-400/50">
                        <FileText className="h-14 w-14" />
                        <span className="text-[10px] uppercase tracking-wider font-semibold">PDF Certificate</span>
                      </div>
                    ) : (
                      <img
                        src={post.fileUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || ''}${post.fileUrl}` : post.fileUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>

                  {/* Actions & Likes counts */}
                  <div className="px-4 space-y-2">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`hover:scale-110 transition-transform ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                      >
                        <Heart className={`h-5.5 w-5.5 ${isLiked ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => toggleComments(post._id)}
                        className="text-gray-400 hover:text-white hover:scale-110 transition-transform"
                      >
                        <MessageCircle className="h-5.5 w-5.5" />
                      </button>
                      <Link
                        to={`/certificates/${post._id}`}
                        className="text-gray-400 hover:text-white ml-auto hover:scale-110 transition-transform"
                        title="Inspect PDF Details"
                      >
                        <ExternalLink className="h-5.5 w-5.5" />
                      </Link>
                    </div>

                    <div className="text-xs font-bold text-white tracking-wide">
                      {post.likes?.length || 0} Likes
                    </div>
                  </div>

                  {/* Metadata and Description */}
                  <div className="px-4 text-xs space-y-1">
                    <p className="text-gray-200 leading-normal">
                      <span className="font-bold text-white mr-1.5">{belongsToAdmin ? 'Admin' : post.uploadedBy.name}</span>
                      {post.title} — Issued by <span className="text-purple-300 font-semibold">{post.issuer}</span>
                    </p>
                    {post.description && (
                      <p className="text-gray-500 leading-relaxed text-[11px] whitespace-pre-wrap">{post.description}</p>
                    )}
                  </div>

                  {/* Comments section */}
                  <div className="px-4 border-t border-purple-950/10 pt-3 pb-4 space-y-3">
                    {post.comments?.length > 0 && (
                      <button
                        onClick={() => toggleComments(post._id)}
                        className="text-[10px] text-purple-400 font-semibold hover:underline"
                      >
                        {expandedComments[post._id]
                          ? 'Hide all comments'
                          : `View all ${post.comments.length} comments`}
                      </button>
                    )}

                    {expandedComments[post._id] && post.comments?.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {post.comments.map((comment) => (
                          <div key={comment._id} className="text-[11px] flex gap-2 items-start">
                            <div className="w-5 h-5 rounded-full bg-purple-950 flex items-center justify-center text-[8px] font-bold text-purple-300 overflow-hidden shrink-0 border border-purple-900/30">
                              {comment.userProfilePicture ? (
                                <img src={comment.userProfilePicture} alt={comment.userName} className="w-full h-full object-cover" />
                              ) : (
                                comment.userName?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-bold text-white mr-1.5">{comment.userName}</span>
                              <span className="text-gray-300">{comment.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Write comment input */}
                    <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add comment..."
                        value={commentInputs[post._id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))
                        }
                        className="flex-1 bg-[#050409] border border-purple-950 text-gray-200 px-3 py-1.5 rounded-lg text-[11px] focus:outline-none focus:border-accent transition-all placeholder:text-gray-700"
                      />
                      <button
                        type="submit"
                        className="p-1.5 rounded-lg bg-accent/20 hover:bg-accent border border-accent/35 text-accent hover:text-white transition-colors"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW: GUEST LANDING PAGE (UNCHANGED LANDING LAYOUT)
  // ----------------------------------------------------
  return (
    <div className="relative overflow-hidden min-h-screen flex flex-col">
      {/* Background vector glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indian-saffron/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 z-10">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-mandala-pattern bg-cover opacity-20 pointer-events-none animate-spin-slow rounded-full hidden lg:block"></div>

        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-900/60 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-indian-saffron"></span>
            Swagat • Welcome to my Showcase
          </div>

          <h1 className="font-accent text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Verify and Explore my{' '}
            <span className="bg-gradient-to-r from-accent via-purple-400 to-indian-gold bg-clip-text text-transparent text-glow-purple">
              Professional Credentials
            </span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            Namaste. I am a software engineer. This is Yogyata, a verified digital repository housing academic degrees, industry certificates, and specialized credentials. Feel free to inspect, view, or verify each document.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
            <Link
              to="/certificates"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] transition-all"
            >
              Browse Full Gallery
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#featured"
              className="inline-flex items-center justify-center gap-2 border border-purple-800/40 hover:border-purple-500/50 bg-purple-950/10 hover:bg-purple-950/20 text-gray-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl transition-all"
            >
              Featured Credentials
            </a>
          </div>
        </div>

        {/* Hero Visual Card Stack */}
        <div className="flex-1 relative w-full max-w-md lg:max-w-none flex justify-center">
          <div className="relative w-[320px] sm:w-[400px] h-[280px] sm:h-[320px]">
            <div className="absolute inset-0 bg-purple-900/10 rounded-2xl border border-purple-500/10 rotate-[-6deg] translate-y-2 translate-x-[-10px] blur-[1px]"></div>
            <div className="absolute inset-0 glass-panel-gold rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl rotate-[3deg] border-indian-gold/30">
              <div className="flex justify-between items-start">
                <div className="bg-gradient-to-br from-indian-gold to-yellow-600 p-2.5 rounded-xl">
                  <ShieldCheck className="h-6 w-6 text-dark-bg" />
                </div>
                <span className="text-[10px] tracking-[0.2em] text-indian-gold uppercase font-bold border border-indian-gold/20 px-2 py-0.5 rounded">
                  Official Record
                </span>
              </div>
              <div className="space-y-2 mt-6">
                <p className="text-xs text-purple-400 font-semibold tracking-wider uppercase">Credentials Repository</p>
                <p className="font-accent text-xl sm:text-2xl text-white font-bold tracking-wide">
                  Yogyata Certificate Showcase
                </p>
                <p className="text-xs text-gray-400">
                  Backed by secure validation endpoints and cryptographic verification urls.
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-purple-950/50 pt-4 mt-4 text-[11px] text-gray-500">
                <span>REPUBLIC OF INDIA</span>
                <span>AUTHENTICATED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Certificates Section */}
      <section id="featured" className="py-16 bg-[#08070d]/50 border-t border-purple-950/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-indian-gold font-bold uppercase tracking-wider mb-2">
                <Award className="h-4 w-4" /> Spotlight
              </div>
              <h2 className="font-accent text-3xl font-bold text-white">
                Featured Achievements
              </h2>
            </div>
            <Link
              to="/certificates"
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-purple-300 transition-colors group"
            >
              View all certificates
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-32 bg-purple-950/10 rounded-2xl animate-pulse"></div>
              <div className="h-32 bg-purple-950/10 rounded-2xl animate-pulse"></div>
              <div className="h-32 bg-purple-950/10 rounded-2xl animate-pulse"></div>
            </div>
          ) : featuredData?.certificates?.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-gray-500 border-purple-950/20">
              No featured certificates found. Admin can mark certificates as "featured" in the dashboard.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredData?.certificates?.map((cert) => (
                <div
                  key={cert._id}
                  className="group relative flex flex-col bg-[#12111d]/60 rounded-2xl border border-purple-950/50 hover:border-purple-800/40 hover:bg-[#151425] shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all overflow-hidden"
                >
                  <div className="w-full h-48 bg-[#09080e] relative overflow-hidden flex items-center justify-center border-b border-purple-950/30">
                    {cert.fileType === 'pdf' ? (
                      <div className="flex flex-col items-center gap-2 text-purple-400/70 group-hover:text-purple-300 transition-colors">
                        <FileText className="h-12 w-12" />
                        <span className="text-xs uppercase tracking-wider font-semibold">PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={cert.fileUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${cert.fileUrl}` : cert.fileUrl}
                        alt={cert.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    )}
                    <span className="absolute top-3 left-3 bg-[#0d0a15]/80 backdrop-blur border border-purple-900/60 text-purple-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                      {cert.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <span className="text-xs text-gray-500">
                      {new Date(cert.dateIssued).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </span>
                    <h3 className="font-accent text-lg font-bold text-white mt-1 group-hover:text-accent transition-colors">
                      {cert.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{cert.issuer}</p>

                    <div className="flex gap-2.5 mt-6 pt-4 border-t border-purple-950/30">
                      <Link
                        to={`/certificates/${cert._id}`}
                        className="flex-1 inline-flex items-center justify-center text-xs font-semibold bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 border border-purple-900/40 py-2 rounded-lg transition-colors"
                      >
                        Inspect details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
