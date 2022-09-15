import React, { FC, useEffect, useState } from 'react';

import ARSceneEventBus, { ARSceneEvent } from './ARSceneEventBus';
import classes from './debug.module.scss';

const Debug: FC = () => {
    const [debug, setDebug] = useState<any>({
        distance: -99999,
    });

    useEffect(
        () =>
            ARSceneEventBus.on(ARSceneEvent.DEBUG, (stats: any) => {
                setDebug((previousDebug) =>
                    Object.keys(stats).reduce((res, key) => ({ ...res, [key]: stats[key] }), previousDebug),
                );
            }),
        [debug],
    );

    return (
        <div className={classes.root}>
            <table>
                <tbody>
                    {Object.keys(debug).map((key) => (
                        <tr key={key}>
                            <td>{key.toUpperCase()}:</td>
                            <td>{debug[key] || 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Debug;
