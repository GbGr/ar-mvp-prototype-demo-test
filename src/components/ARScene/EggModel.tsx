import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import { AnimationMixer, LoopOnce, Vector3, type Group } from 'three';

import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Euler } from 'three/src/math/Euler';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import FrustumCheck from './FrustumCheck';
import ARSceneEventBus, { ARSceneEvent } from './ARSceneEventBus';

const eggModelRotation = new Euler(0, Math.PI / 2, 0);
const eggModelScale = new Vector3(1, 1, 1);

interface Props {
    threexRef: any;
    onCapture?: (image: string) => Promise<any | void>;
    changeCaptureAbility?: (canCapture: boolean) => void;
}

const EggModel = ({ threexRef, onCapture, changeCaptureAbility }: Props): JSX.Element => {
    const { camera, gl } = useThree();
    const mixerRef = useRef<AnimationMixer>();
    const eggGroupRef = useRef<Group>(null);
    const eggLocation = useRef<[number, number]>();
    const { scene, animations } = useLoader(GLTFLoader, '/ARScene/egg.gltf');
    const [isEggAnimationPlaying, setIsEggAnimationPlaying] = useState(false);

    eggLocation.current = [ 37.7354, 55.6994 ];

    useEffect(() => {
        if (!scene) {
            return;
        }
        const mixer = new AnimationMixer(scene);
        animations.forEach((animation) => {
            const clipAction = mixer.clipAction(animation);
            clipAction.setLoop(LoopOnce, 0);
            clipAction.reset().play();
        });

        mixer.update(0);

        mixerRef.current = mixer;
    }, [scene, animations]);

    useEffect(
        () =>
            ARSceneEventBus.on(ARSceneEvent.EGG_CAPTURED_ANIMATION_START, () => {
                const image = gl.domElement.toDataURL('image/jpeg', 0.2);
                const openEgg = onCapture?.(image) ?? Promise.resolve();

                openEgg.then((reward) => {
                    if (!reward) {
                        return null;
                    }
                    setIsEggAnimationPlaying(true);
                    (new Promise((resolve) => setInterval(resolve, 3_000))).then(() => {
                        ARSceneEventBus.emit(ARSceneEvent.EGG_CAPTURED_ANIMATION_END, reward);
                    });
                });
            }),
        [gl, onCapture],
    );

    useEffect(() => {
        if (!threexRef.current) return;

        return ARSceneEventBus.on(ARSceneEvent.GPS_UPDATED, () => {
            const eggGroup = eggGroupRef.current;
            if (!eggGroup) {
                throw new Error('undefined eggGroup');
            }
            const [pointLong, pointLat] = eggLocation.current ?? [];
            threexRef.current.setWorldPosition(eggGroup, pointLong, pointLat);
            ARSceneEventBus.emit(ARSceneEvent.DEBUG, {
                distance: camera.position.clone().sub(eggGroup.position).length(),
            });
        });
    }, [threexRef, eggGroupRef, camera]);

    useFrame((state, delta) => {
        if (isEggAnimationPlaying) {
            mixerRef.current?.update(delta);
        }
    });

    return (
        <group ref={eggGroupRef} scale={eggModelScale} rotation={eggModelRotation}>
            {changeCaptureAbility && <FrustumCheck objectRef={eggGroupRef} onChange={changeCaptureAbility} />}
            <primitive object={scene} />
        </group>
    );
};

export default EggModel;
