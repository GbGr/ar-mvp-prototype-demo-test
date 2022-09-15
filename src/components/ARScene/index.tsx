import React, { createRef, memo, Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';

import EggModel from './EggModel';
import LocationBasedAR from './LocationBasedAR';
import ARSceneEventBus, { ARSceneEvent } from './ARSceneEventBus';
import Debug from './Debug';
import classes from './ARScene.module.scss';

const ARScene = (): JSX.Element => {
    const threexRef = useRef<any>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const arVideoRef = createRef<HTMLVideoElement>();

    useEffect(
        () =>
            ARSceneEventBus.on(ARSceneEvent.EGG_CAPTURED_ANIMATION_END, (reward) => {
                alert('Catched!')
            }),
        [],
    );

    return (
        <div className={classes.root}>
            <video ref={arVideoRef} muted autoPlay playsInline style={{ display: 'none' }} />
            {true && <Debug />}
            <Canvas ref={canvasRef} className={classes.canvas} gl={{ preserveDrawingBuffer: true }}>
                <LocationBasedAR arVideoRef={arVideoRef} threexRef={threexRef} onError={console.log.bind(null, 'onError')} />
                <hemisphereLight color="#fff" intensity={2} />
                <Suspense fallback={null}>
                    <EggModel
                        threexRef={threexRef}
                        onCapture={console.log.bind(null, 'onCapture')}
                        changeCaptureAbility={console.log.bind(null, 'changeCaptureAbility')}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default memo(ARScene);
