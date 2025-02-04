import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {getNotifications} from '../../redux/actions/notificationAction';
import {useDispatch, useSelector} from 'react-redux';
import getTimeDuration from '../common/TimeGenerator';
import axios from 'axios';
import {URI} from '../../redux/URI';
import Loader from '../common/Loader';

type Props = {
  navigation: any;
};

const NotificationScreen = ({navigation}: Props) => {
  const dispatch = useDispatch();
  const {notifications, isLoading} = useSelector(
    (state: any) => state.notification,
  );
  const [refreshing, setRefreshing] = useState(false);
  const {posts} = useSelector((state: any) => state.post);
  const {token, users} = useSelector((state: any) => state.user);

  const refreshingHeight = 100;

  useEffect(() => {
    getNotifications()(dispatch);
  }, []);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Image source={require('../assets/goBack.png')} />
              </TouchableOpacity>
              <Text style={styles.headerText}>Notifications</Text>
            </View>

            {notifications.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  You have no notifications yet!
                </Text>
              </View>
            )}

            <FlatList
              data={notifications}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    getNotifications()(dispatch).then(() => {
                      setRefreshing(false);
                    });
                  }}
                  progressViewOffset={refreshingHeight}
                />
              }
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => {
                const time = item.createdAt;
                const formattedDuration = getTimeDuration(time);

                const handleNavigation = async () => {
                  const id = item.creator._id;

                  await axios
                    .get(`${URI}/get-user/${id}`, {
                      headers: {Authorization: `Bearer ${token}`},
                    })
                    .then(res => {
                      if (item.type === 'Follow') {
                        navigation.navigate('UserProfile', {
                          item: res.data.user,
                        });
                      } else {
                        navigation.navigate('PostDetails', {
                          data: posts.find((i: any) => i._id === item.postId),
                        });
                      }
                    });
                };

                return (
                  <TouchableOpacity onPress={handleNavigation}>
                    <View style={styles.notificationItem} key={item._id}>
                      <View style={styles.notifContainer}>
                        <View style={styles.notifContainer2}>
                          <Image
                            source={{
                              uri: users.find(
                                (user: any) => user._id === item.creator._id,
                              )?.avatar.url,
                            }}
                            style={styles.avatar}
                          />
                          {item.type === 'Like' && (
                            <View style={styles.infoNotif}>
                              <View style={styles.likeBadge}>
                                <Image
                                  source={{
                                    uri: 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png',
                                  }}
                                  style={styles.likeIcon}
                                />
                              </View>

                              <View style={styles.notificationContent}>
                                <View style={styles.notificationText}>
                                  <Text
                                    style={styles.notificationTitle}
                                    ellipsizeMode="tail"
                                    numberOfLines={2}>
                                    <Text style={{fontWeight: 'bold'}}>
                                      {item.creator.name}
                                    </Text>{' '}
                                    Liked your Post "{item.title}".
                                  </Text>
                                </View>
                                <Text style={styles.notificationTime}>
                                  {formattedDuration}
                                </Text>
                              </View>
                            </View>
                          )}

                          {item.type === 'Follow' && (
                            <View style={styles.infoNotif}>
                              <View style={styles.followBadge}>
                                <Image
                                  source={{
                                    uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
                                  }}
                                  style={styles.followIcon}
                                />
                              </View>

                              <View style={styles.notificationContent}>
                                <View style={styles.notificationText}>
                                  <Text style={styles.notificationTitle}>
                                    <Text style={{fontWeight: 'bold'}}>
                                      {item.creator.name}
                                    </Text>{' '}
                                    {item.title}.
                                  </Text>
                                </View>
                                <Text style={styles.notificationTime}>
                                  {formattedDuration}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#EDEDED',
    flex: 1,
  },
  container: {
    marginBottom: 190,
    backgroundColor: '#EDEDED',
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
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
  },
  tab: {
    elevation: 10,
    alignItems: 'center',
    borderColor: '#017E5E',
    borderWidth: 1,
    width: 105,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#000',
    marginTop: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  notifContainer: {
    display: 'flex',
    marginHorizontal: 20,
  },
  notifContainer2: {
    elevation: 5,
    borderRadius: 10,
    padding: 8,
    borderColor: '#ededed',
    borderWidth: 1,
    backgroundColor: 'white',
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 100,
  },
  infoNotif: {
    width: '70%',
    justifyContent: 'space-between',
    display: 'flex',
    flexDirection: 'row',
  },
  likeBadge: {
    position: 'absolute',
    left: 250,
    top: -13,
    height: 30,
    width: 30,
    backgroundColor: '#eb4545',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeIcon: {
    width: 15,
    height: 15,
    tintColor: '#fff',
  },
  followBadge: {
    position: 'absolute',
    left: 250,
    top: -13,
    height: 30,
    width: 30,
    backgroundColor: '#5a49d6',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followIcon: {
    width: 15,
    height: 15,
    tintColor: '#fff',
  },
  notificationContent: {
    paddingLeft: 12,
    marginTop: 8,
  },
  notificationText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#737373',
  },
  notificationSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000b3',
  },
});

export default NotificationScreen;
