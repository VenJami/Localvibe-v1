import React, {useEffect, useRef, useState} from 'react';
import {BlurView} from 'react-native-blur';
import {
  View,
  TouchableOpacity,
  StatusBar,
  Image,
  FlatList,
  Animated,
  Easing,
  RefreshControl,
  Modal,
  Text,
  Button,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {getAllPosts} from '../../redux/actions/postAction';
import PostCard from '../components/PostCard';
import Loader from '../common/Loader';
import {getAllUsers, loadUser} from '../../redux/actions/userAction';
import Geolocation from '@react-native-community/geolocation';
import Lottie from 'lottie-react-native';
import axios from 'axios';
import {URI} from '../../redux/URI';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const loader = require('../assets/newsfeed/animation_lkbqh8co.json');

type Props = {
  route: any;
  navigation: any;
};

const HomeScreen = ({navigation, route}: Props) => {
  const pins = useSelector((state: any) => state.pin);
  // Function to store pins in AsyncStorage
  const storePins = async (pins: any) => {
    try {
      if (pins) {
        await AsyncStorage.setItem('pins', JSON.stringify(pins));
        console.log('Pins stored successfully:', pins);
      } else {
        console.log('No pins available to store');
      }
    } catch (error) {
      console.error('Error storing pins:', error);
    }
  };

  useEffect(() => {
    // Call this only once when the component mounts
    storePins(pins);
  }, []); // Empty dependency array ensures this runs only once

  const {user, token, users} = useSelector((state: any) => state.user);
  const {posts, isLoading} = useSelector((state: any) => state.post);
  const dispatch = useDispatch();
  const [offsetY, setOffsetY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [extraPaddingTop] = useState(new Animated.Value(0));
  const refreshingHeight = 50;
  const lottieViewRef = useRef<Lottie>(null);
  const [slice, setSlice] = useState(5);

  const [showModal, setShowModal] = useState(false);
  const [newProximityThreshold, setNewProximityThreshold] = useState(5);

  const [showThreshold, setShowThreshold] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [userData, setUserData] = useState({
    latitude: user?.latitude,
    longitude: user?.longitude,
  });

  useEffect(() => {
    // Store the user's location in AsyncStorage when the component mounts
    storeUserLocation();
  }, [userData]); // Store whenever userData changes

  

  // Function to store userData in AsyncStorage
  const storeUserLocation = async () => {
    try {
      // Ensure userData has both latitude and longitude
      if (userData?.latitude && userData?.longitude) {
        // Store the userData object (latitude and longitude) in AsyncStorage
        await AsyncStorage.setItem('userLocation', JSON.stringify(userData));

        console.log('User Location Stored:', userData);
      } else {
        console.log('User location data is not available');
      }
    } catch (error) {
      console.error('Error storing user location:', error);
    }
  };

  const openThreshold = () => {
    setShowThreshold(true);
  };

  const closeThreshold = () => {
    setShowThreshold(false);
  };

  const updateProximityThreshold = () => {
    const minThreshold = 0.5;
    const maxThreshold = 10;

    if (
      !isNaN(newProximityThreshold) &&
      newProximityThreshold >= minThreshold &&
      newProximityThreshold <= maxThreshold
    ) {
      setNewProximityThreshold(newProximityThreshold);
      setShowThreshold(false);
    } else {
      alert(
        `Proximity threshold must be between ${minThreshold} and ${maxThreshold}`,
      );
    }
  };

  let progress = 0;
  if (offsetY < 0 && !refreshing) {
    const maxOffsetY = -refreshingHeight;
    progress = Math.min(offsetY / maxOffsetY, 1);
  }

  function onScroll(event: any) {
    const {nativeEvent} = event;
    const {contentOffset} = nativeEvent;
    const {y} = contentOffset;
    setOffsetY(y);
  }

  useEffect(() => {
    if (Geolocation) {
      const success = (geoPosition: {
        coords: {
          latitude: number;
          longitude: number;
          accuracy: number;
          altitude: number;
          altitudeAccuracy: number;
          heading: number;
          speed: number;
        };
      }) => {
        setUserLocation({
          latitude: geoPosition.coords.latitude,
          longitude: geoPosition.coords.longitude,
          accuracy: geoPosition.coords.accuracy,
          altitude: geoPosition.coords.altitude,
          altitudeAccuracy: geoPosition.coords.altitudeAccuracy,
          heading: geoPosition.coords.heading,
          speed: geoPosition.coords.speed,
        });

        setUserData({
          latitude: geoPosition.coords.latitude,
          longitude: geoPosition.coords.longitude,
        });
      };

      const error = (error: {code: any; message: any}) => {
        console.log(error.code, error.message);
      };

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      };

      const watchId = Geolocation.watchPosition(success, error, options);
      return () => Geolocation.clearWatch(watchId);
    } else {
      console.error('Geolocation is not available.');
    }
  }, []);

  console.log(userData);

  useEffect(() => {
    getAllPosts()(dispatch);
    getAllUsers()(dispatch);
  }, [dispatch]);

  useEffect(() => {
    if (refreshing) {
      Animated.timing(extraPaddingTop, {
        toValue: refreshingHeight,
        duration: 0,
        useNativeDriver: false,
      }).start();
      setSlice(5);
    } else {
      Animated.timing(extraPaddingTop, {
        toValue: 0,
        duration: 400,
        easing: Easing.elastic(1.3),
        useNativeDriver: false,
      }).start();
      setSlice(5);
    }
  }, [refreshing]);

  function sliceHandler() {
    const s = slice + 2;
    setSlice(s);
  }

  interface Post {
    id: number;
    user: {
      latitude: number;
      longitude: number;
      accountType: string;
    };
  }

  interface User {
    id: number;
    interactions: Array<{
      post_id: number;
      score: number;
    }>;
    similarUsers: Array<{
      userId: string;
      similarityScore: number;
    }>;
  }

  const filterAndFormatPosts = () => {
    const formattedPosts: Post[] = [];
    const premiumBusinessPosts: Post[] = [];
    const regularBusinessPosts: Post[] = [];
    const personalPosts: Post[] = [];
    const similarUsersInteractions: number[] = [];

    const similarUserIds = user.similarUsers.map(
      (similarUsers: {userId: any}) => similarUsers.userId,
    );

    console.log('Similar User IDs:', similarUserIds);

    similarUserIds.forEach((similarUserIds: any) => {
      const similarUser = users.find((user: {id: any}) => user.id);

      if (similarUser) {
        const interactions = similarUserIds.interactions.map(
          (interactions: {post_id: any}) => interactions.post_id,
        );
        similarUsersInteractions.push(interactions.post_id);
      }
    });

    console.log('Similar Users Interactions:', similarUsersInteractions);

    for (const post of posts) {
      const distance = haversine(
        userData.latitude,
        userData.longitude,
        post.user.latitude,
        post.user.longitude,
      );

      if (distance <= newProximityThreshold) {
        if (post.user.accountType === 'prembusiness') {
          premiumBusinessPosts.push(post);
        } else if (post.user.accountType === 'business') {
          regularBusinessPosts.push(post);
        } else {
          personalPosts.push(post);
        }
      }
    }

    let premiumIndex = 0;
    let regularIndex = 0;
    let personalIndex = 0;
    let premiumCounter = 0;
    let regularCounter = 0;

    while (
      premiumIndex < premiumBusinessPosts.length ||
      regularIndex < regularBusinessPosts.length ||
      personalIndex < personalPosts.length
    ) {
      if (premiumCounter < 2 && premiumIndex < premiumBusinessPosts.length) {
        formattedPosts.push(premiumBusinessPosts[premiumIndex++]);
        premiumCounter++;
      } else if (
        regularCounter < 3 &&
        regularIndex < regularBusinessPosts.length
      ) {
        formattedPosts.push(regularBusinessPosts[regularIndex++]);
      } else if (
        regularCounter < 3 &&
        regularIndex < regularBusinessPosts.length
      ) {
        premiumCounter = 0;
        regularCounter = 0;
      }

      for (let i = 0; i < 4 && personalIndex < personalPosts.length; i++) {
        formattedPosts.push(personalPosts[personalIndex++]);
      }
    }

    return formattedPosts;
  };

  const nearbyPosts = filterAndFormatPosts();

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  const onRefreshHandler = async () => {
    console.log('asdad');
    setRefreshing(true);
    try {
      await submitLocation();
    } finally {
      setRefreshing(false);
      console.log('refreshing false');
    }
  };

  const submitLocation = async () => {
    console.log('Submitting coordinates');

    try {
      // Always fetch the token directly from storage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('Token is missing, please log in again');
        return;
      }

      await axios.put(
        `${URI}/update-coor`,
        {
          latitude: userData.latitude,
          longitude: userData.longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('Coordinates submitted successfully');
      dispatch(loadUser());
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        console.error('Unauthorized: Please log in again');
        // Optional: Handle logout or redirect to login screen
      } else {
        console.error('An error occurred:', error.message);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 pb-20">
      <StatusBar
        animated={true}
        backgroundColor={'#fff'}
        barStyle={'dark-content'}
        showHideTransition={'fade'}
      />

      <View className="flex flex-row p-2 justify-between bg-white">
        <View>
          <TouchableOpacity onPress={onRefreshHandler}>
            <Image source={require('../assets/wordlogo.png')} />
          </TouchableOpacity>
        </View>

        <View className="flex flex-row p-2 justify-between">
          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            className="rounded-full p-2 mx-2 bg-green-50">
            <Image source={require('../assets/newsfeed/search.png')} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openThreshold}>
            <Image
              style={{
                height: 40,
                width: 40,
              }}
              source={require('../assets/radar.png')}
            />
          </TouchableOpacity>
        </View>
      </View>

      <>
        {isLoading ? (
          <Loader />
        ) : (
          <SafeAreaView>
            <FlatList
              style={styles.container}
              data={nearbyPosts}
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => (
                <PostCard navigation={navigation} item={item} />
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefreshHandler}
                  progressViewOffset={refreshingHeight}
                />
              }
              onEndReached={sliceHandler}
              onEndReachedThreshold={0.1}
            />
          </SafeAreaView>
        )}
      </>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showThreshold}
        onRequestClose={closeThreshold}>
        <View style={styles.mainModalContainer}>
          <View style={styles.modalContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.text}>Adjust proximity threshold</Text>
              <Text style={styles.text}>
                {newProximityThreshold.toFixed(2)} km
              </Text>
            </View>
            <Slider
              minimumValue={0.5}
              maximumValue={10}
              minimumTrackTintColor="#017E5E"
              maximumTrackTintColor="#6F6F6F"
              thumbTintColor="#017E5E"
              value={newProximityThreshold}
              onValueChange={setNewProximityThreshold}
            />
            <Text style={styles.information}>
              Once set, we'll prioritize and deliver news, events,and
              recommendations within your chosen radius
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={updateProximityThreshold}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={closeThreshold}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    textAlign: 'center',
    color: '#fff',
  },
  information: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 11,
    width: '100%',
    textAlign: 'center',
  },
  button: {
    borderColor: '#c0c0c0',
    elevation: 10,
    borderRadius: 30,
    borderWidth: 1,
    padding: 10,
    width: '40%',
    backgroundColor: '#017E5E',
  },
  text: {
    fontSize: 20,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    display: 'flex',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  container: {
    marginTop: 40,
  },
  mainModalContainer: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    width: '90%',
    paddingVertical: 60,
    padding: 15,
    borderRadius: 10,
    borderColor: '#c0c0c0',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
});

export default HomeScreen;
