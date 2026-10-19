import React, { useState, useMemo } from 'react';
import { User, AttendanceRecord, AttendanceStatus, Kejuruan } from '../../../types';
import {
  Check,
  CheckCircle2,
  AlertTriangle,
  Search,
  CheckCheck,
  XCircle,
  Home,
  Building2,
  Clock,
  UserX,
  Users
} from 'lucide-react';

interface MentorTraineeTableProps {
  mentorKejuruan: Kejuruan;
  classTrainees: User[];
  classTodayRecords: AttendanceRecord[];
  pendingCount: number;
  onVerifyTrainee: (recordId: string, traineeName: string) => void;
  onApproveAllPending: () => void;
  onApproveAllNormalWFO?: () => void;
  onRejectOrMarkAlpha: (traineeId: string, traineeName: string, reason?: string) => void;
  onQuickMark: (traineeId: string, status: AttendanceStatus) => void;
}

type FilterTab = 'all' | 'needs-attention' | 'wfh' | 'late' | 'not-checked-in';

export const MentorTraineeTable: React.FC<MentorTraineeTableProps> = ({
  mentorKejuruan,
  classTrainees,
  classTodayRecords,
  pendingCount,
  onVerifyTrainee,
  onApproveAllPending,
  onApproveAllNormalWFO,
  onRejectOrMarkAlpha,
  onQuickMark,
}) => {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate quick metrics for filters & bulk actions
  const metrics = useMemo(() => {
    let wfhCount = 0;
    let lateCount = 0;
    let notCheckedInCount = 0;
    let normalWFOCount = 0;
    let needsAttentionCount = 0;

    classTrainees.forEach(t => {
      const rec = classTodayRecords.find(r => r.userId === t.id);
      const isNotCheckedIn = !rec || !rec.checkInTime;
      const isWFH = rec?.workMode === 'WFH';
      const isLate = rec?.status === 'terlambat';
      const isPending = rec?.verificationStatus === 'pending';

      if (isWFH) wfhCount++;
      if (isLate) lateCount++;
      if (isNotCheckedIn) notCheckedInCount++;

      if (rec && isPending && rec.status === 'hadir' && (rec.workMode === 'WFO' || !rec.workMode)) {
        normalWFOCount++;
      }

      if (isWFH || isLate || isPending || isNotCheckedIn) {
        needsAttentionCount++;
      }
    });

    return { wfhCount, lateCount, notCheckedInCount, normalWFOCount, needsAttentionCount };
  }, [classTrainees, classTodayRecords]);

  // Filtered trainee list
  const filteredTrainees = useMemo(() => {
    return classTrainees.filter(trainee => {
      const record = classTodayRecords.find(r => r.userId === trainee.id);
      const notCheckedIn = !record || !record.checkInTime;
      const isWFH = record?.workMode === 'WFH';
      const isLate = record?.status === 'terlambat';
      const isPending = record?.verificationStatus === 'pending';

      // Tab filter
      if (filterTab === 'needs-attention' && !(isWFH || isLate || isPending || notCheckedIn)) {
        return false;
      }
      if (filterTab === 'wfh' && !isWFH) {
        return false;
      }
      if (filterTab === 'late' && !isLate) {
        return false;
      }
      if (filterTab === 'not-checked-in' && !notCheckedIn) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = trainee.name.toLowerCase().includes(q);
        const matchNim = trainee.nim.toLowerCase().includes(q);
        const matchNotes = (record?.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchNim && !matchNotes) return false;
      }

      return true;
    });
  }, [classTrainees, classTodayRecords, filterTab, searchQuery]);

  return (
    <div className="surface rounded-2xl border border-[#E4EAF0] overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-[#E4EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[.13em] text-[#4C83B5] uppercase">
            VALIDASI KELAS BINAAN
          </p>
          <h2 className="text-base font-bold text-[#123B59]">
            Verifikasi Presensi Peserta Kelas {mentorKejuruan?.name || 'Binaan'}
          </h2>
          <p className="text-xs text-[#6F7F8D] mt-0.5">
            Validasi kehadiran harian, pantau pengajuan WFH, dan kelola presensi peserta.
          </p>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {metrics.normalWFOCount > 0 && onApproveAllNormalWFO && (
            <button
              type="button"
              onClick={onApproveAllNormalWFO}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Setujui sekaligus semua peserta yang hadir WFO tepat waktu"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Verifikasi Semua Hadir Normal ({metrics.normalWFOCount})</span>
            </button>
          )}

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={onApproveAllPending}
              className="px-3.5 py-2 rounded-xl bg-[#123B59] hover:bg-[#0D2F47] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Setujui seluruh presensi yang masih pending"
            >
              <Check className="w-3.5 h-3.5 text-[#A9C7DE]" />
              <span>Verifikasi Semua Pending ({pendingCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="px-4 py-3 bg-[#F8FAFB] border-b border-[#E4EAF0] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'all'
                ? 'bg-[#123B59] text-white shadow-xs'
                : 'bg-white text-[#6F7F8D] hover:bg-[#EEF5FA] border border-[#E4EAF0]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Semua</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'all' ? 'bg-white/20 text-white' : 'bg-[#E4EAF0] text-[#6F7F8D]'}`}>
              {classTrainees.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('needs-attention')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'needs-attention'
                ? 'bg-amber-600 text-white shadow-xs'
                : metrics.needsAttentionCount > 0
                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                : 'bg-white text-[#6F7F8D] hover:bg-[#EEF5FA] border border-[#E4EAF0]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Perlu Perhatian</span>
            {metrics.needsAttentionCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'needs-attention' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'}`}>
                {metrics.needsAttentionCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('wfh')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'wfh'
                ? 'bg-indigo-600 text-white shadow-xs'
                : metrics.wfhCount > 0
                ? 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                : 'bg-white text-[#6F7F8D] hover:bg-[#EEF5FA] border border-[#E4EAF0]'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>WFH</span>
            {metrics.wfhCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'wfh' ? 'bg-white/20 text-white' : 'bg-indigo-200 text-indigo-900'}`}>
                {metrics.wfhCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('late')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'late'
                ? 'bg-orange-600 text-white shadow-xs'
                : metrics.lateCount > 0
                ? 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
                : 'bg-white text-[#6F7F8D] hover:bg-[#EEF5FA] border border-[#E4EAF0]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Terlambat</span>
            {metrics.lateCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'late' ? 'bg-white/20 text-white' : 'bg-orange-200 text-orange-900'}`}>
                {metrics.lateCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('not-checked-in')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'not-checked-in'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white text-[#6F7F8D] hover:bg-[#EEF5FA] border border-[#E4EAF0]'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Belum Hadir</span>
            {metrics.notCheckedInCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'not-checked-in' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                {metrics.notCheckedInCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6F7F8D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIM, catatan..."
            className="w-full text-xs py-1.5 pl-8 pr-3 rounded-xl border border-[#E4EAF0] bg-white text-[#123B59] placeholder-[#6F7F8D] outline-none focus:border-[#4C83B5]"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E4EAF0] text-[#6F7F8D] text-[10px] font-bold tracking-wide uppercase bg-[#F8FAFB]">
              <th className="py-3 px-4">Nama Peserta</th>
              <th className="py-3 px-3">Mode Kerja</th>
              <th className="py-3 px-3">Jam Masuk</th>
              <th className="py-3 px-3">Status Absensi</th>
              <th className="py-3 px-3">Status Verifikasi</th>
              <th className="py-3 px-3">Catatan / Lokasi</th>
              <th className="py-3 px-4 text-right">Aksi Mentor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4EAF0]">
            {filteredTrainees.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-[#6F7F8D]">
                  Tidak ada data peserta yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filteredTrainees.map((trainee) => {
                const record = classTodayRecords.find((r) => r.userId === trainee.id);
                const isPending = record && record.verificationStatus === 'pending';
                const isVerified = record && record.verificationStatus === 'verified';
                const isRejected = record && record.verificationStatus === 'rejected';
                const notCheckedIn = !record || !record.checkInTime;
                const isWFH = record?.workMode === 'WFH';

                return (
                  <tr
                    key={trainee.id}
                    className={`transition ${
                      isWFH && isPending
                        ? 'bg-indigo-50/40 hover:bg-indigo-50/70'
                        : isPending
                        ? 'bg-amber-50/30 hover:bg-amber-50/60'
                        : 'hover:bg-[#F8FAFB]/60'
                    }`}
                  >
                    {/* User Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={trainee.avatar}
                          alt={trainee.name}
                          className="w-8 h-8 rounded-xl object-cover border border-[#E4EAF0]"
                        />
                        <div>
                          <div className="font-bold text-[#123B59]">{trainee.name}</div>
                          <div className="text-[10px] text-[#6F7F8D] font-mono">
                            NIM: {trainee.nim}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Mode Kerja (WFO / WFH) */}
                    <td className="py-3 px-3">
                      {record?.workMode ? (
                        record.workMode === 'WFH' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Home className="w-3 h-3" />
                            <span>WFH</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Building2 className="w-3 h-3" />
                            <span>WFO</span>
                          </span>
                        )
                      ) : notCheckedIn ? (
                        <span className="text-[#6F7F8D] text-[11px]">-</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Building2 className="w-3 h-3" />
                          <span>WFO</span>
                        </span>
                      )}
                    </td>

                    {/* Jam Masuk */}
                    <td className="py-3 px-3 font-mono text-[#123B59] tabular-nums">
                      {record?.checkInTime ? (
                        `${record.checkInTime} WIB`
                      ) : (
                        <span className="text-[#6F7F8D] italic">Belum hadir</span>
                      )}
                    </td>

                    {/* Status Absensi */}
                    <td className="py-3 px-3">
                      {record ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
                            record.status === 'hadir'
                              ? 'bg-[#EAF2F8] text-[#28618F]'
                              : record.status === 'terlambat'
                              ? 'bg-[#FFF5E6] text-[#C05621]'
                              : record.status === 'izin' || record.status === 'sakit'
                              ? 'bg-[#EEF5FA] text-[#4C83B5]'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {record.status}
                        </span>
                      ) : (
                        <span className="inline-flex whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-bold bg-[#F4F6F8] text-[#6F7F8D]">
                          Belum Absen
                        </span>
                      )}
                    </td>

                    {/* Status Verifikasi */}
                    <td className="py-3 px-3">
                      {notCheckedIn ? (
                        <span className="text-[#6F7F8D] text-[11px]">Menunggu Check-In</span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>Menunggu Verifikasi</span>
                        </span>
                      ) : isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[#28618F] bg-[#EAF2F8] font-bold text-[10px] px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#4C83B5]" />
                          <span>Terverifikasi Mentor</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 font-bold text-[10px] px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Ditolak / Alpha</span>
                        </span>
                      )}
                    </td>

                    {/* Catatan / Alasan / Lokasi */}
                    <td className="py-3 px-3 text-[#6F7F8D] text-[11px] max-w-[200px]">
                      <div className="truncate font-medium text-[#123B59]" title={record?.notes || ''}>
                        {record?.notes || '-'}
                      </div>
                      {isRejected && record?.rejectionReason && (
                        <div className="text-[10px] text-rose-600 italic truncate" title={record.rejectionReason}>
                          Alasan: {record.rejectionReason}
                        </div>
                      )}
                      {record && (record.checkInCoordinates || record.coordinates) && (
                        <a
                          className="text-[10px] text-[#28618F] hover:underline block mt-0.5"
                          target="_blank"
                          rel="noreferrer"
                          href={`https://www.google.com/maps?q=${
                            (record.checkInCoordinates || record.coordinates)!.lat
                          },${(record.checkInCoordinates || record.coordinates)!.lng}`}
                        >
                          Lihat Peta GPS
                        </a>
                      )}
                    </td>

                    {/* Aksi Mentor */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* WFH Specific Quick Actions */}
                        {isWFH && (
                          <>
                            {isPending && record && (
                              <button
                                type="button"
                                onClick={() => onVerifyTrainee(record.id, trainee.name)}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Setujui Pengajuan WFH"
                              >
                                <Check className="w-3 h-3" />
                                <span>Setujui</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onRejectOrMarkAlpha(trainee.id, trainee.name, 'WFH Tidak Sah / Ditolak Mentor')}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Tolak WFH dan Ubah Status Menjadi Alpha"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Alfakan</span>
                            </button>
                          </>
                        )}

                        {/* Standard Verification Button for Non-WFH */}
                        {!isWFH && isPending && record && (
                          <button
                            type="button"
                            onClick={() => onVerifyTrainee(record.id, trainee.name)}
                            className="px-3 py-1.5 rounded-xl bg-[#123B59] hover:bg-[#0D2F47] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Setujui Kehadiran Peserta"
                          >
                            <Check className="w-3 h-3" />
                            <span>Verifikasi</span>
                          </button>
                        )}

                        {/* Not Checked In Quick Mark as Alpha */}
                        {notCheckedIn && (
                          <button
                            type="button"
                            onClick={() => onRejectOrMarkAlpha(trainee.id, trainee.name, 'Tidak Masuk / Tanpa Keterangan')}
                            className="px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                            title="Tandai Alpha Langsung (Tidak Masuk)"
                          >
                            Tandai Alpha
                          </button>
                        )}

                        {/* Quick Mark Buttons [H] [T] [I] [S] [A] */}
                        <div className="flex items-center gap-1 ml-1 pl-1 border-l border-[#E4EAF0]">
                          <button
                            type="button"
                            onClick={() => onQuickMark(trainee.id, 'hadir')}
                            className={`w-6 h-6 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center ${
                              record?.status === 'hadir' && isVerified
                                ? 'bg-[#EAF2F8] text-[#28618F] ring-1 ring-[#4C83B5]'
                                : 'text-[#6F7F8D] hover:bg-[#F4F6F8]'
                            }`}
                            title="Tandai Hadir Tepat Waktu"
                          >
                            H
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickMark(trainee.id, 'terlambat')}
                            className={`w-6 h-6 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center ${
                              record?.status === 'terlambat' && isVerified
                                ? 'bg-[#FFF5E6] text-[#C05621] ring-1 ring-amber-400'
                                : 'text-[#6F7F8D] hover:bg-[#F4F6F8]'
                            }`}
                            title="Tandai Terlambat"
                          >
                            T
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickMark(trainee.id, 'izin')}
                            className={`w-6 h-6 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center ${
                              record?.status === 'izin' && isVerified
                                ? 'bg-[#EEF5FA] text-[#4C83B5] ring-1 ring-[#4C83B5]'
                                : 'text-[#6F7F8D] hover:bg-[#F4F6F8]'
                            }`}
                            title="Tandai Izin"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickMark(trainee.id, 'sakit')}
                            className={`w-6 h-6 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center ${
                              record?.status === 'sakit' && isVerified
                                ? 'bg-[#EEF5FA] text-[#4C83B5] ring-1 ring-[#4C83B5]'
                                : 'text-[#6F7F8D] hover:bg-[#F4F6F8]'
                            }`}
                            title="Tandai Sakit"
                          >
                            S
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickMark(trainee.id, 'alpha')}
                            className={`w-6 h-6 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center ${
                              record?.status === 'alpha' && (isVerified || isRejected)
                                ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-400'
                                : 'text-[#6F7F8D] hover:bg-[#F4F6F8]'
                            }`}
                            title="Tandai Alpha"
                          >
                            A
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
