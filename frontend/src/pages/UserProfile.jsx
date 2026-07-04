import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getFileUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Globe, Code, Briefcase, MessageSquare, Lock, Heart, Award, Calendar,
  Loader2, ArrowLeft, Settings, Grid, User, Mail, Upload, ShieldAlert,
  Save, Eye, EyeOff, Bell, BellOff, Moon, Sun, Key, Trash2, Shield,
  Check, ChevronRight, AlertTriangle, X, Camera, Link as LinkIcon, Phone,
  Sparkles, Plus, Play, CheckCircle2, Star
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, admin, checkAuth, logout } = useAuth();

  const [listModal, setListModal] = useState({ show: false, title: '', users: [] });
  const [activeProfileTab, setActiveProfileTab] = useState('posts'); // 'posts' | 'settings'

  // Stories & Highlights States
  const [storyViewer, setStoryViewer] = useState({ show: false, stories: [], activeIndex: 0 });
  const [storyCreatorOpen, setStoryCreatorOpen] = useState(false);
  const [storyAudience, setStoryAudience] = useState('public');
  const [storyFile, setStoryFile] = useState(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  const [highlightCreatorOpen, setHighlightCreatorOpen] = useState(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [selectedHighlightStories, setSelectedHighlightStories] = useState([]);
  const [newHighlightCoverIcon, setNewHighlightCoverIcon] = useState('Award');

  // Close Friends List Modal
  const [closeFriendsModalOpen, setCloseFriendsModalOpen] = useState(false);
  const [closeFriendsList, setCloseFriendsList] = useState(currentUser?.closeFriends || []);
  const isSelf = currentUser && String(currentUser._id) === String(id);
  const isAdmin = !!admin;

  const renderHighlightIcon = (name) => {
    switch (name) {
      case 'Award': return <Award className="h-5 w-5 text-indian-gold" />;
      case 'Heart': return <Heart className="h-5 w-5 text-red-400" />;
      case 'Star': return <Star className="h-5 w-5 text-yellow-400" />;
      case 'Code': return <Code className="h-5 w-5 text-cyan-400" />;
      case 'Globe': return <Globe className="h-5 w-5 text-blue-400" />;
      default: return <Award className="h-5 w-5 text-indian-gold" />;
    }
  };

  // Redirection healing for '/profile/undefined'
  React.useEffect(() => {
    if (id === 'undefined' && currentUser?._id) {
      navigate(`/profile/${currentUser._id}`, { replace: true });
    }
  }, [id, currentUser, navigate]);

  // Settings state
  const [sName, setSName] = useState(currentUser?.name || '');
  const [sBio, setSBio] = useState(currentUser?.bio || '');
  const [sGender, setSGender] = useState(currentUser?.gender || '');
  const [sPrivate, setSPrivate] = useState(currentUser?.privateAccount || false);
  const [sWebsite, setSWebsite] = useState(currentUser?.links?.website || '');
  const [sGithub, setSGithub] = useState(currentUser?.links?.github || '');
  const [sLinkedin, setSLinkedin] = useState(currentUser?.links?.linkedin || '');
  
  // MERN Career Profile States
  const [sRole, setSRole] = useState(currentUser?.role || 'Job Seeker');
  const [sSkills, setSSkills] = useState(currentUser?.skills?.join(', ') || '');
  const [sExperience, setSExperience] = useState(currentUser?.experience || []);
  const [sEducation, setSEducation] = useState(currentUser?.education || []);
  const [sResumeUrl, setSResumeUrl] = useState(currentUser?.resumeUrl || '');
  const [sResumeFile, setSResumeFile] = useState(null);

  const [sPassword, setSPassword] = useState('');
  const [sConfirmPassword, setSConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sFile, setSFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(
    () => localStorage.getItem('sanchay_notifications') !== 'off'
  );
  const fileInputRef = useRef(null);

  // Temporary Form States for Adding Experience / Education
  const [expCompany, setExpCompany] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [showAddExp, setShowAddExp] = useState(false);

  const [eduSchool, setEduSchool] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduFieldOfStudy, setEduFieldOfStudy] = useState('');
  const [eduStartDate, setEduStartDate] = useState('');
  const [eduEndDate, setEduEndDate] = useState('');
  const [eduDescription, setEduDescription] = useState('');
  const [showAddEdu, setShowAddEdu] = useState(false);

  const handleAddExperience = () => {
    if (!expCompany.trim() || !expTitle.trim()) {
      return toast.error('Company and Job Title are required');
    }
    const newExp = {
      company: expCompany.trim(),
      title: expTitle.trim(),
      startDate: expStartDate,
      endDate: expCurrent ? 'Present' : expEndDate,
      current: expCurrent,
      description: expDescription.trim()
    };
    setSExperience([...sExperience, newExp]);
    setExpCompany('');
    setExpTitle('');
    setExpStartDate('');
    setExpEndDate('');
    setExpCurrent(false);
    setExpDescription('');
    setShowAddExp(false);
    toast.success('Experience added to drafts!');
  };

  const handleRemoveExperience = (index) => {
    setSExperience(sExperience.filter((_, i) => i !== index));
    toast.success('Experience removed');
  };

  const handleAddEducation = () => {
    if (!eduSchool.trim() || !eduDegree.trim()) {
      return toast.error('School and Degree are required');
    }
    const newEdu = {
      school: eduSchool.trim(),
      degree: eduDegree.trim(),
      fieldOfStudy: eduFieldOfStudy.trim(),
      startDate: eduStartDate,
      endDate: eduEndDate,
      description: eduDescription.trim()
    };
    setSEducation([...sEducation, newEdu]);
    setEduSchool('');
    setEduDegree('');
    setEduFieldOfStudy('');
    setEduStartDate('');
    setEduEndDate('');
    setEduDescription('');
    setShowAddEdu(false);
    toast.success('Education added to drafts!');
  };

  const handleRemoveEducation = (index) => {
    setSEducation(sEducation.filter((_, i) => i !== index));
    toast.success('Education removed');
  };

  // Query: User profile + certificates
  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile', id],
    queryFn: async () => {
      const res = await api.get(`/api/social/profile/${id}`);
      return res.data;
    }
  });

  // Sync settings inputs when data is loaded (TanStack Query v5 workaround)
  React.useEffect(() => {
    if (data?.user && isSelf) {
      setSName(data.user.name || '');
      setSBio(data.user.bio || '');
      setSGender(data.user.gender || '');
      setSPrivate(data.user.privateAccount || false);
      setSWebsite(data.user.links?.website || '');
      setSGithub(data.user.links?.github || '');
      setSLinkedin(data.user.links?.linkedin || '');
      setSRole(data.user.role || 'Job Seeker');
      setSSkills(data.user.skills?.join(', ') || '');
      setSExperience(data.user.experience || []);
      setSEducation(data.user.education || []);
      setSResumeUrl(data.user.resumeUrl || '');
    }
  }, [data, isSelf]);

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/social/follow/${id}`);
      return res.data;
    },
    onSuccess: (resData) => {
      toast.success(resData.message);
      queryClient.invalidateQueries({ queryKey: ['userProfile', id] });
      queryClient.invalidateQueries({ queryKey: ['chatContacts'] });
      checkAuth();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed'),
  });

  React.useEffect(() => {
    if (currentUser?.closeFriends) {
      setCloseFriendsList(currentUser.closeFriends);
    }
  }, [currentUser]);

  // Handle Story Upload Submit
  const handleStoryUpload = async (e) => {
    e.preventDefault();
    if (!storyFile) return toast.error('Please select an image or video.');

    setIsUploadingStory(true);
    const formData = new FormData();
    formData.append('file', storyFile);
    formData.append('audience', storyAudience);

    try {
      const res = await api.post('/api/social/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('Story uploaded successfully! ✨');
        setStoryFile(null);
        setStoryCreatorOpen(false);
        queryClient.invalidateQueries({ queryKey: ['userProfile', id] });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload story.');
    } finally {
      setIsUploadingStory(false);
    }
  };

  // Handle Story Delete
  const handleStoryDelete = async (storyId) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      const res = await api.delete(`/api/social/stories/${storyId}`);
      if (res.data.success) {
        toast.success('Story deleted.');
        // Update viewer active index or close
        const nextStories = storyViewer.stories.filter(s => s._id !== storyId);
        if (nextStories.length === 0) {
          setStoryViewer({ show: false, stories: [], activeIndex: 0 });
        } else {
          const nextIndex = Math.max(0, storyViewer.activeIndex - 1);
          setStoryViewer({ ...storyViewer, stories: nextStories, activeIndex: nextIndex });
        }
        queryClient.invalidateQueries({ queryKey: ['userProfile', id] });
      }
    } catch (err) {
      toast.error('Failed to delete story.');
    }
  };

  // Handle Create Highlight
  const handleCreateHighlight = async (e) => {
    e.preventDefault();
    if (!newHighlightTitle.trim()) return toast.error('Highlight title is required');
    if (selectedHighlightStories.length === 0) return toast.error('Please select at least one story');

    try {
      const res = await api.post('/api/social/highlights', {
        title: newHighlightTitle.trim(),
        coverIcon: newHighlightCoverIcon,
        storyUrls: selectedHighlightStories.map(url => ({ fileUrl: url, fileType: 'image' })),
      });
      if (res.data.success) {
        toast.success('Highlight created successfully!');
        setNewHighlightTitle('');
        setSelectedHighlightStories([]);
        setHighlightCreatorOpen(false);
        queryClient.invalidateQueries({ queryKey: ['userProfile', id] });
      }
    } catch (err) {
      toast.error('Failed to create highlight.');
    }
  };

  // Handle Highlight Delete
  const handleHighlightDelete = async (highlightId, e) => {
    e.stopPropagation(); // prevent playing highlight
    if (!window.confirm('Delete this highlight?')) return;
    try {
      const res = await api.delete(`/api/social/highlights/${highlightId}`);
      if (res.data.success) {
        toast.success('Highlight deleted.');
        queryClient.invalidateQueries({ queryKey: ['userProfile', id] });
      }
    } catch (err) {
      toast.error('Failed to delete highlight.');
    }
  };

  // Handle Toggle Close Friend
  const handleToggleCloseFriend = async (friendId) => {
    const friendIdStr = String(friendId._id || friendId);
    const isCF = closeFriendsList.some(cfId => String(cfId._id || cfId) === friendIdStr);
    let nextList;
    if (isCF) {
      nextList = closeFriendsList.filter(cfId => String(cfId._id || cfId) !== friendIdStr);
    } else {
      nextList = [...closeFriendsList, friendIdStr];
    }
    
    // Optimistic update
    setCloseFriendsList(nextList);
    try {
      await api.put('/api/social/close-friends', { closeFriends: nextList });
      toast.success(isCF ? 'Removed from Close Friends' : 'Added to Close Friends');
      checkAuth();
    } catch (err) {
      toast.error('Failed to update Close Friends');
      setCloseFriendsList(closeFriendsList); // rollback
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data || !data.user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen text-center">
        <div className="glass-panel p-12 rounded-2xl text-red-400 border-red-950/50">
          Profile not found or failed to fetch.
        </div>
      </div>
    );
  }

  const { user, certificates } = data;
  const isPremiumActive = user?.isPremium && user?.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date();
  const isFollowing = currentUser && user.followers?.some((f) => String(f._id || f) === String(currentUser._id));
  const isPrivate = user.privateAccount && !isSelf && !isFollowing && !isAdmin;
  const isFollowerOfMe = !!currentUser && (
    (currentUser.followers?.some((f) => f && String(f._id || f) === String(user._id))) ||
    (user.following?.some((f) => f && String(f._id || f) === String(currentUser._id)))
  );

  const handleFollowClick = () => {
    if (!currentUser) { toast.error('Please login to follow users'); return navigate('/login'); }
    followMutation.mutate();
  };

  const handleMessageClick = () => navigate(`/chat?user=${id}`);

  // File handler
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast.error('Max 2MB (JPG, PNG, WebP)');
    setSFile(f);
  };

  // Save settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!sName.trim()) return toast.error('Name cannot be empty');
    if (sPassword && sPassword !== sConfirmPassword) return toast.error('Passwords do not match');

    setIsUpdating(true);
    try {
      let finalResumeUrl = sResumeUrl;

      // Handle resume file upload separately to circumvent the single-file limit
      if (sResumeFile) {
        const resumeData = new FormData();
        resumeData.append('file', sResumeFile);
        resumeData.append('isResume', 'true');
        const resumeRes = await api.put('/api/social/profile', resumeData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (resumeRes.data.success) {
          finalResumeUrl = resumeRes.data.user.resumeUrl;
        }
      }

      const formData = new FormData();
      formData.append('name', sName);
      formData.append('bio', sBio);
      formData.append('gender', sGender);
      formData.append('privateAccount', sPrivate);
      formData.append('website', sWebsite);
      formData.append('github', sGithub);
      formData.append('linkedin', sLinkedin);
      
      // Append Career fields
      formData.append('role', sRole);
      formData.append('skills', JSON.stringify(sSkills.split(',').map(s => s.trim()).filter(Boolean)));
      formData.append('experience', JSON.stringify(sExperience));
      formData.append('education', JSON.stringify(sEducation));
      formData.append('resumeUrl', finalResumeUrl);

      if (sPassword) formData.append('password', sPassword);
      if (sFile) formData.append('file', sFile);

      const res = await api.put('/api/social/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success('Profile updated successfully!');
        await checkAuth();
        queryClient.invalidateQueries({ queryKey: ['userProfile', id] });
        setSPassword('');
        setSConfirmPassword('');
        setSFile(null);
        setSResumeFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: This will permanently delete your account and all certificates. Cannot be undone!')) return;
    setIsDeleting(true);
    try {
      const res = await api.delete('/api/social/profile');
      if (res.data.success) {
        toast.success('Account deleted');
        await logout();
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deletion failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!isPremiumActive) {
      toast.error('PDF Portfolio Download is a Premium Feature.');
      return;
    }

    const approvedCerts = certificates.filter(c => c.status === 'approved');
    if (approvedCerts.length === 0) {
      toast.error('No approved certificates found to compile in the portfolio.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const certsHtml = approvedCerts.map(c => `
      <div class="certificate-card">
        <h3>${c.title}</h3>
        <p><strong>Issuer:</strong> ${c.issuer}</p>
        <p><strong>Date Issued:</strong> ${new Date(c.dateIssued).toLocaleDateString()}</p>
        <p><strong>Category:</strong> ${c.category}</p>
        ${c.description ? `<p><strong>Description:</strong> ${c.description}</p>` : ''}
        ${c.verifyUrl ? `<p><strong>Verification URL:</strong> <a href="${c.verifyUrl}" target="_blank">${c.verifyUrl}</a></p>` : ''}
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${user.name}'s Certificate Portfolio</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1e293b;
              padding: 40px;
              line-height: 1.6;
              background: #fff;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #7c3aed;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #7c3aed;
              font-size: 28px;
              letter-spacing: 1px;
            }
            .header p {
              margin: 5px 0 0 0;
              color: #64748b;
              font-size: 14px;
            }
            .profile-section {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            .profile-section h2 {
              margin: 0 0 10px 0;
              font-size: 18px;
              color: #0f172a;
            }
            .profile-section p {
              margin: 4px 0;
              font-size: 13px;
              color: #475569;
            }
            .certificate-card {
              border: 1px solid #e2e8f0;
              border-left: 5px solid #7c3aed;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .certificate-card h3 {
              margin: 0 0 10px 0;
              color: #1e293b;
              font-size: 16px;
            }
            .certificate-card p {
              margin: 4px 0;
              font-size: 12px;
              color: #475569;
            }
            .certificate-card a {
              color: #7c3aed;
              text-decoration: none;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              font-size: 11px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>YOGYATA PORTFOLIO</h1>
            <p>Verified Professional Credential Showcase</p>
          </div>
          <div class="profile-section">
            <h2>${user.name}</h2>
            <p><strong>Email:</strong> ${user.email}</p>
            ${user.bio ? `<p><strong>Bio:</strong> ${user.bio}</p>` : ''}
            <p><strong>Verified Credentials:</strong> ${approvedCerts.length} active certificates</p>
          </div>
          <h2>Verified Credentials</h2>
          ${certsHtml}
          <div class="footer">
            Generated via Yogyata Store • Verified digital certificate vault.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 min-h-screen relative z-10">
      <div className="absolute top-[10%] left-[-15%] w-[40vw] h-[40vw] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Back link */}
      <Link
        to={isAdmin ? '/admin/dashboard' : (currentUser ? '/dashboard' : '/')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      {/* ======================================= */}
      {/* PROFILE HEADER */}
      {/* ======================================= */}
      <div className={`glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 bg-[#0c0a13]/70 mb-6 transition-all duration-500 relative overflow-hidden ${
        isPremiumActive 
          ? 'border-2 border-amber-500/50 shadow-amber-500/5' 
          : 'border border-purple-950/40'
      }`}>
        {isPremiumActive && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
        )}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
          {/* Avatar container with Story ring (Instagram style) */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div 
              onClick={() => {
                if (user.stories && user.stories.length > 0) {
                  setStoryViewer({ show: true, stories: user.stories, activeIndex: 0 });
                } else if (isSelf) {
                  setStoryCreatorOpen(true);
                }
              }}
              className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center p-[4px] transition-transform duration-300 ${
                user.stories && user.stories.length > 0
                  ? user.stories.some(s => s.audience === 'close-friends')
                    ? 'bg-emerald-500 cursor-pointer hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 cursor-pointer hover:scale-105 shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                  : 'bg-purple-950/30 border border-purple-800/40'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[#0c0a13] flex items-center justify-center font-accent text-4xl font-bold text-purple-300 border-2 border-[#0c0a13]">
                {user.profilePicture ? (
                  <img src={getFileUrl(user.profilePicture)} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            {isSelf && (
              <button
                onClick={() => setStoryCreatorOpen(true)}
                className="absolute bottom-0 right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center border-2 border-[#0c0a13] hover:bg-accent-dark transition-all shadow-lg hover:scale-105"
                title="Add Story"
              >
                <Plus className="h-4 w-4 text-white" />
              </button>
            )}
          </div>

          {/* Meta & Stats (Instagram layout) */}
          <div className="flex-1 space-y-4 text-center sm:text-left min-w-0 w-full">
            {/* Top row: Name & action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="font-accent text-2xl font-bold text-white tracking-wide flex items-center gap-1.5 truncate">
                  {user.name}
                  {isPremiumActive && user.isGovIdVerified ? (
                    <span className="text-emerald-400" title="Verified Creator (Gov. ID & Subscription Verified)">
                      <CheckCircle2 className="h-5 w-5 fill-emerald-950/80 ml-1.5" />
                    </span>
                  ) : isPremiumActive ? (
                    <span className="text-amber-500 animate-pulse" title="Premium Gold Badge">
                      <Sparkles className="h-5 w-5 fill-current" />
                    </span>
                  ) : null}
                </h2>
                {user.privateAccount && (
                  <span className="inline-flex items-center gap-1 bg-[#120f26]/80 text-[9px] font-bold text-purple-300 uppercase tracking-widest px-2 py-0.5 rounded border border-purple-900/60 w-fit">
                    <Lock className="h-2.5 w-2.5" /> Private
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                {isSelf ? (
                  <>
                    <button
                      onClick={() => setActiveProfileTab('settings')}
                      className={`flex items-center gap-1.5 font-bold px-4 py-2 rounded-xl text-xs transition-all ${
                        activeProfileTab === 'settings'
                          ? 'bg-accent text-white shadow-lg shadow-purple-500/20'
                          : 'bg-purple-950/30 border border-purple-800/40 hover:bg-purple-900/30 text-purple-300'
                      }`}
                    >
                      <Settings className="h-3.5 w-3.5" /> Edit Profile
                    </button>
                    <button
                      onClick={() => setCloseFriendsModalOpen(true)}
                      className="flex items-center gap-1.5 font-bold px-4 py-2 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                    >
                      <Star className="h-3.5 w-3.5" /> Close Friends
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleFollowClick}
                      disabled={followMutation.isLoading}
                      className={`font-bold px-5 py-2 rounded-xl text-xs hover:scale-[1.01] transition-all ${
                        isFollowing
                          ? 'border border-purple-900/60 bg-[#120f26] text-purple-300 hover:bg-purple-950/30'
                          : 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-md shadow-purple-500/10'
                      }`}
                    >
                      {isFollowing ? 'Following' : isFollowerOfMe ? 'Follow Back' : 'Follow'}
                    </button>
                    <Link
                      to={`/chat?userId=${user._id}`}
                      className="font-bold px-5 py-2 rounded-xl text-xs bg-purple-950/30 border border-purple-800/40 hover:bg-purple-900/30 text-purple-300 transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Message
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Stats row (Instagram layout) */}
            <div className="flex items-center justify-center sm:justify-start gap-8 border-y border-purple-950/20 py-2.5 text-xs">
              <div>
                <span className="text-white font-bold text-sm block sm:inline mr-1">{certificates.length}</span>
                <span className="text-gray-500 uppercase tracking-wider text-[9px]">Certificates</span>
              </div>
              <button
                onClick={() => setListModal({ show: true, title: 'Followers', users: user.followers || [] })}
                className="text-left cursor-pointer hover:opacity-85 transition-opacity"
              >
                <span className="text-white font-bold text-sm block sm:inline mr-1">{user.followers?.length || 0}</span>
                <span className="text-gray-500 uppercase tracking-wider text-[9px] hover:text-purple-400">Followers</span>
              </button>
              <button
                onClick={() => setListModal({ show: true, title: 'Following', users: user.following || [] })}
                className="text-left cursor-pointer hover:opacity-85 transition-opacity"
              >
                <span className="text-white font-bold text-sm block sm:inline mr-1">{user.following?.length || 0}</span>
                <span className="text-gray-500 uppercase tracking-wider text-[9px] hover:text-purple-400">Following</span>
              </button>
            </div>

            {/* Role indicator */}
            <div className="flex justify-center sm:justify-start">
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-xl border ${
                user.role === 'Employer' || user.role === 'HR Manager'
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}>
                <Briefcase className="h-3 w-3" /> {user.role || 'Job Seeker'}
              </span>
              
              {user.resumeUrl && (
                <a
                  href={getFileUrl(user.resumeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-xl border bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer animate-pulse"
                >
                  📄 View Resume
                </a>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-xs text-gray-300 leading-relaxed font-medium bg-purple-950/10 p-3 rounded-xl border border-purple-950/30">
                {user.bio}
              </p>
            )}

            {/* Social links */}
            {user.links && (user.links.website || user.links.github || user.links.linkedin) && (
              <div className="flex items-center justify-center sm:justify-start gap-3">
                {user.links.website && (
                  <a href={user.links.website} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-900/40 transition-all">
                    <Globe className="h-4 w-4" />
                  </a>
                )}
                {user.links.github && (
                  <a href={user.links.github} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-900/40 transition-all">
                    <Code className="h-4 w-4" />
                  </a>
                )}
                {user.links.linkedin && (
                  <a href={user.links.linkedin} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-900/40 transition-all">
                    <Briefcase className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================= */}
      {/* HIGHLIGHTS SECTION */}
      {/* ======================================= */}
      <div className="flex items-center gap-6 overflow-x-auto py-3 px-2 mb-6 scrollbar-hide border-b border-purple-950/15">
        {/* Render existing highlights */}
        {user.highlights && user.highlights.map((hl) => (
          <div key={hl._id} className="relative flex flex-col items-center gap-1.5 shrink-0 group">
            <div
              onClick={() => setStoryViewer({ show: true, stories: hl.stories, activeIndex: 0 })}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-purple-950/25 border border-purple-800/40 hover:border-purple-600/60 flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-all"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0c0a13] flex items-center justify-center text-indian-gold">
                {renderHighlightIcon(hl.coverIcon)}
              </div>
            </div>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider w-16 truncate text-center">
              {hl.title}
            </span>
            {isSelf && (
              <button
                onClick={(e) => handleHighlightDelete(hl._id, e)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-650 rounded-full flex items-center justify-center border border-[#0c0a13] hover:bg-red-750 transition-colors opacity-0 group-hover:opacity-100 shadow-md"
                title="Delete Highlight"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            )}
          </div>
        ))}

        {/* Add Highlight button for profile owner */}
        {isSelf && (
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <button
              onClick={() => setHighlightCreatorOpen(true)}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-purple-950/10 border border-dashed border-purple-850 hover:border-purple-600 flex items-center justify-center cursor-pointer hover:scale-105 transition-all"
            >
              <Plus className="h-5 w-5 text-purple-400" />
            </button>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
              New
            </span>
          </div>
        )}
      </div>

      {/* ======================================= */}
      {/* TAB NAV (own profile only shows Settings tab) */}
      {/* ======================================= */}
      {isSelf && (
        <div className="flex border-b border-purple-950/40 mb-6">
          <button
            onClick={() => setActiveProfileTab('posts')}
            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeProfileTab === 'posts' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Grid className="h-3.5 w-3.5" /> Certificates
          </button>
          <button
            onClick={() => setActiveProfileTab('settings')}
            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeProfileTab === 'settings' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Settings className="h-3.5 w-3.5" /> Settings
          </button>
        </div>
      )}

      {/* ======================================= */}
      {/* PROFESSIONAL PORTFOLIO (Skills, Experience, Education) */}
      {/* ======================================= */}
      {(!isSelf || activeProfileTab === 'posts') && !isPrivate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Left Column: Skills & Info */}
          <div className="space-y-6 md:col-span-1">
            {user.skills && user.skills.length > 0 && (
              <div className="glass-panel rounded-2xl p-5 border-purple-950/40 bg-[#0c0a13]/60">
                <h3 className="font-accent text-xs font-bold text-purple-300 uppercase tracking-widest border-b border-purple-950/20 pb-2 mb-3 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-accent" /> Key Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, idx) => (
                    <span key={idx} className="bg-purple-950/40 border border-purple-900/50 text-purple-300 text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Experience & Education Timeline */}
          <div className="space-y-6 md:col-span-2">
            {/* Experience timeline */}
            {user.experience && user.experience.length > 0 && (
              <div className="glass-panel rounded-2xl p-5 border-purple-950/40 bg-[#0c0a13]/60">
                <h3 className="font-accent text-xs font-bold text-purple-300 uppercase tracking-widest border-b border-purple-950/20 pb-2 mb-4 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-accent" /> Work History
                </h3>
                <div className="space-y-5 border-l-2 border-purple-950/50 pl-4 ml-2">
                  {user.experience.map((exp, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-[#09080f] group-hover:scale-125 transition-transform" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-accent transition-colors">{exp.title}</h4>
                        <p className="text-[10px] font-semibold text-gray-300">{exp.company}</p>
                        <p className="text-[9px] text-gray-500 font-medium">
                          {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                        </p>
                        {exp.description && (
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education timeline */}
            {user.education && user.education.length > 0 && (
              <div className="glass-panel rounded-2xl p-5 border-purple-950/40 bg-[#0c0a13]/60">
                <h3 className="font-accent text-xs font-bold text-purple-300 uppercase tracking-widest border-b border-purple-950/20 pb-2 mb-4 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-accent" /> Education & Qualifications
                </h3>
                <div className="space-y-5 border-l-2 border-purple-950/50 pl-4 ml-2">
                  {user.education.map((edu, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-[#09080f] group-hover:scale-125 transition-transform" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-accent transition-colors">{edu.degree} in {edu.fieldOfStudy}</h4>
                        <p className="text-[10px] font-semibold text-gray-300">{edu.school}</p>
                        <p className="text-[9px] text-gray-500 font-medium">{edu.startDate} — {edu.endDate}</p>
                        {edu.description && (
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{edu.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================= */}
      {/* CERTIFICATES GRID */}
      {/* ======================================= */}
      {(!isSelf || activeProfileTab === 'posts') && (
        <div className="space-y-4">
          {!isSelf && (
            <h3 className="font-accent text-sm font-bold text-white uppercase tracking-widest border-b border-purple-950/30 pb-2">
              Certificates Grid
            </h3>
          )}

          {isPrivate ? (
            <div className="glass-panel p-16 rounded-2xl border-purple-950/20 text-center flex flex-col items-center gap-3">
              <Lock className="h-10 w-10 text-purple-400" />
              <h4 className="font-accent text-white font-bold">This Account is Private</h4>
              <p className="text-xs text-gray-500 max-w-xs">Follow this user to view their credential portfolio.</p>
            </div>
          ) : certificates.length === 0 ? (
            <div className="glass-panel p-16 rounded-2xl border-purple-950/20 text-center text-gray-500">
              No certificates uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <Link
                  key={cert._id}
                  to={`/certificates/${cert._id}`}
                  className="group relative h-48 bg-[#12111d]/50 rounded-2xl border border-purple-950/40 hover:border-purple-800/40 hover:bg-[#151425] shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center bg-[#09080e] border-b border-purple-950/20">
                    {cert.fileType === 'pdf' ? (
                      <div className="flex flex-col items-center gap-1.5 text-purple-400/50 group-hover:text-purple-300 transition-colors">
                        <Award className="h-8 w-8" />
                        <span className="text-[8px] uppercase tracking-wider font-semibold">PDF View</span>
                      </div>
                    ) : (
                      <img src={getFileUrl(cert.fileUrl)} alt={cert.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                    )}
                    <span className="absolute top-2.5 left-2.5 bg-[#0d0a15]/80 border border-purple-900/60 text-purple-300 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                      {cert.category}
                    </span>
                    {isSelf && (
                      <span className={`absolute top-2.5 right-2.5 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        cert.status === 'approved' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : cert.status === 'rejected' ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                      }`}>
                        {cert.status || 'pending'}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-accent text-xs font-bold text-white line-clamp-1 group-hover:text-accent transition-colors">{cert.title}</h4>
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
      )}

      {/* ======================================= */}
      {/* SETTINGS TAB (own profile only)          */}
      {/* ======================================= */}
      {isSelf && activeProfileTab === 'settings' && (
        <div className="space-y-5">
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />

          <form onSubmit={handleSaveSettings} className="space-y-5">

            {/* ---- Avatar section ---- */}
            <div className="glass-panel rounded-2xl p-5 border-purple-950/40 flex items-center gap-5 bg-[#0c0a13]/60">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-purple-800/40 bg-purple-950/30 flex items-center justify-center font-bold text-xl text-purple-300 shrink-0">
                {sFile ? (
                  <img src={URL.createObjectURL(sFile)} alt="Preview" className="w-full h-full object-cover" />
                ) : user.profilePicture ? (
                  <img src={getFileUrl(user.profilePicture)} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xs font-bold text-white">Profile Photo</p>
                <div className="flex gap-2 flex-wrap">
                  <label className="bg-purple-950/40 border border-purple-900/50 hover:bg-purple-900/30 text-purple-300 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all">
                    <Upload className="h-3 w-3" /> Upload Photo
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  {sFile && (
                    <button type="button" onClick={() => setSFile(null)}
                      className="text-red-400 border border-red-950 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-950/20 transition-all">
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-gray-600">Max 2MB (JPG, PNG, WebP)</p>
              </div>
            </div>

            {/* ---- Profile Info ---- */}
            <div className="glass-panel rounded-2xl p-5 border-purple-950/40 space-y-4 bg-[#0c0a13]/60">
              <div className="flex items-center gap-2 border-b border-purple-950/30 pb-3">
                <User className="h-4 w-4 text-accent" />
                <h3 className="font-accent text-xs font-bold text-purple-300 uppercase tracking-widest">Profile Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400" />
                    <input
                      type="text"
                      required
                      value={sName}
                      onChange={(e) => setSName(e.target.value)}
                      className="w-full bg-[#07050d] border border-purple-950/80 focus:border-accent text-xs text-gray-200 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Email read-only */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Email (Read Only)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" />
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full bg-[#040307] border border-purple-950/40 text-xs text-gray-600 pl-9 pr-3 py-2.5 rounded-lg cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Gender</label>
                  <select
                    value={sGender}
                    onChange={(e) => setSGender(e.target.value)}
                    className="w-full bg-[#07050d] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-3 py-2.5 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Privacy */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Account Privacy
                  </label>
                  <select
                    value={sPrivate ? 'true' : 'false'}
                    onChange={(e) => setSPrivate(e.target.value === 'true')}
                    className="w-full bg-[#07050d] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-3 py-2.5 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="false">🌍 Public — Everyone can view</option>
                    <option value="true">🔒 Private — Follow required</option>
                  </select>
                </div>

                {/* Bio */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Bio</label>
                  <textarea
                    rows="3"
                    placeholder="Tell the world about yourself, certifications, profession..."
                    value={sBio}
                    onChange={(e) => setSBio(e.target.value)}
                    className="w-full bg-[#07050d] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-3 py-2.5 rounded-lg focus:outline-none resize-y"
                  />
                </div>
              </div>
            </div>

            {/* ---- Social Links ---- */}
            <div className="glass-panel rounded-2xl p-5 border-purple-950/40 space-y-4 bg-[#0c0a13]/60">
              <div className="flex items-center gap-2 border-b border-purple-950/30 pb-3">
                <LinkIcon className="h-4 w-4 text-accent" />
                <h3 className="font-accent text-xs font-bold text-purple-300 uppercase tracking-widest">Social Links</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Portfolio Website', icon: Globe, val: sWebsite, set: setSWebsite, ph: 'https://mywebsite.com' },
                  { label: 'GitHub Profile', icon: Code, val: sGithub, set: setSGithub, ph: 'https://github.com/username' },
                  { label: 'LinkedIn Profile', icon: Briefcase, val: sLinkedin, set: setSLinkedin, ph: 'https://linkedin.com/in/username' },
                ].map(({ label, icon: Icon, val, set, ph }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400" />
                      <input
                        type="url"
                        placeholder={ph}
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        className="w-full bg-[#07050d] border border-purple-950/80 focus:border-accent text-xs text-gray-200 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ---- Career Portfolio Settings ---- */}
            <div className="glass-panel rounded-2xl p-5 border-purple-950/40 space-y-5 bg-[#0c0a13]/60">
              <div className="flex items-center gap-2 border-b border-purple-950/30 pb-3">
                <Briefcase className="h-4 w-4 text-accent" />
                <h3 className="font-accent text-xs font-bold text-purple-300 uppercase tracking-widest">Career & Professional Profile</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Role */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Professional Role</label>
                  <select
                    value={sRole}
                    onChange={(e) => setSRole(e.target.value)}
                    className="w-full bg-[#07050d] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-3 py-2.5 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="Job Seeker">💼 Job Seeker</option>
                    <option value="Employer">🏢 Employer</option>
                    <option value="HR Manager">🧑‍💼 HR Manager</option>
                  </select>
                </div>

                {/* Skills */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Skills / Expertise (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="React, Node.js, Python, Project Management"
                    value={sSkills}
                    onChange={(e) => setSSkills(e.target.value)}
                    className="w-full bg-[#07050d] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-3 py-2.5 rounded-lg focus:outline-none"
                  />
                </div>

                {/* Resume Upload */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Upload Resume (PDF format)</label>
                  <div className="flex items-center gap-3">
                    <label className="bg-purple-950/40 border border-purple-900/50 hover:bg-purple-900/30 text-purple-300 text-[10px] font-bold px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all">
                      <Upload className="h-3 w-3" /> Select PDF
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.type !== 'application/pdf') {
                              toast.error('Resume must be a PDF file');
                              return;
                            }
                            setSResumeFile(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <div className="text-[10px] text-gray-400">
                      {sResumeFile ? (
                        <span className="text-emerald-400 font-semibold">Selected: {sResumeFile.name}</span>
                      ) : sResumeUrl ? (
                        <a href={getFileUrl(sResumeUrl)} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline hover:text-purple-300">
                          Current Resume Uploaded
                        </a>
                      ) : (
                        <span>No resume uploaded yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* EXPERIENCE MANAGEMENT */}
              <div className="space-y-3 pt-3 border-t border-purple-950/20">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex justify-between items-center">
                  <span>Work Experience</span>
                  <button
                    type="button"
                    onClick={() => setShowAddExp(!showAddExp)}
                    className="text-[10px] bg-accent/25 hover:bg-accent/40 text-purple-300 border border-purple-900/60 px-2 py-1 rounded transition-all cursor-pointer"
                  >
                    {showAddExp ? 'Cancel' : '+ Add Work'}
                  </button>
                </h4>

                {/* Experience Draft Items */}
                {sExperience.length > 0 && (
                  <div className="space-y-2">
                    {sExperience.map((exp, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-purple-950/15 border border-purple-950/40 p-3 rounded-xl">
                        <div className="text-[11px]">
                          <p className="font-bold text-white">{exp.title} at {exp.company}</p>
                          <p className="text-gray-400 text-[10px]">{exp.startDate} - {exp.endDate}</p>
                          {exp.description && <p className="text-gray-500 text-[10px] mt-1">{exp.description}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(idx)}
                          className="text-red-400 hover:text-red-300 text-[10px] font-bold p-1 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Experience Inline Form */}
                {showAddExp && (
                  <div className="bg-purple-950/20 border border-purple-900/30 p-4 rounded-xl space-y-3 animate-float-up text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500">Company Name *</label>
                        <input
                          type="text"
                          value={expCompany}
                          onChange={(e) => setExpCompany(e.target.value)}
                          className="w-full bg-[#050409] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500">Job Title *</label>
                        <input
                          type="text"
                          value={expTitle}
                          onChange={(e) => setExpTitle(e.target.value)}
                          className="w-full bg-[#050409] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500">Start Date</label>
                        <input
                          type="text"
                          placeholder="e.g. June 2022"
                          value={expStartDate}
                          onChange={(e) => setExpStartDate(e.target.value)}
                          className="w-full bg-[#050409] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500">End Date</label>
                        <input
                          type="text"
                          placeholder="e.g. Present / Aug 2024"
                          disabled={expCurrent}
                          value={expCurrent ? '' : expEndDate}
                          onChange={(e) => setExpEndDate(e.target.value)}
                          className="w-full bg-[#050409] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-none disabled:opacity-40"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="expCurrentCheck"
                          checked={expCurrent}
                          onChange={(e) => setExpCurrent(e.target.checked)}
                          className="rounded border-purple-950 bg-[#050409] text-accent focus:ring-accent"
                        />
                        <label htmlFor="expCurrentCheck" className="text-[10px] text-gray-300 font-semibold cursor-pointer">
                          I currently work here
                        </label>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[9px] uppercase font-bold text-gray-500">Role Description</label>
                        <textarea
                          rows="2"
                          value={expDescription}
                          onChange={(e) => setExpDescription(e.target.value)}
                          className="w-full bg-[#050409] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="bg-accent hover:bg-accent-dark text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Add Experience Draft
                    </button>
                  </div>
                )}
              </div>

              {/* EDUCATION MANAGEMENT */}
              <div className="space-y-3 pt-3 border-t border-purple-950/20">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex justify-between items-center">
                  <span>Education & Qualifications</span>
                  <button
                    type="button"
                    onClick={() => setShowAddEdu(!showAddEdu)}
                    className="text-[10px] bg-accent/25 hover:bg-accent/40 text-purple-300 border border-purple-900/60 px-2 py-1 rounded transition-all cursor-pointer"
                  >
                    {showAddEdu ? 'Cancel' : '+ Add Edu'}
                  </button>
                </h4>

                {/* Education Draft Items */}
                {sEducation.length > 0 && (
                  <div className="space-y-2">
                    {sEducation.map((edu, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-purple-950/15 border border-purple-950/40 p-3 rounded-xl">
                        <div className="text-[11px]">
                          <p className="font-bold text-white">{edu.degree} in {edu.fieldOfStudy}</p>
                          <p className="text-gray-400 text-[10px]">{edu.school} ({edu.startDate} - {edu.endDate})</p>
                          {edu.description && <p className="text-gray-500 text-[10px] mt-1">{edu.description}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(idx)}
                          className="text-red-400 hover:text-red-300 text-[10px] font-bold p-1 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Education Inline Form */}
                {showAddEdu && (
                  <div className="bg-purple-950/20 border border-purple-900/30 p-4 rounded-xl space-y-3 animate-float-up text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500">School / University *</label>
                        <input
                          type="text"
                          value={eduSchool}
                          onChange={(e) => setEduSchool(e.target.value)}
                          className="w-full bg-[#050409] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500">Degree *</label>
                        <input
                          type="text"
                          placeholder="e.g. Bachelor of Science"
                          value={eduDegree}
                          onChange={(e) => setEduDegree(e.target.value)}
                          className="w-full bg-[#050409] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500">Field of Study</label>
                        <input
                          type="text"
                          placeholder="e.g. Computer Science"
                          value={eduFieldOfStudy}
                          onChange={(e) => setEduFieldOfStudy(e.target.value)}
                          className="w-full bg-[#050409] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500">Start Date</label>
                        <input
                          type="text"
                          placeholder="e.g. 2020"
                          value={eduStartDate}
                          onChange={(e) => setEduStartDate(e.target.value)}
                          className="w-full bg-[#050409] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-gray-500">End Date</label>
                        <input
                          type="text"
                          placeholder="e.g. 2024 / Present"
                          value={eduEndDate}
                          onChange={(e) => setEduEndDate(e.target.value)}
                          className="w-full bg-[#050409] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[9px] uppercase font-bold text-gray-500">Description / Honors</label>
                        <textarea
                          rows="2"
                          value={eduDescription}
                          onChange={(e) => setEduDescription(e.target.value)}
                          className="w-full bg-[#050409] border border-purple-950/80 focus:border-accent text-xs text-gray-200 px-2.5 py-1.5 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddEducation}
                      className="bg-accent hover:bg-accent-dark text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Add Education Draft
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ---- Security / Password ---- */}
            <div className="glass-panel rounded-2xl p-5 border-purple-950/40 space-y-4 bg-[#0c0a13]/60">
              <div className="flex items-center gap-2 border-b border-purple-950/30 pb-3">
                <Key className="h-4 w-4 text-accent" />
                <h3 className="font-accent text-xs font-bold text-purple-300 uppercase tracking-widest">Change Password</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Leave empty to keep current"
                      value={sPassword}
                      onChange={(e) => setSPassword(e.target.value)}
                      className="w-full bg-[#07050d] border border-purple-950/80 focus:border-accent text-xs text-gray-200 pl-9 pr-9 py-2.5 rounded-lg focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={sConfirmPassword}
                      onChange={(e) => setSConfirmPassword(e.target.value)}
                      className="w-full bg-[#07050d] border border-purple-950/80 focus:border-accent text-xs text-gray-200 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Notification Preferences ---- */}
            <div className="glass-panel rounded-2xl p-5 border-purple-950/40 bg-[#0c0a13]/60">
              <div className="flex items-center gap-2 border-b border-purple-950/30 pb-3 mb-4">
                <Bell className="h-4 w-4 text-accent" />
                <h3 className="font-accent text-xs font-bold text-purple-300 uppercase tracking-widest">Preferences</h3>
              </div>

              <div className="space-y-4">
                {/* Notifications toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/30">
                      {notificationsOn ? <Bell className="h-4 w-4 text-accent" /> : <BellOff className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Push Notifications</p>
                      <p className="text-[9px] text-gray-500">Alerts for follows, likes, comments</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !notificationsOn;
                      setNotificationsOn(next);
                      localStorage.setItem('sanchay_notifications', next ? 'on' : 'off');
                      toast.success(next ? 'Notifications enabled' : 'Notifications muted');
                    }}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${notificationsOn ? 'bg-accent' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${notificationsOn ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Profile visibility info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/30">
                      {sPrivate ? <Lock className="h-4 w-4 text-yellow-400" /> : <Globe className="h-4 w-4 text-green-400" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Profile Visibility</p>
                      <p className="text-[9px] text-gray-500">
                        {sPrivate ? 'Only followers can view your vault' : 'Your profile is publicly visible'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sPrivate ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                    {sPrivate ? 'Private' : 'Public'}
                  </span>
                </div>

                {/* Quick links */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/30">
                      <MessageSquare className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Messages & Chat</p>
                      <p className="text-[9px] text-gray-500">Open your chat inbox</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => navigate('/chat')}
                    className="text-[9px] text-purple-400 hover:text-white font-bold flex items-center gap-1 transition-colors">
                    Open <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/30">
                      <Bell className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Notification Center</p>
                      <p className="text-[9px] text-gray-500">View all activity alerts</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => navigate('/notifications')}
                    className="text-[9px] text-purple-400 hover:text-white font-bold flex items-center gap-1 transition-colors">
                    Open <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* ---- Save Button ---- */}
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {isUpdating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...</>
              ) : (
                <><Save className="h-4 w-4" /> Save All Settings</>
              )}
            </button>
          </form>

          {/* ---- Danger Zone ---- */}
          <div className="glass-panel border-red-500/20 bg-red-950/5 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <h3 className="font-accent text-xs font-bold uppercase tracking-wider">Danger Zone</h3>
            </div>
            <div className="p-3 rounded-xl bg-red-950/10 border border-red-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-300">Delete Account Permanently</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                    Once you delete your account, there is no going back. All your certificates, follow connections, likes, and data will be permanently erased.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-400 hover:text-red-300 font-bold py-2.5 rounded-xl text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? 'Deleting Account...' : 'Delete My Account'}
            </button>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* FOLLOWERS / FOLLOWING MODAL              */}
      {/* ======================================= */}
      {listModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07050b]/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#12111d] glass-panel border border-purple-950/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-950/30 pb-3">
              <h3 className="font-accent text-sm font-bold text-white uppercase tracking-wider">{listModal.title}</h3>
              <button
                onClick={() => setListModal({ show: false, title: '', users: [] })}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {listModal.users.length === 0 ? (
                <div className="text-center text-xs text-gray-500 py-6">No {listModal.title.toLowerCase()} found.</div>
              ) : (
                listModal.users.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => { setListModal({ show: false, title: '', users: [] }); navigate(`/profile/${u._id}`); }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-950/20 border border-transparent hover:border-purple-900/35 cursor-pointer transition-all"
                  >
                    <div className="w-9 h-9 rounded-full bg-purple-900/40 border border-purple-800/40 overflow-hidden flex items-center justify-center font-bold text-xs text-purple-300">
                      {u.profilePicture ? (
                        <img src={getFileUrl(u.profilePicture)} alt={u.name} className="w-full h-full object-cover" />
                      ) : u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{u.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{u.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 🎬 INSTAGRAM STORY VIEWER MODAL          */}
      {/* ======================================= */}
      {storyViewer.show && storyViewer.stories.length > 0 && (
        <div className="fixed inset-0 z-[150] bg-[#07050b]/95 backdrop-blur-lg flex items-center justify-center p-0 select-none">
          <div className="w-full max-w-lg h-full sm:h-[85vh] sm:max-w-md bg-[#000] sm:rounded-3xl relative flex flex-col justify-between overflow-hidden shadow-2xl border border-purple-950/20">
            {/* Story Top Progress Indicators */}
            <div className="absolute top-3 left-3 right-3 z-30 flex gap-1">
              {storyViewer.stories.map((s, idx) => (
                <div key={idx} className="flex-1 h-0.5 bg-gray-700/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all ease-linear"
                    style={{
                      width: idx < storyViewer.activeIndex 
                        ? '100%' 
                        : idx === storyViewer.activeIndex 
                        ? '100%' 
                        : '0%',
                      transitionDuration: idx === storyViewer.activeIndex ? '5000ms' : '0ms'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Story Header */}
            <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-purple-800/40 overflow-hidden flex items-center justify-center bg-purple-950 text-white font-bold text-xs">
                  {user.profilePicture ? (
                    <img src={getFileUrl(user.profilePicture)} alt={user.name} className="w-full h-full object-cover" />
                  ) : user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-tight">{user.name}</span>
                  <span className="text-[8px] text-gray-400 block leading-tight">
                    {new Date(storyViewer.stories[storyViewer.activeIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {storyViewer.stories[storyViewer.activeIndex].audience === 'close-friends' && (
                  <span className="bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Star className="h-2 w-2 fill-current" /> Close Friend
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isSelf && (
                  <button
                    onClick={() => handleStoryDelete(storyViewer.stories[storyViewer.activeIndex]._id)}
                    className="p-1 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-900/30 transition-colors"
                    title="Delete Story"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setStoryViewer({ show: false, stories: [], activeIndex: 0 })}
                  className="p-1 text-gray-400 hover:text-white transition-colors bg-black/45 rounded-full border border-purple-950/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Story Viewer Area */}
            <div className="relative flex-1 bg-black flex items-center justify-center">
              {/* Previous Click Target */}
              <div 
                onClick={() => setStoryViewer(prev => ({ ...prev, activeIndex: Math.max(0, prev.activeIndex - 1) }))}
                className="absolute left-0 top-0 bottom-0 w-1/4 z-20 cursor-pointer" 
              />
              {/* Next Click Target */}
              <div 
                onClick={() => {
                  if (storyViewer.activeIndex < storyViewer.stories.length - 1) {
                    setStoryViewer(prev => ({ ...prev, activeIndex: prev.activeIndex + 1 }));
                  } else {
                    setStoryViewer({ show: false, stories: [], activeIndex: 0 });
                  }
                }}
                className="absolute right-0 top-0 bottom-0 w-3/4 z-20 cursor-pointer" 
              />

              {storyViewer.stories[storyViewer.activeIndex].fileType === 'video' ? (
                <video 
                  src={getFileUrl(storyViewer.stories[storyViewer.activeIndex].fileUrl)} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-contain"
                />
              ) : (
                <img 
                  src={getFileUrl(storyViewer.stories[storyViewer.activeIndex].fileUrl)} 
                  alt="User Story" 
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 📹 UPLOAD NEW STORY MODAL                 */}
      {/* ======================================= */}
      {storyCreatorOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#07050b]/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#12111d] glass-panel border border-purple-950/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-purple-950/30 pb-3">
              <h3 className="font-accent text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="h-4.5 w-4.5 text-accent" /> Share New Story
              </h3>
              <button
                onClick={() => setStoryCreatorOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStoryUpload} className="space-y-4">
              {/* File Input */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Select Media (Image/Video)</label>
                <div className="relative border-2 border-dashed border-purple-950/50 hover:border-purple-800/60 rounded-2xl p-6 text-center transition-all bg-[#07050d]">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    required
                    onChange={(e) => setStoryFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-300 font-semibold">
                    {storyFile ? storyFile.name : 'Click or Drag file to upload'}
                  </p>
                  <p className="text-[9px] text-gray-500 mt-1">Supports images and videos up to 10MB</p>
                </div>
              </div>

              {/* Story Audience Selection */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Select Audience</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStoryAudience('public')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      storyAudience === 'public'
                        ? 'bg-accent text-white border-accent shadow-md shadow-purple-500/10'
                        : 'bg-purple-950/20 border-purple-950/50 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoryAudience('close-friends')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      storyAudience === 'close-friends'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-purple-950/20 border-purple-950/50 text-gray-400 hover:text-emerald-400/80'
                    }`}
                  >
                    <Star className="h-3.5 w-3.5 fill-current" /> Close Friends
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-purple-950/25 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStoryCreatorOpen(false)}
                  className="flex-1 bg-purple-950/30 border border-purple-900/40 text-purple-300 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingStory}
                  className="flex-1 bg-gradient-to-r from-accent to-accent-dark text-white py-2.5 rounded-xl text-xs font-bold hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUploadingStory ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sharing...
                    </>
                  ) : (
                    'Share Story'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 📂 HIGHLIGHT CREATOR MODAL                */}
      {/* ======================================= */}
      {highlightCreatorOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#07050b]/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#12111d] glass-panel border border-purple-950/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-950/30 pb-3">
              <h3 className="font-accent text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-accent" /> Create Highlight
              </h3>
              <button
                onClick={() => setHighlightCreatorOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHighlight} className="space-y-4">
              {/* Highlight Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Highlight Title</label>
                <input
                  type="text"
                  placeholder="e.g. Work, Awards, Certificates"
                  required
                  value={newHighlightTitle}
                  onChange={(e) => setNewHighlightTitle(e.target.value)}
                  className="w-full bg-[#07050d] border border-purple-950/70 hover:border-purple-800/40 focus:border-accent text-gray-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none transition-all"
                />
              </div>

              {/* Cover Icon Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Select Cover Icon</label>
                <div className="flex gap-2.5 justify-between">
                  {['Award', 'Heart', 'Star', 'Code', 'Globe'].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewHighlightCoverIcon(icon)}
                      className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                        newHighlightCoverIcon === icon
                          ? 'bg-accent/25 border-accent text-accent shadow-md shadow-purple-500/10'
                          : 'bg-purple-950/20 border-purple-950/50 text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      {icon === 'Award' && <Award className="h-4 w-4" />}
                      {icon === 'Heart' && <Heart className="h-4 w-4" />}
                      {icon === 'Star' && <Star className="h-4 w-4" />}
                      {icon === 'Code' && <Code className="h-4 w-4" />}
                      {icon === 'Globe' && <Globe className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Story selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Select Stories to Include</label>
                {!user.stories || user.stories.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic py-2">No active stories available. Please upload a story first.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 max-h-40 overflow-y-auto pr-1">
                    {user.stories.map((story) => {
                      const isSelected = selectedHighlightStories.includes(story.fileUrl);
                      return (
                        <div 
                          key={story._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedHighlightStories(selectedHighlightStories.filter(url => url !== story.fileUrl));
                            } else {
                              setSelectedHighlightStories([...selectedHighlightStories, story.fileUrl]);
                            }
                          }}
                          className={`relative border aspect-[9/16] rounded-xl overflow-hidden cursor-pointer transition-all ${
                            isSelected ? 'border-accent ring-2 ring-accent/30 scale-95' : 'border-purple-950/50 hover:border-purple-800'
                          }`}
                        >
                          <img src={getFileUrl(story.fileUrl)} alt="Story Thumbnail" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="accent-accent h-3.5 w-3.5 cursor-pointer rounded"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-purple-950/25 flex gap-3">
                <button
                  type="button"
                  onClick={() => setHighlightCreatorOpen(false)}
                  className="flex-1 bg-purple-950/30 border border-purple-900/40 text-purple-300 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-accent to-accent-dark text-white py-2 rounded-xl text-xs font-bold hover:scale-[1.01] transition-all flex items-center justify-center"
                >
                  Create Highlight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 🌟 CLOSE FRIENDS SELECTION MODAL          */}
      {/* ======================================= */}
      {closeFriendsModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#07050b]/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#12111d] glass-panel border border-purple-950/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-950/30 pb-3">
              <h3 className="font-accent text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Star className="h-4.5 w-4.5 text-emerald-400 fill-emerald-500/25" /> Close Friends List
              </h3>
              <button
                onClick={() => setCloseFriendsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[10px] text-gray-400 leading-normal mb-2">
              Select users you follow to add to your Close Friends. Users in this list can see your Close Friends stories (green rings).
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {!user.following || user.following.length === 0 ? (
                <div className="text-center text-xs text-gray-500 py-6">You are not following anyone yet.</div>
              ) : (
                user.following.map((followedUser) => {
                  const isCF = closeFriendsList.some(cfId => String(cfId._id || cfId) === String(followedUser._id));
                  return (
                    <div
                      key={followedUser._id}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-950/20 border border-transparent hover:border-purple-900/35 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-purple-900/40 border border-purple-800/40 overflow-hidden flex items-center justify-center font-bold text-xs text-purple-300 shrink-0">
                          {followedUser.profilePicture ? (
                            <img src={getFileUrl(followedUser.profilePicture)} alt={followedUser.name} className="w-full h-full object-cover" />
                          ) : followedUser.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{followedUser.name}</div>
                          <div className="text-[9px] text-gray-500 truncate">{followedUser.email}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleCloseFriend(followedUser._id)}
                        className={`p-2 rounded-xl transition-all border flex items-center gap-1 text-[10px] font-bold ${
                          isCF
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-purple-950/30 border-purple-900/30 text-gray-500 hover:text-white'
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${isCF ? 'fill-emerald-400' : ''}`} />
                        {isCF ? 'Starred' : 'Add'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
