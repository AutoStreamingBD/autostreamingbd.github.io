const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// একটি অবজেক্টে একটিভ স্ট্রিমগুলো রাখার জন্য
let activeStreams = {};

app.post('/start-stream', (req, res) => {
    const { videoUrl, streamKey, userId } = req.body;

    if (!videoUrl || !streamKey) {
        return res.status(400).send("Video URL and Stream Key are required!");
    }

    // FFmpeg কমান্ড: ইউটিউব ভিডিও থেকে ডাটা নিয়ে সরাসরি ইউটিউবে পুশ করা
    const ffmpeg = spawn('ffmpeg', [
        '-re', 
        '-i', videoUrl,
        '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '2500k',
        '-maxrate', '2500k', '-bufsize', '5000k',
        '-pix_fmt', 'yuv420p', '-g', '50',
        '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
        '-f', 'flv', `rtmp://a.rtmp.youtube.com/live2/${streamKey}`
    ]);

    activeStreams[userId] = ffmpeg;

    console.log(`Live started for User: ${userId}`);

    // ৫ মিনিট (৩০০,০০০ মি.সে.) পর অটোমেটিক বন্ধ করার লজিক
    setTimeout(() => {
        if (activeStreams[userId]) {
            activeStreams[userId].kill('SIGINT');
            delete activeStreams[userId];
            console.log(`Trial expired for User: ${userId}. Redirecting to Plans.`);
        }
    }, 5 * 60 * 1000); 

    res.send({ status: "success", message: "Live started! Trial: 5 Minutes." });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
