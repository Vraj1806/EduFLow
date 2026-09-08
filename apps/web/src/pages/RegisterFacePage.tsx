import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Student } from '@eduflow/shared';
import * as studentApi from '../api/students.ts';
import * as faceApi from '../api/face.ts';
import { PageWrapper } from '../components/PageWrapper.tsx';

export function RegisterFacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (id) loadStudent();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    if (!stream) return;
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;

    let cancelled = false;
    async function play(el: HTMLVideoElement) {
      try {
        if (cancelled) return;
        await el.play();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Camera playback failed');
      }
    }

    if (video.readyState >= 2) {
      play(video);
    } else {
      video.onloadedmetadata = () => play(video);
    }

    return () => {
      cancelled = true;
      video.onloadedmetadata = null;
      video.srcObject = null;
    };
  }, [stream]);

  async function loadStudent() {
    if (!id) return;
    try {
      setLoading(true);
      const { student } = await studentApi.getStudentById(id);
      setStudent(student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student');
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraActive(true);
    } catch {
      setError('Camera access denied. Please allow camera access or use image upload.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setCameraActive(false);
  }

  function captureImage() {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageBase64);
    stopCamera();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageBase64 = event.target?.result as string;
      setCapturedImage(imageBase64);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }

  async function handleRegisterFace() {
    if (!id || !capturedImage) return;

    try {
      setRegistering(true);
      setError(null);
      await faceApi.registerFace(id, capturedImage);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/dashboard/students/${id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Face registration failed');
    } finally {
      setRegistering(false);
    }
  }

  function handleRetake() {
    setCapturedImage(null);
    setError(null);
    setSuccess(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--theme-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--theme-primary)]/20 border-t-[var(--theme-primary)]" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--theme-bg)] px-6 text-[var(--theme-fg)]">
        <AlertCircle className="mb-4 text-[var(--theme-danger)]" size={48} />
        <p className="text-lg text-[var(--theme-muted)]">Student not found</p>
        <button
          onClick={() => navigate('/dashboard/students')}
          className="mt-4 text-sm text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]"
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <PageWrapper className="min-h-screen bg-[var(--theme-bg)] px-6 py-10 text-[var(--theme-fg)]">
      {/* Back button */}
      <button
        onClick={() => navigate(`/dashboard/students/${id}`)}
        className="mb-6 flex items-center gap-2 text-sm text-[var(--theme-muted)] transition-colors hover:text-[var(--theme-fg)]"
      >
        <ArrowLeft size={16} />
        Back to Profile
      </button>

      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Register Face
          </h1>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">
            {student.name} • {student.class} {student.division}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--theme-success)]/20 bg-[var(--theme-success)]/10 p-4">
            <CheckCircle className="text-[var(--theme-success)]" size={24} />
            <div className="text-[var(--theme-success)]">Face registered successfully! Redirecting...</div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--theme-danger)]/20 bg-[var(--theme-danger)]/10 p-4">
            <XCircle className="mt-0.5 shrink-0 text-[var(--theme-danger)]" size={20} />
            <div className="text-sm text-[var(--theme-danger)]">{error}</div>
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
          {!capturedImage ? (
            <>
              {/* Instructions */}
              <div className="mb-6 rounded-lg bg-[var(--theme-surface)] p-4">
                <h3 className="mb-2 text-sm font-semibold text-[var(--theme-primary)]">Instructions</h3>
                <ul className="space-y-1 text-sm text-[var(--theme-muted)]">
                  <li>• Position the student's face inside the frame</li>
                  <li>• Ensure good lighting and clear visibility</li>
                  <li>• Only one person should be visible</li>
                  <li>• Face the camera directly</li>
                </ul>
              </div>

              {/* Camera View */}
              {cameraActive ? (
                <div className="mb-6">
                  <div className="relative overflow-hidden rounded-lg bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                      style={{ transform: 'scaleX(-1)', aspectRatio: '4 / 3' }}
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="h-64 w-64 rounded-full border-4 border-[var(--theme-primary)]/50" />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={captureImage}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--theme-primary)] text-sm font-semibold text-[var(--theme-primary-fg)] transition-all hover:bg-[var(--theme-primary-hover)]"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      <Camera size={18} />
                      Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex h-11 items-center justify-center rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-6 text-sm font-medium text-[var(--theme-fg)] transition-all hover:bg-[var(--theme-surface-raised)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={startCamera}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--theme-primary)] text-sm font-semibold text-[var(--theme-primary-fg)] transition-all hover:bg-[var(--theme-primary-hover)]"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    <Camera size={18} />
                    Start Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm font-medium text-[var(--theme-fg)] transition-all hover:bg-[var(--theme-surface-raised)]"
                  >
                    <Upload size={18} />
                    Upload Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="mb-6">
                <div className="overflow-hidden rounded-lg bg-black">
                  <img src={capturedImage} alt="Captured face" className="w-full" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleRetake}
                  disabled={registering}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm font-medium text-[var(--theme-fg)] transition-all hover:bg-[var(--theme-surface-raised)] disabled:opacity-50"
                >
                  Retake
                </button>
                <button
                  onClick={handleRegisterFace}
                  disabled={registering}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--theme-primary)] text-sm font-semibold text-[var(--theme-primary-fg)] transition-all hover:bg-[var(--theme-primary-hover)] disabled:opacity-50"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {registering ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--theme-fg)]/30 border-t-[var(--theme-fg)]" />
                      Registering...
                    </>
                  ) : (
                    'Register Face'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </PageWrapper>
  );
}
