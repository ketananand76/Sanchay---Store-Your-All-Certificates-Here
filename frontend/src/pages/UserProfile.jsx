import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getFileUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Globe, Code, Briefcase, MessageSquare, Lock, Heart, Award, Calendar, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, admin } = useAuth();

  const [listModal, setListModal] = useState({ show: false, title: '', users: [] });

  const isSelf = currentUser && String(currentUser._id) === String(id);
  const isAdmin = !!admin;

  // Query: User profile and certificates
  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile', id],
    queryFn: async () => {
      const res = await api.get(`/api/social/profile/${id}`);
      return res.data;
    },
  });

  // Mutation: Follow/Unfollow user
  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/social/follow/${id}`);
      return res.data;
    },
    onSuccess: (resData) => {
      toast.success(resData.message);
      queryClient.invalidateQueries({ queryKey: ['userProfile', id] });
      queryClient.invalidateQueries({ queryKey: ['chatContacts'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen text-center">
        <div className="glass-panel p-12 rounded-2xl text-red-400 border-red-950/50">
          Profile not found or failed to fetch.
        </div>
      </div>
    );
  }

  const { user, certificates } = data;
  const isFollowing = currentUser && user.followers?.some(f => String(f._id || f) === String(currentUser._id));
  const isPrivate = user.privateAccount && !isSelf && !isFollowing && !isAdmin;

  const handleFollowClick = () => {
    if (!currentUser) {
      toast.error('Please login to follow users');
      return navigate('/login');
    }
    followMutation.mutate();
  };

  const handleMessageClick = () => {
    navigate('/chat');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 min-h-screen relative z-10">
      <div className="absolute top-[10%] left-[-15%] w-[40vw] h-[40vw] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

      <Link
        to={isAdmin ? '/admin/dashboard' : (currentUser ? '/dashboard' : '/')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      {/* Profile Header card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-purple-950/40 shadow-2xl space-y-6 bg-[#0c0a13]/70 mb-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Profile photo */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-purple-950/30 border-2 border-purple-800/40 overflow-hidden flex items-center justify-center font-accent text-3xl font-bold text-purple-300 shrink-0 shadow-lg">
            {user.profilePicture ? (
              <img
                src={getFileUrl(user.profilePicture)}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>

          {/* User metadata & details */}
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
              <h2 className="font-accent text-2xl font-bold text-white tracking-wide">{user.name}</h2>
              {user.privateAccount && (
                <span className="inline-flex items-center gap-1 bg-[#120f26]/80 text-[9px] font-bold text-purple-300 uppercase tracking-widest px-2 py-0.5 rounded border border-purple-900/60 w-fit mx-auto sm:mx-0">
                  <Lock className="h-2.5 w-2.5" /> Private
                </span>
              )}
            </div>

            {/* Profile Statistics grid */}
            <div className="flex items-center justify-center sm:justify-start gap-6 border-y border-purple-950/20 py-2.5 text-xs">
              <div>
                <span className="text-white font-bold text-sm block">{certificates.length}</span>
                <span className="text-gray-500 uppercase tracking-wider text-[9px]">Certificates</span>
              </div>
              <button
                onClick={() => setListModal({ show: true, title: 'Followers', users: user.followers || [] })}
                className="text-left cursor-pointer hover:opacity-85 transition-opacity focus:outline-none"
              >
                <span className="text-white font-bold text-sm block">{user.followers?.length || 0}</span>
                <span className="text-gray-500 uppercase tracking-wider text-[9px] hover:text-purple-400">Followers</span>
              </button>
              <button
                onClick={() => setListModal({ show: true, title: 'Following', users: user.following || [] })}
                className="text-left cursor-pointer hover:opacity-85 transition-opacity focus:outline-none"
              >
                <span className="text-white font-bold text-sm block">{user.following?.length || 0}</span>
                <span className="text-gray-500 uppercase tracking-wider text-[9px] hover:text-purple-400">Following</span>
              </button>
            </div>

            {/* User Bio */}
            {user.bio && (
              <p className="text-xs text-gray-300 leading-relaxed font-medium bg-purple-950/10 p-3 rounded-xl border border-purple-950/30">
                {user.bio}
              </p>
            )}

            {/* Social icons */}
            {user.links && (user.links.website || user.links.github || user.links.linkedin) && (
              <div className="flex items-center justify-center sm:justify-start gap-3">
                {user.links.website && (
                  <a
                    href={user.links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-900/40 transition-all"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
                {user.links.github && (
                  <a
                    href={user.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-900/40 transition-all"
                  >
                    <Code className="h-4 w-4" />
                  </a>
                )}
                {user.links.linkedin && (
                  <a
                    href={user.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-900/40 transition-all"
                  >
                    <Briefcase className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2 justify-center sm:justify-start">
              {isSelf ? (
                <button
                  onClick={() => navigate('/settings')}
                  className="bg-purple-950/30 border border-purple-800/40 hover:bg-purple-900/30 text-purple-300 font-bold px-5 py-2 rounded-xl text-xs transition-all"
                >
                  Edit Profile Settings
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollowClick}
                    disabled={followMutation.isLoading}
                    className={`font-bold px-6 py-2 rounded-xl text-xs hover:scale-[1.01] transition-all ${
                      isFollowing
                        ? 'border border-purple-900/60 bg-[#120f26] text-purple-300 hover:bg-purple-950/30'
                        : 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-md shadow-purple-500/10'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={handleMessageClick}
                    className="bg-purple-950/30 border border-purple-800/40 hover:bg-purple-900/30 text-purple-300 font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio items grid */}
      <div className="space-y-4">
        <h3 className="font-accent text-sm font-bold text-white uppercase tracking-widest border-b border-purple-950/30 pb-2">
          Certificates Grid
        </h3>

        {isPrivate ? (
          <div className="glass-panel p-16 rounded-2xl border-purple-950/20 text-center flex flex-col items-center gap-3">
            <Lock className="h-10 w-10 text-purple-400" />
            <h4 className="font-accent text-white font-bold">This Account is Private</h4>
            <p className="text-xs text-gray-500 max-w-xs">
              Follow this user to view their credentials and portfolio credentials checklist.
            </p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="glass-panel p-16 rounded-2xl border-purple-950/20 text-center text-gray-500">
            No certificates uploaded by this user yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <Link
                key={cert._id}
                to={`/certificates/${cert._id}`}
                className="group relative h-48 bg-[#12111d]/50 rounded-2xl border border-purple-950/40 hover:border-purple-800/40 hover:bg-[#151425] shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Thumbnail image or PDF Icon */}
                <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center bg-[#09080e] border-b border-purple-950/20">
                  {cert.fileType === 'pdf' ? (
                    <div className="flex flex-col items-center gap-1.5 text-purple-400/50 group-hover:text-purple-300 transition-colors">
                      <Award className="h-8 w-8" />
                      <span className="text-[8px] uppercase tracking-wider font-semibold">PDF View</span>
                    </div>
                  ) : (
                    <img
                      src={getFileUrl(cert.fileUrl)}
                      alt={cert.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  )}
                  <span className="absolute top-2.5 left-2.5 bg-[#0d0a15]/80 border border-purple-900/60 text-purple-300 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    {cert.category}
                  </span>

                  {isSelf && (
                    <span className={`absolute top-2.5 right-2.5 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      cert.status === 'approved'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : cert.status === 'rejected'
                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                    }`}>
                      {cert.status || 'pending'}
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <h4 className="font-accent text-xs font-bold text-white line-clamp-1 group-hover:text-accent transition-colors">
                    {cert.title}
                  </h4>
                  <div className="flex items-center justify-between text-[9px] text-gray-500 mt-1">
                    <span className="truncate max-w-[80px]">{cert.issuer}</span>
                    <span className="flex items-center gap-0.5 text-red-400">
                      <Heart className="h-2.5 w-2.5 fill-current" /> {cert.likes?.length || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Followers / Following List Modal */}
      {listModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07050b]/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#12111d] glass-panel border border-purple-950/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-950/30 pb-3">
              <h3 className="font-accent text-sm font-bold text-white uppercase tracking-wider">
                {listModal.title}
              </h3>
              <button
                onClick={() => setListModal({ show: false, title: '', users: [] })}
                className="text-xs text-purple-400 hover:text-white font-bold transition-colors focus:outline-none"
              >
                Close
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {listModal.users.length === 0 ? (
                <div className="text-center text-xs text-gray-500 py-6">
                  No {listModal.title.toLowerCase()} found.
                </div>
              ) : (
                listModal.users.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => {
                      setListModal({ show: false, title: '', users: [] });
                      navigate(`/profile/${u._id}`);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-950/20 border border-transparent hover:border-purple-900/35 cursor-pointer transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-900/40 border border-purple-800/40 overflow-hidden flex items-center justify-center font-bold text-xs text-purple-300">
                      {u.profilePicture ? (
                        <img
                          src={getFileUrl(u.profilePicture)}
                          alt={u.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        u.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate leading-tight">{u.name}</div>
                      <div className="text-[10px] text-gray-500 truncate mt-0.5">{u.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
