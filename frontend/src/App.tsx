import React, { ChangeEvent, useState } from 'react';
import axios from 'axios';
import srtParser2 from "srt-parser-2";

const App: React.FC = () => {
  var parser = new srtParser2();

  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<any[]>([]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setTranscript(response.data.transcript);
      setSubtitles(parser.fromSrt(response.data.transcript)); // Save the transcript in the state
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState<number | null>(null);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const currentTime = videoRef.current.currentTime * 1000; // Convert to milliseconds
    const newIndex = subtitles.findIndex(
      (subtitle: any) => currentTime >= subtitle.start && currentTime <= subtitle.end
    );

    if (newIndex !== currentSubtitleIndex) {
      setCurrentSubtitleIndex(newIndex);
    }
  };
  return (
    <div>
      <h1>Upload Video and Transcribe</h1>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      <button onClick={handleSubmit}>Upload and Transcribe</button>

      {file && (
        <div>
          <h2>Video Player</h2>
          <video ref={videoRef} src={URL.createObjectURL(file)} controls onTimeUpdate={handleTimeUpdate} />
        </div>
      )}

      {transcript && (
        <div>
          <h2>Transcription:</h2>
          <textarea
            value={transcript}
            readOnly
            rows={10}
            cols={50}
            style={{ resize: 'none', whiteSpace: 'pre-wrap' }}
          />
        </div>
      )}

      {subtitles.length > 0 && (
        <div>
          <h2>Subtitles:</h2>
          <ul>
            {subtitles.map((subtitle: any, index: number) => (
              <li key={index} style={{ backgroundColor: index === currentSubtitleIndex ? 'yellow' : 'transparent' }}>
                {subtitle.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;