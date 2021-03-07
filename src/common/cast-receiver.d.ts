// https://gist.github.com/jeffcunat/484bc331294070fe4547bff058fd5269

/* eslint-disable no-redeclare */
declare module cast {
  export class receiver {
    /**
     * Version of the cast SDK.
     */
    static VERSION: string;

    /**
     * The Cast receiver logger object.
     * Sets the log verbosity level.
     */
    static logger: {
      setLevelValue(loggerLevel: cast.receiver.LoggerLevel): void;
    };

    /**
     *
     * The media namespace.
     */
    MEDIA_NAMESPACE: string;
  }
}

declare module cast.receiver {
  /**
   * Handles cast messages for a specific sender and namespace
   *  * (it is a point to point communications channel).
   *  * It should be used when the application wants to have a virtual connection
   *  * with a single sender for a specific protocol (namespace),
   *  * similar to a virtual websocket.
   *  * Applications should never create CastChannels, they should only be obtained
   *  * from the corresponding CastMessageBus calling the getCastChannel method.
   *  * Extends goog.events.EventTarget. Implements EventTarget.
   */
  export class CastChannel {
    /**
     * Event handler for {code cast.receiver.CastChannel} close event.
     */
    onClose(event: CastChannel.Event): void;

    /**
     * Event handler for cast.receiver.CastMessageBus message event.
     */
    onMessage(event: CastChannel.Event): void;

    getNamespace(): string;

    getSenderId(): string;

    /**
     * Sends a message to the sender associated with this CastChannel.
     */
    send(message: string): void;
  }

  module CastChannel {
    /**
     * System events dispatched by cast.receiver.CastChannel.
     */
    export class Event {
      message: any;

      constructor(type: string, message: any);
    }

    export enum EventType {
      CLOSE,
      MESSAGE
    }
  }

  /**
   * Handles cast messages for a specific namespace.
   *  * Applications should never create a CastMessageBus,
   *  * they should only be obtained from the cast.receiver.CastReceiverManager instance.
   *  * Extends goog.events.EventTarget. Implements EventTarget.
   */
  export class CastMessageBus {
    /**
     * Deserializes a serialized message.
     */
    deserializeMessage(message: string): any;

    /**
     * Serializes a deserialized message.
     */
    serializeMessage(message: any): string;

    /**
     * Event handler for cast.receiver.CastMessageBus message event.
     */
    onMessage(event: CastMessageBus.Event): void;

    /**
     * The namespace of the messages processed by this CastMessageBus
     */
    getNamespace(): string;

    /**
     * The type of messages processed by this CastMessageBus.
     */
    getMessageType(): cast.receiver.CastMessageBus.MessageType;

    /**
     * Sends a message to a specific sender.
     */
    send(senderId: string, message: any): void;

    /**
     * Sends a message to all the senders connected.
     */
    broadcast(message: any): void;

    /**
     * Provides a {cast.receiver.CastChannel} for a specific senderId.
     */
    getCastChannel(senderId: string): CastChannel;
  }

  module CastMessageBus {
    /**
     * Event which contains the event raised when a new message is received
     * * on the message bus for a specific namespace. Extends goog.events.Event.
     */
    export class Event {
      /**
       * Application message.
       */
      data: any;

      /**
       * The sender Id.
       */
      senderId: string;

      constructor(type: CastMessageBus.EventType, senderId: string, data: any);
    }

    /**
     * Events dispatched by cast.receiver.CastMessageBus.
     */
    export enum EventType {
      MESSAGE
    }

    /**
     * Fired when there is a message.
     * Message types used by cast.receiver.CastMessageBus.
     */
    export enum MessageType {
      STRING,
      JSON,
      CUSTOM
    }
  }

  /**
   * Initializes the system manager so we can communicate with the platform.
   *  * This class is used to send/receive system messages/events.
   *  * It must only be instantiated just once (singleton).
   *  * Extends goog.events.EventTarget. Implements EventTarget.
   */
  export class CastReceiverManager {
    /**
     * Initializes the system manager so we can communicate with the platform.
     *      * This class is used to send/receive system messages/events.
     *      * It must only be instantiated just once (singleton).
     */
    constructor();

    /**
     * If provided, it processes the 'ready' event.
     */
    onReady(event: CastReceiverManager.Event): void;

    /**
     * If provided, it processes the 'senderconnected' event.
     */
    onSenderConnected(event: CastReceiverManager.Event): void;

    /**
     * If provided, it processes the 'senderdisconnected' event.
     */
    onSenderDisconnected(event: CastReceiverManager.Event): void;

    /**
     * If provided, it processes the 'systemvolumechanged' event.
     */
    onSystemVolumeChanged(event: CastReceiverManager.Event): void;

    /**
     * If provided, it processes the 'visibilitychanged' event.
     */
    onVisibilityChanged(event: CastReceiverManager.Event): void;

    /**
     * Initializes the system manager.
     */
    start(config?: CastReceiverManager.Config): void;

    /**
     * Terminates the application.
     */
    stop(): void;

    /**
     * When the application calls start, the system will send the ready event to indicate
     *      * that the application information is ready and the application can send messages as
     *      * soon as there is one sender connected.
     */
    isSystemReady(): boolean;

    /**
     * Provides a list of the senders currently connected to the application.
     */
    getSenders(): Array<string>;

    /**
     * Provides a copy of the sender object by senderId.
     */
    getSender(senderId: string): cast.receiver.system.Sender;

    /**
     * Provides application information once the system is ready, otherwise it will be null.
     */
    getApplicationData(): cast.receiver.system.ApplicationData;

    /**
     * Provides device capabilities information once the system is ready, otherwise it will be null.
     * If an empty object is returned, the device does not expose any capabilities information.
     * Capabilities can be dynamic, the same cast device can present different capabilities depending on the device attached to it.
     */
    getDeviceCapabilities(): { [key: string]: any };

    /**
     * Sets the application state.
     */
    setApplicationState(statusText: string): void;

    /**
     * Provides a channel for a specific namespace (for any sender).
     */
    getCastMessageBus(
      namespace: string,
      messageType?: cast.receiver.CastMessageBus.MessageType
    ): cast.receiver.CastMessageBus;

    static getInstance(): CastReceiverManager;
  }

  module CastReceiverManager {
    /**
     * Application configuration parameters.
     */
    export class Config {
      /**
       * Maximum time in seconds before closing an idle sender connection.
       *      * Setting this value enables a heartbeat message to keep the connection alive.
       *      * Used to detect unresponsive senders faster than typical TCP timeouts
       *      * The minimum value is 5 seconds, there is no upper bound enforced but practically
       *      * it's minutes before platform TCP timeouts come into play. Default value is 10 seconds.
       */
      maxInactivity: number;

      /**
       * Text that represents the application status. It should meet internationalization
       *      * rules as may be displayed by the sender application.
       */
      statusText: string;

      constructor();
    }

    /**
     * Event dispatched by cast.receiver.CastReceiverManager which contains system information. Extends goog.events.Event.
     */
    export class Event {
      /**
       * Data associated with this event.
       */
      data: any;

      /**
       * Event dispatched by cast.receiver.CastReceiverManager which contains system information.
       */
      constructor(type: CastReceiverManager.EventType, data: any);
    }

    /**
     * System events dispatched by cast.receiver.CastReceiverManager.
     */
    export enum EventType {
      READY,
      SHUTDOWN,
      SENDER_CONNECTED,
      SENDER_DISCONNECTED,
      ERROR,
      SYSTEM_VOLUME_CHANGED,
      VISIBILITY_CHANGED
    }
  }

  /**
   * This class is used to send/receive media messages/events.
   */
  export class MediaManager {
    /**
     * Creates a media manager instance. This class is used to send/receive media messages/events.
     *     * @param mediaElement    HTMLMediaElement or cast.receiver.media.Player
     *     *                         The DOM media element (video/audio) or a player that implements
     *     *                        the cast.receiver.media.Player interface. Note that the MediaManager will
     *     *                        add listeners for 'loadedmetadata', 'error', and 'ended' HTMLMediaElement events.
     *     *                        Must not be null.
     *     * @param @optional opt_supportedCommands    cast.receiver.media.Command
     *     *                        Media commands supported by the application.
     *     *                        LOAD, PLAY, STOP, GET_STATUS must always be supported. Optional.
     */
    constructor(mediaElement: HTMLMediaElement | cast.receiver.media.Player, opt_supportedCommands?: number);

    /**
     * The application developer can override this method to customize the media status that will be send to the senders (this method will be called before the media status is sent).
     * By providing this method application developers can, for example, add custom data to the media status.
     * The current media status will be provided as a parameter and the method should return the application-modified current status.
     * The default behavior is to return the incoming media status.
     * If the method returns null the media status message will not be sent (developers should be aware that if the media status is a response to a sender status request the sender will expect a response so this method should only return null it if the developer is also overriding onGetStatus).
     * @param mediaStatus the media status
     */
    customizedStatusCallback(
      mediaStatus: cast.receiver.media.MediaStatus
    ): cast.receiver.media.MediaStatus | Promise<cast.receiver.media.MediaStatus>;

    /**
     * The application developer can override this method to customize the media status
     *     * that will be send to the senders (this method will be called before the media status is sent).
     *     * By providing this method application developers can, for example, add custom data to the media status.
     *     * The current media status will be provided as a parameter and the method should return
     *     * the application-modified current status.
     *     * The default behavior is to return the incoming media status.
     *     * If the method returns null the media status message will not be sent
     *     * (developers should be aware that if the media status is a response to a sender status request
     *     * the sender will expect a response so this method should only return null it if the developer
     *     * is also overriding onGetStatus).
     * Called when the media ends. The default behavior is to call ResetMediaElement with idle reason FINISHED.
     */
    onEnded(): void;

    /**
     * Called when there is an error not triggered by a LOAD request.
     *     * The default behavior is to call ResetMediaElement.
     */
    onError(error: any): void;

    /**
     * Processes the get status event.
     */
    onGetStatus(event: any): void;

    /**
     * If provided, it processes the load event. The default behavior is to set the src and autoplay properties
     *     * of the media element and call its load method.
     *     * If provided, the currentTime property will be modified when the 'loadedmetadata' event is fired
     *     * (in onMetadataLoaded) as it can only be set when the media element duration property has been set.
     */
    onLoad(event: any): void;

    /**
     * Called when load has had an error, it can be overridden to handle application specific logic.
     *     * The default behavior is to call resetMediaElement with idle reason ERROR and sendLoadError
     *     * with error type LOAD_FAILED.
     */
    onLoadMetadataError(loadInfo: any): void;

    /**
     * Called when load has completed, it can be overridden to handle application specific action.
     *     * The default behavior is to set the currentTime property of the media element
     *     * (if it was provided in the LOAD request), then call sendLoadComplete.
     */
    onMetadataLoaded(loadInfo: any): void;

    /**
     * Processes the pause event. The default behavior is to call the media element's pause method
     *     * and broadcast the status providing the incoming requestId.
     */
    onPause(event: any): void;

    /**
     * Processes the play event. The default behavior is to call the media element's play method
     *     * and broadcast the status providing the incoming requestId.
     */
    onPlay(event: any): void;

    /**
     * Processes the seek event. The default behavior is to call the media element's play
     *     * or pause methods (only if required based on the current state and the resume state value of the request)
     *     * and broadcast the status providing the incoming requestId.
     */
    onSeek(event: any): void;

    /**
     * Processes the set volume event. The default behavior is to set volume and muted on the media element
     *     * as required and broadcast the status providing the incoming requestId.
     */
    onSetVolume(event: any): void;

    /**
     * Processes the stop event. The default behavior is to call resetMediaElement,
     *     * with idle reason CANCELLED, and broadcast the status providing the incoming requestId.
     */
    onStop(event: any): void;

    /**
     * Provides information about the media currently loaded.
     *     * @returns    cast.receiver.media.MediaInformation The media information.
     *     * @see    cast.receiver.media.MediaInformation
     * Sets information about the media currently loaded. This information will be sent to the senders
     *     * when they request media status.
     *     * @param    mediaInformation    cast.receiver.media.MediaInformation
     *     *             The new media information. Use resetMediaElement to reset its value. Must not be null.
     *     * @param @optional    broadcast    Bool
     *     *             Whether the senders should be notified about the change
     *     *            (if not provided, the senders will be notified). Optional.
     *     * @param @optional    broadcastStatusCustomData    Dynamic
     *     *            If the senders should be notified this parameter allows to set the application-specific
     *     *            custom data in the status message. Optional.
     *     * @throws Error    If broadcastStatusCustomData is provided but broadcast is false.
     *     * @see cast.receiver.media.MediaInformation
     */
    setMediaInformation(mediaInformation: any, broadcast?: boolean, broadcastStatusCustomData?: any): void;

    /**
     * Sends a media status message to all senders (broadcast).
     *     * Applications can use it when they have a custom state change.
     *     * It will call cast.receiver.MediaManager.prototype.customizedStatusCallback so applications can customize
     *     * the status message.
     *     * @param includeMedia            Bool    Whether to include media information.
     *     * @param @optional requestId    Int        The ID of the request that triggered the status change. May be null.
     *     *                                        Optional.
     *     * @param @optional customData    Dynamic    The status message application-specific custom data. Optional.
     */
    broadcastStatus(includeMedia: boolean, requestId?: number, customData?: any): void;

    /**
     * Sets the IDLE reason. This allows applications that want to force the IDLE state to indicate the reason
     *     * that made the player going to IDLE state (a custom error, for example).
     *     * The idle reason will be sent in the next status message.
     *     * NOTE: Most applications do not need to set this value, it is only needed if they want to make the player
     *     * go to IDLE in special circumstances and the default idleReason does not reflect their intended behavior.
     *     * @param idleReason     cast.receiver.media.IdleReason
     *     *                        The reason to be in the IDLE state.
     */
    setIdleReason(idleReason: any): void;

    /**
     * Sends an error to a specific sender.
     *     * @param senderId        String
     *     *                         The sender ID.
     *     * @param requestId        Int
     *     *                         The ID of the incoming request that caused this error.
     *     * @param type            cast.receiver.media.ErrorType
     *     *                         The error type.
     *     * @param @optional reason    cast.receiver.media.ErrorReason
     *     *                         The error reason. May be null. Optional.
     *     * @param @optional customData    Dynamic
     *     *                         The error message application-specific custom data. Optional.
     */
    sendError(senderId: string, requestId: number, errorType: any, errorReason: any, customData?: any): void;

    /**
     * Sends a media status message to a specific sender.
     *     * @param senderId    String
     *     *                     The sender ID.
     *     * @param requestId    Int
     *     *                     The ID of the incoming request that caused this error.
     *     * @param includeMedia    Bool
     *     *                     Whether to include media information.
     *     * @param @optional customData    Dynamic
     *     *                     The status message application-specific custom data. Optional.
     */
    sendStatus(senderId: string, requestId: number, includeMedia: boolean, customData?: any): void;

    /**
     * Associates a new media element or Player to the media manager.
     *     * @param mediaElement    HTMLMediaElement or cast.receiver.media.Player
     *     *                         The DOM media element (video/audio) or a player that implements the
     *     *                        cast.receiver.media.Player interface.
     */
    setMediaElement(mediaElement: any): void;

    /**
     * When the application overrides onLoad, it should use this method to trigger an error response to the sender.
     *     * This is typically due to application-specific verification issues.
     *     * @param @optional errorType    cast.receiver.media.ErrorType
     *     *                                 The error type, by default is assumed to be
     *     *                                cast.receiver.media.ErrorType.LOAD_FAILED, but the application can send an
     *     *                                INVALID_REQUEST for example if there is customData that does not match some
     *     *                                criteria.
     *     * @param @optional customData    Dynamic
     *     *                                 The error message application-specific custom data. Optional.
     *     * @see cast.receiver.media.ErrorType
     */
    sendLoadError(errorType: any, customData?: any): void;

    /**
     * Sends the new status after a LOAD message has been completed succesfully.
     *     * Note: Applications do not normally need to call this API.
     *     * When the application overrides onLoad, it may need to manually declare that the LOAD request was sucessful.
     *     * The default implementaion will send the new status to the sender when the video/audio element raises
     *     * the 'loadedmetadata' event. The default behavior may not be acceptable in a couple scenarios:
     *     *  1) When the application does not want to declare LOAD succesful until for example 'canPlay' is raised
     *     *     (instead of 'loadedmetadata').
     *     *  2) When the application is not actually loading the media element
     *     *     (for example if LOAD is used to load an image).
     *     * @param @optional customData    Dynamic
     *     *                                 The status message application-specific custom data.
     */
    sendLoadComplete(customData?: any): void;

    /**
     * Resets Media Element to IDLE state. After this call the mediaElement properties will change, paused will be true, currentTime will be zero and the src attribute will be empty. This only needs to be manually called if the developer wants to override the default behavior of onError, onStop or onEnded, for example.
     *     * @param @optional idleReason    cast.receiver.media.IdleReason
     *     *                                 The reason to be IDLE.
     *     * @param @optional broadcast    Bool
     *     *                                 Whether the senders should be notified about the change
     *     *                                (if not provided, the senders will be notified).
     *     * @param @optional requestId    Int
     *     *                                 If the status change is due to a sender request (for example STOP),
     *     *                                this is the ID of the sender request that will be added to the status message
     *     *                                so the sender can identify it. May be null.
     *     * @param @optional broadcastStatusCustomData    Dynamic
     *     *                                 If the senders should be notified, this parameter allows to set the
     *     *                                application-specific custom data in the status message.
     *     * @throws Error                If broadcastStatusCustomData is provided but broadcast is false.
     */
    resetMediaElement(idleReason: any, broadcast?: boolean, requestId?: number, broadcastStatusCustomData?: any): void;
  }

  module MediaManager {
    /**
     * Event dispatched by cast.receiver.MediaManager which contains system information.
     */
    export class Event {
      /**
       * The ID of the sender that triggered the event.
       */
      senderId: string;

      /**
       * Request data associated with this event.
       */
      data: RequestData;

      constructor(type: string, data: RequestData, senderId: string);
    }

    /**
     * Load Request Information. Extends cast.receiver.MediaManager.RequestData.
     */
    export class LoadInfo {
      /**
       * Request data associated with this load request.
       * The ID of the sender that triggered the event.
       */
      senderId: string;

      constructor(message: LoadRequestData, senderId: string);
    }

    /**
     * Media event LOAD request data. Extends cast.receiver.MediaManager.RequestData.
     */
    export class LoadRequestData extends RequestData {
      /**
       * If the autoplay parameter is specified, the media player will begin playing the content when it is loaded.
       */
      autoplay?: boolean;

      /**
       * Seconds since beginning of content.
       */
      currentTime?: number;

      /**
       * Mzdia information
       */
      media: cast.receiver.media.MediaInformation;

      /**
       * If the autoplay parameter is specified, the media player will begin playing the content when it is loaded.
       */
      constructor();
    }

    /**
     * Media event request data.
     */
    export class RequestData {
      /**
       * Application-specific data for this request.
       */
      customData: any;

      /**
       * Id of the media session that the request applies to.
       */
      mediaSessionId: number;

      /**
       * Id of the request, used to correlate request/response.
       */
      requestId: number;

      constructor();
    }

    /**
     * Media event SEEK request data. Extends cast.receiver.MediaManager.RequestData
     */
    export class SeekRequestData {
      /**
       * Seconds since beginning of content
       */
      currentTime: number;

      /**
       * The playback state after a SEEK request
       */
      constructor();
    }

    /**
     * Media event SET_VOLUME request data. Extends cast.receiver.MediaManager.RequestData.
     */
    export class VolumeRequestData {
      /**
       * The media stream volume.
       */
      constructor();
    }

    export enum EventType {
      LOAD,
      STOP,
      PAUSE,
      PLAY,
      SEEK,
      SET_VOLUME,
      GET_STATUS
    }
  }

  export enum LoggerLevel {
    DEBUG,
    ERROR,
    INFO,
    NONE,
    VERBOSE
  }
}

declare module cast.receiver.media {
  /**
   * Represents the media information.
   */
  export class MediaInformation {
    /**
     * Partial list of break clips that includes current break clip that
     * receiver is playing or ones that receiver will play shortly after,
     * instead of sending whole list of clips. This is to avoid overflow of
     * MediaStatus message.
     */
    breakClips?: Array<BreakClip> | undefined;

    /**
     * List of breaks.
     */
    breaks?: Array<Break> | undefined;

    /**
     * Typically the url of the media.
     */
    contentId: string;

    /**
     * The stream type.
     */
    contentType: string;

    /**
     * Application-specific media information.
     */
    customData?: any;

    /**
     * The media duration.
     */
    duration?: number;

    /**
     * The media metadata.
     */
    metadata?: any;

    /**
     * The stream type.
     */
    streamType: StreamType;

    /**
     * The media tracks
     */
    tracks?: Array<Track>;
    constructor();
  }

  export class Break {
    /**
     * Duration of a break in seconds.
     */
    duration: number | undefined;

    /**
     * Indicates whether the break is embedded in the main stream.
     */
    isEmbedded: boolean | undefined;

    /**
     * Location of the break inside the main video. -1 represents the end of the main video in seconds.
     */
    position: number;

    constructor(id: string, breakClipIds: Array<string>, position: number);
  }

  export class BreakClip {
    /**
     * Duration of a break clip in seconds.
     */
    duration: number | undefined;

    constructor(id: string);
  }

  export class BreakStatus {
    /**
     * ID of the current break clip.
     */
    breakClipId: string | undefined;

    /**
     * ID of the current break.
     */
    breakId: string | undefined;

    /**
     * Time in seconds elapsed after the current break clip starts.
     */
    currentBreakClipTime: number | undefined;

    /**
     * Time in seconds elapsed after the current break starts.
     */
    currentBreakTime: number | undefined;

    /**
     * The time in seconds when this break clip becomes skippable.
     * 5 means that the end user can skip this break clip after 5 seconds. If this field is not defined, it means that the current break clip is not skippable.
     */
    whenSkippable: number | undefined;

    constructor(currentBreakTime: number | undefined, currentBreakClipTime: number | undefined);
  }

  /**
   * Represents the status of a media session.
   */
  export class MediaStatus {
    /**
     * List of IDs corresponding to the active tracks.
     */
    activeTrackIds: Array<number>;

    /**
     * Status of break, if receiver is playing break. This field will be defined only when receiver is playing break.
     */
    breakStatus: cast.receiver.media.BreakStatus | undefined;

    /**
     * ID of this media item (the item that originated the status change).
     */
    currentItemId: number;

    /**
     * The current playback position.
     */
    currentTime: number;

    /**
     * Application-specific media status.
     */
    customData: any;

    /**
     * If the state is IDLE, the reason the player went to IDLE state.
     */
    idleReason: cast.receiver.media.IdleReason;

    //TODO items: Array<cast.receiver.media.QueueItem;
    //TODO liveSeekableRange: cast.receiver.media.LiveSeekableRange;

    /**
     * ID of the media Item currently loading. If there is no item being loaded, it will be undefined.
     */
    loadingItemId: number;

    /**
     * The media information.
     */
    media: cast.receiver.media.MediaInformation;

    /**
     * If the state is IDLE, the reason the player went to IDLE state.
     * The media information.
     * Unique id for the session.
     */
    mediaSessionId: number;

    /**
     * The playback rate.
     */
    playbackRate: number;

    /**
     * The playback state.
     */
    playerState: cast.receiver.media.PlayerState;

    /**
     * ID of the next Item, only available if it has been preloaded.
     * Media items can be preloaded and cached temporarily in memory, so when they are loaded later on, the process is faster (as the media does not have to be fetched from the network).
     */
    preloadedItemId: number;

    //TODO queueData: cast.receiver.media.QueueData;
    //TODO repeatMode: cast.receiver.media.RepeatMode;

    /**
     * The commands supported by this player.
     */
    supportedMediaCommands: number;

    type: string; //cast.receiver.media.MessageType;

    /**
     * The video information
     */
    videoInfo: cast.receiver.media.VideoInformation;

    /**
     * The current stream volume.
     */
    volume: cast.receiver.media.Volume;

    constructor();
  }

  /**
   * Video information such as video resolution and High Dynamic Range (HDR).
   */
  export class VideoInformation {
    hdrType: cast.receiver.media.HdrType;
    height: number;
    width: number;

    constructor(width: number, height: number, hdrType: cast.receiver.media.HdrType);
  }

  /**
   * Represents the volume of a media session stream.
   */
  export class Volume {
    /**
     * Value from 0 to 1 that represents the current stream volume level.
     */
    level: number;

    /**
     * Whether the stream is muted.
     */
    muted: boolean;

    constructor();
  }

  export interface Player {
    /**
     * Allows to edit the tracks information (active tracks and style).
     *     * @param data cast.receiver.media.TracksInfo
     *     *             The tracks information. The tracks definition can not change so the tracks field will be undefined (and should be ignored).
     */
    editTracksInfo(data: TracksInfo): void;

    /**
     * Provides the current time in seconds.
     */
    getCurrentTimeSec(): number;

    /**
     * Provides the duration of the media in seconds.
     */
    getDurationSec(): number;

    /**
     * Provides the state {cast.receiver.media.PlayerState} of the player.
     */
    getState(): PlayerState;

    /**
     * Provides the stream volume.
     */
    getVolume(): Volume;

    /**
     * Loads content to be played.
     *     * @param contentId The content ID. Should be treated as an opaque string.
     *     * @param autoplay Whether the content should play after load.
     *     * @param opt_time The expected current time after load (in seconds).
     *     * @param opt_tracksInfo The tracks information.
     *     * @param opt_onlyLoadTracks If true, only the tracks will be loaded, the application will be responsible to call load. If it is true, opt_tracksInfo should be provided.
     */
    load(
      contentId: string,
      autoplay: boolean,
      opt_time?: number,
      opt_tracksInfo?: TracksInfo,
      opt_onlyLoadTracks?: boolean
    ): void;

    /**
     * Pauses playback.
     */
    pause(): void;

    /**
     * Starts playback.
     */
    play(): void;

    /**
     * Registers an API that the player should call when the media has ended.
     *     * @param endedCallback The callback method called when the player has ended.
     */
    registerEndedCallback(endedCallback: () => void): void;

    /**
     * Registers an API that the player should call when there is an error.
     *      * @param errorCallback The callback method called when the player has an error.
     */
    registerErrorCallback(errorCallback: (err: Object) => void): void;

    /**
     * Registers an API that the player should call when load is complete.
     *     * @param loadCallback The callback method called when the player has completed load succesfully.
     */
    registerLoadCallback(loadCallback: () => void): void;

    /**
     * Resets the player. After this call the player state should be IDLE (no media loaded).
     */
    reset(): void;

    /**
     * Sets playback to start at a new time position.
     *      * @param time The expected current time after seek (in seconds).
     *      * @param opt_resumeState The expected state after seek.
     */
    seek(time: number, opt_resumeState?: SeekResumeState): void;

    /**
     * Sets the stream volume.
     * @param volume New volume.
     */
    setVolume(volume: Volume): void;

    /**
     * Called to unregister for ended callbacks.
     */
    unregisterEndedCallback(): void;

    /**
     * Called to unregister for error callbacks.
     */
    unregisterErrorCallback(): void;

    /**
     * Called to unregister for load callbacks.
     */
    unregisterLoadCallback(): void;
  }

  export class TracksInfo {
    /**
     * The track Ids that should be active.
     */
    activeTrackIds?: Array<number>;

    /**
     * Language for the tracks that should be active. The language field will take precedence over activeTrackIds if both are specified.
     */
    language?: string;

    /**
     * The text track style.
     */
    textTrackStyle?: any;

    /**
     * The tracks information
     */
    tracks?: Array<Track>;
  }

  export class Track {
    /**
     * Custom data set by the receiver application.
     */
    customData: any;

    /**
     * Indicate track is in-band and not side-loaded track. Relevant only for text tracks.
     */
    isInBand: boolean;

    /**
     * Language tag as per RFC 5646 (If subtype is “SUBTITLES” it is mandatory).
     */
    language: string;

    /**
     * A descriptive, human-readable name for the track. For example "Spanish".
     */
    name: string;

    /**
     * The role(s) of the track. The following values for each media type are recognized, with value explanations described in ISO/IEC 23009-1, labeled "DASH role scheme":
     *
     *    VIDEO: caption, subtitle, main, alternate, supplementary, sign, emergency
     *    AUDIO: main, alternate, supplementary, commentary, dub, emergency
     *    TEXT: main, alternate, subtitle, supplementary, commentary, dub, description, forced_subtitle
     */
    roles: Array<string>;

    /**
     * For text tracks, the type of text track.
     */
    subtype: string;

    /**
     * It can be the URL of the track or any other identifier that allows the receiver to find the content (when the track is not inband or included in the manifest). For example it can be the URL of a vtt file.
     */
    trackContentId: string;

    /**
     * It represents the MIME type of the track content. For example if the track is a vtt file it will be ‘text/vtt’.
     * This field is needed for out of band tracks, so it is usually provided if a trackContentId has also been provided.
     * It is not mandatory if the receiver has a way to identify the content from the trackContentId, but recommended.
     * The track content type, if provided, must be consistent with the track type.
     */
    trackContentType?: string | CaptionMimeType;

    /**
     * Unique identifier of the track within the context of a MediaInformation object.
     */
    trackId: number;

    /**
     * The type of track.
     */
    type: TrackType;

    constructor(trackId: number, trackType: TrackType);
  }

  export enum TrackType {
    TEXT,
    AUDIO,
    VIDEO
  }

  export enum CaptionMimeType {
    CEA608 = 'text/cea608',
    TTML = 'application/ttml+xml',
    TTML_MP4 = 'application/mp4',
    VTT = 'text/vtt'
  }

  export enum Command {
    DUPLICATE_REQUEST_ID,
    INVALID_COMMAND,
    INVALID_MEDIA_SESSION_ID,
    INVALID_PARAMS
  }

  export enum ErrorReason {
    DUPLICATE_REQUEST_ID,
    INVALID_COMMAND,
    INVALID_MEDIA_SESSION_ID,
    INVALID_PARAMS
  }

  /**
   * Represents media error message types.
   */
  export enum ErrorType {
    INVALID_PLAYER_STATE,
    INVALID_REQUEST,
    LOAD_CANCELLED,
    LOAD_FAILED
  }

  export enum HdrType {
    SDR,
    HDR,
    DV
  }

  /**
   * The reason for the player to be in IDLE state.
   */
  export enum IdleReason {
    CANCELLED,
    ERROR,
    FINISHED,
    INTERRUPTED
  }

  export enum PlayerState {
    BUFFERING,
    IDLE,
    PAUSED,
    PLAYING
  }

  export enum SeekResumeState {
    PLAYBACK_PAUSE,
    PLAYBACK_START
  }

  /**
   * Represents the stream types.
   */
  export enum StreamType {
    BUFFERED,
    LIVE,
    NONE
  }
}

declare module cast.receiver.system {
  /**
   * Represents the data of the launched application.
   */
  export class ApplicationData {
    /**
     * The application Id.
     */
    id: string;

    /**
     * The id of the sender that launched the application.
     */
    launchingSenderId: string;

    /**
     * The application name.
     */
    name: string;

    /**
     * The namespaces used by the application.
     */
    namespaces: Array<string>;

    /**
     * The session Id.
     */
    sessionId: number;

    constructor();
  }

  /**
   * Represents the data of a connected sender device.
   */
  export class Sender {
    /**
     * The sender Id.
     */
    id: string;

    /**
     * The userAgent of the sender.
     */
    userAgent: string;

    constructor();
  }
}
