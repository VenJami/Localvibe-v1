import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  Modal,
  Button,
  TextInput,
  Linking,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import PostCard from '../components/PostCard';
import {
  addReviewAction,
  modifyPinAction,
  modifyReviewAction,
  deleteReviewAction,
} from '../../redux/actions/pinAction'; // Import the review actions
import {createOrUpdateReportAction} from '../../redux/actions/reportAction';
import axios from 'axios'; // Import axios
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import {BarChart, StackedBarChart} from 'react-native-chart-kit';

type Props = {
  route: any;
  navigation: any;
};

const MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 55;
const MAX_HEIGHT = 350;
// State for managing the active tab (Posts or Vibe)

const BusinessPinScreen = ({route, navigation}: Props) => {
  const [localPins, setPins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0); // To store the average rating

  // Fetch pins from AsyncStorage
  const fetchPins = async () => {
    try {
      setIsLoading(true);
      const pinsData = await AsyncStorage.getItem('pins');
      if (pinsData) {
        const parsedPins = JSON.parse(pinsData);
        setPins(parsedPins);
      } else {
        console.log('No pins found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error retrieving pins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPins();
  }, []);

  const handleMapPress = (e: any) => {
    const {latitude, longitude} = e.nativeEvent.coordinate;
    setLatitude(latitude); // Set the new latitude where the user pressed
    setLongitude(longitude); // Set the new longitude where the user pressed
  };
  // Get the current pin from the route params
  const {pins} = route.params;
  const [showModal, setShowModal] = useState(!pins.isVerified); // Show modal if not verified
  // Check if the pin exists in local storage
  useEffect(() => {
    console.log('useEffect triggered', {localPins, pins});

    // Ensure localPins and pins are available
    if (localPins.pins && localPins.pins.length > 0 && pins) {
      // Find the localPin in localPins that matches pins._id
      const localPin = localPins.pins.find((pin: any) => pin._id === pins._id);

      if (localPin) {
        // Set the description and contact info
        setPinDescription(localPin.description || 'No description available');
        setPinContactInfo({
          phone: localPin.contactInfo?.phone || 'N/A',
          email: localPin.contactInfo?.email || 'N/A',
        });

        // Log the visitors array and update visitor count

        const visitorCount = localPin.visitors ? localPin.visitors.length : 0;

        setVisitorLength(visitorCount);

        // Retrieve the image URL from the localPin object
        const imageUrl = localPin.image
          ? localPin.image.url
          : 'No image available';

        setImageUrl(imageUrl);

        // Set the reviews from localPin if available
        if (localPin.reviews) {
          setReviews(localPin.reviews);
        } else {
          console.log('No reviews found for this pin.');
        }

        // Handle the dynamic updates for ratings
        if (localPin.reviews && localPin.reviews.length > 0) {
          const totalRatings = localPin.reviews.reduce(
            (acc: number, review: any) => acc + review.ratings,
            0,
          );
          const avgRating = totalRatings / localPin.reviews.length;
          setAverageRating(avgRating); // Update the average rating
        } else {
          setAverageRating(0); // If no reviews, set rating to 0
        }

        // Fetch and set latitude and longitude
        const latitude = localPin.latitude || 14;
        const longitude = localPin.longitude || 120;
        setLatitude(latitude);
        setLongitude(longitude);
      } else {
        console.log('Pin not found in local storage');
      }
    } else {
      console.log('localPins.pins or pins are missing or empty:', {
        localPins,
        pins,
      });
    }
  }, [localPins, pins]); // This will trigger whenever localPins or pins changes

  const [pinDescription, setPinDescription] = useState('');
  const [pinContactInfo, setPinContactInfo] = useState({
    phone: '',
    email: '',
  });
  const [visitorLength, setVisitorLength] = useState(0); // Initialize state for visitor length
  const [imageUrl, setImageUrl] = useState(null); // State for image URL
  const {user, token} = useSelector((state: any) => state.user);
  const [isEditing, setIsEditing] = useState(false);

  const dispatch = useDispatch();

  const {posts} = useSelector((state: any) => state.post);
  const [activeTab, setActiveTab] = useState('Details');

  const handleBackPress = () => {
    navigation.navigate('Map');
  };

  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json`,
          {
            params: {
              latlng: `${pins.latitude},${pins.longitude}`,
              key: 'AIzaSyClgs3wKE9q0DI-dMrOnwBOIpfFkHDDf6c',
            },
          },
        );
        const results = response.data.results;
        if (results && results.length > 0) {
          // Extract street and city from the formatted address
          const components = results[0].address_components;
          const street = components.find(comp =>
            comp.types.includes('route'),
          )?.long_name;
          const city = components.find(comp =>
            comp.types.includes('locality'),
          )?.long_name;

          setAddress(
            `${street || 'Unknown Street'}, ${city || 'Unknown City'}`,
          );
        } else {
          setAddress('Address not found');
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        setAddress('Unable to fetch address');
      }
    };

    fetchAddress();
  }, [pins.latitude, pins.longitude]);

  // State for the follow button (toggle between follow/unfollow)
  const [isFollowed, setIsFollowed] = useState(false);
  const [latitude, setLatitude] = useState<string | number | null>(null);
  const [longitude, setLongitude] = useState<string | number | null>(null);

  // Handle follow button press
  const handleFollowPress = () => {
    setIsFollowed(!isFollowed); // Toggle follow state
  };

  const [postData, setPostData] = useState<any[]>([]);

  useEffect(() => {
    // Filter posts where post.user._id matches pins.createdBy
    const matchingPosts = posts.filter(
      post => post.user._id === pins.createdBy,
    );
    setPostData(matchingPosts);
  }, [posts, pins.createdBy]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl); // Set the selected image when clicked
  };

  const closeModal = () => {
    setSelectedImage(null); // Close the modal by resetting the selected image
  };

  const [editReviewText, setEditReviewText] = useState(''); // Store the review text when editing
  const [editReviewRating, setEditReviewRating] = useState(0); // Store the rating for editing

  // If a review is selected for editing, pre-fill the fields

  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  // Step 2: Add a new review
  // Add a new review and update AsyncStorage
  // Save reviews to AsyncStorage and update the corresponding pin directly in "pins"
  const [editableImageUrl, setEditableImageUrl] = useState(imageUrl || '');
  const [editableDescription, setEditableDescription] = useState(
    pinDescription || '',
  );
  const [editablePhone, setEditablePhone] = useState(
    pinContactInfo.phone || '',
  );
  const [editableEmail, setEditableEmail] = useState(
    pinContactInfo.email || '',
  );
  const handleEditPress = () => {
    setIsEditing(true);
  };
  const handleSavePin = async () => {
    try {
      const pinsData = await AsyncStorage.getItem('pins');
      if (pinsData) {
        const parsedPins = JSON.parse(pinsData);

        const updatedPins = {
          ...parsedPins,
          pins: parsedPins.pins.map((pin: any) =>
            pin._id === pins._id
              ? {
                  ...pin,
                  image: editedImage,
                  description: editableDescription,
                  contactInfo: {
                    phone: editablePhone,
                    email: editableEmail,
                  },
                  latitude,
                  longitude,
                }
              : pin,
          ),
        };

        await AsyncStorage.setItem('pins', JSON.stringify(updatedPins));
        console.log('Pin successfully updated.');

        // Dispatch to update backend
        dispatch(
          modifyPinAction(
            pins._id,
            pins.businessName,
            editableDescription,
            pins.category,
            latitude,
            longitude,
            {phone: editablePhone, email: pins.email},
            editedImage,
            pins.openingHours || 'N/A',
          ),
        );

        Alert.alert('Success', 'Pin updated successfully!');
      }
    } catch (error) {
      console.error('Error saving pin:', error);
      Alert.alert('Error', 'Could not save the pin');
    }
  };

  const saveReviewsToAsyncStorage = async (updatedReviews: any[]) => {
    try {
      console.log('Updating reviews for pin ID:', pins._id);
      console.log('Updated reviews:', updatedReviews);

      // Fetch the current pins from AsyncStorage
      const pinsData = await AsyncStorage.getItem('pins');
      if (pinsData) {
        const parsedPins = JSON.parse(pinsData);

        if (parsedPins && parsedPins.pins) {
          // Update the pin in the object that matches the current pin ID
          const updatedPins = {
            ...parsedPins,
            pins: parsedPins.pins.map((pin: any) =>
              pin._id === pins._id ? {...pin, reviews: updatedReviews} : pin,
            ),
          };

          // Save the updated pins back to AsyncStorage
          await AsyncStorage.setItem('pins', JSON.stringify(updatedPins));
          console.log('Reviews successfully saved to AsyncStorage');

          // Update the state with the new reviews
          setReviews(updatedReviews);
          console.log('State updated with new reviews:', updatedReviews);

          // Recalculate the average rating
          const totalRatings = updatedReviews.reduce(
            (acc: number, review: any) => acc + review.ratings,
            0,
          );
          const avgRating = totalRatings / updatedReviews.length;
          setAverageRating(avgRating); // Update the average rating
        } else {
          console.log('No valid pins data found in AsyncStorage');
        }
      } else {
        console.log('No pins found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error saving reviews to AsyncStorage:', error);
    }
  };

  // Add a new review
  const handleAddReview = async () => {
    if (reviews.some(review => review.userId === user._id)) {
      alert('You have already submitted a review.');
      return;
    }

    const newReviewObject = {
      _id: Date.now().toString(),
      reviewText: newReview,
      ratings: Number(newRating),
      user: {
        _id: user._id,
        name: user.name,
        image: user.avatar.url, // Add the user's avatar image
      },
      createdAt: new Date().toISOString(),
    };

    const updatedReviews = [...reviews, newReviewObject];

    // Modified dispatch with user information
    await dispatch(
      addReviewAction(pins._id, {
        userId: user._id, // Pass userId
        name: user.name, // Pass user's name
        image: user.avatar.url, // Pass user's avatar URL
        reviewText: newReview, // Review text
        ratings: newRating, // Ratings
      }),
    );

    await saveReviewsToAsyncStorage(updatedReviews);

    setNewReview('');
    setNewRating('');
  };

  // Modify an existing review
  const handleModifyReview = async () => {
    const updatedReviews = reviews.map(review =>
      review._id === selectedReviewId
        ? {
            ...review,
            reviewText: newReview,
            ratings: Number(newRating),
          }
        : review,
    );

    await dispatch(
      modifyReviewAction(pins._id, selectedReviewId, {
        userId: user._id, // Pass userId
        name: user.name, // Pass user's name
        image: user.avatar.url, // Pass user's avatar URL
        reviewText: newReview, // Modified review text
        ratings: newRating, // Modified ratings
      }),
    );
    await saveReviewsToAsyncStorage(updatedReviews);

    setNewReview('');
    setNewRating('');
    setSelectedReviewId('');
  };

  // Delete a review
  const handleDeleteReview = async (reviewId: string) => {
    const updatedReviews = reviews.filter(review => review._id !== reviewId);

    await dispatch(
      deleteReviewAction(pins._id, reviewId, {
        userId: user._id, // Pass userId
        name: user.name, // Pass user's name
        image: user.avatar.url, // Pass user's avatar URL
      }),
    );
    await saveReviewsToAsyncStorage(updatedReviews);
  };

  const handleEmailClick = () => {
    const email = pins.contactInfo.email;
    const mailtoLink = `mailto:${email}`;
    Linking.openURL(mailtoLink);
  };

  const handlePhoneClick = () => {
    const phoneNumber = pins.contactInfo.phone;
    const telLink = `tel:${phoneNumber}`;
    Linking.openURL(telLink);
  };
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const uploadImage = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      compressImageQuality: 0.8,
      includeBase64: true,
    })
      .then((image: ImageOrVideo) => {
        if (image?.data) {
          // Update state with the edited image
          setEditedImage(`data:image/jpeg;base64,${image.data}`);
        } else {
          Alert.alert('No image selected');
        }
      })
      .catch(error => {
        console.error('Image picking error:', error);
        Alert.alert('Error', 'Could not pick an image');
      });
  };

  const [openModal, setOpenModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);

  // Define report reasons
  const reportReasons = [
    {label: 'Violent content', value: 'violent'},
    {label: 'Explicit Content', value: 'explicit'},
    {label: 'Hate speech', value: 'hate'},
    {label: 'Illegal activities', value: 'illegal'},
    {label: 'Others', value: 'others'},
  ];

  // Handle report confirmation
  const handleConfirmReport = () => {
    if (selectedReason) {
      console.log('Selected Reason:', selectedReason); // Log the selected reason
      console.log('Reporting User ID:', user._id); // Log the reporting user's ID
      console.log('Reported Item ID:', pins._id); // Log the ID of the reported post
      console.log('Report Type: post'); // Log the assumed type
      console.log('Reason:', selectedReason);

      // Dispatch the report action
      dispatch(
        createOrUpdateReportAction(
          user._id, // Reporting user's ID
          pins._id, // Reported post ID
          'pins', // Assuming this is a post
          selectedReason, // Selected reason for the report
        ),
      );

      console.log('Report dispatched successfully.');

      setOpenModal(false); // Close the modal
      setSelectedReason(null); // Reset the selected reason
    } else {
      console.log('No reason selected. Report not dispatched.');
    }
  };

  // Handle cancel report
  const handleCancelReport = () => {
    setOpenModal(false); // Close modal without reporting
    setSelectedReason(null); // Reset the selected reason
  };

  const [visitorCounts, setVisitorCounts] = useState<{[key: string]: number}>(
    {},
  );

  useEffect(() => {
    if (localPins.pins && localPins.pins.length > 0 && pins) {
      const localPin = localPins.pins.find((pin: any) => pin._id === pins._id);
      if (localPin) {
        const visitorData = localPin.visitors || [];
        console.log('Visitor Data:', visitorData); // Log visitor data
        storeVisitorData(visitorData); // Store visit data
      } else {
        console.log('No matching pin found in localPins');
      }
    } else {
      console.log('localPins.pins or pins is empty or missing');
    }
  }, [localPins, pins]);

  // Function to get the current week number
  const getWeekNumber = (date: Date) => {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - startDate.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.floor(diff / oneWeek);
    console.log('Week Number:', weekNumber); // Log calculated week number
    return weekNumber;
  };

  // Function to store visitors per week in AsyncStorage
  const storeVisitorData = async (visitorData: string[]) => {
    try {
      const currentWeek = getWeekNumber(new Date());
      console.log('Storing visitors for week:', currentWeek); // Log week being processed

      // Get existing data from AsyncStorage
      const existingData = await AsyncStorage.getItem('weeklyVisitors');
      console.log('Existing Visitor Data:', existingData); // Log existing data from AsyncStorage

      const weeklyVisitors = existingData ? JSON.parse(existingData) : {};
      console.log('Parsed Weekly Visitors:', weeklyVisitors); // Log parsed existing data

      // Initialize the set for the current week if it doesn't exist
      if (!weeklyVisitors[currentWeek]) {
        weeklyVisitors[currentWeek] = new Set(); // Initialize as Set if it's undefined
        console.log('Initialized new Set for week:', currentWeek); // Log initialization
      }

      // Ensure weeklyVisitors[currentWeek] is a Set
      if (!(weeklyVisitors[currentWeek] instanceof Set)) {
        weeklyVisitors[currentWeek] = new Set(); // Re-initialize as Set if it's not already
        console.log('Re-initialized currentWeek to Set:', currentWeek); // Log re-initialization
      }

      // Add unique visitors for the current week
      visitorData.forEach(userId => {
        weeklyVisitors[currentWeek].add(userId); // Add user to the Set
        console.log('Added user to week:', currentWeek, 'User ID:', userId); // Log each added visitor
      });

      // Save updated data back to AsyncStorage
      await AsyncStorage.setItem(
        'weeklyVisitors',
        JSON.stringify(weeklyVisitors),
      );
      console.log('Updated Visitor Data saved to AsyncStorage'); // Log after saving data

      // Update state to re-render
      setVisitorCounts(weeklyVisitors);
      console.log('Updated Visitor Counts:', weeklyVisitors); // Log updated counts
    } catch (error) {
      console.error('Error storing visitor data:', error); // Log any errors
    }
  };

  // Function to prepare data for BarChart
  const chartData = {
    labels: Array.from({length: Object.keys(visitorCounts).length}, (_, i) =>
      (i + 1).toString(),
    ), // Sequential weeks starting from 1
    datasets: [
      {
        data: Object.values(visitorCounts).map((set: Set<any>) => {
          const count = set.size || 0; // Ensure count is not undefined
          console.log('Visitor count for week:', count); // Log visitor count for each week
          return count;
        }),
      },
    ],
  };

  const [interactionChartData, setInteractionChartData] = useState<any>(null);

  useEffect(() => {
    console.log('Posts fetched from state:', posts); // Log fetched posts
    if (posts && posts.length > 0) {
      processPostInteractions();
    } else {
      console.log('No posts available to process.');
    }
  }, [posts]);

  const processPostInteractions = () => {
    const weeklyData: any = {};

    console.log('Processing posts for interactions...');

    // Iterate over posts and filter based on pins.createdBy
    posts.forEach((post: any) => {
      // Make sure to check the pins.createdBy condition
      if (post.user._id === pins.createdBy) {
        const weekNumber = getWeekNumber(new Date(post.createdAt));
        console.log(
          `Post ID: ${post._id}, CreatedAt: ${post.createdAt}, Week: ${weekNumber}, User._id: ${post.user._id}, Pins.CreatedBy: ${pins.createdBy}`,
        );

        // Initialize if week does not exist
        if (!weeklyData[weekNumber]) {
          weeklyData[weekNumber] = {likes: 0, replies: 0};
          console.log(`Initialized data for Week ${weekNumber}`);
        }

        // Safely handle likes and replies
        const likes = Array.isArray(post.likes)
          ? post.likes.length
          : post.likes || 0;
        const replies = Array.isArray(post.replies)
          ? post.replies.length
          : post.replies?.length || 0;

        // Update the weekly data for likes and replies
        weeklyData[weekNumber].likes += likes;
        weeklyData[weekNumber].replies += replies;

        console.log(
          `Updated Week ${weekNumber}: Likes = ${weeklyData[weekNumber].likes}, Replies = ${weeklyData[weekNumber].replies}`,
        );
      }
    });

    console.log('Weekly interaction data:', weeklyData);

    // Format data for the chart
    const weeks = Object.keys(weeklyData).sort();
    const chartData = {
      labels: weeks.map(week => `${week}`),
      legend: ['Likes', 'Replies'],
      data: weeks.map(week => [
        weeklyData[week].likes,
        weeklyData[week].replies,
      ]),
      barColors: ['#74b9ff', '#fab1a0'],
    };

    console.log('Final chart data:', chartData);
    setInteractionChartData(chartData);
  };

  const getStarImage = (rating: number) => {
    if (isNaN(rating) || rating === 0) return null; // No star if NaN or 0
    if (rating === 5) return require('../assets/rating/5star.png');
    if (rating >= 4.1) return require('../assets/rating/4HalfStar.png');
    if (rating === 4) return require('../assets/rating/4star.png');
    if (rating >= 3.1) return require('../assets/rating/3HalfStar.png');
    if (rating === 3) return require('../assets/rating/3star.png');
    if (rating >= 2.1) return require('../assets/rating/2HalfStar.png');
    if (rating === 2) return require('../assets/rating/2star.png');
    if (rating >= 1.1) return require('../assets/rating/halfStar.png');
    return require('../assets/rating/1star.png');
  };
  const getRatingDistribution = () => {
    const distribution = {
      excellent: 0,
      good: 0,
      average: 0,
      belowAverage: 0,
      poor: 0,
    };

    reviews.forEach(review => {
      if (review.ratings >= 4.5) distribution.excellent++;
      else if (review.ratings >= 3.5) distribution.good++;
      else if (review.ratings >= 2.5) distribution.average++;
      else if (review.ratings >= 1.5) distribution.belowAverage++;
      else distribution.poor++;
    });

    const totalReviews = reviews.length;
    return Object.keys(distribution).reduce((acc, key) => {
      acc[key] =
        totalReviews > 0 ? (distribution[key] / totalReviews) * 100 : 0;
      return acc;
    }, {});
  };

  const ratingDistribution = getRatingDistribution();

  const getDaysAgo = createdAt => {
    const reviewDate = new Date(createdAt);
    const currentDate = new Date();
    const timeDifference = currentDate - reviewDate;

    const daysAgo = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Days difference
    const hoursAgo = Math.floor(timeDifference / (1000 * 60 * 60)); // Hours difference

    if (daysAgo === 0) {
      // If the review was created today, show hours
      if (hoursAgo === 0) {
        const minutesAgo = Math.floor(timeDifference / (1000 * 60)); // Minutes difference
        return `${minutesAgo} minutes ago`;
      }
      return `${hoursAgo} hours ago`;
    }

    if (daysAgo === 1) return '1 day ago';
    return `${daysAgo} days ago`;
  };

  const [visibleOptions, setVisibleOptions] = useState<string | null>(null);

  const toggleOptions = (reviewId: string) => {
    setVisibleOptions(visibleOptions === reviewId ? null : reviewId);
  };

  const hasUserReviewed = reviews.some(review => review.user._id === user._id);
  const safeAverageRating = isNaN(averageRating) ? 0.0 : averageRating;

  return (
    <View style={styles.container}>
      {/* Set the StatusBar to be translucent and fully transparent */}
      <StatusBar translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          {editedImage ? (
            <Image source={{uri: editedImage}} style={styles.image} />
          ) : imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageTitle}>No Image Available</Text>
            </View>
          )}
        </View>

        <View>
          <View style={styles.goBackContainer}>
            <TouchableOpacity onPress={handleBackPress}>
              <Image
                style={styles.goBackButton}
                source={require('../assets/goBack1.png')}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.editImageContainer}>
            <Modal
              visible={isEditing}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setIsEditing(false)}>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
                }}>
                <View
                  style={{
                    backgroundColor: '#fff',
                    padding: 20,
                    borderRadius: 10,
                    width: '80%',
                    maxWidth: 400,
                  }}>
                  <TouchableOpacity onPress={uploadImage}>
                    <Image
                      source={{
                        uri: editedImage || pins.image?.url, // Use editedImage or fallback to original image.url
                      }}
                      style={styles.image}
                    />
                  </TouchableOpacity>

                  {/* Map View inside the modal */}
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={{width: '100%', height: 300}} // Adjust the height for the map
                    initialRegion={{
                      latitude: latitude,
                      longitude: longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    onPress={handleMapPress} // Handle map press to update marker position
                  >
                    <Marker
                      coordinate={{
                        latitude: latitude,
                        longitude: longitude,
                      }}
                      draggable
                      onDragEnd={e => {
                        const {latitude: newLat, longitude: newLng} =
                          e.nativeEvent.coordinate;
                        setLatitude(newLat); // Update latitude when dragged
                        setLongitude(newLng); // Update longitude when dragged
                        console.log('New Coordinates:', newLat, newLng);
                      }}
                    />
                  </MapView>

                  {/* Form Inputs */}
                  <TextInput
                    defaultValue={editableDescription || pinDescription}
                    onChangeText={setEditableDescription}
                    placeholder="Description"
                    style={{borderWidth: 1, margin: 5, padding: 5}}
                  />
                  <TextInput
                    defaultValue={editablePhone || pinContactInfo.phone}
                    onChangeText={setEditablePhone}
                    placeholder="Phone"
                    style={{borderWidth: 1, margin: 5, padding: 5}}
                    keyboardType="phone-pad"
                  />

                  {/* Save and Cancel buttons */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                    <TouchableOpacity
                      onPress={handleSavePin} // Handle save functionality
                      style={{
                        padding: 10,
                        backgroundColor: 'green',
                        borderRadius: 5,
                      }}>
                      <Text style={{color: 'white'}}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsEditing(false)} // Close the modal
                      style={{
                        padding: 10,
                        backgroundColor: 'red',
                        borderRadius: 5,
                      }}>
                      <Text style={{color: 'white'}}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Button to Open Modal */}
            {user._id === pins.createdBy ? (
              // Edit Button
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Image
                  style={styles.editImage}
                  source={require('../assets/editImage.png')}
                />
              </TouchableOpacity>
            ) : (
              // Report Button
              <TouchableOpacity onPress={() => setOpenModal(true)}>
                <Image
                  style={styles.editImage}
                  source={require('../assets/report.png')} // Replace with the appropriate report image
                />
              </TouchableOpacity>
            )}
            {openModal && (
              <View style={styles.modalContainer}>
                <Modal
                  animationType="fade"
                  transparent={true}
                  visible={openModal}
                  onRequestClose={handleCancelReport}>
                  <View style={styles.modalBackground1}>
                    <View style={styles.modalContent1}>
                      <View style={styles.modalTitleContainer}>
                        <Text style={styles.modalTitle}>Report Post</Text>
                      </View>
                      {reportReasons.map(reason => (
                        <TouchableOpacity
                          key={reason.value}
                          onPress={() => setSelectedReason(reason.value)}>
                          <Text
                            style={
                              selectedReason === reason.value
                                ? styles.selectedReason
                                : styles.reasonText
                            }>
                            {reason.label}
                          </Text>
                        </TouchableOpacity>
                      ))}

                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          onPress={handleConfirmReport}
                          style={styles.confirmButton}>
                          <Text style={styles.buttonText}>Confirm</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleCancelReport}
                          style={styles.cancelButton}>
                          <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.information}>
              <Image
                style={styles.infoImage}
                source={require('../assets/people.png')}
              />
              <Text style={styles.infoText}>{visitorLength}</Text>
            </View>
            <View style={styles.information}>
              <Image
                style={styles.starImage}
                source={require('../assets/rating.png')}
              />
              <Text style={styles.infoText}>{averageRating.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.businessInfoContainer}>
              <View style={styles.businessInfo}>
                <View style={styles.businessProfile}>
                  <Image
                    style={styles.profilePic}
                    source={{uri: pins.image.url}}
                  />
                  {pins.isVerified && (
                    <View style={styles.verifiedContainer}>
                      <Image
                        style={styles.verifiedImage}
                        source={require('../assets/verified.png')}
                      />
                    </View>
                  )}

                  {/* Modal for Unverified Pins */}
                  <Modal
                    visible={showModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowModal(false)} // Handle hardware back button on Android
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent2}>
                        <Image
                          style={styles.warning}
                          source={require('../assets/warning.png')}
                        />
                        <Text style={styles.modalText}>
                          This business is not verified.
                        </Text>
                        <Text style={styles.modalText}>
                          Please proceed at your own risk.
                        </Text>
                        <TouchableOpacity
                          style={styles.continueButton}
                          onPress={() => setShowModal(false)} // Close modal
                        >
                          <Text style={styles.buttonText}>Continue</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                </View>
                <View>
                  <View style={styles.businessNameContainer}>
                    <Text style={styles.businessName}>{pins.businessName}</Text>
                  </View>
                  <View style={styles.businessLocationContainer}>
                    <Image
                      style={styles.grayImage}
                      source={require('../assets/markerGray.png')}
                    />
                    <Text style={styles.businessLocation}>
                      {address || 'Loading...'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.followButtons}>
                <TouchableOpacity onPress={handleFollowPress}>
                  {/* Apply dynamic styles based on the isFollowed state */}
                  <Text
                    style={
                      isFollowed
                        ? styles.followButtonFollowed
                        : styles.followButton
                    }>
                    {isFollowed ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity onPress={() => setActiveTab('Details')}>
              <Text
                style={activeTab === 'Details' ? styles.activeTab : styles.tab}>
                Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('Posts')}>
              <Text
                style={activeTab === 'Posts' ? styles.activeTab : styles.tab}>
                Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('Media')}>
              <Text
                style={activeTab === 'Media' ? styles.activeTab : styles.tab}>
                Media
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('Reviews')}>
              <Text
                style={activeTab === 'Reviews' ? styles.activeTab : styles.tab}>
                Reviews
              </Text>
            </TouchableOpacity>
            {pins.createdBy === user._id && (
              <TouchableOpacity onPress={() => setActiveTab('Analytics')}>
                <Text
                  style={
                    activeTab === 'Analytics' ? styles.activeTab : styles.tab
                  }>
                  Analytics
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Conditional rendering based on the activeTab */}
          {activeTab === 'Details' && (
            <View>
              <Text style={styles.description}>
                <Text style={styles.description}>
                  {editableDescription ? editableDescription : pinDescription}
                </Text>
              </Text>
              {/* Additional Details content */}

              <View style={[styles.section, {height: 250}]}>
                <View style={styles.contactInfoContainer}>
                  <Text style={styles.contact}>Contacts</Text>
                  <View style={styles.contactContainer}>
                    <View style={styles.contactContactContainer}>
                      <TouchableOpacity onPress={handleEmailClick}>
                        <Image
                          style={styles.contactImage}
                          source={require('../assets/email.png')}
                        />
                        <Text style={styles.contactInfoText}>
                          {pinContactInfo.email}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.contactContactContainer}>
                      <TouchableOpacity onPress={handlePhoneClick}>
                        <Image
                          style={styles.contactImage}
                          source={require('../assets/phone.png')}
                        />
                        <Text style={styles.contactInfoText}>
                          {editablePhone ? editablePhone : pinContactInfo.phone}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'Posts' && (
            <View>
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
              {/* Add Reviews content here */}
            </View>
          )}
          {activeTab === 'Media' && (
            <View style={styles.mediaContainer}>
              {postData.length > 0 ? (
                postData.map((item: any) =>
                  item.image?.url ? (
                    <TouchableOpacity
                      key={item._id}
                      onPress={() => handleImageClick(item.image.url)}>
                      <Image
                        source={{uri: item.image.url}}
                        style={styles.mediaImage}
                      />
                    </TouchableOpacity>
                  ) : null,
                )
              ) : (
                <Text style={styles.noMediaText}>No Media yet!</Text>
              )}

              <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={closeModal}>
                <TouchableOpacity
                  style={styles.modalBackground}
                  onPress={closeModal}>
                  <View style={styles.modalContent}>
                    {selectedImage && (
                      <Image
                        source={{uri: selectedImage}}
                        style={styles.modalImage}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          )}
          {activeTab === 'Reviews' && (
            <View>
              <ScrollView>
                <View style={styles.reviewStarContainer}>
                  <Text style={styles.reviewStar}>
                    {safeAverageRating.toFixed(1)}
                  </Text>
                  {getStarImage(safeAverageRating) && (
                    <Image
                      source={getStarImage(safeAverageRating)}
                      style={{width: 100, height: 20}}
                    />
                  )}
                  <Text style={styles.reviewCount}>
                    Based on {reviews.length}{' '}
                    {reviews.length === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>
                <View style={styles.ratingDistributionContainer}>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Excellent</Text>
                    <View style={styles.ratingLine}>
                      <View
                        style={{
                          width: `${ratingDistribution.excellent}%`,
                          height: 4,
                          backgroundColor: '#4CAF50',
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Good</Text>
                    <View style={styles.ratingLine}>
                      <View
                        style={{
                          width: `${ratingDistribution.good}%`,
                          height: 4,
                          backgroundColor: '#8BC34A',
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Average</Text>
                    <View style={styles.ratingLine}>
                      <View
                        style={{
                          width: `${ratingDistribution.average}%`,
                          height: 4,
                          backgroundColor: '#FFEB3B',
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Below Average</Text>
                    <View style={styles.ratingLine}>
                      <View
                        style={{
                          width: `${ratingDistribution.belowAverage}%`,
                          height: 4,
                          backgroundColor: '#FF9800',
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Poor</Text>
                    <View style={styles.ratingLine}>
                      <View
                        style={{
                          width: `${ratingDistribution.poor}%`,
                          height: 4,
                          backgroundColor: '#F44336',
                        }}
                      />
                    </View>
                  </View>
                </View>

                {reviews.length > 0 ? (
                  reviews.map(review => (
                    <View key={review._id} style={styles.reviewCard}>
                      <View style={styles.reviewContainer}>
                        <View style={styles.reviewTitleContainer}>
                          <Image
                            style={styles.reviewImage}
                            source={{uri: review.user.image}}
                          />
                          <View style={styles.reviewNameContainer}>
                            <Text style={styles.reviewName}>
                              {review.user.name}
                            </Text>
                            <View style={styles.ratingContainer}>
                              <Text style={styles.ratingStars}>
                                {'⭐'.repeat(Math.floor(review.ratings))}
                              </Text>
                              <Text style={styles.ratingValue}>
                                {' '}
                                {review.ratings.toFixed(1)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Options Icon */}
                        <View style={styles.dayContainer}>
                          <TouchableOpacity
                            onPress={() => toggleOptions(review._id)}>
                            <Image
                              style={styles.optionImage}
                              source={require('../assets/options.png')}
                            />
                          </TouchableOpacity>

                          <Text style={styles.daysAgo}>
                            {getDaysAgo(review.createdAt)}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.reviewText}>{review.reviewText}</Text>

                      {/* Show buttons only when options are visible */}
                      {visibleOptions === review._id &&
                        review.user._id === user._id && (
                          <View style={styles.buttonGroup}>
                            {/* Modify Button */}
                            <TouchableOpacity
                              style={styles.modifyButton}
                              onPress={() => {
                                setNewReview(review.reviewText);
                                setNewRating(review.ratings.toString());
                                setSelectedReviewId(review._id);
                                setVisibleOptions(null); // Hide Modify/Delete buttons once Modify is clicked
                              }}>
                              <Text style={styles.buttonText}>Modify</Text>
                            </TouchableOpacity>

                            {/* Delete Button */}
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteReview(review._id)}>
                              <Text style={styles.buttonText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noReviewsText}>No reviews available</Text>
                )}

                {/* Conditionally show the review input when the user has not reviewed or when modifying */}
                {!hasUserReviewed && !selectedReviewId && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your review"
                      value={newReview}
                      onChangeText={setNewReview}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter rating (1-5)"
                      keyboardType="numeric"
                      value={newRating}
                      onChangeText={text => {
                        const numericValue = parseInt(text, 10);
                        if (
                          !isNaN(numericValue) &&
                          numericValue >= 1 &&
                          numericValue <= 5
                        ) {
                          setNewRating(text);
                        } else if (text === '') {
                          setNewRating('');
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.reviewButton}
                      onPress={handleAddReview}>
                      <Text style={styles.reviewButtonText}>Add Review</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Show the review input when modifying a review */}
                {selectedReviewId && (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Modify your review"
                      value={newReview}
                      onChangeText={setNewReview}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Modify rating (1-5)"
                      keyboardType="numeric"
                      value={newRating}
                      onChangeText={text => {
                        const numericValue = parseInt(text, 10);
                        if (
                          !isNaN(numericValue) &&
                          numericValue >= 1 &&
                          numericValue <= 5
                        ) {
                          setNewRating(text);
                        } else if (text === '') {
                          setNewRating('');
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.reviewButton}
                      onPress={handleModifyReview}>
                      <Text style={styles.reviewButtonText}>Modify Review</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
          {activeTab === 'Analytics' && (
            <View style={{padding: 20}}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 10,
                  color: '#fff',
                }}>
                Visitor Analytics
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  textAlign: 'center',
                  color: '#aaa',
                  marginBottom: 20,
                }}>
                Weekly Unique Visitors per Week (Starting from Week 49)
              </Text>
              <BarChart
                data={chartData}
                width={350}
                height={250}
                chartConfig={{
                  backgroundColor: '#222',
                  backgroundGradientFrom: '#444',
                  backgroundGradientTo: '#222',
                  decimalPlaces: 0, // Show integer values
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(255, 255, 255, ${opacity})`,
                  propsForLabels: {
                    fontSize: '12',
                    fontWeight: 'bold',
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#fff',
                  },
                  barPercentage: 0.5, // Adjust the bar thickness
                  useShadowColorFromDataset: false,
                  fromZero: true, // Ensure y-axis starts at 0
                }}
                verticalLabelRotation={45} // Rotate the week labels for better visibility
                yAxisInterval={1} // Set interval to 1 for the y-axis ticks
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                  marginLeft: 10,
                  marginRight: 10,
                }}
                segments={2} // Limit to 2 y-axis segments: 0 and 1
              />

              <View>
                {interactionChartData && (
                  <StackedBarChart
                    data={interactionChartData}
                    width={350}
                    height={250}
                    chartConfig={{
                      backgroundColor: '#222',
                      backgroundGradientFrom: '#444',
                      backgroundGradientTo: '#222',
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      labelColor: (opacity = 1) =>
                        `rgba(255, 255, 255, ${opacity})`,
                      propsForLabels: {
                        fontSize: '12',
                        fontWeight: 'bold',
                      },
                    }}
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                      marginLeft: 10,
                      marginRight: 10,
                    }}
                    yAxisInterval={1} // Set the interval to 1 for clear increments
                    segments={2} // Ensure only 2 segments are displayed (e.g., 0 and 1)
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  continueButton: {
    marginTop: 10,
    backgroundColor: '#017E5E', // Example background color
    padding: 10,
    borderRadius: 5,
    alignItems: 'center', // Center text inside button
    justifyContent: 'center',
  },
  warning: {
    height: 50,
    width: 50,
  },
  modalText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent2: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A9A9A9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginHorizontal: 100,
  },

  modifyButton: {
    backgroundColor: '#017E5E', // Blue color
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButton: {
    backgroundColor: '#FF3B30', // Red color
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  reviewButton: {
    backgroundColor: '#017E5E', // Blue color like iOS buttons
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  reviewContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionImage: {
    height: 20,
    resizeMode: 'contain',
    marginLeft: 'auto',
  },
  reviewCard: {
    margin: 20,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    borderColor: '#A9A9A9',
  },
  ratingDistributionContainer: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingLabel: {
    width: 120,
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#ddd', // Light gray background
    borderRadius: 2,
    overflow: 'hidden',
  },

  ratingContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  reviewNameContainer: {
    marginLeft: 10,
  },
  reviewImage: {
    height: 50,
    width: 50,
    borderRadius: 50,
  },
  reviewName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  ratingValue: {
    fontWeight: 'bold',
    marginLeft: 5,
  },
  reviewTitleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewStarContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  reviewStar: {
    fontWeight: 'bold',
    fontSize: 30,
  },

  reviewCount: {
    color: '#696969',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#017E5E',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },

  modalBackground1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Black with 0.5 opacity
  },
  modalContent1: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300, // Optional: to control the max width of the modal
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10, // For Android shadow effect
  },
  modalTitleContainer: {
    width: '90%',
    borderBottomColor: '#000',
    borderBottomWidth: 2,
    marginBottom: 20,
  },
  modalTitle: {
    lineHeight: 20,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#017E5E',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedReason: {
    color: '#017E5E', // Selected reason color
    fontSize: 16,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  reasonText: {
    marginBottom: 15,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  imageEdit: {
    width: 100,
    height: 100,
    flex: 0,
  },
  editForm: {
    backgroundColor: '#fff',
    padding: 20,
    flex: 2,
    position: 'absolute',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
  },

  reviewsContainer: {
    padding: 20,
  },
  reviewsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reviewItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  reviewText: {
    fontSize: 16,
    marginTop: 15,
  },
  reviewRating: {
    fontSize: 14,
    color: '#666',
  },
  reviewActions: {
    flexDirection: 'row',
    marginTop: 5,
  },
  addReviewContainer: {
    marginTop: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  ratingInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: 100,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noReviewsText: {
    fontSize: 15,
    color: '#666',
    alignSelf: 'center',
    marginVertical: 0,
  },
  modalBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...StyleSheet.absoluteFillObject, // This makes the modal cover the entire screen
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  noPostText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
  noMediaText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  mediaImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 8,
  },
  contactInfoText: {
    marginLeft: 10,
    fontWeight: 'bold',
  },
  contactInfoContainer: {
    alignItems: 'center',
  },
  contactImage: {
    width: 40,
    height: 40,
  },
  contact: {
    marginTop: 10,
    fontSize: 15,
    color: '#017E5E',
    fontWeight: 'bold',
  },
  contactContactContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  contactContainer: {
    marginTop: 10,
    display: 'flex',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 0, // Set padding top to 0
  },
  goBackContainer: {
    backgroundColor: '#fff',
    padding: 14,
    left: 15,
    borderRadius: 50,
    position: 'absolute',
    top: -220,
    opacity: 0.9,
  },
  goBackButton: {
    width: 28,
    height: 28,
  },
  imageHolder: {
    height: 280,
    width: Dimensions.get('window').width,
    alignSelf: 'stretch',
    resizeMode: 'cover',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  image: {
    height: 280,
    width: Dimensions.get('window').width,
    alignSelf: 'stretch',
    resizeMode: 'cover',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  imagePlaceholder: {
    height: MAX_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTitle: {
    color: 'white',
    backgroundColor: 'transparent',
    fontSize: 24,
  },
  title: {
    fontSize: 20,
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
  },
  sectionContent: {
    fontSize: 16,
    textAlign: 'justify',
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  categoryContainer: {
    flexDirection: 'row',
    backgroundColor: '#FF6347',
    borderRadius: 20,
    margin: 10,
    padding: 10,
    paddingHorizontal: 15,
  },
  category: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 10,
  },
  navTitleView: {
    height: MIN_HEIGHT,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 5,
    backgroundColor: 'transparent',
  },
  navTitle: {
    color: 'black',
    fontSize: 28,
    backgroundColor: 'transparent',
    paddingLeft: 20,
    margin: 5,
  },
  sectionLarge: {
    minHeight: 150,
  },
  editImageContainer: {
    position: 'absolute',
    top: -220,
    left: '85%',
    zIndex: 1,
  },
  editImage: {
    height: 40,
    width: 40,
  },
  infoContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: 190,
    justifyContent: 'space-between',
    position: 'absolute',
    top: -50,
    left: '50%',
  },
  information: {
    display: 'flex',
    flexDirection: 'row',
    width: 90,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
  },
  infoImage: {
    height: 18,
    width: 18,
  },
  starImage: {
    height: 18,
    width: 18,
  },
  infoText: {
    fontWeight: '700',
  },
  businessLocationContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedContainer: {
    position: 'absolute',
    top: 50,
    left: 45,
  },
  verifiedImage: {
    height: 30,
    width: 30,
  },
  grayImage: {
    marginRight: 5,
    height: 15,
    width: 15,
  },
  businessLocation: {
    color: '#6E6E6E',
    fontWeight: 'bold',
  },
  businessNameContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessInfoContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  businessInfo: {
    display: 'flex',
    flexDirection: 'row',
    width: '53%',
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  businessProfile: {
    marginRight: 10,
  },
  followButtons: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Follow button styles
  followButton: {
    borderColor: '#cecece',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 20,
    fontSize: 15,
    borderRadius: 50,
    backgroundColor: '#017E5E', // Default background color
    color: '#FFFFFF', // Default text color
  },

  // Followed button styles
  followButtonFollowed: {
    borderColor: '#cecece',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 20,
    fontSize: 15,
    borderRadius: 50,
    backgroundColor: '#fff', // Background for followed state
    color: '#017E5E', // Text color for followed state
  },
  markerImage: {
    height: 35,
    width: 35,
  },
  profilePic: {
    height: 70,
    width: 70,
    borderRadius: 100,
  },
  tabsContainer: {
    marginTop: 15,
    display: 'flex',
    width: '100%',
    justifyContent: 'space-around',
    flexDirection: 'row',
    borderBottomColor: '#cccccc',
    borderBottomWidth: 1,
  },
  activeTab: {
    color: '#017E5E',
    fontWeight: 'medium',
    borderBottomColor: '#017E5E',
    borderBottomWidth: 1,
    width: '100%',
    fontSize: 20,
  },
  tab: {
    fontSize: 20,
    paddingBottom: 10,
    fontWeight: 'lightweight',
  },
  description: {
    fontFamily: 'Roboto',
    fontSize: 17,
    textAlign: 'justify',
    margin: 15,
  },
  contactInfo: {
    fontFamily: 'Roboto',
    fontSize: 17,
    textAlign: 'justify',
    marginLeft: 15,
  },
});

export default BusinessPinScreen;
