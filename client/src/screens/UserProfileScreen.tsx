import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {
  followUserAction,
  unfollowUserAction,
} from '../../redux/actions/userAction';
import PostCard from '../components/PostCard';

type Props = {
  route: any;
  navigation: any;
};

const UserProfileScreen = ({navigation, route}: Props) => {
  const {users, user, isLoading} = useSelector((state: any) => state.user);
  const [imagePreview, setImagePreview] = useState(false);
  const [active, setActive] = useState(0);
  const {posts} = useSelector((state: any) => state.post);
  const [postData, setPostsData] = useState([]);
  const [repliesData, setRepliesData] = useState([]);
  const d = route.params.item;
  const [data, setData] = useState(d);
  const dispatch = useDispatch();

  useEffect(() => {
    if (users) {
      const userData = users.find((i: any) => i._id === d?._id);
      setData(userData);
    }
    if (posts) {
      const myPosts = posts.filter((post: any) =>
        post.replies.some((reply: any) => reply.user._id === d._id),
      );

      setRepliesData(myPosts.filter((post: any) => post.replies.length > 0));

      const myUserPosts = posts.filter((post: any) => post.user._id === d._id);
      setPostsData(myUserPosts);
    }
  }, [users, route.params.item, posts, d]);

  const FollowUnfollowHandler = async () => {
    try {
      if (data.followers.find((i: any) => i.userId === user._id)) {
        await unfollowUserAction({
          userId: user._id,
          users,
          followUserId: data._id,
        })(dispatch);
      } else {
        await followUserAction({
          userId: user._id,
          users,
          followUserId: data._id,
        })(dispatch);
      }
    } catch (error) {
      console.log(error, 'error');
    }
  };

  return (
    <>
      {data && (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar backgroundColor="#F1FFF8" barStyle="dark-content" />
          {imagePreview ? (
            <TouchableOpacity
              style={styles.imagePreview}
              onPress={() => setImagePreview(!imagePreview)}>
              <Image
                source={{uri: data.avatar.url}}
                width={250}
                height={250}
                borderRadius={500}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}>
                  <Image source={require('../assets/goBack.png')} />
                </TouchableOpacity>
                <Text style={styles.headerText}>Profile</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.coverPhotoContainer}>
                  <Image
                    style={styles.coverPhoto}
                    source={require('../assets/cover.png')}
                  />
                </View>

                <View style={styles.mainContainer}>
                  <View style={styles.infoContainer}>
                    <View style={styles.avatarContainer}>
                      <TouchableOpacity
                        onPress={() => setImagePreview(!imagePreview)}>
                        <View style={styles.avatarContainer}>
                          <Image
                            source={{uri: data.avatar.url}}
                            style={styles.avatar}
                          />
                          {data.role === 'Admin' && (
                            <Image
                              source={{
                                uri: 'https://cdn-icons-png.flaticon.com/128/1828/1828640.png',
                              }}
                              width={18}
                              height={18}
                              style={styles.adminIcon}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.nameContainer}>
                      <Text style={styles.userName}>{data.name}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('FollowerCard', {
                            item: data,
                            followers: data?.followers,
                            following: data?.following,
                          })
                        }>
                        <Text style={styles.followers}>
                          {data.followers.length} followers
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.followButtonContainer}>
                      <TouchableOpacity
                        style={[
                          styles.followButton,
                          data.followers.find((i: any) => i.userId === user._id)
                            ? styles.followingButton
                            : styles.unfollowedButton,
                        ]}
                        onPress={FollowUnfollowHandler}>
                        <Text
                          style={[
                            styles.followButtonText,
                            data.followers.find(
                              (i: any) => i.userId === user._id,
                            )
                              ? styles.followingText
                              : styles.unfollowedText,
                          ]}>
                          {data.followers.find(
                            (i: any) => i.userId === user._id,
                          )
                            ? 'Following'
                            : 'Follow'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.bioContainer}>
                    <View style={styles.bioContainer2}>
                      {data.bio && (
                        <Text style={styles.userBio}>{data.bio}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.tabMainContainer}>
                    <View style={styles.tabContainer}>
                      <View style={styles.tabRow}>
                        <TouchableOpacity onPress={() => setActive(0)}>
                          <Text
                            style={[
                              styles.tab,
                              active === 0
                                ? styles.activeText
                                : styles.inactiveText,
                            ]}>
                            Posts
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActive(1)}>
                          <Text
                            style={[
                              styles.tab,
                              active === 1
                                ? styles.activeText
                                : styles.inactiveText,
                            ]}>
                            Vibes
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View
                        style={[
                          styles.tabIndicator,
                          {left: `${active === 0 ? 0 : 50}%`},
                        ]}
                      />
                    </View>
                  </View>
                </View>
                {active === 0 && (
                  <>
                    {postData &&
                      postData.map((item: any) => (
                        <PostCard
                          navigation={navigation}
                          key={item._id}
                          item={item}
                        />
                      ))}
                    {postData.length === 0 && (
                      <Text style={styles.noPostText}>No Post yet!</Text>
                    )}
                  </>
                )}
                {active === 1 && (
                  <>
                    {repliesData &&
                      repliesData.map((item: any) => (
                        <PostCard
                          navigation={navigation}
                          key={item._id}
                          item={item}
                          replies={true}
                        />
                      ))}
                    {repliesData.length === 0 && (
                      <Text style={styles.noPostText}>No Post yet!</Text>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffff',
  },
  mainContainer: {
    backgroundColor: 'white',
    elevation: 1,
    zIndex: 1,
  },
  infoContainer: {
    top: -15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  avatar: {
    height: 95,
    width: 95,
    borderRadius: 300,
    position: 'absolute',
    top: -25,
    left: 10,
  },
  avatarContainer: {
    width: '20%',
  },
  nameContainer: {
    width: '30%',
    marginLeft: 5,
  },
  followButtonContainer: {
    width: '30%',
  },
  followButton: {
    marginTop: 17,
    borderRadius: 100,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#017E5E',
    width: '90%',
  },
  followingButton: {
    backgroundColor: '#fff',
  },
  unfollowedButton: {
    backgroundColor: '#017E5E',
  },
  followButtonText: {
    fontSize: 15,
  },
  followingText: {
    color: '#017E5E',
  },
  unfollowedText: {
    color: '#fff',
  },
  coverPhoto: {
    height: 140,
    width: 'auto',
    resizeMode: 'stretch',
  },
  header: {
    width: '100%',
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
  imagePreview: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
  },
  headerLeft: {
    width: '80%',
  },
  userName: {
    marginTop: 10,
    fontSize: 22,
    color: 'black',
    fontWeight: 'bold',
  },
  userHandle: {
    paddingVertical: 8,
    fontSize: 16,
    color: '#0000009d',
  },
  bioContainer: {
    top: -15,
    width: '100%',
    alignItems: 'center',
  },
  bioContainer2: {
    width: '70%',
    alignItems: 'center',
  },
  userBio: {
    paddingVertical: 8,
    fontSize: 15,
    color: '#000',
    fontWeight: '400',
  },
  followers: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  adminIcon: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  tabMainContainer: {
    borderBottomColor: '#dedede',
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  tabContainer: {
    marginTop: 15,
    marginHorizontal: 20,
    position: 'relative',
    alignItems: 'center',
    paddingBottom: 5,
  },
  tabRow: {
    width: '100%',
    justifyContent: 'space-around',
    flexDirection: 'row',
  },
  tab: {
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  activeText: {
    fontSize: 18,
    color: '#017E5E',
  },
  inactiveText: {
    fontSize: 18,
    color: 'black',
  },
  tabIndicator: {
    position: 'absolute',
    height: 1,
    width: '50%',
    backgroundColor: '#017E5E',
    bottom: 0,
  },
  noPostText: {
    color: 'black',
    paddingVertical: 40,
    textAlign: 'center',
    fontSize: 18,
  },
});

export default UserProfileScreen;
