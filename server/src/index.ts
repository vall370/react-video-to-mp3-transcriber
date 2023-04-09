import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import cors from 'cors';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/.env' });
const app = express();
app.use(cors());
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.mp4') //Appending .jpg
    }
})
var upload = multer({ storage: storage });

app.post('/upload', upload.single('video'), async (req, res) => {
    const videoPath = req.file!.path;
    console.log(videoPath)
    const outputPath = videoPath.replace('.mp4', '.mp3');

    try {
        await convertVideoToMp3(videoPath, outputPath);

        const transcript = await transcribeWithWhisper(outputPath);

        res.json({ transcript });
    } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).send('Error processing video');
    }
});
const transcribeWithWhisper = async (filePath: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), { filename: 'audio.mp3', contentType: 'audio/mpeg' });
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'srt')
    formData.append('language', 'en')
    try {
        const response = await axios.post('https://api.openai.com/v1/audio/translations', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        throw error;
    }
};
const convertVideoToMp3 = (input: string, output: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', ['-i', input, '-vn', output]);

        ffmpeg.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`ffmpeg exited with code ${code}`));
            }
        });
    });
};

app.listen(3001, () => {
    console.log('Server started on port 3001');
});