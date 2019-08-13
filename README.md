# media-server-demo-node
Demo application for the Medooze Media Server for Node.js

## Intallation
```
npm install
```

## Run
You need to run the demo passing as argument the public IP address of the media server that will be included in the SDP. This IP address is the one facing your clients.
```
node index.js <ip>
```

The demo will open an HTPPS/WSS server at port 8000. 

## Demos
### SVC Layer selection

To run this demo just open `https://ip:8000/svc/` on a Chrome browser and follow instructions.

### Recording

To run this demo just open `https://ip:8000/rec/` with Chrome or Firefox.

### Broadcasting

To run this demo just open `https://ip:8000/broadcast/` with Chrome or Firefox and follow instructions.

### Simulcat

To run this demo just open `https://ip:8000/simulcast/` with Chrome or Firefox and follow instructions.


## Docker build
see `https://github.com/Piasy/WebRTC-Docker`

```
# build
docker build -t yourname/media-server-demo .
# run
docker run -p 10000-10050:10000-10050/udp -p 5004-5005:5004-5005/udp -p 8000:8000 -it --name media-server-demo yourname/media-server-demo
```

## Push stream
WebRTC closes b frames by default, so h264 profile must be baseline
**Notice:** if you set `-vcodec copy`, you can't set `-profile:v baseline`, otherwise, ffmpeg will throw an error.

```
# use vlc
vlc ./toystory.mp4 --sout "#duplicate{dst=rtp{dst=127.0.0.1,port=5004,sap,name=sergio},dst=display}" --no-sout-audio --sout-video --sout-keep

# use ffmpeg
# -re                 read input at native frame rate
# -fflags             <flags>      ED....... (default autobsf)
# -an                 disable audio
# -vcodec codec       force video codec ('copy' to copy stream)
# -profile:v          set profile, must be baseline, should not have B frames
# -f fmt              force format
# -payload_type       <int>        E........ Specify RTP payload type (from -1 to 127) (default -1)
ffmpeg -re -fflags nobuffer -i ./toystory.mp4 \
-an -vcodec h264 -profile:v baseline -f rtp -payload_type 96 rtp://127.0.0.1:5004 \
-vn -acodec copy -f rtp rtp://127.0.0.1:5005

# ffmpeg in cmd
ffmpeg -re -fflags nobuffer -i ./toystory.mp4 ^
-an -vcodec h264 -profile:v baseline -f rtp -payload_type 96 rtp://127.0.0.1:5004 ^
-vn -acodec copy -f rtp rtp://127.0.0.1:5005
```

### Play RTP
```
# use ffplay
ffplay -protocol_whitelist "file,udp,rtp" test.sdp
```

### See if a video has B frames
```
ffprobe -show_streams -count_frames -pretty <filename>
```

## Some docs
1. [[FFmpeg-user] -c:v or -vcodec copy or -codec:v](https://lists.ffmpeg.org/pipermail/ffmpeg-user/2017-February/035335.html)
2. [Browser-based non-webrtc webcam capture](https://video.stackexchange.com/questions/18131/browser-based-non-webrtc-webcam-capture/19543#19543)

