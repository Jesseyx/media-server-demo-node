``` bash
# use vlc
vlc ./toystory.mp4 --sout "#duplicate{dst=rtp{dst=127.0.0.1,port=5004,sap,name=sergio},dst=display}" --no-sout-audio --sout-video --sout-keep

# use ffmpeg
ffmpeg -re -fflags nobuffer -i ./toystory.mp4 -vcodec copy -an -f rtp -payload_type 96 rtp://127.0.0.1:5004
```
