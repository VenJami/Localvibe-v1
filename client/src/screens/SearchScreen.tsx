import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {
  followUserAction,
  getAllUsers,
  unfollowUserAction,
} from '../../redux/actions/userAction';
import Loader from '../common/Loader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SearchScreen = ({navigation}) => {
  const [data, setData] = useState([]);
  const {users, user, isLoading} = useSelector(state => state.user);
  const dispatch = useDispatch();

  useEffect(() => {
    getAllUsers()(dispatch);
  }, [dispatch]);

  useEffect(() => {
    if (users) {
      setData(users);
    }
  }, [users]);

  const handleSearchChange = e => {
    if (e.length !== 0) {
      const filteredUsers = users.filter(i =>
        i.name.toLowerCase().includes(e.toLowerCase()),
      );
      setData(filteredUsers);
    } else {
      setData(users);
    }
  };

  const FollowButton = ({userId, item}) => {
    const [isFollowing, setIsFollowing] = useState(false);

    // Load the following list from AsyncStorage
    const loadFollowing = async () => {
      try {
        const followingList = await AsyncStorage.getItem('following');
        if (followingList) {
          const followingArray = JSON.parse(followingList);
          setIsFollowing(followingArray.includes(userId));
        }
      } catch (error) {
        console.error('Error loading following list', error);
      }
    };

    // Save the updated following list to AsyncStorage
    const updateFollowing = async (newFollowingList: string[]) => {
      try {
        await AsyncStorage.setItem(
          'following',
          JSON.stringify(newFollowingList),
        );
      } catch (error) {
        console.error('Error saving following list', error);
      }
    };

    // Follow or unfollow the user
    const handleFollow = async () => {
      try {
        const followingList = await AsyncStorage.getItem('following');
        let newFollowingList = followingList ? JSON.parse(followingList) : [];

        if (isFollowing) {
          // Unfollow user
          newFollowingList = newFollowingList.filter(
            (id: string) => id !== userId,
          );
          dispatch(unfollowUserAction(userId)); // Dispatch unfollow action to Redux and DB
        } else {
          // Follow user
          newFollowingList.push(userId);
          dispatch(followUserAction(userId)); // Dispatch follow action to Redux and DB
        }

        await updateFollowing(newFollowingList);
        setIsFollowing(!isFollowing);
      } catch (error) {
        console.error('Error following/unfollowing', error);
      }
    };

    useEffect(() => {
      loadFollowing(); // Load the following status when component mounts

      // Log the current following list to console
      const logFollowingList = async () => {
        try {
          const followingList = await AsyncStorage.getItem('following');
          if (followingList) {
            const followingArray = JSON.parse(followingList);
            console.log('Currently following:', followingArray);
          } else {
            console.log('No users are currently followed.');
          }
        } catch (error) {
          console.error('Error loading following list for logging', error);
        }
      };

      logFollowingList(); // Call the function to log the following list
    }, []);

    const handleFollowUnfollow = async () => {
      try {
        if (item.followers.find(i => i.userId === user._id)) {
          await unfollowUserAction({
            userId: user._id,
            users,
            followUserId: item._id,
          })(dispatch);
        } else {
          await followUserAction({
            userId: user._id,
            users,
            followUserId: item._id,
          })(dispatch);
        }
      } catch (error) {
        console.log(error, 'error');
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.followButton,
          isFollowing && styles.followingButton, // Apply conditional styling
        ]}
        onPress={() => {
          handleFollow();
          handleFollowUnfollow(); // Ensure both follow/unfollow actions are called
        }}>
        <Text
          style={[
            styles.followButtonText,
            isFollowing && styles.followingButtonText, // Change text color
          ]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Image source={require('../assets/goBack.png')} />
            </TouchableOpacity>
            <Text style={styles.headerText}>Search</Text>
          </View>
          <View style={styles.searchContainer}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/2811/2811806.png',
              }}
              style={styles.searchIcon}
            />
            <TextInput
              onChangeText={handleSearchChange}
              placeholder="Search"
              placeholderTextColor="#000"
              style={styles.searchInput}
            />
          </View>
          <FlatList
            data={data.slice(0, 5)}
            renderItem={({item}) => {
              const isFollowing = item.followers.find(
                i => i.userId === user._id,
              );

              return (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('UserProfile', {item: item})
                  }>
                  <View style={styles.userContainer}>
                    <Image
                      source={{uri: item.avatar.url}}
                      style={styles.userAvatar}
                    />
                    <View style={styles.userInfo}>
                      <View>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.userFollowers}>
                          {item.followers.length} followers
                        </Text>
                      </View>
                      <FollowButton userId={item._id} item={item} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ededed',
  },
  header: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: 'black',
    elevation: 20,
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
  searchContainer: {
    marginHorizontal: '3%',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#d7d7d7',
    flexDirection: 'row',
    marginTop: 10,
    height: 40,
  },
  searchIcon: {
    marginLeft: 15,
    width: 27,
    height: 27,
  },
  searchInput: {
    marginLeft: 4,
    height: 38,
    borderRadius: 8,
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  userContainer: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    width: '90%',
    marginHorizontal: '5%',
    flexDirection: 'row',
    marginVertical: 5,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  userInfo: {
    width: '85%',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  userName: {
    paddingLeft: 12,
    fontSize: 17,
    fontWeight: 'bold',
    color: 'black',
  },
  userFollowers: {
    paddingLeft: 12,
    fontSize: 12,
    color: 'black',
  },
  followButton: {
    backgroundColor: '#017E5E',
    width: 110,
    height: 35,
    borderWidth: 1,
    borderColor: '#0000004b',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButtonText: {
    color: 'white',
    fontWeight: '400',
  },
  // Styling for the button when the user is following
  followingButton: {
    backgroundColor: '#fff', // White background
    borderColor: '#017E5E', // Green border
  },
  followingButtonText: {
    color: '#017E5E', // Green text color
  },
});

export default SearchScreen;
