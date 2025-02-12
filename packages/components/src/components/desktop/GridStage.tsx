import { Participant } from 'livekit-client';
import React, { useEffect, useState } from 'react';
import { ControlsView } from '../ControlsView';
import { ParticipantView } from '../ParticipantView';
import { StageProps } from '../StageProps';
import styles from './styles.module.css';

export const GridStage = ({
  roomState,
  participantRenderer,
  controlRenderer,
  onLeave,
}: StageProps) => {
  const { isConnecting, error, participants, room } = roomState;
  const [visibleParticipants, setVisibleParticipants] = useState<Participant[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [gridClass, setGridClass] = React.useState(styles.grid1x1);

  // compute visible participants and sort.
  useEffect(() => {
    // determine grid size
    let numVisible = 0;
    participants.forEach((participant: Participant) => {
      if (participant.permissions?.canPublish && participant.metadata) {
        const participantMetadata: any = JSON.parse(String(participant.metadata));
        if (participantMetadata.user_type === 'streamer') {
          numVisible += 1;
        }
      }
    });
    if (numVisible === 1) {
      setGridClass(styles.grid1x1);
    } else if (numVisible === 2) {
      setGridClass(styles.grid2x1);
      numVisible = 2;
    } else if (numVisible <= 4) {
      setGridClass(styles.grid2x2);
      numVisible = Math.min(numVisible, 4);
    } else if (numVisible <= 9) {
      setGridClass(styles.grid3x3);
      numVisible = Math.min(numVisible, 9);
    } else if (numVisible <= 16) {
      setGridClass(styles.grid4x4);
      numVisible = Math.min(numVisible, 16);
    } else {
      setGridClass(styles.grid5x5);
      numVisible = Math.min(numVisible, 25);
    }

    // remove any participants that are no longer connected
    const newParticipants: Participant[] = [];
    participants.forEach((participant: Participant) => {
      if (
        (room?.participants.has(participant.sid) ||
          room?.localParticipant.sid === participant.sid) &&
        participant.permissions?.canPublish &&
        participant.metadata
      ) {
        newParticipants.push(participant);
      }
    });

    // ensure active speakers are all visible
    room?.activeSpeakers?.forEach((speaker) => {
      if (
        newParticipants.includes(speaker) ||
        (speaker !== room?.localParticipant && !room?.participants.has(speaker.sid))
      ) {
        return;
      }
      // find a non-active speaker and switch
      const idx = newParticipants.findIndex((p) => !p.isSpeaking);
      if (idx >= 0) {
        newParticipants[idx] = speaker;
      } else {
        newParticipants.push(speaker);
      }
    });

    // add other non speakers
    for (const p of participants) {
      if (newParticipants.length >= numVisible) {
        break;
      }
      if (newParticipants.includes(p) || p.isSpeaking) {
        continue;
      }
      newParticipants.push(p);
    }

    if (newParticipants.length > numVisible) {
      newParticipants.splice(numVisible, newParticipants.length - numVisible);
    }
    setVisibleParticipants(newParticipants);
  }, [participants]);

  if (error) {
    return <div>error {error.message}</div>;
  }

  if (isConnecting) {
    return <div>connecting</div>;
  }
  if (!room) {
    return <div>room closed</div>;
  }

  if (participants.length === 0) {
    return <div>no one is in the room</div>;
  }

  const ParticipantRenderer = participantRenderer ?? ParticipantView;
  const ControlRenderer = controlRenderer ?? ControlsView;

  return (
    // global container
    <div className={styles.container}>
      <div className={`${styles.gridStage} ${gridClass}`}>
        {visibleParticipants.map((participant) => {
          return (
            <ParticipantRenderer
              key={participant.identity}
              participant={participant}
              orientation="landscape"
              width="100%"
              height="100%"
              showOverlay={showOverlay}
              showConnectionQuality
              onMouseEnter={() => setShowOverlay(true)}
              onMouseLeave={() => setShowOverlay(false)}
            />
          );
        })}
      </div>
      <div className={styles.controlsArea}>
        <ControlRenderer room={room} onLeave={onLeave} />
      </div>
    </div>
  );
};
