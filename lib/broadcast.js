//Get the Medooze Media Server interface
const MediaServer = require("medooze-media-server");

//Get Semantic SDP objects
const SemanticSDP	= require("semantic-sdp");
const SDPInfo		= SemanticSDP.SDPInfo;
const MediaInfo		= SemanticSDP.MediaInfo;
const CandidateInfo	= SemanticSDP.CandidateInfo;
const DTLSInfo		= SemanticSDP.DTLSInfo;
const ICEInfo		= SemanticSDP.ICEInfo;
const StreamInfo	= SemanticSDP.StreamInfo;
const TrackInfo		= SemanticSDP.TrackInfo;
const Direction		= SemanticSDP.Direction;
const CodecInfo		= SemanticSDP.CodecInfo;


//Create new streamer
const streamer = MediaServer.createStreamer();

//Create new video session codecs
const video = new MediaInfo("video","video");

//Add h264 codec
video.addCodec(new CodecInfo("h264",96));

//Create session for video
const session = streamer.createSession(video,{
	local  : {
		port: 5004
	}
});

// ------ audio
const audioStreamer = MediaServer.createStreamer();
const audioMediaInfo = new MediaInfo('audio', 'audio');
// RTP Payload Types see https://www.iana.org/assignments/rtp-parameters/rtp-parameters.xhtml
// 这里使用 111 的话，推流的时候也要指定 -payload_type 111
audioMediaInfo.addCodec(new CodecInfo('opus', 111));	// find in sdp
const audioSession = audioStreamer.createSession(audioMediaInfo, {
	local  : {
		port: 6004
	}
});


module.exports = function(request,protocol,endpoint)
{
	const connection = request.accept(protocol);

	connection.on('message', (frame) =>
	{
		//Get cmd
		var msg = JSON.parse(frame.utf8Data);


		//Get cmd
		if (msg.cmd==="OFFER")
		{

			//Process the sdp
			var offer = SDPInfo.process(msg.offer);

			//Create an DTLS ICE transport in that enpoint
			const transport = endpoint.createTransport({
				dtls : offer.getDTLS(),
				ice  : offer.getICE()
			});

			//Set RTP remote properties
			transport.setRemoteProperties({
				audio : offer.getMedia("audio"),
				video : offer.getMedia("video")
			});

			//Get local DTLS and ICE info
			const dtls = transport.getLocalDTLSInfo();
			const ice  = transport.getLocalICEInfo();

			//Get local candidates
			const candidates = endpoint.getLocalCandidates();

			//Create local SDP info
			let answer = new SDPInfo();

			//Add ice and dtls info
			answer.setDTLS(dtls);
			answer.setICE(ice);
			//For each local candidate
			for (let i=0;i<candidates.length;++i)
				//Add candidate to media info
				answer.addCandidate(candidates[i]);

			//Get remote video m-line info
			let audioOffer = offer.getMedia("audio");

			//If offer had video
			if (audioOffer)
			{
				//Create video media
				let audio = new MediaInfo(audioOffer.getId(), "audio");

				// Get audio codecs
				let opus = audioOffer.getCodec('opus');
				console.log('-----------------------');
				console.log(opus);
				//Add audio codecs
				audio.addCodec(opus);
				//Set recv only
				// audio.setDirection(Direction.INACTIVE);
				audio.setDirection(Direction.SENDONLY);
				//Add it to answer
				answer.addMedia(audio);
			}

			//Get remote video m-line info
			let videoOffer = offer.getMedia("video");

			//If offer had video
			if (videoOffer)
			{
				//Create video media
				let  video = new MediaInfo(videoOffer.getId(), "video");

				//Get codec types
				let h264 = videoOffer.getCodec("h264");
				console.log('-----------------------');
				console.log(h264);
				//Add video codecs
				video.addCodec(h264);
				//Set recv only
				// video.setDirection(Direction.RECVONLY);
				video.setDirection(Direction.SENDONLY);
				//Add it to answer
				answer.addMedia(video);
			}

			//Set RTP local  properties
			transport.setLocalProperties({
				audio : answer.getMedia("audio"),
				video : answer.getMedia("video")
			});


			//Create new local stream with only video
			const outgoingStream  = transport.createOutgoingStream({
				audio: true,
				video: true
			});

			//Copy incoming data from the broadcast stream to the local one
			outgoingStream.getVideoTracks()[0].attachTo(session.getIncomingStreamTrack());
			outgoingStream.getAudioTracks()[0].attachTo(audioSession.getIncomingStreamTrack());

			//Get local stream info
			const info = outgoingStream.getStreamInfo();

			//Add local stream info it to the answer
			answer.addStream(info);

			//Send response
			connection.sendUTF(JSON.stringify({
				answer : answer.toString()
			}));

			//Close on disconnect
			connection.on("close",() => {
				//Stop
				transport.stop();
			});
		}
	});
};
