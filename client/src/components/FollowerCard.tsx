import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getAllUsers} from '../../redux/actions/userAction';

type Props = {
  route: any;
  navigation: any;
};

const FollowerCard = ({navigation, route}: Props) => {
  const {users, user} = useSelector((state: any) => state.user);
  const followers = route.params.followers;
  const following = route.params.following;

  const [data, setData] = useState(followers);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0); // 0 = Followers, 1 = Following

  const dispatch = useDispatch();

  // Load the list of followed user IDs from AsyncStorage
  const loadFollowingIds = async () => {
    try {
      const followingList = await AsyncStorage.getItem('following');
      if (followingList) {
        setFollowingIds(JSON.parse(followingList));
      }
    } catch (error) {
      console.error('Error loading following list', error);
    }
  };

  // Update AsyncStorage with the new list of following IDs
  const updateFollowingIds = async (newFollowingList: string[]) => {
    try {
      await AsyncStorage.setItem('following', JSON.stringify(newFollowingList));
      setFollowingIds(newFollowingList); // Update state
    } catch (error) {
      console.error('Error saving following list', error);
    }
  };

  // Toggle follow/unfollow status
  const toggleFollow = async (userId: string) => {
    let updatedFollowingIds = [...followingIds];
    if (followingIds.includes(userId)) {
      updatedFollowingIds = updatedFollowingIds.filter(id => id !== userId); // Unfollow
    } else {
      updatedFollowingIds.push(userId); // Follow
    }
    await updateFollowingIds(updatedFollowingIds);
  };

  useEffect(() => {
    loadFollowingIds(); // Load following IDs from AsyncStorage
    dispatch(getAllUsers()); // Fetch all users from API
  }, [dispatch]);

  // Filter users to show only those that are followed or following
  useEffect(() => {
    if (users && followingIds.length > 0) {
      const filteredFollowing = users.filter((u: any) =>
        followingIds.includes(u._id),
      );
      setFollowingList(filteredFollowing);
    }
  }, [users, followingIds]);

  useEffect(() => {
    if (users) {
      if (followers) {
        const updatedUsers = [...users, user];
        const fullUsers = updatedUsers.filter((user: any) =>
          followers.some((item: any) => item.userId === user._id),
        );
        setData(fullUsers);
      }
      if (activeTab === 1) {
        if (following) {
          const updatedUsers = [...users, user];
          const fullUsers = updatedUsers.filter((user: any) =>
            following.some((item: any) => item.userId === user._id),
          );
          setData(fullUsers);
        }
      }
    }
  }, [followers, following, activeTab, users]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Image source={require('../assets/goBack.png')} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Following</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setActiveTab(0)}>
            <Text
              style={[
                styles.tabText,
                activeTab === 0 && styles.activeText, // Apply activeText style if active is 0
                {opacity: activeTab === 0 ? 1 : 0.6},
              ]}>
              Followers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab(1)}>
            <Text
              style={[
                styles.tabText,
                activeTab === 1 && styles.activeText, // Apply activeText style if active is 1
                {opacity: activeTab === 1 ? 1 : 0.6},
              ]}>
              Following
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.followerCountContainer}>
        {/* Display dynamic count based on current data */}
        {activeTab === 0 && (
          <View style={styles.followerContainer}>
            <Text style={styles.followerCount}>{data?.length} Followers</Text>
          </View>
        )}

        {activeTab === 1 && (
          <View style={styles.followerContainer}>
            <Text style={styles.followerCount}>
              {followingList.length} Following
            </Text>
          </View>
        )}
      </View>

      {/* Conditionally render FlatList based on activeTab */}
      {activeTab === 0 && (
        <FlatList
          data={data}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() =>
                navigation.navigate('UserProfile', {
                  item,
                })
              }>
              <View style={styles.userInfoContainer}>
                <Image
                  source={{uri: item?.avatar?.url}}
                  style={styles.userAvatar}
                />
                <View style={styles.userTextContainer}>
                  <Text style={styles.userName}>{item?.name}</Text>
                  <Text style={styles.userUsername}>{item?.userName}</Text>
                </View>
              </View>

              {user._id !== item._id && (
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    followingIds.includes(item._id)
                      ? styles.followingButton
                      : styles.defaultButton,
                  ]}
                  onPress={() => toggleFollow(item._id)}>
                  <Text
                    style={[
                      styles.followButtonText,
                      followingIds.includes(item._id)
                        ? styles.followingText
                        : styles.defaultText,
                    ]}>
                    {followingIds.includes(item._id) ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {activeTab === 1 && (
        <FlatList
          data={followingList}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() =>
                navigation.navigate('UserProfile', {
                  userId: item._id,
                })
              }>
              <View style={styles.userInfoContainer}>
                <Image
                  source={{uri: item.avatar.url}}
                  style={styles.userAvatar}
                />
                <View style={styles.userTextContainer}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userUsername}>{item.userName}</Text>
                </View>
              </View>
              {user._id !== item._id && (
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    followingIds.includes(item._id)
                      ? styles.followingButton
                      : styles.defaultButton,
                  ]}
                  onPress={() => toggleFollow(item._id)}>
                  <Text
                    style={[
                      styles.followButtonText,
                      followingIds.includes(item._id)
                        ? styles.followingText
                        : styles.defaultText,
                    ]}>
                    {followingIds.includes(item._id) ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  followerContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 10,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: '#dedede',
  },
  followerCountContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  activeText: {
    color: '#017E5E',
  },
  header: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    width: '75%',
    paddingLeft: 16,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: 'bold',
    color: '#000',
  },
  headerContainer: {
    backgroundColor: 'white',
    shadowColor: 'black',
    elevation: 20,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    width: 25,
    height: 25,
  },
  tabContainer: {
    width: '100%',
    paddingTop: 20,
    marginHorizontal: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabText: {
    fontSize: 18,
    paddingLeft: 12,
    fontWeight: '600',
    color: '#000',
  },
  activeIndicator: {
    borderBottomColor: '#017E5E',
    borderBottomWidth: 2,
    paddingBottom: 5,
    width: '110%',
  },
  followerCount: {
    textAlign: 'center',
    color: '#017E5E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userInfoContainer: {
    flexDirection: 'row',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 100,
  },
  userTextContainer: {
    paddingLeft: 12,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  userName: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
  },
  userUsername: {
    fontSize: 14,
    color: '#000000ba',
  },
  followButton: {
    borderRadius: 15,
    width: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 35,
    marginLeft: 5,
  },
  defaultButton: {
    backgroundColor: '#017E5E',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#017E5E',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  defaultText: {
    color: 'white',
  },
  followingText: {
    color: '#017E5E',
  },
});

export default FollowerCard;
