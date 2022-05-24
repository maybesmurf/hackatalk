import React, {FC, ReactElement} from 'react';

import {Platform} from 'react-native';
import {SharedElement} from 'react-navigation-shared-element';

type Props = {id: string};

const SharedElementView: FC<Props> = ({id, children}) => {
  return Platform.select({
    web: children as ReactElement,
    default: <SharedElement id={id}>{children}</SharedElement>,
  });
};

export default SharedElementView;
