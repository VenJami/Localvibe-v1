import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {logoutUser} from '../../redux/actions/userAction';
import PostCard from '../components/PostCard';
import {Title, Caption} from 'react-native-paper';
import {FlatList} from 'react-native';

const ProfileScreen = ({navigation}) => {
  const [activeTab, setActiveTab] = useState(0);
  const {user} = useSelector(state => state.user);
  const {posts} = useSelector(state => state.post);
  const [userPosts, setUserPosts] = useState([]);
  const [vibesData, setVibesData] = useState([]);
  const dispatch = useDispatch();
  const logoutHandler = async () => {
    logoutUser()(dispatch);
  };

  useEffect(() => {
    if (posts && user) {
      const myPosts = posts.filter(post => post.user._id === user._id);
      setUserPosts(myPosts);
    }
  }, [posts, user]);

  // Fetch interactions and combine with posts
  useEffect(() => {
    if (posts && user) {
      // Filter posts by the current user
      const myPosts = posts.filter(post => post.user._id === user._id);
      setUserPosts(myPosts); // Set user posts state

      // Filter interaction posts (vibes)
      const interactionPosts = user?.interactions
        ?.map(interaction => {
          const foundPost = posts.find(
            post => post._id === interaction.post_id,
          );
          return foundPost ? foundPost : null; // Return null for missing posts
        })
        .filter(post => post !== null); // Filter out null posts

      // Set vibes data, ensuring it doesn't include the user's posts
      const vibes = interactionPosts
        .filter(post => !myPosts.includes(post)) // Exclude user posts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setVibesData(vibes); // Set vibes state
    } else {
      console.warn('Posts or user data is missing');
    }
  }, [posts, user]);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F1FFF8" barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.mainContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Image source={require('../assets/goBack.png')} />
            </TouchableOpacity>
            <Text style={styles.headerText}>Profile</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('PremiumScreen')}>
              <Image
                style={styles.premiumButton}
                source={require('../assets/premium.png')}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.coverContainer}>
            <Image
              style={styles.cover}
              source={require('../assets/cover.png')}
            />
          </View>

          <View style={styles.subMainContainer}>
            <View style={styles.avatarContainer}>
              <Image source={{uri: user?.avatar.url}} style={styles.avatar} />
            </View>

            <View style={styles.userInfoContainer}>
              <Text style={styles.title}>{user?.name}</Text>
              <Text style={styles.caption}>{user?.userName}</Text>
              <Text style={styles.bio}>{user?.bio}</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.editProfileContainer}
                onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.editProfile}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutContainer}
                onPress={logoutHandler}>
                <Image
                  source={require('../assets/logout.png')}
                  style={styles.premium}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.infoBoxWrapper}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('FollowerCard', {
                    followers: user?.followers,
                    following: user?.following,
                  })
                }
                style={[styles.infoBox, styles.borderRight]}>
                <Title style={styles.infoBoxCount}>
                  {user?.followers.length}
                </Title>
                <Text style={styles.infoBoxText}>Followers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('FollowerCard', {
                    followers: user?.followers,
                    following: user?.following,
                  })
                }
                style={styles.infoBox}>
                <Title style={styles.infoBoxCount}>
                  {user?.following.length}
                </Title>
                <Text style={styles.infoBoxText}>Following</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              {/* Posts Tab */}
              <TouchableOpacity
                onPress={() => setActiveTab(0)}
                style={styles.tab}>
                <Text
                  style={
                    activeTab === 0
                      ? styles.activeTabText
                      : styles.inactiveTabText
                  }>
                  Posts
                </Text>
                {activeTab === 0 && <View style={styles.underline} />}
              </TouchableOpacity>

              {/* Vibes Tab */}
              <TouchableOpacity
                onPress={() => setActiveTab(1)}
                style={styles.tab}>
                <Text
                  style={
                    activeTab === 1
                      ? styles.activeTabText
                      : styles.inactiveTabText
                  }>
                  Vibes
                </Text>
                {activeTab === 1 && <View style={styles.underline} />}
              </TouchableOpacity>
            </View>

            <View>
              {activeTab === 0 ? (
                userPosts.length > 0 ? (
                  userPosts.map(item => <PostCard key={item._id} item={item} />)
                ) : (
                  <Text>You have no posts yet!</Text>
                )
              ) : vibesData.length > 0 ? (
                <FlatList
                  data={vibesData}
                  keyExtractor={item => item._id}
                  renderItem={({item}) => <PostCard item={item} />}
                />
              ) : (
                <Text>No posts available</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  subMainContainer: {
    backgroundColor: '#fff',
    top: -60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mainContainer: {
    paddingBottom: '100%',
  },
  premiumButton: {
    height: 50,
    width: 50,
  },
  premiumContainer: {
    backgroundColor: '#d3d3',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    flexGrow: 1,
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
  coverContainer: {
    height: 190, // Fixed height for consistent display
    marginBottom: 20,
  },
  cover: {
    width: '100%',
    height: '100%', // Ensures the cover image fits within coverContainer
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -70,
  },
  avatar: {
    height: 140,
    width: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: '#fff',
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    lineHeight: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  caption: {
    fontSize: 16,
    lineHeight: 17,
    fontWeight: '500',
    color: '#1F1F1F',
  },
  bio: {
    lineHeight: 20,
    padding: 12,
    color: '#000',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 80,
    marginBottom: '7%',
  },
  editProfileContainer: {
    width: '75%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    borderColor: '#000',
    borderWidth: 1,
    padding: 10,
  },
  editProfile: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  logoutContainer: {
    padding: 10,
    width: '20%',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premium: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
  infoBoxWrapper: {
    justifyContent: 'space-around',
    borderRadius: 10,
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: '5%',
  },
  infoBox: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBoxText: {
    lineHeight: 15,
    fontSize: 15,
    fontWeight: '500',
  },
  infoBoxCount: {
    fontWeight: '700',
  },
  borderRight: {
    borderRightColor: '#000',
    borderRightWidth: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  tab: {
    width: '47%', // Each tab takes up 47% width
    alignItems: 'center',
  },
  activeTabText: {
    fontSize: 16,
    color: '#008060', // Green color for the active tab
    fontWeight: 'bold',
  },
  inactiveTabText: {
    fontSize: 16,
    color: 'black',
  },
  underline: {
    marginTop: 4,
    height: 2,
    width: '90%', // Underline takes 100% of the tab width
    backgroundColor: '#008060', // Green underline for the active tab
  },
});

export default ProfileScreen;
