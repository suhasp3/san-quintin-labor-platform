import { useState, useRef, useEffect } from 'react';

interface VoiceRecorderProps {
  onRecordComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onRecordComplete, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        try {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        } catch (err) {
          console.error('Error handling audio data:', err);
        }
      };

      mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          onRecordComplete(audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        } catch (err) {
          console.error('Error stopping recording:', err);
          alert('Error processing recording. Please try again.');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
        alert('Recording error occurred. Please try again.');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Could not access microphone: ${errorMessage}. Please allow access and try again.`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        {isRecording ? (
          <div>
            <div className="text-4xl mb-2">🎤</div>
            <div className="text-lg font-semibold text-gray-800">
              {formatTime(recordingTime)}
            </div>
            <div className="text-sm text-gray-600">Recording...</div>
          </div>
        ) : (
          <div className="text-gray-600">Press to record</div>
        )}
      </div>

      <div className="flex gap-2">
        {!isRecording ? (
          <>
            <button
              onClick={startRecording}
              className="flex-1 bg-primary text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors active:scale-95"
            >
              🎤 Record
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold text-lg hover:bg-gray-400 transition-colors active:scale-95"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={stopRecording}
              className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-red-600 transition-colors active:scale-95"
            >
              ⏹ Stop
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold text-lg hover:bg-gray-400 transition-colors active:scale-95"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

