import type {
  ChannelsQuery,
  ChannelsQuery$data,
  ChannelsQuery$variables,
} from '../../__generated__/ChannelsQuery.graphql';
import {FlatList, TouchableOpacity, View} from 'react-native';
import React, {Suspense, useMemo} from 'react';
import {graphql, useLazyLoadQuery, usePaginationFragment} from 'react-relay';

import type {Channel} from '../../types/graphql';
import ChannelListItem from '../uis/ChannelListItem';
import CustomLoadingIndicator from '../uis/CustomLoadingIndicator';
import EmptyListItem from '../uis/EmptyListItem';
import type {FC} from 'react';
import type {MainChannelComponent_channel$key} from '../../__generated__/MainChannelComponent_channel.graphql';
import type {MainStackNavigationProps} from '../navigations/MainStackNavigator';
import type {MaterialTopTabNavigationProps} from '../navigations/MainTabNavigator';
import {SvgPlus} from '../../utils/Icons';
import {channelsQuery} from '../../relay/queries/Channel';
import {getString} from '../../../STRINGS';
import styled from '@emotion/native';
import {useDooboo} from 'dooboo-ui';
import {useLeaveChannelContext} from '../../providers/LeaveChannelModalProvider';
import {useNavigation} from '@react-navigation/native';

const Container = styled.View`
  flex: 1;
  background: ${({theme}) => theme.bg.basic};
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Fab = styled.View`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  justify-content: center;
  align-items: center;
  background: ${({theme}) => theme.button.primary.bg};
`;

const ITEM_CNT = 20;

const channelsPaginationFragment = graphql`
  fragment MainChannelComponent_channel on Query
  @argumentDefinitions(
    first: {type: "Int!"}
    after: {type: "String"}
    withMessage: {type: "Boolean"}
  )
  @refetchable(queryName: "Channels") {
    channels(first: $first, after: $after, withMessage: $withMessage)
      @connection(
        key: "MainChannelComponent_channels"
        filters: ["withMessage"]
      ) {
      edges {
        cursor
        node {
          id
          channelType
          name
          memberships(excludeMe: false) {
            user {
              id
              name
              nickname
              thumbURL
              photoURL
            }
          }
          lastMessage {
            id
            messageType
            text
            imageUrls
            fileUrls
            createdAt
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

interface ChannelProps {
  channel: MainChannelComponent_channel$key;
  searchArgs: ChannelsQuery$variables;
}

const ChannelsFragment: FC<ChannelProps> = ({channel, searchArgs}) => {
  const {data, loadNext, isLoadingNext, refetch} = usePaginationFragment<
    ChannelsQuery,
    MainChannelComponent_channel$key
  >(channelsPaginationFragment, channel);

  const navigation = useNavigation<MainStackNavigationProps<'MainTab'>>();
  const {showModal} = useLeaveChannelContext();

  const onEndReached = (): void => {
    loadNext(ITEM_CNT);
  };

  const showLeaveModal = (channelId: any): void => {
    showModal({channelId});
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: {node: Channel; cursor: string};
    index: number;
  }): React.ReactElement | null => {
    if (!item.node?.memberships || !item.node?.memberships.length) {
      return <View key={index} />;
    }

    return (
      <ChannelListItem
        key={index.toString()}
        item={item.node}
        onPress={(): void => {
          navigation.navigate('Message', {
            channelId: item.node.id,
          });
        }}
        onLongPress={(): void => {
          showLeaveModal(item.node.id);
        }}
      />
    );
  };

  const channels = useMemo(() => {
    return data?.channels?.edges ?? [];
  }, [data?.channels?.edges]);

  return (
    <FlatList
      scrollIndicatorInsets={{right: 1}}
      style={{
        alignSelf: 'stretch',
      }}
      contentContainerStyle={
        channels.length === 0
          ? {
              flex: 1,
              alignSelf: 'stretch',
              alignItems: 'center',
              justifyContent: 'center',
            }
          : null
      }
      keyExtractor={(_, index): string => index.toString()}
      // @ts-ignore
      data={channels}
      renderItem={renderItem}
      ListEmptyComponent={
        <EmptyListItem>{getString('NO_CHANNELLIST')}</EmptyListItem>
      }
      ListFooterComponent={<View style={{height: 60}} />}
      refreshing={isLoadingNext}
      onRefresh={() => {
        refetch(searchArgs, {fetchPolicy: 'network-only'});
      }}
      onEndReachedThreshold={0.1}
      onEndReached={onEndReached}
    />
  );
};

interface ContentProps {
  searchArgs: ChannelsQuery$variables;
}

const ContentContainer: FC<ContentProps> = ({searchArgs}) => {
  const data: ChannelsQuery$data = useLazyLoadQuery<ChannelsQuery>(
    channelsQuery,
    searchArgs,
    {fetchPolicy: 'store-or-network'},
  );

  return <ChannelsFragment channel={data} searchArgs={searchArgs} />;
};

const Screen: FC = () => {
  const {theme} = useDooboo();
  const navigation = useNavigation<MaterialTopTabNavigationProps<'Channel'>>();

  const searchArgs: ChannelsQuery$variables = {
    first: ITEM_CNT,
    withMessage: true,
  };

  return (
    <Container>
      <Suspense fallback={<CustomLoadingIndicator />}>
        <ContentContainer searchArgs={searchArgs} />
      </Suspense>
      <TouchableOpacity
        testID="channel-create-fab"
        activeOpacity={0.65}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 44,
        }}
        onPress={(): void => navigation.navigate('ChannelCreate')}
      >
        <Fab>
          <SvgPlus fill={theme.role.primary} />
        </Fab>
      </TouchableOpacity>
    </Container>
  );
};

export default Screen;
