import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Video,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';
import type { AttendanceSession, ClassroomRecognitionResult, PaginationMeta, RecognizedStudent } from '@eduflow/shared';
import * as attendanceApi from '../api/attendance.ts';
import { ErrorBanner, PageHeader, Spinner, StatusBadge, buttonPrimary, buttonSecondary, inputClass } from '../components/ui.tsx';
import { PageWrapper } from '../components/PageWrapper.tsx';

function sessionTone(status: AttendanceSession['status']): 'gray' | 'amber' | 'green' | 'red' {
  if (status === 'COMPLETED') return 'green';
  if (status === 'PROCESSING') return 'amber';
  if (status === 'FAILED') return 'red';
  return 'gray';
}

export function AttendancePage() {
  const [classId, setClassId] = useState('');
  const [division, setDivision] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [imageData, setImageData] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState<ClassroomRecognitionResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsMeta, setSessionsMeta] = useState<PaginationMeta>({ page: 1, pageSize: 25, total: 0, totalPages: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const loadSessions = useCallback(async (page = 1) => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const data = await attendanceApi.getSessions(page);
      setSessions(data.sessions);
      setSessionsMeta(data.meta);
      setSessionsPage(page);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions(1);
    return () => {
      stopCamera();
    };
  }, [loadSessions]);

  async function startCamera() {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'environment' },
        audio: false,
      });
      setCameraStream(mediaStream);
      setCameraActive(true);
    } catch {
      setError('Camera access denied. Please allow camera access or use image upload instead.');
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  function captureFromCamera() {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);
    setImageData(imageBase64);
    setResult(null);
    setError(null);
    stopCamera();
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageData(event.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }

  async function handleRecognize() {
    if (!classId || !division) {
      setError('Enter the class and division before processing a photo');
      return;
    }
    if (!imageData) {
      setError('Upload a classroom photo first');
      return;
    }

    try {
      setRecognizing(true);
      setError(null);
      setSuccess(null);
      const recognition = await attendanceApi.recognizeClassroom(imageData, classId, division);
      setResult(recognition);
      setSelected(new Set(recognition.recognizedStudents.map((s) => s.studentId)));
      if (recognition.recognizedStudents.length === 0) {
        setSuccess(`Photo processed — ${recognition.totalFaces} face(s) found, but none matched a registered student.`);
      } else {
        setSuccess(`Photo processed — ${recognition.recognizedStudents.length} student(s) recognized.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recognition failed');
    } finally {
      setRecognizing(false);
    }
  }

  function toggleSelect(studentId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (!classId || !division || !date || !result) return;

    const recognizedStudents = result.recognizedStudents.filter((s) => selected.has(s.studentId));

    if (recognizedStudents.length === 0) {
      setError('Select at least one recognized student before confirming attendance');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const created = await attendanceApi.createSession({
        classId,
        division,
        date,
        imageReference: imageData ?? undefined,
      });
      await attendanceApi.processSession(
        created.session.id,
        recognizedStudents.map((s) => ({ studentId: s.studentId, confidence: s.confidence })),
      );
      await attendanceApi.confirmSession(created.session.id);
      setSuccess(`Attendance confirmed for ${recognizedStudents.length} student(s).`);
      setResult(null);
      setImageData(null);
      setSelected(new Set());
      loadSessions(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm attendance');
    } finally {
      setSubmitting(false);
    }
  }

  function presentCount(session: AttendanceSession) {
    return session.records?.filter((r) => r.status === 'PRESENT').length ?? 0;
  }

  function absentCount(session: AttendanceSession) {
    return session.records?.filter((r) => r.status === 'ABSENT').length ?? 0;
  }

  return (
    <PageWrapper className="min-h-screen bg-[var(--theme-bg)] px-6 py-10 text-[var(--theme-fg)]">
      <PageHeader title="Attendance" subtitle="Upload a classroom photo, review recognized students, and confirm attendance" />

      {error && <ErrorBanner message={error} />}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--theme-success)]/20 bg-[var(--theme-success)]/10 p-4">
          <CheckCircle className="shrink-0 text-[var(--theme-success)]" size={18} />
          <div className="text-sm text-[var(--theme-success)]">{success}</div>
        </div>
      )}

      {/* New Session */}
      <div className="mb-8 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
        <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          New Attendance Session
        </h2>

        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            handleRecognize();
          }}
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="classId" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
                Class
              </label>
              <input
                id="classId"
                type="text"
                required
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder="e.g., 6"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="division" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
                Division
              </label>
              <input
                id="division"
                type="text"
                required
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="e.g., A"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
                Date
              </label>
              <input
                id="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Image Upload */}
          {!imageData ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)] px-6 py-10 text-center transition-all hover:border-[var(--theme-primary)]/40">
                  <ImageIcon className="text-[var(--theme-muted)]" size={28} />
                  <span className="text-sm text-[var(--theme-muted)]">Upload a photo</span>
                  <span className="text-xs text-[var(--theme-muted)]">PNG / JPG / WebP</span>
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleImageUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)] px-6 py-10 text-center transition-all hover:border-[var(--theme-primary)]/40 hover:bg-[var(--theme-primary)]/5"
                >
                  <Video className="text-[var(--theme-primary)]" size={28} />
                  <span className="text-sm text-[var(--theme-muted)]">Take live photo</span>
                  <span className="text-xs text-[var(--theme-muted)]">Opens your camera</span>
                </button>
              </div>
              <p className="text-center text-xs text-[var(--theme-muted)]">The photo is used only to detect and match registered student faces</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="overflow-hidden rounded-lg bg-black">
                <img src={imageData} alt="Classroom photo" className="max-h-72 w-full object-contain" />
              </div>
              <div className="flex flex-row gap-3 sm:flex-col">
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-fg)] transition-all hover:bg-[var(--theme-surface-raised)] sm:flex-none">
                  <Camera size={16} />
                  Change
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleImageUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setImageData(null);
                    setResult(null);
                  }}
                  className="flex-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3 text-sm text-[var(--theme-fg)] transition-all hover:bg-[var(--theme-surface-raised)] sm:flex-none"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={recognizing || !imageData}
            className={buttonPrimary}
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {recognizing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--theme-fg)]/30 border-t-[var(--theme-fg)]" />
                Processing…
              </>
            ) : (
              'Process Photo'
            )}
          </button>
        </form>

        {/* Recognition Review */}
        {result && (
          <div className="mt-6 border-t border-[var(--theme-border)] pt-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Review Recognized Students
              </h3>
              <StatusBadge label={`${result.totalFaces} face(s) found`} tone="orange" />
              <StatusBadge label={`${result.recognizedStudents.length} matched`} tone="green" />
              <StatusBadge label={`${result.unknownFaces.length} unknown`} tone="gray" />
            </div>

            {result.recognizedStudents.length === 0 ? (
              <p className="text-sm text-[var(--theme-muted)]">
                No registered student was recognized in this photo. Check that the students have registered faces, then try again.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-[var(--theme-border)]">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-[var(--theme-border)] bg-[var(--theme-surface)]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">Mark Present</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">Roll No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--theme-border)]">
                      {result.recognizedStudents.map((s: RecognizedStudent) => (
                        <tr key={s.studentId} className="transition-colors hover:bg-[var(--theme-surface)]">
                          <td className="px-6 py-3">
                            <input
                              type="checkbox"
                              checked={selected.has(s.studentId)}
                              onChange={() => toggleSelect(s.studentId)}
                              className="h-4 w-4 accent-[var(--theme-primary)]"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--theme-primary)]/10 text-sm font-semibold text-[var(--theme-primary)]">
                                {s.studentName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-[var(--theme-fg)]">{s.studentName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-[var(--theme-fg)]">{s.rollNumber}</td>
                          <td className="px-6 py-3 text-sm text-[var(--theme-fg)]">
                            {Math.round(s.confidence * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.unknownFaces.length > 0 && (
              <p className="mt-3 flex items-center gap-2 text-sm text-amber-400">
                <UserX size={16} />
                {result.unknownFaces.length} unknown face(s) were not added to attendance and can be reviewed manually later.
              </p>
            )}

            {selected.size > 0 && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className={`${buttonSecondary} mt-5 border-[var(--theme-primary)]/30 bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/20`}
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {submitting ? 'Confirming…' : `Confirm ${selected.size} Present`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sessions */}
      <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Attendance Sessions
      </h2>

      {sessionsError && <ErrorBanner message={sessionsError} />}

      {sessionsLoading ? (
        <Spinner label="Loading sessions…" />
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)] px-6 py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-surface)]">
            <AlertCircle className="text-[var(--theme-muted)]" size={24} />
          </div>
          <p className="text-[var(--theme-muted)]">No attendance sessions yet</p>
          <p className="mt-1 text-sm text-[var(--theme-muted)]">Upload a classroom photo above to create your first session</p>
        </div>
      ) : (
        <>
        <div className="overflow-hidden rounded-lg border border-[var(--theme-border)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--theme-border)] bg-[var(--theme-surface)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">Present</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">Absent</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border)]">
                {sessions.map((session) => (
                  <Fragment key={session.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                      className="cursor-pointer transition-colors hover:bg-[var(--theme-surface)]"
                    >
                      <td className="px-6 py-4 text-sm text-[var(--theme-fg)]">
                        {new Date(session.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--theme-fg)]">
                        {session.classId} {session.division}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge label={session.status} tone={sessionTone(session.status)} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-sm text-[var(--theme-success)]">
                          <UserCheck size={16} /> {presentCount(session)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-sm text-amber-400">
                          <UserX size={16} /> {absentCount(session)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {expandedId === session.id ? (
                          <ChevronDown className="ml-auto text-[var(--theme-muted)]" size={18} />
                        ) : (
                          <ChevronRight className="ml-auto text-[var(--theme-muted)]" size={18} />
                        )}
                      </td>
                    </tr>
                    {expandedId === session.id && (
                      <tr key={`${session.id}-details`} className="bg-[var(--theme-surface)]">
                        <td colSpan={6} className="px-6 py-4">
                          {session.records && session.records.length > 0 ? (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {session.records.map((record) => (
                                <div
                                  key={record.id}
                                  className="flex items-center justify-between rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--theme-primary)]/10 text-xs font-semibold text-[var(--theme-primary)]">
                                      {record.student?.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-sm text-[var(--theme-fg)]">{record.student?.name}</div>
                                      <div className="text-xs text-[var(--theme-muted)]">{record.student?.rollNumber}</div>
                                    </div>
                                  </div>
                                  <StatusBadge
                                    label={record.status}
                                    tone={record.status === 'PRESENT' ? 'green' : record.status === 'ABSENT' ? 'red' : 'amber'}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-[var(--theme-muted)]">No records for this session.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sessionsMeta.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-[var(--theme-muted)]">
            <span>
              Page {sessionsPage} of {sessionsMeta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => loadSessions(sessionsPage - 1)}
                disabled={sessionsPage <= 1}
                className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-[var(--theme-fg)] transition-colors hover:bg-[var(--theme-surface-raised)] disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => loadSessions(sessionsPage + 1)}
                disabled={sessionsPage >= sessionsMeta.totalPages}
                className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-[var(--theme-fg)] transition-colors hover:bg-[var(--theme-surface-raised)] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
        </>
      )}
      {/* Camera Modal */}
      {cameraActive && cameraStream && (
        <CameraModal
          videoRef={videoRef}
          canvasRef={canvasRef}
          stream={cameraStream}
          onCapture={captureFromCamera}
          onClose={stopCamera}
        />
      )}
    </PageWrapper>
  );
}

function CameraModal({
  videoRef,
  canvasRef,
  stream,
  onCapture,
  onClose,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  stream: MediaStream;
  onCapture: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-5 py-3">
          <h3 className="text-sm font-semibold text-[var(--theme-fg)]">Live Camera</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--theme-muted)] hover:bg-[var(--theme-surface-raised)] hover:text-[var(--theme-fg)]">
            <X size={18} />
          </button>
        </div>

        <div className="relative bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ maxHeight: '60vh' }} />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-2xl border-2 border-dashed border-[var(--theme-primary)]/50" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 border-t border-[var(--theme-border)] px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-5 py-2.5 text-sm text-[var(--theme-fg)] hover:bg-[var(--theme-surface-raised)]">
            Cancel
          </button>
          <button
            onClick={onCapture}
            className="flex items-center gap-2 rounded-lg bg-[var(--theme-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--theme-primary-fg)] hover:bg-[var(--theme-primary-hover)]"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            <Camera size={16} />
            Capture
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
