import { faBolt } from '@fortawesome/free-solid-svg-icons';
import { createLocalVideoTrack, LocalVideoTrack } from 'livekit-client';
import { AudioSelectButton, ControlButton, VideoSelectButton } from '@livekit/react-components';
import { VideoRenderer } from '@livekit/react-core';
import { ReactElement, useEffect, useState } from 'react';
import { AspectRatio } from 'react-aspect-ratio';
import { useNavigate } from 'react-router-dom';

export const PreJoinPage = () => {
  // state to pass onto room
  const [url, setUrl] = useState('wss://livekitpoc.lumina.mba');
  const [token, setToken] = useState<string>('');
  const [simulcast, setSimulcast] = useState(true);
  const [dynacast, setDynacast] = useState(true);
  const [adaptiveStream, setAdaptiveStream] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  // disable connect button unless validated
  const [connectDisabled, setConnectDisabled] = useState(true);
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack>();
  const [audioDevice, setAudioDevice] = useState<MediaDeviceInfo>();
  const [videoDevice, setVideoDevice] = useState<MediaDeviceInfo>();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && url) {
      setConnectDisabled(false);
    } else {
      setConnectDisabled(true);
    }
  }, [token, url]);

  const toggleVideo = async () => {
    if (videoTrack) {
      videoTrack.stop();
      setVideoEnabled(false);
      setVideoTrack(undefined);
    } else {
      const track = await createLocalVideoTrack({
        deviceId: videoDevice?.deviceId,
      });
      setVideoEnabled(true);
      setVideoTrack(track);
    }
  };

  useEffect(() => {
    // enable video by default
    createLocalVideoTrack({
      deviceId: videoDevice?.deviceId,
    }).then((track) => {
      setVideoEnabled(true);
      setVideoTrack(track);
    });
  }, [videoDevice]);

  const toggleAudio = () => {
    if (audioEnabled) {
      setAudioEnabled(false);
    } else {
      setAudioEnabled(true);
    }
  };

  const selectVideoDevice = (device: MediaDeviceInfo) => {
    setVideoDevice(device);
    if (videoTrack) {
      if (videoTrack.mediaStreamTrack.getSettings().deviceId === device.deviceId) {
        return;
      }
      // stop video
      videoTrack.stop();
    }
  };

  const connectToRoom = async () => {
    if (videoTrack) {
      videoTrack.stop();
    }

    if (
      window.location.protocol === 'https:' &&
      url.startsWith('ws://') &&
      !url.startsWith('ws://localhost')
    ) {
      alert('Unable to connect to insecure websocket from https');
      return;
    }

    const params: { [key: string]: string } = {
      url,
      token,
      videoEnabled: videoEnabled ? '1' : '0',
      audioEnabled: audioEnabled ? '1' : '0',
      simulcast: simulcast ? '1' : '0',
      dynacast: dynacast ? '1' : '0',
      adaptiveStream: adaptiveStream ? '1' : '0',
    };
    if (audioDevice) {
      params.audioDeviceId = audioDevice.deviceId;
    }
    if (videoDevice) {
      params.videoDeviceId = videoDevice.deviceId;
    } else if (videoTrack) {
      // pass along current device id to ensure camera device match
      const deviceId = await videoTrack.getDeviceId();
      if (deviceId) {
        params.videoDeviceId = deviceId;
      }
    }
    navigate({
      pathname: '/room',
      search: '?' + new URLSearchParams(params).toString(),
    });
  };

  let videoElement: ReactElement;
  if (videoTrack) {
    videoElement = <VideoRenderer track={videoTrack} isLocal={true} />;
  } else {
    videoElement = <div className="placeholder" />;
  }

  return (
    <div className="prejoin">
      <main style={{"display": "flex", "flexDirection": "column", "justifyContent": "center", "alignItems": "center"}}>
        <h2>Panggung Live Lumina</h2>

        <div className="entrySection" style={{"display": "flex", "justifyContent": "center", "alignItems": "center"}}>
          <div style={{"display": "none"}}>
            <div className="label">Server URL</div>
            <div>
              <input type="text" name="url" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
          </div>
          <div style={{"paddingBottom": "20px"}}>
            <div style={{"width": "400px"}}>
              <input
                placeholder="Masukkan token kamu disini..."
                type="text"
                name="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="options" style={{"display": "flex", "justifyContent": "center", "alignItems": "center"}}>
            <div>
              <input
                id="simulcast-option"
                type="checkbox"
                name="simulcast"
                checked={simulcast}
                onChange={(e) => setSimulcast(e.target.checked)}
              />
              <label htmlFor="simulcast-option">Simulcast</label>
            </div>
            <div>
              <input
                id="dynacast-option"
                type="checkbox"
                name="dynacast"
                checked={dynacast}
                onChange={(e) => setDynacast(e.target.checked)}
              />
              <label htmlFor="dynacast-option">Dynacast</label>
            </div>
            <div>
              <input
                id="adaptivestream-option"
                type="checkbox"
                name="adaptiveStream"
                checked={adaptiveStream}
                onChange={(e) => setAdaptiveStream(e.target.checked)}
              />
              <label htmlFor="adaptivestream-option">Adaptive Stream</label>
            </div>
          </div>

        <div className="videoSection">
          <AspectRatio ratio={16 / 9}>{videoElement}</AspectRatio>
        </div>

        <div className="controlSection" style={{"display": "flex", "justifyContent": "center", "alignItems": "center"}}>
          <div>
            <AudioSelectButton
              isMuted={!audioEnabled}
              onClick={toggleAudio}
              onSourceSelected={setAudioDevice}
            />
            <VideoSelectButton
              isEnabled={videoTrack !== undefined}
              onClick={toggleVideo}
              onSourceSelected={selectVideoDevice}
            />
            <ControlButton
              label="Connect"
              disabled={connectDisabled}
              icon={faBolt}
              onClick={connectToRoom}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
