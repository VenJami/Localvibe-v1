import React, {useEffect, useState, useRef} from 'react';
import {useRoute} from '@react-navigation/native';
import {SelectList} from 'react-native-dropdown-select-list';
import {
  View,
  TextInput,
  Switch,
  StyleSheet,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Slider from '@react-native-community/slider';
import MapView, {
  Callout,
  Circle,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import {GeoPosition} from 'react-native-geolocation-service';
import axios from 'axios';
import {URI} from '../../redux/URI';
import {useDispatch, useSelector} from 'react-redux';
import {getAllUsers, loadUser} from '../../redux/actions/userAction';
import {Modal as RNModal} from 'react-native';
import {
  getAllPins,
  createPinAction,
  addVisitorAction,
} from '../../redux/actions/pinAction';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import StarRating from '../components/StarRating';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import DateTimePicker
import { format } from 'date-fns'; // Optional: To format the date if needed

const {width, height} = Dimensions.get('window');
const CARD_HEIGHT = 150;
const CARD_WIDTH = width * 0.9;
const SPACING_FOR_CARD_INSET = width * 0.1 - 25;

type Props = {
  navigation: any;
};

const MapScreen = ({navigation}: Props) => {
  const [isAddingOpeningHours, setIsAddingOpeningHours] = useState(false);
  const [weekHours, setWeekHours] = useState({
    Monday: {isSelected: false, open: null, close: null},
    Tuesday: {isSelected: false, open: null, close: null},
    Wednesday: {isSelected: false, open: null, close: null},
    Thursday: {isSelected: false, open: null, close: null},
    Friday: {isSelected: false, open: null, close: null},
    Saturday: {isSelected: false, open: null, close: null},
    Sunday: {isSelected: false, open: null, close: null},
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedType, setSelectedType] = useState('open'); // 'open' or 'close'

  // Function to handle time change
  const handleTimeChange = (event, selectedTime) => {
    const newTime = selectedTime || new Date();
    // Apply the same time for all selected days
    const updatedWeekHours = {...weekHours};
    selectedDays.forEach(day => {
      updatedWeekHours[day] = {
        ...updatedWeekHours[day],
        [selectedType]: newTime,
      };
    });
    setWeekHours(updatedWeekHours);
    setShowTimePicker(false);
  };

  const showTimePickerForDay = type => {
    setSelectedType(type);
    setShowTimePicker(true);
  };

  // Haversine formula to calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = value => value * (Math.PI / 180);

    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return distance;
  };
  useEffect(() => {
    const getAllData = async () => {
      try {
        // Get all the keys in AsyncStorage
        const keys = await AsyncStorage.getAllKeys();

        // If no keys exist
        if (keys.length === 0) {
          console.log('No data found in AsyncStorage');
          return;
        }

        // Retrieve the values corresponding to all keys
        const allData = await AsyncStorage.multiGet(keys);

        // Output the data
        allData.forEach(([key, value]) => {
          console.log(`Key: ${key}, Value: ${value}`);
        });
      } catch (error) {
        console.error('Error retrieving data from AsyncStorage:', error);
      }
    };

    // Call the function to get and log all data
    getAllData();
  }, []); // Empty dependency array to run only once when the component mounts

  const [distance, setDistance] = useState(null);

  // Handle when a pin is clicked
  const handleVisitButtonPress = async item => {
    setSelectedPin(item); // Set selected pin

    // Fetch user location from AsyncStorage
    const userLocation = await AsyncStorage.getItem('userLocation');
    // Save selected pin's latitude and longitude to AsyncStorage
    await AsyncStorage.setItem(
      'currentPinLatitude',
      JSON.stringify(item.latitude),
    );
    await AsyncStorage.setItem(
      'currentPinLongitude',
      JSON.stringify(item.longitude),
    );
    const selectedPinLocation = {
      latitude: item.latitude, // Assuming latitude is available in item
      longitude: item.longitude, // Assuming longitude is available in item
      createdBy: item.createdBy,
    };

    if (userLocation) {
      const userLocationParsed = JSON.parse(userLocation);
      const userLat = userLocationParsed.latitude;
      const userLon = userLocationParsed.longitude;

      // Calculate distance
      const calculatedDistance = calculateDistance(
        userLat,
        userLon,
        selectedPinLocation.latitude,
        selectedPinLocation.longitude,
      );

      // Set the distance in state
      setDistance(calculatedDistance.toFixed(2)); // Round the result to 2 decimal places
    }

    setIsModalVisible(true); // Show modal after handling button press
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedPin(null);
    setDistance(null);
  };
  const [isInputFocused, setIsInputFocused] = useState(false);
  let mapAnimation = new Animated.Value(0);
  const route = useRoute();
  const {latitude, longitude} = route.params || {};
  const [data, setData] = useState([
    {
      name: '',
      avatar: {url: ''},
      latitude: null,
      longitude: null,
    },
  ]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  // Set initial categories in useEffect
  useEffect(() => {
    // Set to all categories initially
    setSelectedCategories(categories.map(cat => cat.key));
  }, []);
  const allCategories = [
    'transportation',
    'food',
    'service',
    'healthcare',
    'retail',
    'default',
  ];
  // Function to handle category selection (for multiple selections)
  const toggleCategory = category => {
    // When 'All Categories' is clicked, include all categories in the selection
    if (category === 'default') {
      // Include all categories (i.e., set the selected categories to all categories)
      setSelectedCategories(categories.map(cat => cat.key));
    } else {
      setSelectedCategories(prevCategories => {
        // If 'All Categories' is currently selected, reset to the selected category
        if (prevCategories.length === categories.length) {
          return [category]; // Reset to only the selected category
        }

        // Toggle the selected category
        const newCategories = prevCategories.includes(category)
          ? prevCategories.filter(c => c !== category) // Deselect the category
          : [...prevCategories, category]; // Select the category

        return newCategories.length
          ? newCategories
          : categories.map(cat => cat.key); // If no categories are selected, set to all categories
      });
    }
  };

  // Handle day selection toggle
  const toggleDaySelection = day => {
    const newSelectedDays = [...selectedDays];
    if (newSelectedDays.includes(day)) {
      newSelectedDays.splice(newSelectedDays.indexOf(day), 1);
    } else {
      newSelectedDays.push(day);
    }
    setSelectedDays(newSelectedDays);
    // Update the isSelected state for the days
    setWeekHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isSelected: !prev[day].isSelected,
      },
    }));
  };

  useEffect(() => {
    if (selectedCategories.includes('default')) {
      setFilteredPins(nearbypin); // Show all pins if "default" is selected
    } else {
      setFilteredPins(
        nearbypin.filter(pin => selectedCategories.includes(pin.category)),
      );
    }
  }, [selectedCategories, nearbypin]);

  // Confirm selected categories and set to pinnedCategories
  const onConfirm = () => {
    setPinnedCategories(
      selectedCategories.length > 0 ? selectedCategories : ['default'],
    );
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPins, setFilteredPins] = useState(nearbypin);
  useEffect(() => {
    console.log('Search query changed:', searchQuery);

    if (nearbypin) {
      const results = nearbypin.filter(pin =>
        pin.businessName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredPins(results); // Update the filtered pins
    }
  }, [searchQuery, nearbypin]); // Include both dependencies
  const [pinnedCategories, setPinnedCategories] = React.useState([]);
  const [userLocation, setUserLocation] = useState<GeoPosition | null>(null);
  const [watchID, setWatchID] = useState<number | null>(null);
  const {users, user, token} = useSelector((state: any) => state.user);
  const dispatch = useDispatch();

  const handleVisitPress = (pins: any) => {
    // Log the pins object to check its structure and content
    console.log('Sending pins._id:', pins._id);

    // Ensure user and user._id are available
    if (user && user._id) {
      console.log('Sending User ID:', user._id);

      // Dispatch the incrementVisitCountAction
      dispatch(addVisitorAction(pins._id, user._id));
    } else {
      console.log('User or User ID is unavailable.');
    }

    // Navigate to the BusinessPinScreen with the selected pin
    navigation.navigate('BusinessPinScreen', {pins});

    // Handle case where user is not logged in or user._id is unavailable
  };

  const [userData, setUserData] = useState({
    latitude: user?.latitude,
    longitude: user?.longitude,
  });
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [selectedPin, setSelectedPin] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [isAddingForm, setIsAddingForm] = useState(false);
  const [markerCoords, setMarkerCoords] = useState({
    latitude: user?.latitude,
    longitude: user?.longitude,
  });
  const [selected, setSelected] = React.useState('');
  const categories = [
    {key: 'food', value: 'Food & Dining'},
    {key: 'transportation', value: 'Transportation'},
    {key: 'service', value: 'Service'},
    {key: 'healthcare', value: 'Health'},
    {key: 'merchant', value: 'Retail'},
    {key: 'default', value: 'Others'},
  ];

  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    website: null,
  });
  const [image, setImage] = useState('');

  const [newProximityThreshold, setNewProximityThreshold] = useState(5);

  const [center, setCenter] = useState({
    latitude: user?.latitude,
    longitude: user?.longitude,
  });
  const [radius, setRadius] = useState(500);

  const kmToMeters = (km: number) => km * 1000;

  useEffect(() => {
    setRadius(kmToMeters(newProximityThreshold));
  }, [newProximityThreshold]);

  const handleAddPin = () => {
    setIsAddingPin(true);
  };

  const _scrollView: React.MutableRefObject<any> = useRef(null);
  const _map: React.MutableRefObject<any> = useRef(null);

  const [openModal, setOpenModal] = useState(false);
  const [showThreshold, setShowThreshold] = useState(false);

  const openThreshold = () => {
    setShowThreshold(true);
  };

  const closeThreshold = () => {
    setShowThreshold(false);
  };

  const updateProximityThreshold = () => {
    const newThreshold = newProximityThreshold;

    const minThreshold = 0.5;
    const maxThreshold = 10;

    if (
      !isNaN(newThreshold) &&
      newThreshold >= minThreshold &&
      newThreshold <= maxThreshold
    ) {
      setNewProximityThreshold(newThreshold);
      setShowThreshold(false);
      (_map.current as MapView).animateToRegion(
        {
          latitude: user?.latitude,
          longitude: user?.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        350,
      );
    } else {
      Alert.alert(
        'Invalid Threshold',
        `Proximity threshold must be between ${minThreshold} and ${maxThreshold}`,
      );
    }
  };

  const handleConfirm = () => {
    console.log('Pinned location:', markerCoords);
    setIsAddingPin(false);
    setIsAddingForm(true);
  };

  const deletePinHandler = async (e: any) => {
    await axios
      .delete(`${URI}/delete-pin/${e}`, {
        // Added backticks here
        headers: {
          Authorization: `Bearer ${token}`, // Added backticks here
        },
      })
      .then(res => {
        getAllPins()(dispatch);
      })
      .catch(error => {
        console.error('Error deleting pin:', error);
      });
    setOpenModal(false);
  };

  /*const initialMapState = {
    categories: [
      {
        name: 'Milktea Shop',
        icon: (
          <View style={styles.chipsIcon}>
            <Image source={require('../assets/maps/milktea.png')} />
          </View>
        ),
      },
      {
        name: 'Convenience Store',
        icon: (
          <View style={styles.chipsIcon}>
            <Image source={require('../assets/maps/store.png')} />
          </View>
        ),
      },
      {
        name: 'Streetfoods',
        icon: (
          <View style={styles.chipsIcon}>
            <Image source={require('../assets/maps/streetfood.png')} />
          </View>
        ),
      },
      {
        name: 'Bar',
        icon: (
          <View style={styles.chipsIcon}>
            <Image source={require('../assets/maps/bar.png')} />
          </View>
        ),
      },
      {
        name: 'Hotels',
        icon: (
          <View style={styles.chipsIcon}>
            <Image source={require('../assets/maps/hotel.png')} />
          </View>
        ),
      },
    ],
  };

  let mapIndex = 0;
  const [state, setState] = React.useState(initialMapState);*/

  const handleSubmit = () => {
    // Check if the required fields are filled
    if (
      businessName !== '' ||
      description !== '' ||
      category !== '' ||
      contactInfo.phone !== '' ||
      contactInfo.email !== '' ||
      contactInfo.website !== null
    ) {
      console.log(businessName);

      // Map weekHours state to match the operatingHours format
      const operatingHours = Object.keys(weekHours).reduce((acc, day) => {
        // Convert the day to lowercase
        const lowerCaseDay = day.toLowerCase();

        // If the day is selected, assign the opening and closing times
        if (weekHours[day].isSelected) {
          acc[lowerCaseDay] = {
            open: weekHours[day].open
              ? format(weekHours[day].open, 'hh:mm a')
              : null,
            close: weekHours[day].close
              ? format(weekHours[day].close, 'hh:mm a')
              : null,
          };
        } else {
          // If the day is not selected, set open and close to null
          acc[lowerCaseDay] = {
            open: null,
            close: null,
          };
        }

        return acc;
      }, {});

      // Dispatch the action with the operatingHours
      createPinAction(
        user,
        businessName,
        description,
        category,
        markerCoords.latitude,
        markerCoords.longitude,
        contactInfo,
        image,
        operatingHours, // Pass the operatingHours object
      )(dispatch);
    }

    // Reset form states
    setIsAddingForm(false);
    setIsAddingOpeningHours(false);
  };

  const [openingHours, setOpeningHours] = useState('');

  const handleNext = () => {
    if (businessName !== '' && description !== '' && category !== '') {
      setIsAddingForm(false); // Close the first modal
      setIsAddingOpeningHours(true); // Open the next modal for opening hours
    }
  };

  const uploadImage = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      compressImageQuality: 0.8,
      includeBase64: true,
    })
      .then((image: ImageOrVideo | null) => {
        if (image) {
          setImage('data:image/jpeg;base64,' + image.data);
        } else {
          // Handle the case where image is null or undefined
          Alert.alert('No image selected');
        }
      })
      .catch(error => {
        // Handle any errors that occur during image picking
        console.error('Image picking error:', error);
      });
  };

  const {pins} = useSelector((state: any) => state.pin);

  const nearbypin = pins.filter(
    (pins: {latitude: number; longitude: number}) => {
      const distance = haversine(
        user.latitude,
        user.longitude,
        pins.latitude,
        pins.longitude,
      );

      return distance <= newProximityThreshold;
    },
  );
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

  const customMapStyle = [
    {
      featureType: 'all',
      elementType: 'geometry.fill',
      stylers: [
        {
          weight: '2.00',
        },
      ],
    },
    {
      featureType: 'all',
      elementType: 'geometry.stroke',
      stylers: [
        {
          color: '#9c9c9c',
        },
      ],
    },
    {
      featureType: 'all',
      elementType: 'labels.text',
      stylers: [
        {
          visibility: 'on',
        },
      ],
    },
    {
      featureType: 'landscape',
      elementType: 'all',
      stylers: [
        {
          color: '#FEFAF6',
        },
      ],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#FEFAF6',
        },
      ],
    },
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#ddd0c9',
        },
      ],
    },
    {
      featureType: 'poi',
      elementType: 'all',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'all',
      stylers: [
        {
          saturation: -100,
        },
        {
          lightness: 45,
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#E0FBE2',
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#2b2b2b',
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.stroke',
      stylers: [
        {
          color: '#ffffff',
        },
      ],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [
        {
          visibility: 'on',
        },
        {
          color: '#00FF00',
        },
      ],
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry.fill',
      stylers: [
        {
          visibility: 'on',
        },
        {
          color: '#5fff54',
        },
      ],
    },
    {
      featureType: 'transit',
      elementType: 'all',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'all',
      stylers: [
        {
          color: '#46bcec',
        },
        {
          visibility: 'on',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [
        {
          color: '#2b2b2b',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: '#070707',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [
        {
          color: '#ffffff',
        },
      ],
    },
  ];

  const [currentPinIndex, setCurrentPinIndex] = useState('');

  const calculateCurrentPinIndex = (offsetX: number) => {
    const index = Math.floor(offsetX / (CARD_WIDTH - 100));
    setCurrentPinIndex(index);
  };
  useEffect(() => {
    console.log(currentPinIndex);

    if (typeof currentPinIndex === 'number' && currentPinIndex >= 0) {
      const pin = filteredPins[currentPinIndex]; // Reference filteredPins instead of pins
      if (pin && _map.current) {
        const {latitude, longitude, ...otherPinData} = pin; // Destructure to separate lat, long, and other pin data

        // Log latitude, longitude, and the entire pin data
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        console.log('Pin data:', pin);

        (_map.current as MapView).animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          350,
        );
      }
    }
  }, [currentPinIndex, filteredPins]); // Watch filteredPins

  const handleOpenModal = () => {
    console.log('Button clicked');
    setOpenModal(true);
  };

  useEffect(() => {
    getAllUsers()(dispatch);
    getAllPins()(dispatch);
  }, [dispatch]);

  useEffect(() => {
    if (users) {
      setData(users);
    }
  }, [users]);

  useEffect(() => {
    if (latitude && longitude && _map.current) {
      (_map.current as MapView).animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        350,
      );
    }
  }, [latitude, longitude]);

  const success = geoPosition => {
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
    console.log('Updated Location:', geoPosition.coords);
  };

  const handlePinMarkerPress = (pin: any) => {
    const index = filteredPins.findIndex((p: {_id: any}) => p._id === pin._id);

    if (_scrollView.current) {
      _scrollView.current.scrollTo({
        x: index * (CARD_WIDTH + 19),
        animated: true,
      });
    }

    const {latitude, longitude} = pin;

    if (_map.current) {
      _map.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        350,
      );
    }
  };

  const [lineCoordinates, setLineCoordinates] = useState([]);

  const fetchCoordinates = async () => {
    try {
      // Log retrieval of userLocation
      const userLocation = await AsyncStorage.getItem('userLocation');
      console.log('User Location from AsyncStorage:', userLocation);

      // Log retrieval of currentPinLatitude and currentPinLongitude
      const currentPinLatitude = await AsyncStorage.getItem(
        'currentPinLatitude',
      );
      console.log(
        'Current Pin Latitude from AsyncStorage:',
        currentPinLatitude,
      );

      const currentPinLongitude = await AsyncStorage.getItem(
        'currentPinLongitude',
      );
      console.log(
        'Current Pin Longitude from AsyncStorage:',
        currentPinLongitude,
      );

      if (userLocation && currentPinLatitude && currentPinLongitude) {
        const userCoords = JSON.parse(userLocation); // Parse the user's location
        const pinCoords = {
          latitude: JSON.parse(currentPinLatitude),
          longitude: JSON.parse(currentPinLongitude),
        };

        console.log('Parsed User Coordinates:', userCoords);
        console.log('Parsed Pin Coordinates:', pinCoords);

        // Set the coordinates for the polyline
        setLineCoordinates([
          {latitude: userCoords.latitude, longitude: userCoords.longitude},
          pinCoords,
        ]);

        console.log('Line Coordinates Set:', [
          {latitude: userCoords.latitude, longitude: userCoords.longitude},
          pinCoords,
        ]);

        // Close the modal
        setIsModalVisible(false);
        setShowDistancePopup(true);
        setTimeout(() => setShowDistancePopup(false), 10000);
        _map.current?.fitToCoordinates([userCoords, pinCoords], {
          edgePadding: {top: 50, right: 50, bottom: 50, left: 50},
          animated: true,
        });
      } else {
        console.warn('Coordinates not found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
    }
  };


  const [activeTab, setActiveTab] = useState('overview');
  const [userHasPin, setUserHasPin] = useState(false);

  useEffect(() => {
    if (pins && user) {
      console.log('Checking if the user has a pin...');
      const hasPin = pins.some(pin => {
        console.log('Checking pin:', pin);
        console.log('Current user ID:', user._id);
        const isMatch = pin.createdBy === user._id;
        console.log('Does this pin belong to the user?', isMatch);
        return isMatch;
      });

      console.log('Final result - Does the user have a pin?', hasPin);
      setUserHasPin(hasPin);
    }
  }, [pins, user]); // Re-run when `pins` or `user` changes

  useEffect(() => {
    if (distance) {
      // Assume walking speed is 5 km/h
      const walkingSpeed = 5; // km/h
      const timeInHours = distance / walkingSpeed;

      // Convert hours to minutes
      const timeInMinutes = Math.round(timeInHours * 60);

      // Update the travel time state
      setTravelTime(timeInMinutes);
    } else {
      setTravelTime(null);
    }
  }, [distance]);
  const [showDistancePopup, setShowDistancePopup] = useState(false);
  const [travelTime, setTravelTime] = useState(null);
  return (
    <View style={styles.container}>
      <MapView
        ref={_map}
        provider={PROVIDER_GOOGLE}
        style={{flex: 1}}
        customMapStyle={customMapStyle}
        showsUserLocation
        showsMyLocationButton
        region={{
          latitude: userData?.latitude || 14,
          longitude: userData?.longitude || 120,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        onPress={e => {
          if (isAddingPin) {
            setMarkerCoords(e.nativeEvent.coordinate);
          }
        }}>
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            description="You are here"
            image={require('../assets/maps/location.png')}>
            <Callout tooltip>
              <View>
                <View style={styles.bubble}>
                  <View style={styles.relative}>
                    <Image
                      source={{uri: user?.avatar.url}}
                      style={{height: 80, width: 80}} // use style prop instead of height/width directly
                    />
                  </View>
                  <Text style={styles.name}>{user?.name}</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        )}

        {/* Nearby Pins */}
        {nearbypin
          .filter(pin => selectedCategories.includes(pin.category)) // Filter pins based on selected categories
          .map((pin: any) => {
            // Initialize the default marker path based on the pin's category
            let pinMarker = require('../assets/maps/location.png'); // Default marker for regular businesses

            // Set the marker based on pin category
            switch (pin.category) {
              case 'healthcare':
                pinMarker = require('../assets/maps/free/healthcare.png');
                break;
              case 'transportation':
                pinMarker = require('../assets/maps/free/transportation.png');
                break;
              case 'food':
                pinMarker = require('../assets/maps/free/food.png');
                break;
              case 'merchant':
                pinMarker = require('../assets/maps/free/merchant.png');
                break;
              case 'service':
                pinMarker = require('../assets/maps/free/service.png');
                break;
              default:
                pinMarker = require('../assets/maps/location.png');
            }

            // Check the current user's ID
            const currentUserId = user?._id;

            // If the current user created this pin
            if (pin.createdBy === currentUserId) {
              if (user?.accountType === 'prembusiness') {
                switch (pin.category) {
                  case 'healthcare':
                    pinMarker = require('../assets/maps/premium/premHealthcare.png');
                    break;
                  case 'transportation':
                    pinMarker = require('../assets/maps/premium/premTransportation.png');
                    break;
                  case 'food':
                    pinMarker = require('../assets/maps/premium/premFood.png');
                    break;
                  case 'merchant':
                    pinMarker = require('../assets/maps/premium/premMerchant.png');
                    break;
                  case 'service':
                    pinMarker = require('../assets/maps/premium/premService.png');
                    break;
                  default:
                    pinMarker = require('../assets/maps/premLocation.png');
                }
              }
            } else {
              // Check if any user created the pin and is 'prembusiness'
              const matchingUser = users.find(
                user => pin.createdBy === user._id,
              );
              if (matchingUser && matchingUser.accountType === 'prembusiness') {
                switch (pin.category) {
                  case 'healthcare':
                    pinMarker = require('../assets/maps/premium/premHealthcare.png');
                    break;
                  case 'transportation':
                    pinMarker = require('../assets/maps/premium/premTransportation.png');
                    break;
                  case 'food':
                    pinMarker = require('../assets/maps/premium/premFood.png');
                    break;
                  case 'merchant':
                    pinMarker = require('../assets/maps/premium/premMerchant.png');
                    break;
                  case 'service':
                    pinMarker = require('../assets/maps/premium/premService.png');
                    break;
                  default:
                    pinMarker = require('../assets/maps/premLocation.png');
                }
              }
            }

            // Render the pin with the determined marker
            return (
              <Marker
                key={pin._id} // Ensure this uses pin._id correctly
                coordinate={{
                  latitude: pin.latitude,
                  longitude: pin.longitude,
                }}
                title={pin.businessName}
                description={pin.description}
                image={pinMarker} // The resized 100x100 image
                onPress={() => {
                  handlePinMarkerPress(pin); // Handle pin marker press
                  handleVisitButtonPress(pin); // Handle visit button press
                }}
              />
            );
          })}

        {/* New Pin */}
        {isAddingPin && (
          <Marker
            draggable
            coordinate={markerCoords}
            onDragEnd={e => setMarkerCoords(e.nativeEvent.coordinate)}
          />
        )}

        {/* Radius */}
        {showThreshold && (
          <Circle
            center={center}
            radius={radius}
            fillColor="rgba(0, 255, 0, 0.2)"
            strokeColor="rgba(0, 255, 0, 0.5)"
          />
        )}

        {/* Directions Polyline */}
        {lineCoordinates.length > 0 && (
          <Polyline
            coordinates={lineCoordinates}
            strokeWidth={4}
            strokeColor="blue"
          />
        )}
      </MapView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showThreshold}
        onRequestClose={closeThreshold}>
        <View style={styles.modalContainer}>
          <View style={styles.preferenceHeaderContainer}>
            <Text style={styles.preferenceText}>
              Adjust proximity threshold
            </Text>
            <Text style={styles.preferenceText}>
              {newProximityThreshold.toFixed(2)} KM
            </Text>
            <Slider
              style={{width: '100%', marginTop: 10}}
              minimumValue={0.5}
              maximumValue={10}
              minimumTrackTintColor="#017E5E"
              maximumTrackTintColor="#6F6F6F"
              thumbTintColor="#017E5E"
              value={newProximityThreshold}
              onValueChange={setNewProximityThreshold}
            />
            <Text style={styles.preferenceText1}>
              Once set, we'll prioritize and deliver news, events,and
              recommendations within your chosen radius
            </Text>
          </View>

          <View style={styles.proximityButtonContainer}>
            <TouchableOpacity
              style={styles.proximityButton}
              onPress={updateProximityThreshold}>
              <Text style={styles.proximityText}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.proximityButton}
              onPress={closeThreshold}>
              <Text style={styles.proximityText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.searchBoxContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Image source={require('../assets/goBack.png')} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Map</Text>
        </View>

        <View style={styles.searchBox}>
          <View style={styles.settingsContainer}>
            <TouchableOpacity
              style={styles.radarButton}
              onPress={openThreshold}>
              <Image
                style={styles.goBackButton}
                source={require('../assets/settings.png')}
              />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchBar}
            placeholder="Search"
            value={searchQuery}
            onChangeText={text => {
              setSearchQuery(text); // Update search query
            }}
          />
        </View>
      </View>
      <View style={styles.preferenceContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Default Category */}
          <TouchableOpacity
            style={[
              styles.preferenceButton,
              selectedCategories.includes('default') && styles.selectedButton,
            ]}
            onPress={() => toggleCategory('default')}>
            <Text
              style={[
                styles.preferenceText2,
                selectedCategories.includes('default') && styles.selectedText,
              ]}>
              All Categories
            </Text>
          </TouchableOpacity>

          {/* Food Category */}
          <TouchableOpacity
            style={[
              styles.preferenceButton,
              selectedCategories.includes('food') && styles.selectedButton,
            ]}
            onPress={() => toggleCategory('food')}>
            <Image
              style={styles.preferenceImage}
              source={require('../assets/maps/food.png')}
            />
            <Text
              style={[
                styles.preferenceText2,
                selectedCategories.includes('food') && styles.selectedText,
              ]}>
              Restaurants
            </Text>
          </TouchableOpacity>

          {/* Service Category */}
          <TouchableOpacity
            style={[
              styles.preferenceButton,
              selectedCategories.includes('service') && styles.selectedButton,
            ]}
            onPress={() => toggleCategory('service')}>
            <Image
              style={styles.preferenceImage}
              source={require('../assets/maps/service.png')}
            />
            <Text
              style={[
                styles.preferenceText2,
                selectedCategories.includes('service') && styles.selectedText,
              ]}>
              Services
            </Text>
          </TouchableOpacity>

          {/* Transportation Category */}
          <TouchableOpacity
            style={[
              styles.preferenceButton,
              selectedCategories.includes('transportation') &&
                styles.selectedButton,
            ]}
            onPress={() => toggleCategory('transportation')}>
            <Image
              style={styles.preferenceImage}
              source={require('../assets/maps/transportation.png')}
            />
            <Text
              style={[
                styles.preferenceText2,
                selectedCategories.includes('transportation') &&
                  styles.selectedText,
              ]}>
              Transportation
            </Text>
          </TouchableOpacity>

          {/* Retail Category */}
          <TouchableOpacity
            style={[
              styles.preferenceButton,
              selectedCategories.includes('merchant') && styles.selectedButton,
            ]}
            onPress={() => toggleCategory('merchant')}>
            <Image
              style={styles.preferenceImage}
              source={require('../assets/maps/merchant.png')}
            />
            <Text
              style={[
                styles.preferenceText2,
                selectedCategories.includes('merchant') && styles.selectedText,
              ]}>
              Retail
            </Text>
          </TouchableOpacity>

          {/* Healthcare Category */}
          <TouchableOpacity
            style={[
              styles.preferenceButton,
              selectedCategories.includes('healthcare') &&
                styles.selectedButton,
            ]}
            onPress={() => toggleCategory('healthcare')}>
            <Image
              style={styles.preferenceImage}
              source={require('../assets/maps/healthcare.png')}
            />
            <Text
              style={[
                styles.preferenceText2,
                selectedCategories.includes('healthcare') &&
                  styles.selectedText,
              ]}>
              Health
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      {showDistancePopup && (
        <View style={styles.distancePopup}>
          <Text style={styles.popupText}>
            {distance ? `${distance} km` : 'Calculating...'}
          </Text>
          {travelTime && (
            <Text style={styles.popupText}>
              Walking time: {`${travelTime} minutes`}
            </Text>
          )}
        </View>
      )}
      <Animated.ScrollView
        ref={_scrollView}
        horizontal
        pagingEnabled
        scrollEventThrottle={1}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 25}
        snapToAlignment="center"
        style={styles.scrollView}
        contentInset={{
          top: 0,
          left: SPACING_FOR_CARD_INSET + 1,
          bottom: 0,
          right: SPACING_FOR_CARD_INSET,
        }}
        contentContainerStyle={{
          paddingHorizontal:
            Platform.OS === 'android' ? SPACING_FOR_CARD_INSET : 0,
        }}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          if (
            event.nativeEvent.contentOffset &&
            typeof event.nativeEvent.contentOffset.x === 'number'
          ) {
            const xOffset = event.nativeEvent.contentOffset.x;
            calculateCurrentPinIndex(xOffset);
          }
        }}>
        <FlatList
          horizontal
          data={filteredPins}
          showsHorizontalScrollIndicator={false}
          renderItem={({item}) => (
            <TouchableOpacity onPress={() => handleVisitPress(item)}>
              <View style={styles.card}>
                <Image
                  source={
                    item.image
                      ? {uri: item.image.url}
                      : require('../assets/defaultImage.png')
                  }
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.textContent}>
                  <Text numberOfLines={1} style={styles.cardtitle}>
                    {item.businessName}
                  </Text>
                  <Text numberOfLines={1} style={styles.cardDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Modal for Business Overview */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.directionButton}
                  onPress={fetchCoordinates}>
                  <Text style={styles.directionText}>Directions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.closeButton}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>

              {selectedPin && (
                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>
                    {selectedPin.businessName}
                  </Text>
                  <Text>
                    Walking time:{' '}
                    {travelTime ? `${travelTime} minutes` : 'Calculating...'}
                  </Text>
                  <Text>{selectedPin.category}</Text>
                  <Image
                    source={
                      selectedPin.image
                        ? {uri: selectedPin.image.url}
                        : require('../assets/defaultImage.png')
                    }
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                  {/* Debugging Console Logs */}
                  {console.log('Selected Pin:', selectedPin)}
                  {console.log(
                    'Selected Pin createdBy:',
                    selectedPin.createdBy,
                  )}
                  {console.log('Current User:', user)}
                  {console.log('Current User ID:', user?._id)}

                  {/* Tab Navigation */}
                  <View style={styles.tabs}>
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        activeTab === 'overview' && styles.activeTab,
                      ]}
                      onPress={() => setActiveTab('overview')}>
                      <Text style={styles.tabText}>Overview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.tabButton,
                        activeTab === 'reviews' && styles.activeTab,
                      ]}
                      onPress={() => setActiveTab('reviews')}>
                      <Text style={styles.tabText}>Reviews</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Tab Content */}
                  {activeTab === 'overview' && (
                    <ScrollView style={styles.tabContent}>
                      <Text style={styles.tabContentText}>
                        {selectedPin.description}
                      </Text>

                      <Text style={styles.textHeader}>Contacts</Text>
                      <View style={styles.contactContainer}>
                        <View style={styles.emailContainer}>
                          <Image
                            style={styles.emailImage}
                            source={require('../assets/email.png')}
                          />
                          <Text style={styles.emailText}>
                            {
                              // Find the user from the list whose ID matches selectedPin.createdBy
                              users?.find(
                                user => user._id === selectedPin.createdBy,
                              )?.email || 'Email not available'
                            }
                          </Text>
                        </View>

                        <View style={styles.emailContainer}>
                          <Image
                            style={styles.emailImage}
                            source={require('../assets/phone.png')}
                          />
                          <Text style={styles.emailText}>
                            {selectedPin.contactInfo.phone}
                          </Text>
                        </View>
                      </View>
                    </ScrollView>
                  )}

                  {activeTab === 'reviews' && (
                    <View>
                      {Array.isArray(selectedPin.reviews) &&
                      selectedPin.reviews.length > 0 ? (
                        selectedPin.reviews.map((review: any) => (
                          <View key={review._id} style={styles.reviewCard}>
                            <Text style={styles.reviewText}>
                              {review.reviewText}
                            </Text>
                            <Text style={styles.reviewRating}>
                              Rating: {review.ratings}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text>No reviews yet</Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
      </Animated.ScrollView>
      {openModal && (
        <View className="flex-[1] justify-center items-center mt-[22]">
          <Modal
            animationType="fade"
            transparent={true}
            visible={openModal}
            onRequestClose={() => {
              setOpenModal(!openModal);
            }}>
            <TouchableWithoutFeedback onPress={() => setOpenModal(false)}>
              <View className="flex-[1] justify-end bg-[#00000059]">
                <TouchableWithoutFeedback onPress={() => setOpenModal(true)}>
                  <View className="w-full bg-[#fff] h-[120] rounded-[20px] p-[20px] items-center shadow-[#000] shadow-inner">
                    <TouchableOpacity
                      className="w-full bg-[#00000010] h-[50px] rounded-[10px] items-center flex-row pl-5"
                      onPress={() => deletePinHandler(selectedPin._id)}>
                      <Text className="text-[18px] font-[600] text-[#e24848]">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      )}
      {!userHasPin &&
        !isAddingPin &&
        (user.accountType === 'business' ||
          user.accountType === 'prembusiness') && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddPin}>
            <Text style={styles.addButtonText}>Add Store</Text>
          </TouchableOpacity>
        )}
      {isAddingPin && (
        <View style={styles.confirmButtons}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}>
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsAddingPin(false)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      <RNModal visible={isAddingForm} animationType="slide" transparent>
        <View
          style={[
            styles.fillInfoContainer,
            isInputFocused && {
              position: 'absolute',
              alignSelf: 'center',
            },
          ]}>
          <View style={styles.textContainer1}>
            <Text style={styles.modalText}>Your business info</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon} onPress={uploadImage}>
            <Image
              style={styles.profileImage}
              source={{
                uri: user?.avatar?.url
                  ? user.avatar.url
                  : 'https://cdn-icons-png.flaticon.com/512/8801/8801434.png',
              }}
            />
            <Image
              style={styles.editProfile}
              source={require('../assets/editImage.png')}
            />
          </TouchableOpacity>

          <View style={styles.businessNameContainer}>
            <Text style={styles.fillInfoText}>Business Name</Text>
            <TextInput
              style={styles.businessNameBox}
              value={businessName}
              onChangeText={text => setBusinessName(text)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.fillInfoText}>Description</Text>
            <TextInput
              multiline={true}
              numberOfLines={4}
              style={styles.descriptionBox}
              value={description}
              onChangeText={text => setDescription(text)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </View>

          <View style={styles.categoryPhoneContainer}>
            <View style={styles.categoryContainer}>
              <Text style={styles.fillInfoText}>Category</Text>
              <SelectList
                data={categories}
                setSelected={setCategory} // Save selected category
                boxStyles={{borderColor: '#017E5E', height: 45}}
                defaultOption={{key: 'default', value: 'Others'}}
              />
            </View>
            <View style={styles.phoneContainer}>
              <Text style={styles.fillInfoText}>Phone</Text>
              <TextInput
                style={styles.phoneBox}
                placeholder="Phone"
                value={contactInfo.phone}
                onChangeText={text =>
                  setContactInfo({...contactInfo, phone: text})
                }
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
            </View>
          </View>

          <View style={styles.emailContainer}>
            <Text style={styles.fillInfoText}>Email</Text>
            <TextInput
              style={styles.emailBox}
              placeholder="Email"
              value={contactInfo.email}
              onChangeText={text =>
                setContactInfo({...contactInfo, email: text})
              }
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </View>

          <View style={styles.submitButtonContainer}>
            <TouchableOpacity style={styles.submitCancel} onPress={handleNext}>
              <Text style={styles.submitText}>Next</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitCancel}
              onPress={() => setIsAddingForm(false)}>
              <Text style={styles.submitText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNModal>
      <Modal visible={isAddingOpeningHours} animationType="slide" transparent>
        <View style={styles.fillInfoContainer}>
          <View style={styles.textContainer1}>
            <Text style={styles.modalText}>Business Opening Hours</Text>
          </View>

          {/* Day Selection */}
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.daySelectionTitle}>
              Select Days You Are Open
            </Text>
            {Object.keys(weekHours).map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.daySelectionContainer,
                  {
                    backgroundColor: selectedDays.includes(day)
                      ? 'green'
                      : 'transparent',
                  },
                ]}
                onPress={() => toggleDaySelection(day)}>
                <Text style={styles.dayText}>{day}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time Pickers for Opening and Closing */}
          <View style={styles.timePickerContainer}>
            {/* Opening Time Picker */}
            <TouchableOpacity onPress={() => showTimePickerForDay('open')}>
              <TextInput
                style={styles.timeInput}
                value={
                  selectedDays.length > 0 && weekHours[selectedDays[0]]?.open
                    ? format(weekHours[selectedDays[0]].open, 'hh:mm a')
                    : ''
                }
                editable={false}
                placeholder={`Opening Time`}
              />
            </TouchableOpacity>

            {/* Closing Time Picker */}
            <TouchableOpacity onPress={() => showTimePickerForDay('close')}>
              <TextInput
                style={styles.timeInput}
                value={
                  selectedDays.length > 0 && weekHours[selectedDays[0]]?.close
                    ? format(weekHours[selectedDays[0]].close, 'hh:mm a')
                    : ''
                }
                editable={false}
                placeholder={`Closing Time`}
              />
            </TouchableOpacity>
          </View>

          {/* Time Picker Modal */}
          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
            />
          )}

          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={styles.submitCancel}
              onPress={handleSubmit}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitCancel}
              onPress={() => setIsAddingOpeningHours(false)}>
              <Text style={styles.submitText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  daySelectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  daySelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  dayText: {
    fontSize: 14,
    marginLeft: 10,
  },
  dayContainer: {
    marginBottom: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    borderBottomWidth: 1,
    padding: 10,
    width: '45%',
  },
  distancePopup: {
    position: 'absolute',
    top: 180, // Adjust based on your desired position
    left: '10%', // Center horizontally
    width: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#017E5E',
  },
  popupText: {
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
  },
  contactContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  textHeader: {
    color: '#017E5E',
    fontSize: 16,
    alignSelf: 'center',
    fontWeight: 'bold',
    marginVertical: 10,
  },
  emailContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailImage: {
    height: 30,
    width: 30,
    marginRight: 5,
  },
  emailText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabs: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabButton: {
    padding: 10,
    marginRight: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  tabContent: {
    marginTop: 10,
  },
  tabContentText: {
    fontSize: 14,
    color: '#000',
    borderColor: '#c3c3c3',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  review: {
    marginBottom: 15,
  },
  reviewUser: {
    fontWeight: 'bold',
  },
  reviewRating: {
    fontSize: 12,
    color: '#888',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
  },
  directionButton: {
    padding: 10,
    backgroundColor: '#017E5E',
    borderRadius: 20,
  },
  directionText: {
    color: '#fff',
  },
  modalButtons: {
    justifyContent: 'space-between',
    display: 'flex',
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 400,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  closeText: {
    fontSize: 16,
    color: '#017E5E',
  },
  modalBody: {
    marginTop: 20,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  modalDescription: {
    fontSize: 14,
    marginTop: 10,
    color: '#666',
  },
  submitText: {
    color: '#fff',
  },
  submitCancel: {
    backgroundColor: '#017E5E',
    width: '47%',
    justifyContent: 'center',
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 10,
  },
  submitButtonContainer: {
    marginTop: 6,
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  categoryContainer: {
    width: '47%',
  },
  phoneContainer: {
    width: '47%',
  },
  categoryPhoneContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fillInfoText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emailBox: {
    borderColor: '#017E5E',
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    paddingLeft: 10,
    marginBottom: 10,
    height: 45,
  },
  descriptionBox: {
    borderColor: '#017E5E',
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    paddingLeft: 10,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  phoneBox: {
    borderColor: '#017E5E',
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    paddingLeft: 10,
    marginBottom: 15,
    height: 45,
  },
  businessNameBox: {
    borderColor: '#017E5E',
    borderWidth: 1,
    height: 45,
    borderRadius: 15,
    fontSize: 16,
    paddingLeft: 10,
    marginBottom: 15,
  },
  editProfile: {
    position: 'absolute',
    height: 40,
    width: 40,
    top: 80,
    left: 190,
  },
  fillInfoContainer: {
    height: 660,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '30%',
    marginBottom: 'auto',
    width: 380,
    backgroundColor: '#fff',
    padding: 20,
    elevation: 10,
    borderColor: '#cecece',
    borderWidth: 1,
  },
  textContainer1: {
    width: '100%',
    alignItems: 'center',
    borderBottomColor: '#017E5E',
    borderBottomWidth: 1,
  },
  modalText: {
    color: '#017E5E',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 6,
    flexDirection: 'row',
    gap: 20,
    marginVertical: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 90,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  headerContainer: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
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
  preferenceText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 50,
  },
  preferenceText1: {
    textAlign: 'center',
    marginTop: 13,
    fontSize: 12,
  },
  preferenceContainer: {
    display: 'flex',
    flexDirection: 'row',
    position: 'absolute',
    top: 140,
  },
  preferenceButton: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 3,
    borderRadius: 5,
    borderColor: '#000',
    borderWidth: 1,
    backgroundColor: 'white',
    marginRight: 10,
  },
  preferenceImage: {
    height: 20,
    width: 20,
    resizeMode: 'contain',
    marginRight: 10,
    paddingHorizontal: 5,
  },
  preferenceText2: {
    fontWeight: '600',
    fontSize: 14,
  },
  selectedButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#017E5E',
  },
  selectedText: {
    color: '#000',
  },
  preferenceHeaderContainer: {
    marginHorizontal: 20,
  },
  headerText: {
    width: '75%',
    paddingLeft: 16,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: 'bold',
    color: '#000',
  },
  goBackButton: {
    width: 32,
    height: 32,
  },
  proximityButton: {
    backgroundColor: '#017E5E',
    width: '45%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    borderRadius: 10,
  },
  proximityButtonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    width: '100%',
  },
  proximityText: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  thresholdButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  activeButton: {
    backgroundColor: '#017E5E',
    color: '#fff',
  },
  searchBox: {
    padding: 5,
    flexDirection: 'row',
    backgroundColor: '#fff',
    width: '98%',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 5,
    position: 'absolute',
    top: 70,
  },
  searchBar: {
    borderColor: '#000',
    borderLeftWidth: 1,
    width: '90%',
    paddingLeft: 10,
  },
  searchBoxContainer: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#fff',
    width: '100%',
    alignSelf: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  chipsIcon: {
    marginRight: 5,
  },
  chipsScrollView: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 80,
    paddingHorizontal: 10,
  },
  chipsItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    height: 35,
    shadowColor: '#ccc',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  scrollView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
  },
  card: {
    borderRadius: 20,
    // padding: 10,
    elevation: 2,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowRadius: 2,
    shadowOpacity: 0.3,
    shadowOffset: {x: 2, y: -2},
    height: 180,
    width: CARD_WIDTH,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardImage: {
    flex: 3,
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  textContent: {
    alignItems: 'center',
  },
  cardtitle: {
    fontSize: 15,
    color: '#000',
    // marginTop: 5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    color: '#444',
  },
  signIn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
    borderRadius: 3,
    backgroundColor: 'FF0000',
  },
  textSign: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  mapset: {
    flexDirection: 'row',
    position: 'absolute',
    alignSelf: 'center',
    bottom: 10,
  },
  cardButtons: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    width: 100,
    backgroundColor: '#ff0000',
    borderRadius: 5,
  },
  modalContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    bottom: 20,
    alignSelf: 'center',
    elevation: 5,
  },
  map: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: 'black',
    marginBottom: 5,
    paddingRight: 20,
  },
  addButtonText: {
    fontWeight: '700',
  },
  addButton: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 220,
    backgroundColor: 'white',
    color: 'black',
    padding: 20,
    elevation: 20,
    borderRadius: 30,
    width: 120,
    height: 60,
    alignSelf: 'center',
  },
  confirmButtons: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  settingsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '14%',
  },
});

export default MapScreen;

function setWatchID(arg0: number) {
  throw new Error('Function not implemented.');
}
function animateToRegion(
  arg0: {
    latitude: any;
    longitude: any;
    latitudeDelta: number;
    longitudeDelta: number;
  },
  arg1: number,
) {
  throw new Error('Function not implemented.');
}
