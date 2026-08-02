import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Student } from '@eduflow/shared';
import * as studentApi from '../api/students.ts';
import * as faceApi from '../api/face.ts';

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

  useEffect(() => {
    if (id) loadStudent();
    return () => {
      stopCamera();
    };
  }, [id]);

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
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch {
      setError('Camera access denied. Please allow camera access or use image upload.');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f14]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF7A3D]/20 border-t-[#FF7A3D]" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0f14] px-6 text-white">
        <AlertCircle className="mb-4 text-red-400" size={48} />
        <p className="text-lg text-gray-400">Student not found</p>
        <button
          onClick={() => navigate('/dashboard/students')}
          className="mt-4 text-sm text-[#FF7A3D] hover:text-[#ff8f5a]"
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] px-6 py-10 text-white">
      {/* Back button */}
      <button
        onClick={() => navigate(`/dashboard/students/${id}`)}
        className="mb-6 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
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
          <p className="mt-2 text-sm text-gray-400">
            {student.name} • {student.class} {student.division}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <CheckCircle className="text-green-400" size={24} />
            <div className="text-green-400">Face registered successfully! Redirecting...</div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <XCircle className="mt-0.5 shrink-0 text-red-400" size={20} />
            <div className="text-sm text-red-300">{error}</div>
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          {!capturedImage ? (
            <>
              {/* Instructions */}
              <div className="mb-6 rounded-lg bg-white/5 p-4">
                <h3 className="mb-2 text-sm font-semibold text-[#FF7A3D]">Instructions</h3>
                <ul className="space-y-1 text-sm text-gray-400">
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
                      className="w-full"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-64 w-64 rounded-full border-4 border-[#FF7A3D]/50" />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={captureImage}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF7A3D] text-sm font-semibold text-[#140A08] transition-all hover:bg-[#ff8f5a]"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      <Camera size={18} />
                      Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-6 text-sm font-medium text-white transition-all hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={startCamera}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF7A3D] text-sm font-semibold text-[#140A08] transition-all hover:bg-[#ff8f5a]"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    <Camera size={18} />
                    Start Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white transition-all hover:bg-white/10"
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
                  className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white transition-all hover:bg-white/10 disabled:opacity-50"
                >
                  Retake
                </button>
                <button
                  onClick={handleRegisterFace}
                  disabled={registering}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF7A3D] text-sm font-semibold text-[#140A08] transition-all hover:bg-[#ff8f5a] disabled:opacity-50"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {registering ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#140A08]/30 border-t-[#140A08]" />
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
    </div>
  );
}
