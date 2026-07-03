import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Plus, Edit2, Trash2, Star, ChevronLeft, ChevronRight, Loader2, Award, Search, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 8;

  // Query for fetching admin certificates list
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminCertificates', page, search],
    queryFn: async () => {
      const params = { page, limit, sortBy: 'order_asc' };
      if (search) params.search = search;
      const res = await api.get('/api/certificates', { params });
      return res.data;
    },
    keepPreviousData: true,
  });

  // Toggle Featured status Mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }) => {
      const res = await api.put(`/api/certificates/${id}`, { featured });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Spotlight status updated');
      queryClient.invalidateQueries({ queryKey: ['adminCertificates'] });
      queryClient.invalidateQueries({ queryKey: ['featuredCertificates'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });

  // Reorder index Mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, order }) => {
      const res = await api.put(`/api/certificates/${id}`, { order });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Certificate order updated');
      queryClient.invalidateQueries({ queryKey: ['adminCertificates'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Reorder failed');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/api/certificates/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Certificate deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['adminCertificates'] });
      queryClient.invalidateQueries({ queryKey: ['featuredCertificates'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Delete failed');
    },
  });

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOrderChange = (id, currentOrder, change) => {
    const newOrder = currentOrder + change;
    updateOrderMutation.mutate({ id, order: newOrder });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen relative z-10">
      <div className="absolute top-[5%] left-[-5%] w-[40vw] h-[40vw] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-accent text-3xl font-bold text-white tracking-wide">
            Management Panel
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
            Control Dashboard • Create, Edit, Reorder and Spotlight
          </p>
        </div>

        <Link
          to="/admin/add"
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/10 hover:scale-[1.01] transition-all self-start sm:self-center"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Certificate
        </Link>
      </div>

      {/* Dashboard Filter Card */}
      <div className="glass-panel rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4 border-purple-950/40">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
          <input
            type="text"
            placeholder="Filter list by title or issuer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#07050d] border border-purple-950/70 hover:border-purple-800/40 focus:border-accent text-gray-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none transition-all placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Main Table view */}
      {isLoading ? (
        <div className="glass-panel rounded-2xl p-16 flex items-center justify-center border-purple-950/40">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
            <p className="text-gray-400 text-sm">Loading inventory database...</p>
          </div>
        </div>
      ) : error ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-red-400 border-red-950/50">
          Error loading dashboard list. Check server connection.
        </div>
      ) : data?.certificates?.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-gray-500 border-purple-950/20">
          {search ? 'No records match search filters.' : 'Inventory database empty. Add your first certificate.'}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl overflow-hidden border-purple-950/40 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-purple-950/20 border-b border-purple-950/50 text-gray-400 uppercase text-[10px] font-bold tracking-widest">
                    <th className="px-6 py-4">Title & Issuer</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-center">Featured</th>
                    <th className="px-6 py-4 text-center">Order Index</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/30 text-sm">
                  {data?.certificates?.map((cert) => (
                    <tr key={cert._id} className="hover:bg-[#12111d]/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{cert.title}</span>
                          <span className="text-xs text-gray-500 mt-0.5">{cert.issuer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-purple-950/40 border border-purple-900/40 text-purple-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          {cert.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            toggleFeaturedMutation.mutate({ id: cert._id, featured: !cert.featured })
                          }
                          className={`inline-flex p-1.5 rounded-lg border transition-all ${
                            cert.featured
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-indian-gold'
                              : 'bg-purple-950/20 border-purple-950 text-gray-600 hover:text-purple-400'
                          }`}
                          title="Toggle Spotlight Feature"
                        >
                          <Star className="h-4.5 w-4.5 fill-current" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2.5 bg-[#07050d] border border-purple-950 px-2.5 py-1 rounded-xl">
                          <button
                            onClick={() => handleOrderChange(cert._id, cert.order, -1)}
                            className="text-gray-500 hover:text-accent disabled:opacity-30"
                            disabled={cert.order <= 0}
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-white w-6 text-center">{cert.order}</span>
                          <button
                            onClick={() => handleOrderChange(cert._id, cert.order, 1)}
                            className="text-gray-500 hover:text-accent"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          <a
                            href={cert.fileUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${cert.fileUrl}` : cert.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg border border-purple-950 bg-[#0d0a15]/30 text-gray-400 hover:text-white"
                            title="View File"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <Link
                            to={`/admin/edit/${cert._id}`}
                            className="p-2 rounded-lg border border-purple-950 bg-[#0d0a15]/30 text-blue-400 hover:bg-blue-500/10"
                            title="Edit Certificate"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(cert._id, cert.title)}
                            className="p-2 rounded-lg border border-red-500/10 bg-[#0d0a15]/30 text-red-400 hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-semibold text-gray-500">
                Displaying page <span className="text-white">{page}</span> of{' '}
                <span className="text-white">{data.totalPages}</span>
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 text-xs font-bold border border-purple-950 hover:border-purple-800 bg-[#0d0a15]/50 px-3.5 py-2 rounded-xl text-gray-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, data.totalPages))}
                  disabled={page === data.totalPages}
                  className="inline-flex items-center gap-1 text-xs font-bold border border-purple-950 hover:border-purple-800 bg-[#0d0a15]/50 px-3.5 py-2 rounded-xl text-gray-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
