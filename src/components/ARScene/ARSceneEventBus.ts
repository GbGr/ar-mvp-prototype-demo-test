import Eventemitter3 from 'eventemitter3';

type Unsubscribe = () => void;

export enum ARSceneEvent {
    EGG_CAPTURED_ANIMATION_START = 'EGG_CAPTURED_ANIMATION_START',
    EGG_CAPTURED_ANIMATION_END = 'EGG_CAPTURED_ANIMATION_END',
    GPS_UPDATED = 'GPS_UPDATED',
    DEBUG = 'DEBUG',
}

export default class ARSceneEventBus {
    private static readonly ee = new Eventemitter3();

    public static on(eventName: ARSceneEvent.EGG_CAPTURED_ANIMATION_START, callback: () => void): Unsubscribe;
    public static on(
        eventName: ARSceneEvent.EGG_CAPTURED_ANIMATION_END,
        callback: (data: any) => void,
    ): Unsubscribe;

    public static on(eventName: ARSceneEvent.GPS_UPDATED, callback: (data: GeolocationPosition) => void): Unsubscribe;
    public static on(eventName: ARSceneEvent.DEBUG, callback: (data: Record<string, any>) => void): Unsubscribe;
    public static on(eventName: ARSceneEvent, callback: (data?: any) => void): Unsubscribe {
        ARSceneEventBus.ee.on(eventName, callback);
        return () => ARSceneEventBus.ee.off(eventName, callback);
    }

    static emit(eventName: ARSceneEvent.EGG_CAPTURED_ANIMATION_START): void;
    static emit(eventName: ARSceneEvent.EGG_CAPTURED_ANIMATION_END, data: any): void;
    static emit(eventName: ARSceneEvent.GPS_UPDATED, data: GeolocationPosition): void;
    static emit(eventName: ARSceneEvent.DEBUG, data: Record<string, any>): void;
    static emit(eventName: ARSceneEvent, data?: any): void {
        ARSceneEventBus.ee.emit(eventName, data);
    }
}
