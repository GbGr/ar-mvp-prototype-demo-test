import { MutableRefObject, RefObject, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { useFrame, useThree } from '@react-three/fiber';
import * as THREEx from '@ar-js-org/ar.js/three.js/build/ar-threex-location-only';
import { Geolocation } from '@capacitor/geolocation';

import ARSceneEventBus, { ARSceneEvent } from './ARSceneEventBus';
import WebcamRenderer from './WebcamRenderer';

globalThis['THREE'] = THREE;

interface Props {
    arVideoRef: RefObject<HTMLVideoElement>;
    threexRef: MutableRefObject<any>;
    onError: (error: Error) => void;
}

const LocationBasedAR = ({ arVideoRef, threexRef, onError }: Props): null => {
    const { scene, camera, gl } = useThree();
    const webcamRendererRef = useRef<WebcamRenderer>();
    const orientationControlsRef = useRef<any>();

    useEffect(() => {
        // eslint-disable-next-line no-param-reassign
        threexRef.current = new THREEx.LocationBased(scene, camera);
        threexRef.current.setGpsOptions({ gpsMinAccuracy: 50_000 });
    }, [threexRef, scene, camera]);

    useEffect(() => {
        Geolocation.watchPosition({ enableHighAccuracy: true }, (position) => {
            if (!position) return;
            const threex = threexRef.current;
            if (!threex) return;
            threex._gpsReceived(position);
        }).then(console.warn)

        if (!arVideoRef.current) {
            onError(new Error('Video ref should exist'));

            return () => void 0;
        }
        webcamRendererRef.current = new WebcamRenderer(gl, arVideoRef.current);
        webcamRendererRef.current?.play().catch(onError);

        return () => {
            webcamRendererRef.current?.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene]);

    useEffect(() => {
        orientationControlsRef.current = new THREEx.DeviceOrientationControls(camera);
    }, [camera]);

    useEffect(() => {
        const threex = threexRef.current;
        if (!threex) return;

        threex.on('gpsupdate', (pos: GeolocationPosition) => {
            ARSceneEventBus.emit(ARSceneEvent.DEBUG, { latLong: `${pos.coords.latitude}; ${pos.coords.longitude}` });
            ARSceneEventBus.emit(ARSceneEvent.DEBUG, { accuracy: `${pos.coords.accuracy / 1000}` });
            Promise.resolve().then(() => ARSceneEventBus.emit(ARSceneEvent.GPS_UPDATED, pos));
        });

        // threex.startGps(); // TODO: no more fukin\' needed'

        return () => threex.stopGps();
    }, [threexRef]);

    useFrame(() => {
        webcamRendererRef.current?.update();
        orientationControlsRef.current?.update();
    });

    return null;
};
// const originalLonLatToWorldCoords = THREEx.LocationBased.prototype.lonLatToWorldCoords;
// THREEx.LocationBased.prototype.lonLatToWorldCoords = function () {
//   console.log(`setWorldPosition params: ${Array.prototype.slice.call(arguments).join('; ')}`);
//   const result = originalLonLatToWorldCoords.apply(this, Array.prototype.slice.apply(arguments));
//   result.forEach((v: any, i: number) => result[i] = Math.abs(v));
//   // debugger;
//   console.log(`setWorldPosition result: ${result.join('; ')}`);
//   return result;
// }

export default LocationBasedAR;
