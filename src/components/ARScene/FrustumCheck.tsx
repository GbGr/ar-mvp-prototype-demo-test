import { RefObject, useEffect, useState } from 'react';
import { Frustum, Matrix4, Vector3 } from 'three';

import { useFrame, useThree } from '@react-three/fiber';

interface Props {
    objectRef: RefObject<{ position: Vector3 }>;
    onChange(isInFrustum: boolean): void;
}
const FrustumCheck = ({ objectRef, onChange }: Props): null => {
    const { camera } = useThree();
    const [frustum, setFrustum] = useState<Frustum>();
    const [inFrustum, setInFrustum] = useState(false);

    useEffect(() => {
        setFrustum(new Frustum());
    }, []);

    useFrame(() => {
        if (!frustum || !objectRef.current) return;
        frustum.setFromProjectionMatrix(
            new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
        );

        const newInFrustum = frustum.containsPoint(objectRef.current.position);
        if (inFrustum !== newInFrustum) {
            setInFrustum(newInFrustum);
            onChange(newInFrustum);
        }
    });

    return null;
};

export default FrustumCheck;
